import React, { useState, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import ChatManager from '../chat/ChatManager';
import NotificationDropdown from '../notifications/NotificationDropdown';
import GlobalSearch from '../search/GlobalSearch';
import { 
  Home, 
  User, 
  MessageCircle, 
  Bell, 
  Search, 
  LogOut, 
  Settings,
  Menu,
  X,
  Users,
  Heart,
  Bookmark,
  Plus
} from 'lucide-react';

// Create context for modal state
const ModalContext = createContext();
export const useModal = () => useContext(ModalContext);

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Fetch unread notification count
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!user,
  });

  const unreadCount = unreadCountData?.unread_count || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Profile', href: `/profile/${user?.id}`, icon: User },
    { name: 'Chat', href: '/chat', icon: MessageCircle },
    { name: 'Friends', href: '/friends', icon: Users },
    { name: 'Explore', href: '/explore', icon: Search },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <ModalContext.Provider value={{ isModalOpen, setIsModalOpen }}>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-bold text-gray-900">AMKSocial</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

                         {/* Mobile hamburger button - Position first on mobile */}
            <div className="flex items-center space-x-2 sm:space-x-4">
               <button
                 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                 className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors order-first"
               >
                 {isMobileMenuOpen ? (
                   <X className="h-6 w-6" />
                 ) : (
                   <Menu className="h-6 w-6" />
                 )}
               </button>

               {/* Search Button - Desktop */}
               <button 
                 onClick={() => setShowSearch(true)}
                 className="hidden sm:flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
               >
                 <Search className="h-4 w-4" />
                 <span className="hidden md:inline">Search...</span>
               </button>

               {/* Mobile Search Icon */}
               <button 
                 onClick={() => setShowSearch(true)}
                 className="sm:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 <Search className="h-5 w-5" />
               </button>

               {/* Quick Actions */}
               <div className="hidden sm:flex items-center space-x-1">
                 <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                   <Plus className="w-5 h-5" />
                 </button>
                 <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                   <Heart className="w-5 h-5" />
                 </button>
                 <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                   <Bookmark className="w-5 h-5" />
                 </button>
               </div>

               {/* Notifications */}
               <div className="relative">
                 <button 
                   onClick={() => setShowNotifications(!showNotifications)}
                   className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
                 >
                   <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                   {/* Notification Badge */}
                   {unreadCount > 0 && (
                     <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                       {unreadCount > 99 ? '99+' : unreadCount}
                     </span>
                   )}
                 </button>

                 {/* Notification Dropdown */}
                 <NotificationDropdown
                   isOpen={showNotifications}
                   onClose={() => setShowNotifications(false)}
                   unreadCount={unreadCount}
                 />
               </div>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user?.name}
                  </span>
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to={`/profile/${user?.id}`}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg animate-slide-down">
            <div className="px-4 pt-4 pb-4 space-y-2">
              {/* Mobile Search Button */}
              <div className="sm:hidden mb-4">
                <button 
                  onClick={() => {
                    setShowSearch(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Search className="h-5 w-5 text-gray-500" />
                  <span>Search for people and posts...</span>
                </button>
              </div>

              {/* Navigation Links */}
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'text-blue-600 bg-blue-50 border border-blue-100'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-6 h-6" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Quick Actions */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-3 px-2">Quick Actions</p>
                <div className="flex space-x-2">
                  <button className="flex-1 flex items-center justify-center space-x-2 p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                    <Plus className="w-5 h-5" />
                    <span className="text-sm">Create</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center space-x-2 p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">Likes</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center space-x-2 p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                    <Bookmark className="w-5 h-5" />
                    <span className="text-sm">Saved</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-3 px-3 sm:py-4 sm:px-4 lg:py-6 lg:px-8">
        {children}
      </main>

      {/* Click outside to close dropdowns */}
      {(isProfileMenuOpen || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileMenuOpen(false);
            setShowNotifications(false);
          }}
        />
      )}

      {/* Global Search Modal */}
      <GlobalSearch 
        isOpen={showSearch} 
        onClose={() => setShowSearch(false)} 
      />

      {/* Floating Chat Manager */}
      <ChatManager />
      </div>
    </ModalContext.Provider>
  );
};

export default Layout;
