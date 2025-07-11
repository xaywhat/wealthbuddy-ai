import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default openai;

// Enhanced AI Analysis with merchant-specific insights
export async function analyzeSpendingHabits(transactions: any[]) {
  try {
    // Process transactions to extract expense data
    const expenseTransactions = transactions
      .filter(t => parseFloat(t.amount || t.transactionAmount?.amount || 0) < 0) // Only expenses
      .map(t => ({
        amount: Math.abs(parseFloat(t.amount || t.transactionAmount?.amount || 0)),
        description: (t.description || t.remittanceInformationUnstructured || '').substring(0, 100),
        merchant: (t.creditor_name || t.creditorName || t.debtor_name || t.debtorName || 'Unknown').substring(0, 50),
        date: t.date || new Date().toISOString().split('T')[0],
        category: t.user_category || t.category || 'Uncategorized'
      }));

    // Generate comprehensive analysis
    const analysis = await generateComprehensiveAnalysis(expenseTransactions);
    
    return analysis;

  } catch (error) {
    console.error('Error with enhanced AI analysis:', error);
    return generateFallbackAnalysis(transactions);
  }
}

// Generate comprehensive spending analysis
async function generateComprehensiveAnalysis(transactions: any[]) {
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const merchantStats = getMerchantStats(transactions);
  const categoryStats = generateCategoryStats(transactions);
  const frequencyStats = generateFrequencyStats(transactions);
  
  // Generate merchant-specific insights
  const merchantInsights = generateMerchantInsights(merchantStats, totalSpent);
  
  // Generate savings opportunities
  const savingsOpportunities = generateSavingsOpportunities(merchantStats, categoryStats, totalSpent);
  
  // Generate spending pattern insights
  const spendingPatterns = generateSpendingPatterns(frequencyStats, merchantStats);
  
  return {
    totalSpent,
    categories: categoryStats,
    merchantAnalysis: merchantStats,
    insights: [...merchantInsights, ...spendingPatterns],
    recommendations: savingsOpportunities
  };
}

// Generate merchant-specific insights
function generateMerchantInsights(merchantStats: any, totalSpent: number) {
  const insights = [];
  
  // Get top merchants by spending
  const topMerchants = Object.entries(merchantStats)
    .sort(([,a], [,b]) => (b as any).amount - (a as any).amount)
    .slice(0, 5);
  
  for (const [merchant, stats] of topMerchants) {
    const merchantData = stats as any;
    const percentage = (merchantData.amount / totalSpent) * 100;
    
    if (percentage > 5) { // Only show insights for merchants with >5% of spending
      insights.push({
        type: 'merchant_spending',
        title: `${merchant} Analysis`,
        description: `You spent ${merchantData.amount.toFixed(2)} DKK at ${merchant} across ${merchantData.count} transactions this month`,
        potentialSavings: 0,
        timeframe: 'monthly',
        merchant: merchant,
        amount: merchantData.amount,
        transactions: merchantData.count
      });
    }
  }
  
  return insights;
}

