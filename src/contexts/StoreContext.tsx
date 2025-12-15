import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type { Store } from '../types/database';
import { db } from '../lib/supabase';

const demoStores: Record<string, Store> = {
  '550e8400-e29b-41d4-a716-446655440001': {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: '本店',
    address: '東京都渋谷区道玄坂1-2-3',
    phone: '03-1234-5678',
    manager_id: '',
    created_at: '',
    updated_at: ''
  },
  '550e8400-e29b-41d4-a716-446655440002': {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: '支店',
    address: '大阪府大阪市北区梅田1-1-1',
    phone: '06-1234-5678',
    manager_id: '',
    created_at: '',
    updated_at: ''
  },
  '550e8400-e29b-41d4-a716-446655440003': {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: '名古屋店',
    address: '愛知県名古屋市中区栄1-1-1',
    phone: '052-123-4567',
    manager_id: '',
    created_at: '',
    updated_at: ''
  }
};

const isValidUUID = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

interface StoreContextType {
  currentStore: Store | null;
  setCurrentStore: (store: Store | null) => void;
  switchStore: (storeId: string) => Promise<void>;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const { user, isDatabaseMode } = useAuth();
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadCurrentStore = useCallback(async (storeId: string) => {
    setIsLoading(true);
    try {
      if (isDatabaseMode) {
        if (!isValidUUID(storeId)) {
          console.error('Invalid store_id (not UUID):', storeId);
          setCurrentStore(null);
          return;
        }
        // データベースから店舗情報を取得
        const { data: storeData, error } = await db.getStore(storeId);
        if (storeData && !error) {
          setCurrentStore(storeData);
        } else {
          console.error('Error loading store from database:', error);
        }
      } else {
        const storeData = demoStores[storeId];
        if (storeData) {
          setCurrentStore(storeData);
        }
      }
    } catch (error) {
      console.error('Error loading current store:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isDatabaseMode]);

  useEffect(() => {
    if (user?.store_id) {
      loadCurrentStore(user.store_id);
    } else if (!isDatabaseMode) {
      const saved = localStorage.getItem('currentStoreId');
      const fallbackId = saved && demoStores[saved] ? saved : '550e8400-e29b-41d4-a716-446655440001';
      setCurrentStore(demoStores[fallbackId]);
    }
  }, [user?.store_id, isDatabaseMode, loadCurrentStore]);

  const switchStore = async (storeId: string) => {
    setIsLoading(true);
    try {
      if (isDatabaseMode) {
        if (!isValidUUID(storeId)) {
          console.error('Invalid store_id (not UUID):', storeId);
          setCurrentStore(null);
          return;
        }
        // データベースから店舗情報を取得
        const { data: storeData, error } = await db.getStore(storeId);
        if (storeData && !error) {
          setCurrentStore(storeData);
        } else {
          console.error('Error loading store from database:', error);
        }
      } else {
        const storeData = demoStores[storeId];
        if (storeData) {
          setCurrentStore(storeData);
          localStorage.setItem('currentStoreId', storeId);
        }
      }
    } catch (error) {
      console.error('Error switching store:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: StoreContextType = {
    currentStore,
    setCurrentStore,
    switchStore,
    isLoading,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
