import React, { useState } from 'react';
import { UserProfile, UserRole, AppNotification } from '../types';
import { Bell, Key, LogOut, ShieldAlert, CheckSquare, Sparkles, User, RefreshCw, Layers, Search, Settings, X } from 'lucide-react';
import SearchInput from './SearchInput';

interface HeaderProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  onSwitchRole: (newRole: UserRole) => void;
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  globalSearchTerm?: string;
  setGlobalSearchTerm?: (val: string) => void;
  onOpenProfile?: () => void;
  onSelectProfileTab?: () => void;
}

export default function Header({
  currentUser,
  onLogout,
  onSwitchRole,
  notifications: rawNotifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  globalSearchTerm = '',
  setGlobalSearchTerm,
  onOpenProfile,
  onSelectProfileTab
}: HeaderProps) {
  const notifications = Array.isArray(rawNotifications) ? rawNotifications.filter(Boolean) : [];
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.isRead && (!currentUser || n.userEmail === currentUser.email));
  const userNotifications = notifications.filter(n => !currentUser || n.userEmail === currentUser.email);

  const handleSwitch = (role: UserRole) => {
    onSwitchRole(role);
    setShowRoleSwitcher(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approved': return '🟢';
      case 'rejected': return '🔴';
      case 'granted': return '🔑';
      case 'submitted': return '🔵';
      case 'security': return '⚠️';
      default: return '✉️';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-150 dark:border-gray-800/80 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
      
      {/* Brand area */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center font-black text-sm tracking-tighter">
          AR
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-black text-gray-950 dark:text-white leading-none tracking-tight">AccessPortal</h1>
          <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase block mt-0.5">Corporate IAM system</span>
        </div>
      </div>

      {/* Top Navigation Search Input */}
      {currentUser && setGlobalSearchTerm && (
        <div className="flex-1 max-w-sm mx-4 hidden md:block">
          <SearchInput
            value={globalSearchTerm}
            onChange={setGlobalSearchTerm}
            placeholder="Search active requests by title or system..."
            id="global-header-search"
          />
        </div>
      )}

      {/* Center simulation controller */}
      {currentUser && (
        <div className="hidden lg:flex items-center gap-2 bg-blue-500/10 dark:bg-blue-500/10 border border-blue-200/40 dark:border-blue-900/30 px-3.5 py-1.5 rounded-xl text-xs">
          <span className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 select-none animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Persona Role:</span>
          </span>
          <span className="bg-blue-600/10 text-blue-750 dark:text-blue-300 font-extrabold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-md select-none">
            {currentUser.role}
          </span>
        </div>
      )}

      {/* Right controls */}
      <div className="flex items-center gap-3">
        
        {currentUser && (
          <>
            {/* Mobile / General static role display */}
            <div className="lg:hidden p-1 px-2.5 border border-gray-250 dark:border-gray-800 text-gray-650 dark:text-gray-400 rounded-lg text-xs font-black uppercase tracking-wider bg-gray-50/50 dark:bg-gray-850/50 select-none">
              {currentUser.role}
            </div>

            {/* Notifications panel */}
            <div className="relative">
              <button
                id="btn-notifications"
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications.length > 0 && (
                  <span id="notifications-badge" className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce shadow-sm">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div id="notifications-dropdown" className="absolute right-[-60px] sm:right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-4 space-y-3 z-50">
                  <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-850 pb-2.5">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">Recent Alerts</span>
                    {unreadNotifications.length > 0 && (
                      <button
                        onClick={onMarkAllNotificationsAsRead}
                        className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 overflow-y-auto max-h-[280px]">
                    {userNotifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-400 italic">No recent messages.</div>
                    ) : (
                      userNotifications.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => onMarkNotificationAsRead(item.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex gap-2 items-start ${
                            item.isRead 
                              ? 'bg-gray-50/50 border-gray-100 dark:bg-gray-900/30 dark:border-gray-850/50 opacity-60' 
                              : 'bg-blue-50/20 border-blue-500/30 dark:bg-blue-950/10 dark:border-blue-950/40 hover:bg-blue-50/40'
                          }`}
                        >
                          <span className="text-sm leading-none">{getNotificationIcon(item.type)}</span>
                          <div className="space-y-0.5 flex-1">
                            <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{item.message}</p>
                            <span className="text-[10px] text-gray-400 block">{new Date(item.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Card with Dropdown */}
            <div className="relative flex items-center gap-2 border-l border-gray-150 dark:border-gray-800 pl-3">
              <button
                id="btn-avatar-dropdown-toggle"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 cursor-pointer hover:opacity-85 focus:outline-none transition-all p-1 rounded-xl"
              >
                {currentUser.avatarUrl ? (
                  <img 
                    src={currentUser.avatarUrl} 
                    alt="Profile Avatar" 
                    className="w-8 h-8 rounded-full object-cover border border-blue-500/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black text-xs flex items-center justify-center select-none shadow-inner">
                    {currentUser.fullName.split(' ').map(n=>n[0]).join('')}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-black text-gray-950 dark:text-white leading-none">{currentUser.fullName}</div>
                  <span className="text-[10px] text-gray-500 font-medium">{currentUser.role}</span>
                </div>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-fade-in">
                  
                  {/* Dropdown Header */}
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-850">
                    <p className="text-xs font-black text-gray-950 dark:text-white truncate">{currentUser.fullName}</p>
                    <p className="text-[10px] text-gray-400 font-mono truncate">{currentUser.email}</p>
                  </div>

                  {/* Dropdown Options */}
                  <div className="py-1">
                    {onSelectProfileTab && (
                      <button
                        id="dropdown-item-profile"
                        onClick={() => {
                          onSelectProfileTab();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-250 hover:bg-gray-50 dark:hover:bg-gray-800/60 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <User className="w-4 h-4 text-blue-500" />
                        <span>Profile & Security</span>
                      </button>
                    )}

                    {onOpenProfile && (
                      <button
                        id="dropdown-item-notifications"
                        onClick={() => {
                          onOpenProfile();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-250 hover:bg-gray-50 dark:hover:bg-gray-800/60 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Settings className="w-4 h-4 text-indigo-500" />
                        <span>Notification Preferences</span>
                      </button>
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="border-t border-gray-100 dark:border-gray-850 pt-1">
                    <button
                      id="dropdown-item-logout"
                      onClick={() => {
                        onLogout();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          </>
        )}

      </div>

    </header>
  );
}
