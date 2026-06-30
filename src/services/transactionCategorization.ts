import { TransactionCategorization, BankTransaction } from '@/lib/types';

// Predefined category patterns for rule-based categorization
const CATEGORY_PATTERNS = {
  'Food & Dining': [
    'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'burger', 'pizza',
    'doordash', 'uber eats', 'grubhub', 'food', 'dining', 'meal'
  ],
  'Transportation': [
    'uber', 'lyft', 'gas', 'fuel', 'parking', 'transit', 'metro', 'bus',
    'train', 'airline', 'flight', 'car', 'auto', 'taxi'
  ],
  'Shopping': [
    'amazon', 'walmart', 'target', 'best buy', 'costco', 'shop', 'store',
    'retail', 'mall', 'online', 'purchase'
  ],
  'Entertainment': [
    'netflix', 'spotify', 'hulu', 'movie', 'theater', 'concert', 'game',
    'entertainment', 'disney', 'hbo', 'apple music'
  ],
  'Utilities': [
    'electric', 'water', 'gas bill', 'internet', 'phone', 'utility', 'power',
    'verizon', 'at&t', 'comcast', 'spectrum'
  ],
  'Healthcare': [
    'pharmacy', 'doctor', 'hospital', 'medical', 'health', 'dental', 'clinic',
    'cvs', 'walgreens', 'insurance', 'wellness'
  ],
  'Education': [
    'school', 'university', 'college', 'tuition', 'education', 'book',
    'course', 'learning', 'student'
  ],
  'Income': [
    'salary', 'payroll', 'deposit', 'transfer in', 'refund', 'income',
    'dividend', 'interest', 'payment received'
  ],
  'Investments': [
    'investment', 'stock', 'trade', 'brokerage', 'robinhood', 'fidelity',
    'schwab', 'etf', 'mutual fund'
  ],
  'Housing': [
    'rent', 'mortgage', 'housing', 'apartment', 'property', 'hoa',
    'maintenance', 'repair'
  ],
  'Insurance': [
    'insurance', 'premium', 'coverage', 'policy', 'auto insurance',
    'home insurance', 'life insurance'
  ],
  'Travel': [
    'hotel', 'airbnb', 'booking', 'travel', 'vacation', 'trip', 'airbnb',
    'expedia', 'booking.com'
  ],
  'Personal Care': [
    'salon', 'spa', 'gym', 'fitness', 'personal care', 'beauty',
    'wellness', 'massage'
  ],
  'Gifts & Donations': [
    'gift', 'donation', 'charity', 'present', 'contribution', 'fundraising'
  ],
  'Subscriptions': [
    'subscription', 'membership', 'monthly fee', 'annual fee', 'recurring'
  ]
};

// Merchant-specific categorization
const MERCHANT_CATEGORIES: Record<string, string> = {
  'amazon': 'Shopping',
  'apple': 'Shopping',
  'google': 'Technology',
  'microsoft': 'Technology',
  'netflix': 'Entertainment',
  'spotify': 'Entertainment',
  'uber': 'Transportation',
  'lyft': 'Transportation',
  'starbucks': 'Food & Dining',
  'mcdonalds': 'Food & Dining',
  'walmart': 'Shopping',
  'target': 'Shopping',
  'costco': 'Shopping',
  'best buy': 'Shopping',
  'cvs': 'Healthcare',
  'walgreens': 'Healthcare',
  'shell': 'Transportation',
  'chevron': 'Transportation',
  'exxon': 'Transportation',
  'comcast': 'Utilities',
  'verizon': 'Utilities',
  'at&t': 'Utilities',
};

export class TransactionCategorizationService {
  private static instance: TransactionCategorizationService;

  private constructor() {}

  static getInstance(): TransactionCategorizationService {
    if (!TransactionCategorizationService.instance) {
      TransactionCategorizationService.instance = new TransactionCategorizationService();
    }
    return TransactionCategorizationService.instance;
  }

