import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Nordigen API base URL
const NORDIGEN_BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';

// Token storage file path
const TOKEN_CACHE_FILE = path.join(process.cwd(), '.nordigen-tokens.json');

// Rate limiting helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429 && attempt < maxRetries - 1) {
        const delayMs = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limited, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await delay(delayMs);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Token cache interface
interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp
}

// Nordigen client class
class NordigenClient {
  private secretId: string;
  private secretKey: string;
  private tokenCache: TokenCache | null = null;

  constructor(secretId: string, secretKey: string) {
    this.secretId = secretId;
    this.secretKey = secretKey;
    // Load cached tokens on initialization
    this.loadTokensFromFile();
  }

  // Load tokens from persistent storage
  private loadTokensFromFile(): void {
    try {
      if (fs.existsSync(TOKEN_CACHE_FILE)) {
        const data = fs.readFileSync(TOKEN_CACHE_FILE, 'utf8');
        const cached = JSON.parse(data) as TokenCache;
        
        // Only load if not expired
        if (cached.expiresAt > Date.now()) {
          this.tokenCache = cached;
          console.log('Loaded valid tokens from cache file');
        } else {
          console.log('Cached tokens expired, will create new ones');
          // Clean up expired cache file
          fs.unlinkSync(TOKEN_CACHE_FILE);
        }
      }
    } catch (error) {
      console.log('Could not load token cache:', error);
      // Clean up corrupted cache file
      try {
        if (fs.existsSync(TOKEN_CACHE_FILE)) {
          fs.unlinkSync(TOKEN_CACHE_FILE);
        }
      } catch {}
    }
  }

