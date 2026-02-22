import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'owner' | 'staff';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // ログイン後に元のページにリダイレクトするため、現在のパスを保存
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ロールベースのアクセス制御
  if (requiredRole && user) {
    const normalizedUserRole = user.role === 'staff' ? 'staff' : 'owner';
    const roleHierarchy = { staff: 1, owner: 2 };
    const userRoleLevel = roleHierarchy[normalizedUserRole];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">アクセス権限がありません</h1>
            <p className="text-gray-600 mb-6">
              このページにアクセスするには {requiredRole} 以上の権限が必要です。
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              戻る
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;




