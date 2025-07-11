import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default openai;

// Production-Ready AI Financial Analysis using OpenAI
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

    if (expenseTransactions.length === 0) {
      return { totalSpent: 0, categories: {}, insights: [], recommendations: [] };
    }

    // Generate AI-powered analysis using OpenAI
    const analysis = await generateAIAnalysis(expenseTransactions);
    
    return analysis;

  } catch (error) {
    console.error('Error with AI analysis:', error);
    return generateFallbackAnalysis(transactions);
  }
}

// Real AI Analysis using OpenAI
async function generateAIAnalysis(transactions: any[]) {
  try {
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const categoryBreakdown = generateCategoryStats(transactions);
    const merchantBreakdown = getMerchantStats(transactions);
    const timeAnalysis = getTimeBasedAnalysis(transactions);

    // Prepare data for AI analysis
    const analysisPrompt = `
Analyze this Danish user's spending data and provide comprehensive financial insights:

SPENDING SUMMARY:
- Total spent: ${totalSpent.toFixed(2)} DKK
- Transaction count: ${transactions.length}
- Time period: Last 30 days

CATEGORY BREAKDOWN:
${Object.entries(categoryBreakdown)
  .sort(([,a], [,b]) => (b as any).amount - (a as any).amount)
  .slice(0, 8)
  .map(([cat, data]) => `- ${cat}: ${(data as any).amount.toFixed(2)} DKK (${(data as any).count} transactions)`)
  .join('\n')}

TOP MERCHANTS:
${Object.entries(merchantBreakdown)
  .sort(([,a], [,b]) => (b as any).amount - (a as any).amount)
  .slice(0, 6)
  .map(([merchant, data]) => `- ${merchant}: ${(data as any).amount.toFixed(2)} DKK (${(data as any).count} transactions)`)
  .join('\n')}

SPENDING PATTERNS:
${timeAnalysis.insights.join('\n')}

CONTEXT: This is a Danish user, so consider:
- Danish stores: Netto, Rema 1000, Bilka, 7-Eleven, etc.
- Danish currency (DKK)
- Danish lifestyle and spending patterns
- Local alternatives and cost comparisons

Please provide EXACTLY 3-5 specific, actionable insights with:
1. Precise savings amounts in DKK
2. Specific merchant recommendations
3. Realistic, achievable advice
4. Danish context-aware suggestions

Return ONLY valid JSON with this structure:
{
  "totalSpent": number,
  "categories": {...category data...},
  "insights": [
    {
      "type": "savings_opportunity" | "spending_pattern" | "budget_alert",
      "title": "specific title",
      "description": "detailed analysis with specific DKK amounts and merchant names",
      "potentialSavings": number,
      "timeframe": "weekly" | "monthly" | "yearly"
    }
  ],
  "recommendations": [
    {
      "id": "unique_id",
      "category": "category name",
      "suggestion": "specific actionable advice with DKK amounts",
      "impact": "high" | "medium" | "low",
      "savingsEstimate": number
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert Danish financial advisor. Analyze spending data and provide specific, actionable insights with exact DKK amounts and Danish merchant recommendations. Respond only with valid JSON."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const analysisText = completion.choices[0].message.content;
    
    // Parse and validate AI response
    try {
      const jsonMatch = analysisText?.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const aiAnalysis = JSON.parse(jsonMatch[0]);
      
      // Merge AI insights with calculated data
      return {
        totalSpent,
        categories: categoryBreakdown,
        merchantAnalysis: merchantBreakdown,
        insights: aiAnalysis.insights || [],
        recommendations: aiAnalysis.recommendations || [],
        timeAnalysis: timeAnalysis
      };
      
    } catch (parseError) {
      console.error('Error parsing AI analysis:', parseError);
      return generateFallbackAnalysis([]);
    }

  } catch (error) {
    console.error('Error with OpenAI analysis:', error);
    return generateFallbackAnalysis([]);
  }
}

// AI-Powered Budget Suggestions
export async function generateBudgetSuggestions(transactions: any[], userIncome?: number) {
  try {
    const expenseData = transactions
      .filter(t => parseFloat(t.amount) < 0)
      .map(t => ({
        amount: Math.abs(parseFloat(t.amount)),
        category: t.user_category || t.category || 'Uncategorized',
        date: t.date
      }));

    const categorySpending = generateCategoryStats(expenseData);
    const totalMonthlySpending = Object.values(categorySpending).reduce((sum: number, cat: any) => sum + cat.amount, 0);

    const prompt = `
Analyze this Danish user's spending and suggest realistic monthly budgets:

CURRENT SPENDING (last 30 days):
${Object.entries(categorySpending)
  .sort(([,a], [,b]) => (b as any).amount - (a as any).amount)
  .map(([cat, data]) => `- ${cat}: ${(data as any).amount.toFixed(2)} DKK`)
  .join('\n')}

Total monthly spending: ${totalMonthlySpending.toFixed(2)} DKK
${userIncome ? `User income: ${userIncome} DKK` : 'Income not provided'}

Create smart budget suggestions that:
1. Are 10-20% lower than current spending (realistic reduction)
2. Prioritize essential vs non-essential categories
3. Consider Danish cost of living
4. Include specific savings strategies

Return JSON with suggested budgets:
{
  "suggestedBudgets": [
    {
      "category": "category name",
      "currentSpending": current_amount,
      "suggestedBudget": suggested_amount,
      "reasoning": "why this budget makes sense",
      "tips": ["specific tip 1", "specific tip 2"]
    }
  ],
  "totalReduction": estimated_monthly_savings,
  "confidenceScore": 0.8
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a Danish financial advisor specializing in realistic budget creation. Provide specific, achievable budget suggestions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const response = completion.choices[0].message.content;
    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('No valid JSON in budget response');

  } catch (error) {
    console.error('Error generating budget suggestions:', error);
    return { suggestedBudgets: [], totalReduction: 0, confidenceScore: 0 };
  }
}

// AI-Powered Subscription Analysis
export async function analyzeSubscriptions(transactions: any[]) {
  try {
    // Find potential recurring payments
    const recurringCandidates = findRecurringPayments(transactions);
    
    if (recurringCandidates.length === 0) {
      return { subscriptions: [], totalMonthlyCost: 0, recommendations: [] };
    }

    const prompt = `
Analyze these potential subscriptions from Danish transaction data:

RECURRING PAYMENTS DETECTED:
${recurringCandidates.map(sub => 
  `- ${sub.merchant}: ${sub.amount.toFixed(2)} DKK every ~${sub.intervalDays} days (${sub.occurrences} times)`
).join('\n')}

Determine which are likely subscriptions and provide optimization advice:

Return JSON:
{
  "subscriptions": [
    {
      "merchant": "merchant name",
      "service": "likely service name",
      "amount": monthly_amount_dkk,
      "frequency": "monthly" | "yearly" | "weekly",
      "confidence": 0.9,
      "category": "Entertainment" | "Utilities" | etc
    }
  ],
  "recommendations": [
    {
      "type": "cancel_unused" | "downgrade" | "alternative",
      "suggestion": "specific advice",
      "potentialSavings": dkk_amount
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at identifying subscriptions and suggesting optimizations. Focus on Danish services and realistic advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1200,
    });

    const response = completion.choices[0].message.content;
    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('No valid JSON in subscription response');

  } catch (error) {
    console.error('Error analyzing subscriptions:', error);
    return { subscriptions: [], totalMonthlyCost: 0, recommendations: [] };
  }
}

// Helper function to find recurring payments using pattern analysis
function findRecurringPayments(transactions: any[]) {
  const merchantGroups = new Map();
  
  transactions
    .filter(t => parseFloat(t.amount) < 0)
    .forEach(t => {
      const merchant = t.creditor_name || t.debtor_name || 'Unknown';
      const amount = Math.abs(parseFloat(t.amount));
      const date = new Date(t.date);
      
      if (!merchantGroups.has(merchant)) {
        merchantGroups.set(merchant, []);
      }
      merchantGroups.get(merchant).push({ amount, date });
    });

  const recurring = [];
  
  for (const [merchant, payments] of merchantGroups) {
    if (payments.length < 2) continue;
    
    // Sort by date and check for regular intervals
    payments.sort((a: any, b: any) => a.date.getTime() - b.date.getTime());
    
    const intervals = [];
    for (let i = 1; i < payments.length; i++) {
      const daysDiff = Math.floor((payments[i].date.getTime() - payments[i-1].date.getTime()) / (1000 * 60 * 60 * 24));
      intervals.push(daysDiff);
    }
    
    if (intervals.length === 0) continue;
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const intervalVariance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    // Check if it's likely a subscription (regular intervals, consistent amounts)
    if (intervalVariance < 50 && (avgInterval >= 28 && avgInterval <= 35 || avgInterval >= 6 && avgInterval <= 8)) {
      const avgAmount = payments.reduce((sum: number, p: any) => sum + p.amount, 0) / payments.length;
      
      recurring.push({
        merchant,
        amount: avgAmount,
        intervalDays: Math.round(avgInterval),
        occurrences: payments.length,
        consistency: 1 - (intervalVariance / avgInterval)
      });
    }
  }
  
  return recurring.filter(r => r.consistency > 0.8); // High consistency threshold
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

// Generate time-based analysis
function getTimeBasedAnalysis(transactions: any[]) {
  const insights = [];
  const now = new Date();
  const dayStats = new Map();
  const weeklySpending = [];
  
  // Analyze spending by day of week
  transactions.forEach(t => {
    const date = new Date(t.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];
    
    if (!dayStats.has(dayName)) {
      dayStats.set(dayName, { amount: 0, count: 0 });
    }
    const dayData = dayStats.get(dayName)!;
    dayData.amount += t.amount;
    dayData.count += 1;
  });
  
  // Find highest spending days
  const sortedDays = Array.from(dayStats.entries())
    .sort(([,a], [,b]) => b.amount - a.amount);
    
  if (sortedDays.length > 0) {
    const [topDay, topStats] = sortedDays[0];
    insights.push(`Highest spending day: ${topDay} (${topStats.amount.toFixed(2)} DKK across ${topStats.count} transactions)`);
  }
  
  // Analyze weekly patterns
  const weekGroupedTransactions = new Map();
  transactions.forEach(t => {
    const date = new Date(t.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weekGroupedTransactions.has(weekKey)) {
      weekGroupedTransactions.set(weekKey, 0);
    }
    const currentAmount = weekGroupedTransactions.get(weekKey)!;
    weekGroupedTransactions.set(weekKey, currentAmount + t.amount);
  });
  
  const weeklyAmounts = Array.from(weekGroupedTransactions.values());
  if (weeklyAmounts.length > 1) {
    const avgWeeklySpending = weeklyAmounts.reduce((sum, amount) => sum + amount, 0) / weeklyAmounts.length;
    const lastWeekSpending = weeklyAmounts[weeklyAmounts.length - 1];
    
    if (lastWeekSpending > avgWeeklySpending * 1.2) {
      insights.push(`Last week spending was 20% higher than average (${lastWeekSpending.toFixed(2)} DKK vs ${avgWeeklySpending.toFixed(2)} DKK)`);
    } else if (lastWeekSpending < avgWeeklySpending * 0.8) {
      insights.push(`Great job! Last week spending was 20% lower than average (${lastWeekSpending.toFixed(2)} DKK vs ${avgWeeklySpending.toFixed(2)} DKK)`);
    }
  }
  
  return {
    insights,
    dayStats: Object.fromEntries(dayStats),
    weeklySpending: weeklyAmounts
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