  /**
   * Categorize a transaction using rule-based pattern matching
   */
  categorizeTransaction(transaction: BankTransaction): TransactionCategorization {
    const description = transaction.description.toLowerCase();
    const merchantName = transaction.merchantName?.toLowerCase() || '';
    const combinedText = `${description} ${merchantName}`;

    // Check merchant-specific categories first
    for (const [merchant, category] of Object.entries(MERCHANT_CATEGORIES)) {
      if (merchantName.includes(merchant) || description.includes(merchant)) {
        return {
          transactionId: transaction.id,
          suggestedCategory: category,
          confidence: 0.9,
          method: 'rule-based',
          alternatives: this.getAlternativeCategories(category, combinedText)
        };
      }
    }

    // Check pattern-based categories
    const categoryScores: Record<string, number> = {};
    
    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      let score = 0;
      for (const pattern of patterns) {
        if (combinedText.includes(pattern)) {
          score += 1;
        }
      }
      if (score > 0) {
        categoryScores[category] = score;
      }
    }

    // Find the category with the highest score
    const sortedCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a);

    if (sortedCategories.length > 0) {
      const [topCategory, topScore] = sortedCategories[0];
      const confidence = Math.min(0.95, 0.5 + (topScore * 0.1));
      
      return {
        transactionId: transaction.id,
        suggestedCategory: topCategory,
        confidence,
        method: 'rule-based',
        alternatives: sortedCategories
          .slice(1, 4)
          .map(([category, score]) => ({
            category,
            confidence: Math.min(0.95, 0.5 + (score * 0.1))
          }))
      };
    }

    // Default categorization based on transaction type
    const defaultCategory = transaction.type === 'income' ? 'Income' : 'Uncategorized';
    return {
      transactionId: transaction.id,
      suggestedCategory: defaultCategory,
      confidence: 0.3,
      method: 'rule-based',
      alternatives: []
    };
  }

  /**
   * Batch categorize multiple transactions
   */
  categorizeTransactions(transactions: BankTransaction[]): TransactionCategorization[] {
    return transactions.map(tx => this.categorizeTransaction(tx));
  }

  /**
   * Get alternative categories for a transaction
   */
  private getAlternativeCategories(primaryCategory: string, text: string): Array<{ category: string; confidence: number }> {
    const alternatives: Array<{ category: string; confidence: number }> = [];
    
    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      if (category === primaryCategory) continue;
      
      let score = 0;
      for (const pattern of patterns) {
        if (text.includes(pattern)) {
          score += 1;
        }
      }
      
      if (score > 0) {
        alternatives.push({
          category,
          confidence: Math.min(0.85, 0.4 + (score * 0.1))
        });
      }
    }

    return alternatives.slice(0, 3).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Learn from user corrections to improve categorization
   */
  learnFromCorrection(transactionId: string, correctCategory: string): void {
    // In a real implementation, this would update ML models or rule weights
    console.log(`Learning: Transaction ${transactionId} should be categorized as ${correctCategory}`);
    
    // Store correction for future reference
    const corrections = JSON.parse(localStorage.getItem('category-corrections') || '{}');
    corrections[transactionId] = correctCategory;
    localStorage.setItem('category-corrections', JSON.stringify(corrections));
  }

  /**
   * Get category suggestions for a given text
   */
  getCategorySuggestions(text: string): Array<{ category: string; confidence: number }> {
    const lowerText = text.toLowerCase();
    const categoryScores: Record<string, number> = {};
    
    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      let score = 0;
      for (const pattern of patterns) {
        if (lowerText.includes(pattern)) {
          score += 1;
        }
      }
      if (score > 0) {
        categoryScores[category] = score;
      }
    }

    return Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, score]) => ({
        category,
        confidence: Math.min(0.95, 0.5 + (score * 0.1))
      }));
  }
}

export const transactionCategorizationService = TransactionCategorizationService.getInstance();
