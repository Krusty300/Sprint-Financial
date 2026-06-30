/**
 * IndexedDB implementation for enhanced data management and storage
 */

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account?: string;
  tags?: string[];
  type: 'income' | 'expense';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  budget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncStatus {
  lastSync: string;
  pendingChanges: number;
  conflicts: string[];
}

class IndexedDBManager {
  private dbName = 'finance-tracker-db';
  private version = 1;
  private db: IDBDatabase | null = null;
  private compressionEnabled = true;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const target = event.target as IDBOpenDBRequest;
        const db = target.result as IDBDatabase;
        this.createObjectStores(db);
      };
    });
  }

  private createObjectStores(db?: IDBDatabase): void {
    const database = db || this.db;
    if (!database) return;

    // Create object stores if they don't exist
    if (!database.objectStoreNames.contains('transactions')) {
      database.createObjectStore('transactions', { keyPath: 'id' });
    }
    if (!database.objectStoreNames.contains('categories')) {
      database.createObjectStore('categories', { keyPath: 'id' });
    }
    if (!database.objectStoreNames.contains('budgets')) {
      database.createObjectStore('budgets', { keyPath: 'id' });
    }
    if (!database.objectStoreNames.contains('accounts')) {
      database.createObjectStore('accounts', { keyPath: 'id' });
    }
    if (!database.objectStoreNames.contains('sync')) {
      database.createObjectStore('sync', { keyPath: 'id' });
    }
  }

  // Compression utilities
  private async compress(data: any): Promise<Uint8Array> {
    if (!this.compressionEnabled) {
      return new TextEncoder().encode(JSON.stringify(data));
    }

    const jsonString = JSON.stringify(data);
    return new TextEncoder().encode(jsonString);
  }

  private async decompress(data: Uint8Array): Promise<any> {
    if (!this.compressionEnabled) {
      return JSON.parse(new TextDecoder().decode(data));
    }

    const jsonString = new TextDecoder().decode(data);
    return JSON.parse(jsonString);
  }

  // Generic CRUD operations
  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const items = request.result;
        resolve(items);
      };
    });
  }

  async add<T>(storeName: string, item: T): Promise<string> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Add timestamp and ID
      const itemWithMeta = {
        ...item,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const request = store.add(itemWithMeta);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string);
    });
  }

  async update<T>(storeName: string, id: string, updates: Partial<T>): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const getRequest = store.get(id);
      
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const existingItem = getRequest.result;
        if (!existingItem) {
          reject(new Error('Item not found'));
          return;
        }
        
        const updatedItem = {
          ...existingItem,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        const updateRequest = store.put(updatedItem);
        
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      };
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Query operations
  async query<T>(
    storeName: string, 
    query: {
      index?: string;
      range?: IDBKeyRange;
      limit?: number;
      direction?: 'next' | 'prev' | 'nextunique' | 'prevunique';
    } = {}
  ): Promise<T[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request: IDBRequest;
      
      if (query.index) {
        const index = store.index(query.index);
        request = index.openCursor(query.range, query.direction);
      } else {
        request = store.openCursor(query.range, query.direction);
      }
      
      const results: T[] = [];
      let count = 0;
      
      request.onerror = () => reject(request.error);
      request.onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        
        if (cursor) {
          const item = cursor.value;
          results.push(item);
          count++;
          
          if (!query.limit || count < query.limit) {
            cursor.continue();
          } else {
            resolve(results);
          }
        } else {
          resolve(results);
        }
      };
    });
  }

  // Sync operations
  async getSyncStatus(): Promise<SyncStatus> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync'], 'readonly');
      const store = transaction.objectStore('sync');
      const request = store.get('status');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result || {
          lastSync: new Date().toISOString(),
          pendingChanges: 0,
          conflicts: []
        });
      };
    });
  }

  async updateSyncStatus(updates: Partial<SyncStatus>): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync'], 'readwrite');
      const store = transaction.objectStore('sync');
      
      const updatedStatus = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      const request = store.put(updatedStatus, 'status');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Backup and restore operations
  async createBackup(): Promise<Blob> {
  const transactions = await this.getAll<Transaction>('transactions');
  const categories = await this.getAll<Category>('categories');
  const budgets = await this.getAll<Budget>('budgets');
  const accounts = await this.getAll<Account>('accounts');
  
  const backup = {
    version: this.version,
    timestamp: new Date().toISOString(),
    data: {
      transactions,
      categories,
      budgets,
      accounts
    }
  };
  
  const jsonString = JSON.stringify(backup, null, 2);
  // Use a simple Blob with JSON data
  return new Blob([jsonString], { type: 'application/json' });
}

  async restoreFromBackup(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        try {
          const target = event.target;
          if (!target || !target.result) {
            reject(new Error('Failed to read file'));
            return;
          }
          
          const data = await this.decompress(new Uint8Array(target.result as ArrayBuffer));
          
          // Clear existing data
          await this.clearAll();
          
          // Restore data
          await this.restoreData(data.data);
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  private async restoreData(data: any): Promise<void> {
    const { transactions, categories, budgets, accounts } = data;
    
    // Restore in order to maintain foreign key relationships
    if (categories && categories.length > 0) {
      for (const category of categories) {
        await this.add('categories', category);
      }
    }
    
    if (accounts && accounts.length > 0) {
      for (const account of accounts) {
        await this.add('accounts', account);
      }
    }
    
    if (budgets && budgets.length > 0) {
      for (const budget of budgets) {
        await this.add('budgets', budget);
      }
    }
    
    if (transactions && transactions.length > 0) {
      for (const transaction of transactions) {
        await this.add('transactions', transaction);
      }
    }
  }

  private async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    
    const storeNames = this.db!.objectStoreNames;
    
    for (const storeName of storeNames) {
      if (storeName !== 'sync') { // Don't clear sync status
        await this.clear(storeName);
      }
    }
  }

  // Storage optimization
  async optimizeStorage(): Promise<{
    totalSize: number;
    compressedSize: number;
    savings: number;
  }> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readonly');
      const store = transaction.objectStore('transactions');
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        const items = request.result;
        let totalSize = 0;
        let compressedSize = 0;
        
        for (const item of items) {
          const itemSize = JSON.stringify(item).length;
          totalSize += itemSize;
          
          if (item.compressed) {
            compressedSize += item.data.length;
          } else {
            const compressed = await this.compress(item);
            compressedSize += compressed.length;
          }
        }
        
        const savings = totalSize - compressedSize;
        
        resolve({
          totalSize,
          compressedSize,
          savings: Math.round((savings / totalSize) * 100)
        });
      };
    });
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async getStorageUsage(): Promise<{
    used: number;
    available: number;
    quota: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0),
        quota: estimate.quota || 0
      };
    }
    
    // Fallback for browsers without storage estimate
    return {
      used: 0,
      available: 0,
      quota: 0
    };
  }

  // Migration from localStorage
  async migrateFromLocalStorage(): Promise<void> {
    const migrationData: any = {};
    
    // Get data from localStorage
    const keys = ['finance-tracker-transactions', 'finance-tracker-categories', 
                   'finance-tracker-budgets', 'finance-tracker-accounts'];
    
    for (const key of keys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          migrationData[key.replace('finance-tracker-', '')] = JSON.parse(data);
        } catch (error) {
          console.error(`Failed to parse ${key}:`, error);
        }
      }
    }
    
    // Migrate to IndexedDB
    try {
      for (const [storeName, data] of Object.entries(migrationData)) {
        if (Array.isArray(data)) {
          for (const item of data) {
            await this.add(storeName, item);
          }
        }
      }
      
      // Clear localStorage after successful migration
      for (const key of keys) {
        localStorage.removeItem(key);
      }
      
      console.log('Migration from localStorage to IndexedDB completed');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  // Export data for external use
  async exportData(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const transactions = await this.getAll<Transaction>('transactions');
    const categories = await this.getAll<Category>('categories');
    const budgets = await this.getAll<Budget>('budgets');
    const accounts = await this.getAll<Account>('accounts');
    
    const exportData = {
      version: this.version,
      timestamp: new Date().toISOString(),
      transactions,
      categories,
      budgets,
      accounts
    };
    
    if (format === 'json') {
      const jsonString = JSON.stringify(exportData, null, 2);
      return new Blob([jsonString], { type: 'application/json' });
    } else if (format === 'csv') {
      const csv = this.convertToCSV(exportData);
      return new Blob([csv], { type: 'text/csv' });
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private convertToCSV(data: any): string {
    const headers = ['id', 'date', 'description', 'amount', 'category', 'account', 'type', 'createdAt'];
    const csvRows = [headers.join(',')];
    
    // Add transactions
    if (data.transactions) {
      for (const transaction of data.transactions) {
        const row = [
          transaction.id,
          transaction.date,
          `"${transaction.description.replace(/"/g, '""')}"`,
          transaction.amount,
          transaction.category,
          transaction.account || '',
          transaction.type,
          transaction.createdAt
        ];
        csvRows.push(row.join(','));
      }
    }
    
    return csvRows.join('\n');
  }

  // Cleanup
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const indexedDB = new IndexedDBManager();