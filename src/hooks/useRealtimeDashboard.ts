'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTransactions } from './useTransactions';
import { useAccounts } from './useAccounts';
import { useBudgets } from './useBudgets';
import { useCategories } from './useCategories';

interface RealtimeUpdate {
  type: 'transaction' | 'account' | 'budget' | 'category';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  userId?: string;
}

interface RealtimeState {
  isConnected: boolean;
  lastUpdate: RealtimeUpdate | null;
  pendingUpdates: RealtimeUpdate[];
  connectionAttempts: number;
}

export function useRealtimeDashboard() {
  const [realtimeState, setRealtimeState] = useState<RealtimeState>({
    isConnected: false,
    lastUpdate: null,
    pendingUpdates: [],
    connectionAttempts: 0
  });

  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { accounts, updateAccount } = useAccounts();
  const { budgets, updateBudget } = useBudgets();
  const { categories } = useCategories();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    try {
      // In production, use your actual WebSocket URL
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-finance-app.com/ws' 
        : 'ws://localhost:3001/ws';

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Realtime dashboard connected');
        setRealtimeState(prev => ({
          ...prev,
          isConnected: true,
          connectionAttempts: 0
        }));

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, 30000); // 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const update: RealtimeUpdate = JSON.parse(event.data);
          handleRealtimeUpdate(update);
        } catch (error) {
          console.error('Failed to parse realtime update:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('Realtime dashboard disconnected:', event.code, event.reason);
        setRealtimeState(prev => ({
          ...prev,
          isConnected: false
        }));

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Attempt reconnection
        if (event.code !== 1000) { // Not a normal closure
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setRealtimeState(prev => ({
          ...prev,
          isConnected: false
        }));
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      scheduleReconnect();
    }
  }, []);

  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    setRealtimeState(prev => ({
      ...prev,
      connectionAttempts: prev.connectionAttempts + 1
    }));

    const backoffMs = Math.min(1000 * Math.pow(2, realtimeState.connectionAttempts), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, backoffMs);
  }, [realtimeState.connectionAttempts, connectWebSocket]);

  // Handle incoming realtime updates
  const handleRealtimeUpdate = useCallback((update: RealtimeUpdate) => {
    console.log('Received realtime update:', update);

    setRealtimeState(prev => ({
      ...prev,
      lastUpdate: update,
      pendingUpdates: [...prev.pendingUpdates.slice(-9), update] // Keep last 10 updates
    }));

    // Apply update to local state
    switch (update.type) {
      case 'transaction':
        handleTransactionUpdate(update);
        break;
      case 'account':
        handleAccountUpdate(update);
        break;
      case 'budget':
        handleBudgetUpdate(update);
        break;
      case 'category':
        handleCategoryUpdate(update);
        break;
    }
  }, []);

  // Handle transaction updates
  const handleTransactionUpdate = useCallback((update: RealtimeUpdate) => {
    switch (update.action) {
      case 'create':
        if (addTransaction) {
          addTransaction(update.data);
        }
        break;
      case 'update':
        if (updateTransaction) {
          updateTransaction(update.data.id, update.data);
        }
        break;
      case 'delete':
        if (deleteTransaction) {
          deleteTransaction(update.data.id);
        }
        break;
    }
  }, [addTransaction, updateTransaction, deleteTransaction]);

  // Handle account updates
  const handleAccountUpdate = useCallback((update: RealtimeUpdate) => {
    if (update.action === 'update' && updateAccount) {
      updateAccount(update.data.id, update.data);
    }
  }, [updateAccount]);

  // Handle budget updates
  const handleBudgetUpdate = useCallback((update: RealtimeUpdate) => {
    if (update.action === 'update' && updateBudget) {
      updateBudget(update.data.id, update.data);
    }
  }, [updateBudget]);

  // Handle category updates
  const handleCategoryUpdate = useCallback((update: RealtimeUpdate) => {
    // Categories are typically read-only, but we can handle updates
    console.log('Category update received:', update.data);
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  // Clear pending updates
  const clearPendingUpdates = useCallback(() => {
    setRealtimeState(prev => ({
      ...prev,
      pendingUpdates: []
    }));
  }, []);

  // Initialize connection
  useEffect(() => {
    connectWebSocket();

    return () => {
      // Cleanup
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [connectWebSocket]);

  return {
    // Connection state
    isConnected: realtimeState.isConnected,
    lastUpdate: realtimeState.lastUpdate,
    pendingUpdates: realtimeState.pendingUpdates,
    connectionAttempts: realtimeState.connectionAttempts,

    // Actions
    sendMessage,
    clearPendingUpdates,
    reconnect: connectWebSocket,

    // Statistics
    stats: {
      totalUpdates: realtimeState.pendingUpdates.length,
      lastUpdateTime: realtimeState.lastUpdate?.timestamp || null,
      connectionQuality: realtimeState.connectionAttempts === 0 ? 'excellent' : 
                       realtimeState.connectionAttempts < 3 ? 'good' : 'poor'
    }
  };
}

// Mock WebSocket for development
export function useMockRealtimeDashboard() {
  const [realtimeState, setRealtimeState] = useState<RealtimeState>({
    isConnected: false,
    lastUpdate: null,
    pendingUpdates: [],
    connectionAttempts: 0
  });

  // Simulate random updates for demo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const mockUpdate: RealtimeUpdate = {
          type: 'transaction',
          action: Math.random() > 0.5 ? 'create' : 'update',
          data: {
            id: `mock-${Date.now()}`,
            amount: Math.random() * 1000,
            description: 'Mock transaction',
            category: 'Food',
            date: new Date().toISOString()
          },
          timestamp: Date.now()
        };

        setRealtimeState(prev => ({
          ...prev,
          isConnected: true,
          lastUpdate: mockUpdate,
          pendingUpdates: [...prev.pendingUpdates.slice(-9), mockUpdate]
        }));
      }, 5000 + Math.random() * 10000); // Random interval between 5-15 seconds

      return () => clearInterval(interval);
    }
  }, []);

  return {
    isConnected: realtimeState.isConnected,
    lastUpdate: realtimeState.lastUpdate,
    pendingUpdates: realtimeState.pendingUpdates,
    connectionAttempts: realtimeState.connectionAttempts,
    sendMessage: () => {},
    clearPendingUpdates: () => setRealtimeState(prev => ({ ...prev, pendingUpdates: [] })),
    reconnect: () => {},
    stats: {
      totalUpdates: realtimeState.pendingUpdates.length,
      lastUpdateTime: realtimeState.lastUpdate?.timestamp || null,
      connectionQuality: 'excellent'
    }
  };
}
