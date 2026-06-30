import { ApiIntegration } from '@/lib/types';

export class ApiIntegrationService {
  private static instance: ApiIntegrationService;
  private integrations: ApiIntegration[] = [];

  private constructor() {
    this.loadIntegrations();
  }

  static getInstance(): ApiIntegrationService {
    if (!ApiIntegrationService.instance) {
      ApiIntegrationService.instance = new ApiIntegrationService();
    }
    return ApiIntegrationService.instance;
  }

  private loadIntegrations(): void {
    try {
      const stored = localStorage.getItem('api-integrations');
      if (stored) {
        this.integrations = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading API integrations:', error);
    }
  }

  private saveIntegrations(): void {
    try {
      localStorage.setItem('api-integrations', JSON.stringify(this.integrations));
    } catch (error) {
      console.error('Error saving API integrations:', error);
    }
  }

  /**
   * Create a new API integration
   */
  createIntegration(
    name: string,
    apiKey: string,
    permissions: string[],
    rateLimit?: { requestsPerMinute: number; requestsPerDay: number }
  ): ApiIntegration {
    const integration: ApiIntegration = {
      id: `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      apiKey,
      permissions,
      isActive: true,
      lastUsed: new Date().toISOString(),
      rateLimit
    };

    this.integrations.push(integration);
    this.saveIntegrations();
    return integration;
  }

  /**
   * Get all integrations
   */
  getIntegrations(): ApiIntegration[] {
    return this.integrations;
  }

  /**
   * Get integration by ID
   */
  getIntegrationById(id: string): ApiIntegration | undefined {
    return this.integrations.find(int => int.id === id);
  }

  /**
   * Update integration
   */
  updateIntegration(id: string, updates: Partial<ApiIntegration>): ApiIntegration | null {
    const index = this.integrations.findIndex(int => int.id === id);
    if (index === -1) return null;

    this.integrations[index] = { ...this.integrations[index], ...updates };
    this.saveIntegrations();
    return this.integrations[index];
  }

  /**
   * Delete integration
   */
  deleteIntegration(id: string): boolean {
    const index = this.integrations.findIndex(int => int.id === id);
    if (index === -1) return false;

    this.integrations.splice(index, 1);
    this.saveIntegrations();
    return true;
  }

  /**
   * Update last used timestamp
   */
  updateLastUsed(id: string): void {
    const integration = this.getIntegrationById(id);
    if (integration) {
      integration.lastUsed = new Date().toISOString();
      this.saveIntegrations();
    }
  }

  /**
   * Validate API key
   */
  validateApiKey(apiKey: string): boolean {
    // Basic validation - in a real implementation, this would validate against the API provider
    return apiKey.length >= 32 && /^[a-zA-Z0-9\-_]+$/.test(apiKey);
  }

  /**
   * Check rate limit
   */
  checkRateLimit(id: string): boolean {
    const integration = this.getIntegrationById(id);
    if (!integration || !integration.rateLimit) return true;

    // In a real implementation, this would check actual usage against rate limits
    return true;
  }

  /**
   * Get available permissions
   */
  getAvailablePermissions(): string[] {
    return [
      'read:accounts',
      'write:accounts',
      'read:transactions',
      'write:transactions',
      'read:categories',
      'write:categories',
      'read:budgets',
      'write:budgets',
      'read:goals',
      'write:goals',
      'read:reports',
      'admin:full'
    ];
  }
}

export const apiIntegrationService = ApiIntegrationService.getInstance();
