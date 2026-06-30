import { AppImport, Transaction, Account } from '@/lib/types';

export class AppImportService {
  private static instance: AppImportService;
  private imports: AppImport[] = [];

  private constructor() {
    this.loadImports();
  }

  static getInstance(): AppImportService {
    if (!AppImportService.instance) {
      AppImportService.instance = new AppImportService();
    }
    return AppImportService.instance;
  }

  private loadImports(): void {
    try {
      const stored = localStorage.getItem('app-imports');
      if (stored) {
        this.imports = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading app imports:', error);
    }
  }

  private saveImports(): void {
    try {
      localStorage.setItem('app-imports', JSON.stringify(this.imports));
    } catch (error) {
      console.error('Error saving app imports:', error);
    }
  }

  /**
   * Import from Mint
   */
  async importFromMint(file: File): Promise<AppImport> {
    const appImport: AppImport = {
      id: `mint-import-${Date.now()}`,
      source: 'mint',
      status: 'processing',
      file,
      accountCount: 0,
      transactionCount: 0,
      createdAt: new Date().toISOString()
    };

    this.imports.push(appImport);
    this.saveImports();

    try {
      // Parse Mint CSV format
      const content = await file.text();
      const data = this.parseMintCSV(content);
      
      appImport.accountCount = data.accounts.length;
      appImport.transactionCount = data.transactions.length;
      appImport.status = 'completed';
      appImport.completedAt = new Date().toISOString();
      
      // In a real implementation, this would save the data to the database
      console.log('Imported from Mint:', data);
    } catch (error) {
      appImport.status = 'failed';
      appImport.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      appImport.completedAt = new Date().toISOString();
    }

    this.saveImports();
    return appImport;
  }

  /**
   * Import from YNAB
   */
  async importFromYNAB(file: File): Promise<AppImport> {
    const appImport: AppImport = {
      id: `ynab-import-${Date.now()}`,
      source: 'ynab',
      status: 'processing',
      file,
      accountCount: 0,
      transactionCount: 0,
      createdAt: new Date().toISOString()
    };

    this.imports.push(appImport);
    this.saveImports();

    try {
      // Parse YNAB CSV format
      const content = await file.text();
      const data = this.parseYNABCSV(content);
      
      appImport.accountCount = data.accounts.length;
      appImport.transactionCount = data.transactions.length;
      appImport.status = 'completed';
      appImport.completedAt = new Date().toISOString();
      
      // In a real implementation, this would save the data to the database
      console.log('Imported from YNAB:', data);
    } catch (error) {
      appImport.status = 'failed';
      appImport.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      appImport.completedAt = new Date().toISOString();
    }

    this.saveImports();
    return appImport;
  }

  /**
   * Import from Personal Capital
   */
  async importFromPersonalCapital(file: File): Promise<AppImport> {
    const appImport: AppImport = {
      id: `pc-import-${Date.now()}`,
      source: 'personal-capital',
      status: 'processing',
      file,
      accountCount: 0,
      transactionCount: 0,
      createdAt: new Date().toISOString()
    };

    this.imports.push(appImport);
    this.saveImports();

    try {
      // Parse Personal Capital CSV format
      const content = await file.text();
      const data = this.parsePersonalCapitalCSV(content);
      
      appImport.accountCount = data.accounts.length;
      appImport.transactionCount = data.transactions.length;
      appImport.status = 'completed';
      appImport.completedAt = new Date().toISOString();
      
      // In a real implementation, this would save the data to the database
      console.log('Imported from Personal Capital:', data);
    } catch (error) {
      appImport.status = 'failed';
      appImport.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      appImport.completedAt = new Date().toISOString();
    }

    this.saveImports();
    return appImport;
  }

  /**
   * Import from generic CSV
   */
  async importFromCSV(file: File): Promise<AppImport> {
    const appImport: AppImport = {
      id: `csv-import-${Date.now()}`,
      source: 'csv',
      status: 'processing',
      file,
      accountCount: 0,
      transactionCount: 0,
      createdAt: new Date().toISOString()
    };

    this.imports.push(appImport);
    this.saveImports();

    try {
      // Parse generic CSV format
      const content = await file.text();
      const data = this.parseGenericCSV(content);
      
      appImport.accountCount = data.accounts.length;
      appImport.transactionCount = data.transactions.length;
      appImport.status = 'completed';
      appImport.completedAt = new Date().toISOString();
      
      // In a real implementation, this would save the data to the database
      console.log('Imported from CSV:', data);
    } catch (error) {
      appImport.status = 'failed';
      appImport.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      appImport.completedAt = new Date().toISOString();
    }

    this.saveImports();
    return appImport;
  }

  /**
   * Parse Mint CSV format
   */
  private parseMintCSV(content: string): { accounts: Account[]; transactions: Transaction[] } {
    const lines = content.split('\n');
    const accounts: Account[] = [];
    const transactions: Transaction[] = [];

    // Mint CSV format parsing logic
    // In a real implementation, this would parse the specific Mint CSV format
    lines.forEach((line, index) => {
      if (index === 0) return; // Skip header
      
      const columns = line.split(',');
      if (columns.length < 5) return;

      transactions.push({
        id: `tx-${Date.now()}-${index}`,
        date: columns[0],
        description: columns[1],
        amount: parseFloat(columns[2]) || 0,
        category: columns[3],
        type: columns[4] as 'income' | 'expense',
        account: columns[5] || 'default'
      } as Transaction);
    });

    return { accounts, transactions };
  }

  /**
   * Parse YNAB CSV format
   */
  private parseYNABCSV(content: string): { accounts: Account[]; transactions: Transaction[] } {
    const lines = content.split('\n');
    const accounts: Account[] = [];
    const transactions: Transaction[] = [];

    // YNAB CSV format parsing logic
    // In a real implementation, this would parse the specific YNAB CSV format
    lines.forEach((line, index) => {
      if (index === 0) return; // Skip header
      
      const columns = line.split(',');
      if (columns.length < 4) return;

      transactions.push({
        id: `tx-${Date.now()}-${index}`,
        date: columns[0],
        description: columns[1],
        amount: parseFloat(columns[2]) || 0,
        category: columns[3],
        type: columns[4] as 'income' | 'expense',
        account: columns[5] || 'default'
      } as Transaction);
    });

    return { accounts, transactions };
  }

  /**
   * Parse Personal Capital CSV format
   */
  private parsePersonalCapitalCSV(content: string): { accounts: Account[]; transactions: Transaction[] } {
    const lines = content.split('\n');
    const accounts: Account[] = [];
    const transactions: Transaction[] = [];

    // Personal Capital CSV format parsing logic
    // In a real implementation, this would parse the specific Personal Capital CSV format
    lines.forEach((line, index) => {
      if (index === 0) return; // Skip header
      
      const columns = line.split(',');
      if (columns.length < 5) return;

      transactions.push({
        id: `tx-${Date.now()}-${index}`,
        date: columns[0],
        description: columns[1],
        amount: parseFloat(columns[2]) || 0,
        category: columns[3],
        type: columns[4] as 'income' | 'expense',
        account: columns[5] || 'default'
      } as Transaction);
    });

    return { accounts, transactions };
  }

  /**
   * Parse generic CSV format
   */
  private parseGenericCSV(content: string): { accounts: Account[]; transactions: Transaction[] } {
    const lines = content.split('\n');
    const accounts: Account[] = [];
    const transactions: Transaction[] = [];

    // Generic CSV format parsing logic
    lines.forEach((line, index) => {
      if (index === 0) return; // Skip header
      
      const columns = line.split(',');
      if (columns.length < 4) return;

      transactions.push({
        id: `tx-${Date.now()}-${index}`,
        date: columns[0],
        description: columns[1],
        amount: parseFloat(columns[2]) || 0,
        category: columns[3],
        type: columns[4] as 'income' | 'expense',
        account: columns[5] || 'default'
      } as Transaction);
    });

    return { accounts, transactions };
  }

  /**
   * Get all imports
   */
  getImports(): AppImport[] {
    return this.imports;
  }

  /**
   * Get import by ID
   */
  getImportById(id: string): AppImport | undefined {
    return this.imports.find(imp => imp.id === id);
  }

  /**
   * Delete import
   */
  deleteImport(id: string): boolean {
    const index = this.imports.findIndex(imp => imp.id === id);
    if (index === -1) return false;

    this.imports.splice(index, 1);
    this.saveImports();
    return true;
  }

  /**
   * Get supported import formats
   */
  getSupportedFormats(): string[] {
    return ['mint', 'ynab', 'personal-capital', 'csv'];
  }
}

export const appImportService = AppImportService.getInstance();
