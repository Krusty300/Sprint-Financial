import { Transaction, Category, Account } from './types';
import { db } from './db';

export function seedSampleData() {
  try {
    // Only seed if there's no existing data
    const existingTransactions = db.getTransactions();
    const existingCategories = db.getCategories();
    const existingAccounts = db.getAccounts();

    if (!existingCategories || existingCategories.length === 0) {
      console.warn('No categories found for seeding data');
      return;
    }

    if (!existingAccounts || existingAccounts.length === 0) {
      console.warn('No accounts found for seeding data');
      return;
    }

    if (existingTransactions.length > 0) {
      console.log('Transactions already exist, skipping seed');
      return;
    }

    // Helper function to get category ID by name
    const getCategoryId = (name: string, type?: string) => {
      return existingCategories.find(c => 
        (type ? c.name === name && c.type === type : c.name === name)
      )?.id || existingCategories.find(c => 
        type ? c.type === type : c.name.toLowerCase().includes(name.toLowerCase())
      )?.id || '';
    };

    // Helper function to generate random date within last 90 days
    const getRandomDate = (daysAgo: number) => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
      return date.toISOString().split('T')[0];
    };

    // Enhanced sample transactions with more variety
    const sampleTransactions: Omit<Transaction, 'id'>[] = [
      // Income transactions
      {
        amount: 4500,
        type: 'income',
        category: getCategoryId('Salary', 'income'),
        date: getRandomDate(30),
        description: 'Monthly Salary - Tech Corp',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 1200,
        type: 'income',
        category: getCategoryId('Freelance', 'income'),
        date: getRandomDate(45),
        description: 'Website Design Project',
        account: existingAccounts[1]?.id,
      },
      {
        amount: 350,
        type: 'income',
        category: getCategoryId('Investments', 'income'),
        date: getRandomDate(60),
        description: 'Dividend Payment - Tech Stocks',
        account: existingAccounts[2]?.id,
      },
      {
        amount: 800,
        type: 'income',
        category: getCategoryId('Other Income', 'income'),
        date: getRandomDate(90),
        description: 'Quarterly Performance Bonus',
        account: existingAccounts[0]?.id,
      },

      // Housing expenses
      {
        amount: 1200,
        type: 'expense',
        category: getCategoryId('Bills', 'expense'),
        date: getRandomDate(5),
        description: 'Monthly Rent Payment',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 150,
        type: 'expense',
        category: getCategoryId('Bills', 'expense'),
        date: getRandomDate(10),
        description: 'Electricity and Water Bill',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 80,
        type: 'expense',
        category: getCategoryId('Bills', 'expense'),
        date: getRandomDate(15),
        description: 'Monthly Internet Service',
        account: existingAccounts[0]?.id,
      },

      // Food and groceries
      {
        amount: 245,
        type: 'expense',
        category: getCategoryId('Food', 'expense'),
        date: getRandomDate(7),
        description: 'Weekly Grocery Shopping',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 85,
        type: 'expense',
        category: getCategoryId('Food', 'expense'),
        date: getRandomDate(12),
        description: 'Dinner at Italian Restaurant',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 45,
        type: 'expense',
        category: getCategoryId('Food', 'expense'),
        date: getRandomDate(3),
        description: 'Coffee Shop - Morning Latte',
        account: existingAccounts[0]?.id,
      },

      // Transportation
      {
        amount: 65,
        type: 'expense',
        category: getCategoryId('Transport', 'expense'),
        date: getRandomDate(8),
        description: 'Gas Station Fill-up',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 120,
        type: 'expense',
        category: getCategoryId('Transport', 'expense'),
        date: getRandomDate(20),
        description: 'Monthly Transit Pass',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 35,
        type: 'expense',
        category: getCategoryId('Transport', 'expense'),
        date: getRandomDate(14),
        description: 'Downtown Parking',
        account: existingAccounts[0]?.id,
      },

      // Entertainment and leisure
      {
        amount: 120,
        type: 'expense',
        category: getCategoryId('Entertainment', 'expense'),
        date: getRandomDate(25),
        description: 'Movie Tickets and Popcorn',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 65,
        type: 'expense',
        category: getCategoryId('Entertainment', 'expense'),
        date: getRandomDate(30),
        description: 'Video Game Purchase',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 180,
        type: 'expense',
        category: getCategoryId('Entertainment', 'expense'),
        date: getRandomDate(40),
        description: 'Concert Tickets - Jazz Festival',
        account: existingAccounts[1]?.id,
      },

      // Shopping and personal care
      {
        amount: 320,
        type: 'expense',
        category: getCategoryId('Shopping', 'expense'),
        date: getRandomDate(35),
        description: 'New Work Outfit',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 85,
        type: 'expense',
        category: getCategoryId('Shopping', 'expense'),
        date: getRandomDate(18),
        description: 'Haircut and Grooming',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 150,
        type: 'expense',
        category: getCategoryId('Shopping', 'expense'),
        date: getRandomDate(50),
        description: 'Phone Case and Accessories',
        account: existingAccounts[0]?.id,
      },

      // Health and fitness
      {
        amount: 45,
        type: 'expense',
        category: getCategoryId('Healthcare', 'expense'),
        date: getRandomDate(22),
        description: 'Monthly Gym Membership',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 25,
        type: 'expense',
        category: getCategoryId('Healthcare', 'expense'),
        date: getRandomDate(28),
        description: 'Doctor Visit Co-pay',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 65,
        type: 'expense',
        category: getCategoryId('Healthcare', 'expense'),
        date: getRandomDate(33),
        description: 'Prescription Medication',
        account: existingAccounts[0]?.id,
      },

      // Education and learning
      {
        amount: 299,
        type: 'expense',
        category: getCategoryId('Education', 'expense'),
        date: getRandomDate(55),
        description: 'Online Course Subscription',
        account: existingAccounts[1]?.id,
      },
      {
        amount: 45,
        type: 'expense',
        category: getCategoryId('Education', 'expense'),
        date: getRandomDate(42),
        description: 'Technical Books Purchase',
        account: existingAccounts[0]?.id,
      },

      // Travel
      {
        amount: 450,
        type: 'expense',
        category: getCategoryId('Other', 'expense'),
        date: getRandomDate(70),
        description: 'Weekend Trip - Hotel Booking',
        account: existingAccounts[1]?.id,
      },
      {
        amount: 180,
        type: 'expense',
        category: getCategoryId('Other', 'expense'),
        date: getRandomDate(68),
        description: 'Flight Tickets',
        account: existingAccounts[1]?.id,
      },

      // Miscellaneous
      {
        amount: 95,
        type: 'expense',
        category: getCategoryId('Other', 'expense'),
        date: getRandomDate(38),
        description: 'Birthday Gift for Friend',
        account: existingAccounts[0]?.id,
      },
      {
        amount: 25,
        type: 'expense',
        category: getCategoryId('Other', 'expense'),
        date: getRandomDate(48),
        description: 'Charity Donation',
        account: existingAccounts[0]?.id,
      },
    ];

    // Sort transactions by date (newest first)
    sampleTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Add transactions to database
    sampleTransactions.forEach(transaction => {
      try {
        db.addTransaction(transaction);
      } catch (error) {
        console.error('Error adding sample transaction:', error);
      }
    });

    // Add sample budgets if they don't exist
    const existingBudgets = db.getBudgets();
    if (!existingBudgets || existingBudgets.length === 0) {
      const sampleBudgets = [
        {
          category: getCategoryId('Food', 'expense'),
          amount: 400,
          period: 'monthly' as const,
          startDate: new Date().toISOString().split('T')[0],
        },
        {
          category: getCategoryId('Entertainment', 'expense'),
          amount: 200,
          period: 'monthly' as const,
          startDate: new Date().toISOString().split('T')[0],
        },
        {
          category: getCategoryId('Transport', 'expense'),
          amount: 150,
          period: 'monthly' as const,
          startDate: new Date().toISOString().split('T')[0],
        },
      ];

      sampleBudgets.forEach(budget => {
        try {
          db.addBudget(budget);
        } catch (error) {
          console.error('Error adding sample budget:', error);
        }
      });
    }

    console.log(`Sample data seeded successfully: ${sampleTransactions.length} transactions added`);
  } catch (error) {
    console.error('Failed to seed sample data:', error);
  }
}
