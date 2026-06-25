import React, { useState } from 'react';
import { UserProfile, UserRole, AppNotification } from '../types';
import { Bell, Key, LogOut, ShieldAlert, CheckSquare, Sparkles, User, RefreshCw, Layers, Search, Settings, X } from 'lucide-react';

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
  onRefreshData?: () => void;
  isRefreshing?: boolean;
}

export default function Header({
  currentUser,
  onLogout,
  onSwitchRole,
  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  globalSearchTerm = '',
  setGlobalSearchTerm,
  onOpenProfile,
  onRefreshData,
  isRefreshing = false
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

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
        <div className="flex-1 max-w-sm mx-4 relative hidden md:block">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search active requests by title or system..."
            value={globalSearchTerm}
            onChange={(e) => setGlobalSearchTerm(e.target.value)}
            className="pl-9 pr-9 py-1.5 w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-950 dark:text-gray-150 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
          />
          {globalSearchTerm && (
            <button 
              onClick={() => setGlobalSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Center simulation controller */}
      {currentUser && (
        <div className="relative">
          <button
            type="button"
            disabled
            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 px-3 py-1.5 rounded-xl text-xs opacity-60 cursor-not-allowed select-none"
            title="Switch Persona Sandbox (Disabled)"
          >
            <span className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 select-none">
              <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline">Active Persona Role:</span>
            </span>
            <span className="bg-blue-600/10 text-blue-750 dark:text-blue-300 font-extrabold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-md select-none">
              {currentUser.role}
            </span>
            <span className="text-blue-550 dark:text-blue-400 text-[10px] ml-0.5 select-none">▼</span>
          </button>
          
          {showRoleSwitcher && (
            <>
              {/* Overlay clickable backplate to dismiss dropdown */}
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setShowRoleSwitcher(false)} 
              />
              <div id="role-switcher-dropdown" className="absolute left-0 mt-2.5 w-52 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn">
                <div className="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 px-3 py-1.5 tracking-wider border-b border-gray-100 dark:border-gray-850/60 mb-1 select-none">
                  Switch Sandbox Persona
                </div>
                {(['Admin', 'Employee (Requester)', 'Manager (Approver)', 'IT Support', 'Super Admin'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleSwitch(role)}
                    className={`w-full text-left px-3.5 py-2 text-xs rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                      currentUser.role === role
                        ? 'bg-blue-50/70 text-blue-600 font-black dark:bg-blue-950/20 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-900/60 dark:hover:text-white font-semibold'
                    }`}
                  >
                    <span>{role}</span>
                    {currentUser.role === role && <span className="text-blue-550 dark:text-blue-400 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Right controls */}
      <div className="flex items-center gap-3">
        
        {currentUser && (
          <>

            {onRefreshData && (
              <button
                type="button"
                onClick={onRefreshData}
                disabled={isRefreshing}
                className={`p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all ${
                  isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Synchronize data with Database"
              >
                <RefreshCw className={`w-4.5 h-4.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            )}

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

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-2 border-l border-gray-150 dark:border-gray-800 pl-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black text-xs flex items-center justify-center select-none shadow-inner">
                {currentUser.fullName.split(' ').map(n=>n[0]).join('')}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-black text-gray-950 dark:text-white leading-none">{currentUser.fullName}</div>
                <span className="text-[10px] text-gray-500 font-medium">{currentUser.role}</span>
              </div>

              {onOpenProfile && (
                <button
                  id="btn-profile-settings"
                  type="button"
                  onClick={onOpenProfile}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/15 rounded-xl transition-all ml-1.5"
                  title="Notification & Profile Settings"
                >
                  <Settings className="w-4.5 h-4.5" />
                </button>
              )}

              <button
                id="btn-logout"
                type="button"
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15 rounded-xl transition-all ml-1.5"
                title="Logout from directory"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </>
        )}

      </div>

    </header>
  );
}
