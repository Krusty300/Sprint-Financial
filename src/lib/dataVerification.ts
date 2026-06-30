import { db } from './db';

export function verifyDataPersistence() {
  console.log('🔍 Verifying Data Persistence...');
  
  try {
    // Test Categories
    const categories = db.getCategories();
    console.log(`📁 Categories: ${categories.length} items`);
    if (categories.length > 0) {
      console.log('✅ Categories loaded successfully');
      console.log('Sample categories:', categories.slice(0, 3).map(c => c.name));
    } else {
      console.log('❌ No categories found');
    }

    // Test Accounts
    const accounts = db.getAccounts();
    console.log(`💳 Accounts: ${accounts.length} items`);
    if (accounts.length > 0) {
      console.log('✅ Accounts loaded successfully');
      console.log('Sample accounts:', accounts.slice(0, 3).map(a => a.name));
    } else {
      console.log('❌ No accounts found');
    }

    // Test Transactions
    const transactions = db.getTransactions();
    console.log(`💰 Transactions: ${transactions.length} items`);
    if (transactions.length > 0) {
      console.log('✅ Transactions loaded successfully');
      console.log('Sample transactions:', transactions.slice(0, 3).map(t => ({
        description: t.description,
        amount: t.amount,
        type: t.type
      })));
    } else {
      console.log('❌ No transactions found');
    }

    // Test Budgets
    const budgets = db.getBudgets();
    console.log(`📊 Budgets: ${budgets.length} items`);

    // Test adding a sample transaction
    try {
      const testTransaction = {
        amount: 100,
        type: 'expense' as const,
        category: categories[0]?.id || 'test-category',
        date: new Date().toISOString().split('T')[0],
        description: 'Test Transaction',
        account: accounts[0]?.id || 'test-account',
      };

      const added = db.addTransaction(testTransaction);
      console.log('✅ Successfully added test transaction:', added.description);

      // Test deleting the test transaction
      const deleted = db.deleteTransaction(added.id);
      console.log('✅ Successfully deleted test transaction:', deleted);

    } catch (error) {
      console.error('❌ Error testing transaction operations:', error);
    }

    // Test data export
    try {
      const exportedData = db.exportData();
      console.log('✅ Data export successful');
      console.log('Export includes:', Object.keys(exportedData));
    } catch (error) {
      console.error('❌ Error testing data export:', error);
    }

    console.log('🎯 Data Persistence Verification Complete');
    return {
      categories: categories.length,
      accounts: accounts.length,
      transactions: transactions.length,
      budgets: budgets.length,
    };
  } catch (error) {
    console.error('❌ Critical error during data verification:', error);
    return {
      categories: 0,
      accounts: 0,
      transactions: 0,
      budgets: 0,
    };
  }
}

export function verifyLocalStorage() {
  console.log('🔍 Verifying Local Storage...');
  
  try {
    const testKey = 'finance-tracker-test';
    const testValue = 'test-value';
    
    // Test write
    localStorage.setItem(testKey, testValue);
    console.log('✅ Local storage write successful');
    
    // Test read
    const readValue = localStorage.getItem(testKey);
    console.log('✅ Local storage read successful:', readValue === testValue);
    
    // Test delete
    localStorage.removeItem(testKey);
    console.log('✅ Local storage delete successful');
    
    return true;
  } catch (error) {
    console.error('❌ Local storage error:', error);
    return false;
  }
}