// Generate specific savings opportunities
function generateSavingsOpportunities(merchantStats: any, categoryStats: any, totalSpent: number) {
  const opportunities = [];
  
  // Check for 7-Eleven vs supermarket savings
  const convenience = merchantStats['7-Eleven'] || merchantStats['7-eleven'] || 
                     Object.entries(merchantStats).find(([name]) => 
                       name.toLowerCase().includes('7-eleven') || name.toLowerCase().includes('convenience')
                     )?.[1];
  
  if (convenience && (convenience as any).amount > 200) {
    const convenienceData = convenience as any;
    const potentialSavings = convenienceData.amount * 0.4; // 40% savings by switching
    
    opportunities.push({
      id: 'convenience-to-supermarket',
      category: 'Convenience Stores',
      suggestion: `You spent ${convenienceData.amount.toFixed(2)} DKK at convenience stores across ${convenienceData.count} purchases. If you switched half of that to Lidl or Netto, you could save ~${potentialSavings.toFixed(2)} DKK per month`,
      impact: 'high',
      savingsEstimate: potentialSavings,
      timeframe: 'monthly'
    });
  }
  
  // Check for dining out savings
  const dining = categoryStats['Dining'] || categoryStats['Restaurant'] || 
                 Object.entries(categoryStats).find(([name]) => 
                   name.toLowerCase().includes('dining') || name.toLowerCase().includes('restaurant')
                 )?.[1];
  
  if (dining && (dining as any).amount > 800) {
    const diningData = dining as any;
    const potentialSavings = diningData.amount * 0.3; // 30% savings by cooking more
    
    opportunities.push({
      id: 'dining-reduction',
      category: 'Dining',
      suggestion: `You spent ${diningData.amount.toFixed(2)} DKK on dining out. Cooking at home 3 more times per week could save you ~${potentialSavings.toFixed(2)} DKK monthly`,
      impact: 'medium',
      savingsEstimate: potentialSavings,
      timeframe: 'monthly'
    });
  }
  
  // Check for transport savings
  const transport = categoryStats['Transport'] || categoryStats['Transportation'];
  if (transport && (transport as any).amount > 400) {
    const transportData = transport as any;
    const potentialSavings = transportData.amount * 0.2; // 20% savings with monthly pass
    
    opportunities.push({
      id: 'transport-optimization',
      category: 'Transport',
      suggestion: `You spent ${transportData.amount.toFixed(2)} DKK on transport. A monthly pass might save you ~${potentialSavings.toFixed(2)} DKK`,
      impact: 'medium',
      savingsEstimate: potentialSavings,
      timeframe: 'monthly'
    });
  }
  
  return opportunities;
}

// Generate spending pattern insights
function generateSpendingPatterns(frequencyStats: any, merchantStats: any) {
  const patterns = [];
  
  // Find high-frequency, low-amount patterns
  const highFrequencyMerchants = Object.entries(merchantStats)
    .filter(([_, stats]) => (stats as any).count >= 5)
    .sort(([,a], [,b]) => (b as any).count - (a as any).count);
  
  for (const [merchant, stats] of highFrequencyMerchants.slice(0, 3)) {
    const merchantData = stats as any;
    const avgAmount = merchantData.amount / merchantData.count;
    
    patterns.push({
      type: 'spending_pattern',
      title: `Frequent ${merchant} Visits`,
      description: `You visited ${merchant} ${merchantData.count} times this month, spending an average of ${avgAmount.toFixed(2)} DKK per visit`,
      potentialSavings: 0,
      timeframe: 'monthly',
      pattern: 'high_frequency',
      merchant: merchant
    });
  }
  
  return patterns;
}

// Generate frequency statistics
function generateFrequencyStats(transactions: any[]) {
  const stats: any = {};
  
  transactions.forEach(t => {
    const merchant = t.merchant || 'Unknown';
    if (!stats[merchant]) {
      stats[merchant] = { dates: [], amounts: [] };
    }
    stats[merchant].dates.push(t.date);
    stats[merchant].amounts.push(t.amount);
  });
  
  return stats;
}

// Helper function to generate category statistics
function generateCategoryStats(transactions: any[]) {
  const stats: any = {};
  
  transactions.forEach(t => {
    const description = t.description.toLowerCase();
    const merchant = t.merchant.toLowerCase();
    
    let category = 'Other';
    if (description.includes('7-eleven') || merchant.includes('7-eleven')) {
      category = 'Convenience Stores';
    } else if (description.includes('netto') || description.includes('rema') || description.includes('bilka') || description.includes('føtex')) {
      category = 'Groceries';
    } else if (description.includes('dsb') || description.includes('metro') || description.includes('transport')) {
      category = 'Transport';
    } else if (description.includes('restaurant') || description.includes('cafe') || description.includes('pizza')) {
      category = 'Dining';
    } else if (description.includes('spotify') || description.includes('netflix') || description.includes('entertainment')) {
      category = 'Entertainment';
    } else if (description.includes('apotek') || description.includes('læge') || description.includes('hospital')) {
      category = 'Healthcare';
    } else if (description.includes('shell') || description.includes('q8') || description.includes('benzin')) {
      category = 'Gas';
    }
    
    if (!stats[category]) {
      stats[category] = { amount: 0, count: 0 };
    }
    stats[category].amount += t.amount;
    stats[category].count += 1;
  });
  
  return stats;
}

