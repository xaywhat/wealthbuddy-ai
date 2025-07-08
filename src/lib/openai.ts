import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default openai;

// AI Analysis functions
export async function analyzeSpendingHabits(transactions: any[]) {
  try {
    // Limit to recent transactions and reduce data size
    const recentTransactions = transactions
      .filter(t => parseFloat(t.transactionAmount?.amount || t.amount) < 0) // Only expenses
      .slice(0, 100) // Limit to 100 most recent transactions
      .map(t => ({
        amount: Math.abs(parseFloat(t.transactionAmount?.amount || t.amount)),
        description: (t.remittanceInformationUnstructured || t.description || '').substring(0, 50), // Truncate descriptions
        merchant: (t.creditorName || t.debtorName || 'Unknown').substring(0, 30), // Truncate merchant names
      }));

    // Pre-process data to create summary statistics instead of sending raw transactions
    const categoryStats = generateCategoryStats(recentTransactions);
    const totalSpent = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgTransaction = totalSpent / recentTransactions.length;
    const transactionCount = recentTransactions.length;

    const prompt = `You must respond with ONLY valid JSON. No explanatory text before or after.

Analyze this Danish spending data and return ONLY this JSON structure:

Data:
- Total spent: ${totalSpent.toFixed(2)} DKK
- Average transaction: ${avgTransaction.toFixed(2)} DKK  
- Transaction count: ${transactionCount}
- Categories: ${Object.entries(categoryStats).map(([cat, stats]: [string, any]) => 
  `${cat}: ${stats.amount.toFixed(2)} DKK (${stats.count} transactions)`
).join(', ')}

Return ONLY this JSON (no other text):
{
  "totalSpent": ${totalSpent},
  "categories": {
    ${Object.entries(categoryStats).map(([cat, stats]: [string, any]) => 
      `"${cat}": {"amount": ${stats.amount.toFixed(2)}, "percentage": ${((stats.amount/totalSpent)*100).toFixed(1)}, "transactions": ${stats.count}}`
    ).join(',\n    ')}
  },
  "insights": [
    {"type": "savings_opportunity", "title": "Convenience Store Spending", "description": "Consider reducing convenience store visits", "potentialSavings": ${Math.max(100, totalSpent * 0.1)}, "timeframe": "monthly"}
  ],
  "recommendations": [
    {"category": "Convenience Stores", "suggestion": "Shop at supermarkets instead of 7-Eleven", "impact": "medium", "savingsEstimate": ${Math.max(50, totalSpent * 0.05)}}
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a Danish financial advisor. Analyze spending patterns and provide actionable savings advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const analysisText = completion.choices[0].message.content;
    
    // Parse the JSON response with better extraction
    try {
      let jsonText = analysisText || '{}';
      
      // Try to extract JSON from mixed text response
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      const analysis = JSON.parse(jsonText);
      
      // Validate the structure
      if (!analysis.totalSpent || !analysis.categories) {
        throw new Error('Invalid analysis structure');
      }
      
      return analysis;
    } catch (parseError) {
      console.error('Error parsing AI analysis:', parseError);
      console.error('Raw response:', analysisText);
      return generateFallbackAnalysis(transactions);
    }

  } catch (error) {
    console.error('Error with OpenAI analysis:', error);
    return generateFallbackAnalysis(transactions);
  }
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
      merchantStats[merchant] = 0;
    }
    merchantStats[merchant] += t.amount;
  });
  
  // Sort by amount and return top merchants
  return Object.fromEntries(
    Object.entries(merchantStats).sort(([,a], [,b]) => (b as number) - (a as number))
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