  // Save tokens to persistent storage
  private saveTokensToFile(): void {
    try {
      if (this.tokenCache) {
        fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(this.tokenCache, null, 2));
        console.log('Tokens saved to cache file');
      }
    } catch (error) {
      console.log('Could not save token cache:', error);
    }
  }

  // Check if token is still valid (50 minutes = 3000 seconds)
  private isTokenValid(): boolean {
    if (!this.tokenCache) return false;
    const now = Date.now();
    return now < this.tokenCache.expiresAt;
  }

  // Refresh access token using refresh token
  private async refreshAccessToken(): Promise<string> {
    if (!this.tokenCache?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      console.log('Refreshing access token...');
      const response = await axios.post(`${NORDIGEN_BASE_URL}/token/refresh/`, {
        refresh: this.tokenCache.refreshToken,
      });

      // Update token cache with new access token
      this.tokenCache.accessToken = response.data.access;
      this.tokenCache.expiresAt = Date.now() + (50 * 60 * 1000); // 50 minutes from now
      
      // Save updated tokens to file
      this.saveTokensToFile();
      
      console.log('Access token refreshed successfully');
      return this.tokenCache.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Clear cache and force new token creation
      this.tokenCache = null;
      throw error;
    }
  }

  // Get access token with proper caching and refresh logic
  async getToken(): Promise<string> {
    // If we have a valid cached token, return it
    if (this.isTokenValid()) {
      return this.tokenCache!.accessToken;
    }

    // If we have a refresh token, try to refresh
    if (this.tokenCache?.refreshToken) {
      try {
        return await this.refreshAccessToken();
      } catch (error) {
        console.log('Token refresh failed, creating new token...');
        // Fall through to create new token
      }
    }

    // Create new token pair
    try {
      console.log('Creating new token pair...');
      const response = await axios.post(`${NORDIGEN_BASE_URL}/token/new/`, {
        secret_id: this.secretId,
        secret_key: this.secretKey,
      });

      // Cache the new tokens
      this.tokenCache = {
        accessToken: response.data.access,
        refreshToken: response.data.refresh,
        expiresAt: Date.now() + (50 * 60 * 1000), // 50 minutes from now
      };

      // Save new tokens to file
      this.saveTokensToFile();

      console.log('New token pair created and cached');
      return this.tokenCache.accessToken;
    } catch (error) {
      console.error('Error getting Nordigen token:', error);
      throw error;
    }
  }

  // Create requisition (bank connection request)
  async createRequisition(institutionId: string, redirectUrl: string, reference: string) {
    const token = await this.getToken();
    
    try {
      const requestData = {
        redirect: redirectUrl,
        institution_id: institutionId,
        reference: reference,
        user_language: 'DA', // Danish
      };

      console.log('Creating requisition with data:', requestData);

      const response = await axios.post(
        `${NORDIGEN_BASE_URL}/requisitions/`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error creating requisition:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  // Get requisition details
  async getRequisition(requisitionId: string) {
    const token = await this.getToken();
    
    try {
      const response = await axios.get(
        `${NORDIGEN_BASE_URL}/requisitions/${requisitionId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting requisition:', error);
      throw error;
    }
  }

  // Get account details with retry logic
  async getAccountDetails(accountId: string) {
    const token = await this.getToken();
    
    return retryWithBackoff(async () => {
      const response = await axios.get(
        `${NORDIGEN_BASE_URL}/accounts/${accountId}/details/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    });
  }

  // Get account balances with retry logic
  async getAccountBalances(accountId: string) {
    const token = await this.getToken();
    
    return retryWithBackoff(async () => {
      const response = await axios.get(
        `${NORDIGEN_BASE_URL}/accounts/${accountId}/balances/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    });
  }

  // Get account transactions with retry logic
  async getAccountTransactions(accountId: string, dateFrom?: string, dateTo?: string) {
    const token = await this.getToken();
    
    return retryWithBackoff(async () => {
      let url = `${NORDIGEN_BASE_URL}/accounts/${accountId}/transactions/`;
      const params = new URLSearchParams();
      
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    });
  }

  // Get institutions for a country
  async getInstitutions(countryCode: string = 'DK') {
    const token = await this.getToken();
    
    try {
      const response = await axios.get(
        `${NORDIGEN_BASE_URL}/institutions/?country=${countryCode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting institutions:', error);
      throw error;
    }
  }

  // Get all requisitions
  async getAllRequisitions() {
    const token = await this.getToken();
    
    try {
      const response = await axios.get(
        `${NORDIGEN_BASE_URL}/requisitions/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting requisitions:', error);
      throw error;
    }
  }

  // Find requisition by reference
  async findRequisitionByReference(reference: string) {
    try {
      const requisitions = await this.getAllRequisitions();
      const requisition = requisitions.results?.find((req: any) => req.reference === reference);
      
      if (!requisition) {
        throw new Error(`Requisition with reference ${reference} not found`);
      }
      
      return requisition;
    } catch (error) {
      console.error('Error finding requisition by reference:', error);
      throw error;
    }
  }
}

// Initialize Nordigen client
const client = new NordigenClient(
  process.env.NORDIGEN_SECRET_ID!,
  process.env.NORDIGEN_SECRET_KEY!
);

export default client;

// Danish bank institution IDs for Nordigen
export const DANISH_BANKS = {
  danske_andelskassers: 'DANSKE_ANDELSKASSERS_BANK_DANBDK22',
  danske_bank: 'DANSKEBANK_DABADKKK',
  nordea: 'NORDEA_NDEADKKK',
  jyske: 'JYSKEBANK_JYBADKKK',
  sydbank: 'SYDBANK_SYBKDKKK',
  arbejdernes: 'ARBEJDERNES_LANDSBANK_ALBADKKK',
} as const;

export type BankId = keyof typeof DANISH_BANKS;

// Types for Nordigen API responses
export interface NordigenAccount {
  id: string;
  iban: string;
  name: string;
  currency: string;
  ownerName: string;
  product: string;
  cashAccountType: string;
}

export interface NordigenBalance {
  balanceAmount: {
    amount: string;
    currency: string;
  };
  balanceType: string;
  referenceDate: string;
}

export interface NordigenTransaction {
  transactionId: string;
  bookingDate: string;
  valueDate: string;
  transactionAmount: {
    amount: string;
    currency: string;
  };
  creditorName?: string;
  debtorName?: string;
  remittanceInformationUnstructured?: string;
  proprietaryBankTransactionCode?: string;
  merchantCategoryCode?: string;
}

export interface NordigenRequisition {
  id: string;
  created: string;
  redirect: string;
  status: string;
  institution_id: string;
  agreement: string;
  reference: string;
  accounts: string[];
  user_language: string;
  link: string;
  ssn?: string;
  account_selection: boolean;
  redirect_immediate: boolean;
}
