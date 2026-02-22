import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import MenuManagement from './pages/MenuManagement';
import Expiration from './pages/Expiration';
import Settings from './pages/Settings';
import SupplierSettings from './components/SupplierSettings';
import StockAlertSettings from './components/StockAlertSettings';
import UserManagement from './components/UserManagement';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <Router>
            <div className="flex h-screen bg-gray-50">
              <Routes>
                {/* 認証不要ページ */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* 認証が必要なページ */}
                <Route path="/*" element={
                  <ProtectedRoute>
                    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <Header onMenuClick={() => setSidebarOpen(true)} />
                      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4">
                        <ErrorBoundary>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/inventory" element={<Inventory />} />
                            <Route path="/orders" element={<Orders />} />
                            <Route path="/menus" element={<MenuManagement />} />
                            <Route path="/expiration" element={<Expiration />} />
                            {/* <Route path="/analytics" element={<Analytics />} /> */}
                            {/* <Route path="/chat" element={<Chat />} /> */}
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/settings/suppliers" element={<SupplierSettings />} />
                            <Route path="/settings/stock-alerts" element={<StockAlertSettings />} />
                            <Route path="/settings/users" element={<UserManagement />} />
                          </Routes>
                        </ErrorBoundary>
                      </main>
                    </div>
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
            <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          </Router>
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;