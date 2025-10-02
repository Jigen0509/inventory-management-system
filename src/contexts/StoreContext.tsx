import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import type { Store } from '../types/database';
import { db } from '../lib/supabase';

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

  useEffect(() => {
    if (user?.store_id) {
      loadCurrentStore(user.store_id);
    }
  }, [user?.store_id]);

  const loadCurrentStore = async (storeId: string) => {
    setIsLoading(true);
    try {
      if (isDatabaseMode) {
        // データベースから店舗情報を取得
        const { data: storeData, error } = await db.getStore(storeId);
        if (storeData && !error) {
          setCurrentStore(storeData);
        } else {
          console.error('Error loading store from database:', error);
        }
      } else {
        // デモ用の店舗データ
        const demoStores = {
          '550e8400-e29b-41d4-a716-446655440001': {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: '本店',
            address: '東京都渋谷区道玄坂1-2-3',
            phone: '03-1234-5678'
          },
          '550e8400-e29b-41d4-a716-446655440002': {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: '支店',
            address: '大阪府大阪市北区梅田1-1-1',
            phone: '06-1234-5678'
          },
          '550e8400-e29b-41d4-a716-446655440003': {
            id: '550e8400-e29b-41d4-a716-446655440003',
            name: '名古屋店',
            address: '愛知県名古屋市中区栄1-1-1',
            phone: '052-123-4567'
          }
        };

        const storeData = demoStores[storeId as keyof typeof demoStores];
        if (storeData) {
          setCurrentStore(storeData);
        }
      }
    } catch (error) {
      console.error('Error loading current store:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchStore = async (storeId: string) => {
    setIsLoading(true);
    try {
      if (isDatabaseMode) {
        // データベースから店舗情報を取得
        const { data: storeData, error } = await db.getStore(storeId);
        if (storeData && !error) {
          setCurrentStore(storeData);
        } else {
          console.error('Error loading store from database:', error);
        }
      } else {
        // デモ用の店舗データ
        const demoStores = {
          '550e8400-e29b-41d4-a716-446655440001': {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: '本店',
            address: '東京都渋谷区道玄坂1-2-3',
            phone: '03-1234-5678'
          },
          '550e8400-e29b-41d4-a716-446655440002': {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: '支店',
            address: '大阪府大阪市北区梅田1-1-1',
            phone: '06-1234-5678'
          },
          '550e8400-e29b-41d4-a716-446655440003': {
            id: '550e8400-e29b-41d4-a716-446655440003',
            name: '名古屋店',
            address: '愛知県名古屋市中区栄1-1-1',
            phone: '052-123-4567'
          }
        };

        const storeData = demoStores[storeId as keyof typeof demoStores];
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