// Helper function to get merchant statistics
function getMerchantStats(transactions: any[]) {
  const merchantStats: any = {};
  
  transactions.forEach(t => {
    const merchant = t.merchant;
    if (!merchantStats[merchant]) {
      merchantStats[merchant] = { amount: 0, count: 0 };
    }
    merchantStats[merchant].amount += t.amount;
    merchantStats[merchant].count += 1;
  });
  
  // Sort by amount and return top merchants
  return Object.fromEntries(
    Object.entries(merchantStats).sort(([,a], [,b]) => (b as any).amount - (a as any).amount)
  );
}

// Fallback analysis if OpenAI fails
function generateFallbackAnalysis(transactions: any[]) {
  const totalSpent = transactions
    .filter(t => (parseFloat(t.transactionAmount?.amount || t.amount) < 0))
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.transactionAmount?.amount || t.amount)), 0);

  // Simple categorization
  const categories: any = {};
  const insights: any[] = [];
  const recommendations: any[] = [];

  transactions.forEach(t => {
    const amount = Math.abs(parseFloat(t.transactionAmount?.amount || t.amount));
    const description = (t.remittanceInformationUnstructured || t.description || '').toLowerCase();
    
    let category = 'Other';
    if (description.includes('7-eleven') || description.includes('convenience')) {
      category = 'Convenience Stores';
    } else if (description.includes('netto') || description.includes('rema') || description.includes('grocery')) {
      category = 'Groceries';
    } else if (description.includes('transport') || description.includes('dsb')) {
      category = 'Transport';
    } else if (description.includes('restaurant') || description.includes('cafe')) {
      category = 'Dining';
    }

    if (!categories[category]) {
      categories[category] = { amount: 0, percentage: 0, transactions: 0 };
    }
    categories[category].amount += amount;
    categories[category].transactions += 1;
  });

  // Calculate percentages
  Object.keys(categories).forEach(cat => {
    categories[cat].percentage = (categories[cat].amount / totalSpent) * 100;
  });

  // Generate insights
  if (categories['Convenience Stores']?.amount > 200) {
    insights.push({
      type: 'savings_opportunity',
      title: 'Convenience Store Spending',
      description: `You've spent ${categories['Convenience Stores'].amount.toFixed(2)} DKK on convenience stores. Reducing this by 50% could save you significant money.`,
      potentialSavings: categories['Convenience Stores'].amount * 0.5 * 52,
      timeframe: 'yearly'
    });
  }

  return {
    totalSpent,
    categories,
    insights,
    recommendations
  };
}

// Generate spending summary for a specific merchant/category
export async function generateMerchantInsight(merchantName: string, transactions: any[], totalAmount: number) {
  try {
    const prompt = `
Analyze spending at ${merchantName} with total amount of ${totalAmount} DKK.

Transactions: ${transactions.length}
Total spent: ${totalAmount} DKK

Provide a brief insight about this spending pattern and suggest potential savings in Danish context. 
Keep response under 100 words and focus on actionable advice.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a Danish financial advisor. Provide brief, actionable spending insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    return completion.choices[0].message.content || `You've spent ${totalAmount} DKK at ${merchantName}. Consider reducing visits to save money.`;

  } catch (error) {
    console.error('Error generating merchant insight:', error);
    return `You've spent ${totalAmount} DKK at ${merchantName}. Consider reducing visits to save money.`;
  }
}
