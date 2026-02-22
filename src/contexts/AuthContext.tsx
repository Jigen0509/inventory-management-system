import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserWithStore } from '../types/database';
import { auth, db } from '../lib/supabase';
import { checkMigrationStatus, migrateAllData } from '../utils/migration';

interface AuthContextType {
  user: UserWithStore | null;
  loading: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isDatabaseMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserWithStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDatabaseMode, setIsDatabaseMode] = useState(false);

  useEffect(() => {
    // 初期セッション確認
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // 環境変数をチェックしてデータベースモードかどうかを判定
      const hasSupabaseConfig = import.meta.env.VITE_SUPABASE_URL && 
                               import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co' &&
                               import.meta.env.VITE_SUPABASE_ANON_KEY && 
                               import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-anon-key';
      
      // 本番環境モードを有効化（Supabase使用）
      const enableDatabaseMode = true;
      
      if (hasSupabaseConfig && enableDatabaseMode) {
        setIsDatabaseMode(true);
        
        // データ移行をチェック
        const migrationStatus = checkMigrationStatus();
        if (!migrationStatus.completed) {
          console.log('データベース移行を開始します...');
          await migrateAllData();
        }
        
        // Supabaseセッションをチェック
        const { session } = await auth.getSession();
        if (session?.user) {
          // ユーザープロファイルを取得
          const { data: userProfile, error } = await db.getUserProfile(session.user.id);
          if (userProfile && !error) {
            setUser(userProfile);
          }
        }
      } else {
        // ローカルストレージからセッション情報を取得（デモモード）
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      // エラーの場合はデモモードにフォールバック
      setIsDatabaseMode(false);
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        } catch (parseError) {
          console.error('ユーザーデータの復元に失敗しました:', parseError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    // MVP: デモ用ユーザーは「オーナー（admin）」と「スタッフ（staff）」の2階層のみ
    const demoUsers = {
      'admin@demo.com': {
        id: '750e8400-e29b-41d4-a716-446655440001',
        email: 'admin@demo.com',
        name: 'オーナー 太郎',
        role: 'admin' as const,
        store_id: '550e8400-e29b-41d4-a716-446655440001',
        store: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: '本店',
          address: '東京都渋谷区道玄坂1-2-3',
          phone: '03-1234-5678'
        }
      },
      'manager@demo.com': {
        id: '750e8400-e29b-41d4-a716-446655440002',
        email: 'manager@demo.com',
        name: 'オーナー 花子',
        role: 'admin' as const,
        store_id: '550e8400-e29b-41d4-a716-446655440001',
        store: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: '本店',
          address: '東京都渋谷区道玄坂1-2-3',
          phone: '03-1234-5678'
        }
      },
      'staff@demo.com': {
        id: '750e8400-e29b-41d4-a716-446655440003',
        email: 'staff@demo.com',
        name: 'スタッフ 一郎',
        role: 'staff' as const,
        store_id: '550e8400-e29b-41d4-a716-446655440001',
        store: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: '本店',
          address: '東京都渋谷区道玄坂1-2-3',
          phone: '03-1234-5678'
        }
      },
      'manager2@demo.com': {
        id: '750e8400-e29b-41d4-a716-446655440004',
        email: 'manager2@demo.com',
        name: 'オーナー 二郎',
        role: 'admin' as const,
        store_id: '550e8400-e29b-41d4-a716-446655440001',
        store: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: '本店',
          address: '東京都渋谷区道玄坂1-2-3',
          phone: '03-1234-5678'
        }
      },
      'staff2@demo.com': {
        id: '750e8400-e29b-41d4-a716-446655440005',
        email: 'staff2@demo.com',
        name: 'スタッフ 三郎',
        role: 'staff' as const,
        store_id: '550e8400-e29b-41d4-a716-446655440001',
        store: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: '本店',
          address: '東京都渋谷区道玄坂1-2-3',
          phone: '03-1234-5678'
        }
      }
    };

    const userData = demoUsers[userId as keyof typeof demoUsers];
    if (userData) {
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
    }
  };

  const signIn = async (email: string, password: string, remember: boolean = false) => {
    try {
      setLoading(true);
      
      if (isDatabaseMode) {
        // Supabase認証
        const { data, error } = await auth.signIn(email, password);
        
        if (error) {
          return { success: false, error: error.message };
        }

        // セッションを確実にクライアントへ反映
        if (data.session) {
          await auth.setSession(data.session.access_token, data.session.refresh_token);
        }

        if (data.user) {
          // ユーザープロファイルを取得
          const { data: userProfile, error: profileError } = await db.getUserProfile(data.user.id);
          
          if (profileError || !userProfile) {
            return { success: false, error: 'ユーザープロファイルの取得に失敗しました' };
          }

          setUser(userProfile);
          return { success: true };
        }
        
        return { success: false, error: 'ログインに失敗しました' };
      } else {
        // デモモード
        if (password !== 'DemoPass2025!') {
          return { success: false, error: 'パスワードが正しくありません' };
        }

        // ユーザープロファイルを読み込み
        await loadUserProfile(email);
        
        // 自動ログイン設定
        if (remember) {
          localStorage.setItem('rememberLogin', 'true');
        } else {
          localStorage.removeItem('rememberLogin');
        }

        return { success: true };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'ログインに失敗しました' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      if (isDatabaseMode) {
        await auth.signOut();
      } else {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('rememberLogin');
      }
      
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isDatabaseMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
