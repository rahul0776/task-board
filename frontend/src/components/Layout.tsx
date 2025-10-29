import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext.tsx';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-orange-300 to-orange-500 text-white transition-all duration-300 ease-in-out z-50 shadow-2xl ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-indigo-500">
            <div className="flex items-center justify-between">
              {sidebarOpen ? (
                <div>
                  <h1 className="text-2xl font-bold flex items-center">
                    <span className="mr-2">📋</span>
                    TaskBoard
                  </h1>
                  <p className="text-xs text-indigo-200 mt-1">Organize your work</p>
                </div>
              ) : (
                <span className="text-3xl">📋</span>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                {sidebarOpen ? '←' : '→'}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              to="/dashboard"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105"
            >
              <span className="text-2xl">🏠</span>
              {sidebarOpen && <span className="font-medium">Dashboard</span>}
            </Link>
            
            <Link
              to="/dashboard"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105"
            >
              <span className="text-2xl">📊</span>
              {sidebarOpen && <span className="font-medium">My Boards</span>}
            </Link>

            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
              <span className="text-2xl">⭐</span>
              {sidebarOpen && <span className="font-medium">Favorites</span>}
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
              <span className="text-2xl">🔔</span>
              {sidebarOpen && <span className="font-medium">Notifications</span>}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-indigo-500">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center text-white font-bold shadow-lg">
                {user?.first_name?.charAt(0) || 'U'}
              </div>
              {sidebarOpen && (
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {user?.first_name || user?.last_name 
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim() 
                      : user?.username}
                  </p>
                  <p className="text-xs text-indigo-200">{user?.email}</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="w-full p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium shadow-md"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
