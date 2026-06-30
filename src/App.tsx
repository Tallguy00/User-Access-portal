import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { 
  UserProfile, 
  AccessRequest, 
  AuditLog, 
  AppNotification, 
  Department, 
  SystemApplication, 
  UserRole,
  RequestStatus,
  SupportTicket
} from './types';
import { 
  INITIAL_DEPARTMENTS, 
  INITIAL_SYSTEMS, 
  INITIAL_REQUESTS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_NOTIFICATIONS 
} from './initialData';

// Pages & Components import
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import { LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen, AuthLayout } from './components/AuthScreens';
import UserDashboard from './components/UserDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement';
import ReportingModule from './components/ReportingModule';
import AuditLogView from './components/AuditLogView';
import CreateRequestModal from './components/CreateRequestModal';
import RequestDetailsModal from './components/RequestDetailsModal';
import UserProfileModal from './components/UserProfileModal';
import FAQView from './components/FAQView';
import ProfileView from './components/ProfileView';
import SupportView from './components/SupportView';

import { ShieldCheck, Users, User, LayoutDashboard, FileBarChart, History, Settings, Sun, Moon, CheckCircle2, AlertCircle, HelpCircle, LifeBuoy } from 'lucide-react';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Current Auth states
  const [sessionUserEmail, setSessionUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('ar_session_user_email');
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'register' | 'forgot' | 'reset' | 'dashboard'>(() => {
    return localStorage.getItem('ar_session_user_email') ? 'dashboard' : 'landing';
  });

  // Main entity states synced with local Storage
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('ar_profiles');
    if (saved) return JSON.parse(saved);
    
    // Seed initial organizational roster matching our test accounts
    return [
      { id: 'user-ops-admin', fullName: 'IT Director Admin', email: 'admin@company.com', role: 'IT Admin', departmentId: 'dep-ops', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'EMP-2026-1011', phoneNumber: '+1 (555) 019-1011', jobTitle: 'Director of Identity & Access Operations', lastLogin: '2026-06-30T09:00:00Z' },
      { id: 'user-super-admin', fullName: 'Chief Information Officer', email: 'super@company.com', role: 'Super Admin', departmentId: 'dep-ops', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'EMP-2026-1001', phoneNumber: '+1 (555) 019-1001', jobTitle: 'Chief Information Officer (CIO)', lastLogin: '2026-06-30T08:50:00Z' },
      { id: 'user-mgr-fin', fullName: 'Finance Manager', email: 'manager.fin@company.com', role: 'Manager', departmentId: 'dep-fin', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'EMP-2026-2001', phoneNumber: '+1 (555) 019-2001', jobTitle: 'VP of Finance & Control', lastLogin: '2026-06-30T08:30:00Z' },
      { id: 'user-mgr-eng', fullName: 'Engineering Manager', email: 'manager.eng@company.com', role: 'Manager', departmentId: 'dep-eng', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'EMP-2026-3001', phoneNumber: '+1 (555) 019-3001', jobTitle: 'VP of Product Engineering', lastLogin: '2026-06-30T08:45:00Z' },
      { id: 'user-mgr-hr', fullName: 'HR Manager', email: 'manager.hr@company.com', role: 'Manager', departmentId: 'dep-hr', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'EMP-2026-4001', phoneNumber: '+1 (555) 019-4001', jobTitle: 'Chief People Officer', lastLogin: '2026-06-30T08:15:00Z' },
      { id: 'user-mgr-mkt', fullName: 'Marketing Manager', email: 'manager.mkt@company.com', role: 'Manager', departmentId: 'dep-mkt', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'EMP-2026-5001', phoneNumber: '+1 (555) 019-5001', jobTitle: 'Director of Global Marketing', lastLogin: '2026-06-30T08:20:00Z' },
      { id: 'user-mgr-ops', fullName: 'Operations Manager', email: 'manager.ops@company.com', role: 'Manager', departmentId: 'dep-ops', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'EMP-2026-6001', phoneNumber: '+1 (555) 019-6001', jobTitle: 'Director of Business Operations', lastLogin: '2026-06-30T08:00:00Z' },
      { id: 'user-emp-jane', fullName: 'Jane Smith', email: 'employee.jane@company.com', role: 'User', departmentId: 'dep-eng', status: 'Active', createdAt: '2026-06-05T00:00:00Z', mfaEnabled: true, employeeId: 'EMP-2026-3022', phoneNumber: '+1 (555) 019-3022', jobTitle: 'Senior Cloud Security Architect', lastLogin: '2026-06-30T07:45:00Z' },
      { id: 'user-emp-mark', fullName: 'Mark Fletcher', email: 'finance.mark@company.com', role: 'User', departmentId: 'dep-fin', status: 'Active', createdAt: '2026-06-06T00:00:00Z', mfaEnabled: true, employeeId: 'EMP-2026-2051', phoneNumber: '+1 (555) 019-2051', jobTitle: 'Financial Compliance Auditor', lastLogin: '2026-06-30T07:30:00Z' },
      { id: 'user-emp-lucy', fullName: 'Lucy Thorne', email: 'hr.lucy@company.com', role: 'User', departmentId: 'dep-hr', status: 'Active', createdAt: '2026-06-07T00:00:00Z', mfaEnabled: true, employeeId: 'EMP-2026-4034', phoneNumber: '+1 (555) 019-4034', jobTitle: 'HR Information Systems Admin', lastLogin: '2026-06-30T07:15:00Z' }
    ];
  });

  const [requests, setRequests] = useState<AccessRequest[]>(() => {
    const saved = localStorage.getItem('ar_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('ar_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('ar_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Base datasets
  const [departments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [systems] = useState<SystemApplication[]>(INITIAL_SYSTEMS);

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('ar_support_tickets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse ar_support_tickets:", e);
      }
    }
    // Seed initial tickets
    return [
      {
        id: 'TCK-2606-9481',
        userId: 'user-emp-jane',
        userName: 'Jane Smith',
        userEmail: 'employee.jane@company.com',
        userDepartmentId: 'dep-eng',
        userRole: 'User',
        subject: 'MFA Security Token Sync Failure',
        category: 'Login Issue',
        priority: 'High',
        status: 'In Progress',
        description: 'I am unable to authenticate with my hardware MFA key on the engineering gateway since this morning. It displays a "token signature invalid" error message. I\'ve cleared my browser cache but the error persists.',
        assignedToId: 'user-ops-admin',
        assignedToName: 'IT Director Admin',
        createdAt: '2026-06-30T07:45:00Z',
        updatedAt: '2026-06-30T08:00:00Z',
        comments: [
          {
            id: 'c1',
            authorName: 'IT Support System',
            authorEmail: 'support@company.com',
            authorRole: 'IT Admin',
            text: 'System has assigned this ticket to IT Director Admin.',
            timestamp: '2026-06-30T07:50:00Z',
            isInternal: true
          },
          {
            id: 'c2',
            authorName: 'IT Director Admin',
            authorEmail: 'admin@company.com',
            authorRole: 'IT Admin',
            text: 'Hi Jane, we are looking into the hardware token mapping in our central active directory. Please make sure you are logged in to the VPN first.',
            timestamp: '2026-06-30T08:00:00Z',
            isInternal: false
          }
        ],
        activityLogs: [
          { id: 'a1', action: 'Ticket Created', actorName: 'Jane Smith', timestamp: '2026-06-30T07:45:00Z' },
          { id: 'a2', action: 'Assigned to IT Director Admin', actorName: 'System', timestamp: '2026-06-30T07:50:00Z' }
        ]
      },
      {
        id: 'TCK-2606-1205',
        userId: 'user-emp-mark',
        userName: 'Mark Fletcher',
        userEmail: 'finance.mark@company.com',
        userDepartmentId: 'dep-fin',
        userRole: 'User',
        subject: 'Financial Audit Folder Read Permissions',
        category: 'Access Request',
        priority: 'Medium',
        status: 'Open',
        description: 'I need read access to the Q2 Audit subfolders on the finance department secure share. The manager approved the internal request, but the directory permissions have not been synchronized.',
        createdAt: '2026-06-30T07:30:00Z',
        updatedAt: '2026-06-30T07:30:00Z',
        comments: [],
        activityLogs: [
          { id: 'a1', action: 'Ticket Created', actorName: 'Mark Fletcher', timestamp: '2026-06-30T07:30:00Z' }
        ]
      },
      {
        id: 'TCK-2606-3392',
        userId: 'user-emp-lucy',
        userName: 'Lucy Thorne',
        userEmail: 'hr.lucy@company.com',
        userDepartmentId: 'dep-hr',
        userRole: 'User',
        subject: 'Department Manager Change Propagation',
        category: 'Account Problem',
        priority: 'Low',
        status: 'Resolved',
        description: 'Our department manager\'s email list needs to be updated. The new director has joined, but the approval routing rules still target the previous manager. Could you please check the department hierarchy mappings?',
        createdAt: '2026-06-30T07:15:00Z',
        updatedAt: '2026-06-30T08:15:00Z',
        comments: [
          {
            id: 'c1',
            authorName: 'Chief Information Officer',
            authorEmail: 'super@company.com',
            authorRole: 'Super Admin',
            text: 'Hierarchy routing mapping updated successfully. The approval nodes are now routing to the correct director.',
            timestamp: '2026-06-30T08:15:00Z',
            isInternal: false
          }
        ],
        activityLogs: [
          { id: 'a1', action: 'Ticket Created', actorName: 'Lucy Thorne', timestamp: '2026-06-30T07:15:00Z' },
          { id: 'a2', action: 'Status Changed to Resolved', actorName: 'Chief Information Officer', timestamp: '2026-06-30T08:15:00Z' }
        ]
      }
    ];
  });

  // Sync tickets to local storage on changes
  useEffect(() => {
    localStorage.setItem('ar_support_tickets', JSON.stringify(tickets));
  }, [tickets]);

  // Layout Tab select
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'audit_logs' | 'reports' | 'faq' | 'profile' | 'support'>('dashboard');

  // Modals view controllers
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync state to local storage on changes
  useEffect(() => {
    localStorage.setItem('ar_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('ar_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('ar_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('ar_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('ar_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Automated pending SLA reminders (>48h)
  useEffect(() => {
    const safeRequests = Array.isArray(requests) ? requests.filter(Boolean) : [];
    const pendingReqs = safeRequests.filter(req => req.status === 'Submitted' || req.status === 'Under Review');
    if (pendingReqs.length === 0) return;

    const now = new Date();
    const fortyEightHoursInMs = 48 * 60 * 60 * 1000;
    const safeProfiles = Array.isArray(profiles) ? profiles.filter(Boolean) : [];
    const managers = safeProfiles.filter(p => p.role === 'Manager');
    if (managers.length === 0) return;

    setNotifications(prevNotifications => {
      const newNotices: AppNotification[] = [];
      let updatedState = false;

      pendingReqs.forEach(req => {
        const createdDate = new Date(req.createdAt);
        const diffMs = now.getTime() - createdDate.getTime();
        const isOverdue = diffMs > fortyEightHoursInMs;

        if (isOverdue) {
          const reminderTag = `Pending Request Reminder [${req.id}]`;

          managers.forEach(mgr => {
            // Check if manager was already notified for this exact overdue request
            const alreadyHasNotice = prevNotifications.some(n => 
              n.userEmail === mgr.email && 
              n.message.includes(reminderTag)
            );

            if (!alreadyHasNotice) {
              newNotices.push({
                id: 'notice-reminder-' + Math.random().toString(36).substring(2, 9),
                userEmail: mgr.email,
                message: `⚠️ Pending Request Reminder [${req.id}]: Active access request "${req.title}" by ${req.userFullName} has been inactive for > 48 hours. Please review.`,
                isRead: false,
                createdAt: new Date().toISOString(),
                type: 'security'
              });
              updatedState = true;
            }
          });
        }
      });

      if (updatedState && newNotices.length > 0) {
        return [...newNotices, ...prevNotifications];
      }
      return prevNotifications;
    });
  }, [requests, profiles]);

  // Initial session recovery via Supabase Auth & Live Listener
  useEffect(() => {
    const recoverSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const loginKey = session?.user?.email;
      if (loginKey) {
        setSessionUserEmail(loginKey);
        localStorage.setItem('ar_session_user_email', loginKey);
        setCurrentPage('dashboard');
      }
    };
    recoverSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const loginKey = session?.user?.email;
      if (loginKey) {
        setSessionUserEmail(loginKey);
        localStorage.setItem('ar_session_user_email', loginKey);
        setCurrentPage('dashboard');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Load real profiles from Supabase DB on user sign-in/mount
  useEffect(() => {
    const fetchProfilesFromDB = async () => {
      if (!sessionUserEmail) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: true });
          
        if (error) {
          console.error("Error fetching profiles from Supabase DB:", error);
          return;
        }
        
        if (data && data.length > 0) {
          // Map snake_case columns back to camelCase models
          const mappedProfiles: UserProfile[] = data.map(item => {
            const emailLower = (item.email || '').toLowerCase().trim();
            const isManagerEmail = emailLower.startsWith('manager.');
            const mappedRole = isManagerEmail ? 'Manager' : (item.role as any);
            const mappedDept = isManagerEmail ? (
              emailLower.startsWith('manager.eng') ? 'dep-eng' : 
              emailLower.startsWith('manager.hr') ? 'dep-hr' : 
              emailLower.startsWith('manager.mkt') ? 'dep-mkt' : 
              emailLower.startsWith('manager.ops') ? 'dep-ops' : 
              (emailLower.startsWith('manager.fin') || emailLower.startsWith('manager.bob') || emailLower === 'manager@company.com' ? 'dep-fin' : 'dep-eng')
            ) : (item.department_id || 'dep-eng');

            return {
              id: item.id,
              fullName: item.full_name,
              email: item.email,
              role: mappedRole,
              departmentId: mappedDept,
              status: item.status as any,
              createdAt: item.created_at,
              mfaEnabled: item.mfa_enabled,
              notificationPreferences: item.notification_preferences,
              phoneNumber: item.phone_number,
              jobTitle: item.job_title,
              employeeId: item.employee_id,
              avatarUrl: item.avatar_url,
              lastLogin: item.last_login
            };
          });
          
          setProfiles(prev => {
            // Keep existing local profiles if they are not in database (e.g. seeds),
            // but prioritize database profiles by email matching.
            const merged = [...mappedProfiles];
            prev.forEach(localP => {
              const exists = merged.some(dbP => dbP.email.toLowerCase().trim() === localP.email.toLowerCase().trim());
              if (!exists) {
                merged.push(localP);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.error("Failed to load profiles from DB:", err);
      }
    };
    
    fetchProfilesFromDB();
  }, [sessionUserEmail]);

  // Load real access requests from Supabase DB on user sign-in/mount
  const fetchRequestsFromDB = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching requests from Supabase DB:", error);
        return;
      }
      
      if (data) {
        // Map snake_case columns back to camelCase models
        const mappedRequests: AccessRequest[] = data.map(item => ({
          id: item.id,
          userId: item.user_id,
          userEmail: item.user_email,
          userFullName: item.user_full_name,
          departmentId: item.department_id || '',
          title: item.title,
          accessType: item.access_type as any,
          systemName: item.system_name,
          justification: item.justification,
          priority: item.priority as any,
          startDate: item.start_date,
          endDate: item.end_date || undefined,
          status: item.status as any,
          createdAt: item.created_at,
          attachments: item.attachments || [],
          comments: item.comments || undefined,
          commentsHistory: item.comments_history || [],
          provisionedCredentials: item.provisioned_credentials || undefined,
          requestedRole: item.requested_role || undefined,
          manager: item.manager || undefined,
          currentApprover: item.current_approver || undefined,
          updatedAt: item.updated_at || undefined
        }));
        
        setRequests(mappedRequests);
      }
    } catch (err) {
      console.error("Failed to load requests from DB:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchRequestsFromDB();

    if (!currentUser) return;

    // Real-time Supabase subscription to automatically refresh the user's requests list
    const channel = supabase
      .channel('realtime:access_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'access_requests' },
        (payload) => {
          console.log('Real-time database update detected:', payload);
          fetchRequestsFromDB();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequestsFromDB, currentUser]);

  // Load real audit logs from Supabase DB on user sign-in/mount
  useEffect(() => {
    const fetchAuditLogsFromDB = async () => {
      if (!currentUser) return;
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching audit logs from Supabase DB:", error);
          return;
        }
        
        if (data && data.length > 0) {
          const mappedLogs: AuditLog[] = data.map(item => ({
            id: item.id,
            userEmail: item.user_email,
            userRole: item.user_role as any,
            action: item.action,
            details: item.details,
            createdAt: item.created_at,
            ipAddress: item.ip_address || undefined,
            device: item.device || undefined
          }));
          
          setAuditLogs(mappedLogs);
        }
      } catch (err) {
        console.error("Failed to load audit logs from DB:", err);
      }
    };
    
    fetchAuditLogsFromDB();
  }, [currentUser]);

  // Load real notifications from Supabase DB on user sign-in/mount
  useEffect(() => {
    const fetchNotificationsFromDB = async () => {
      if (!currentUser) return;
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching notifications from Supabase DB:", error);
          return;
        }
        
        if (data && data.length > 0) {
          const mappedNotifications: AppNotification[] = data.map(item => ({
            id: item.id,
            userEmail: item.user_email,
            message: item.message,
            isRead: item.is_read,
            createdAt: item.created_at,
            type: item.type as any
          }));
          
          setNotifications(mappedNotifications);
        }
      } catch (err) {
        console.error("Failed to load notifications from DB:", err);
      }
    };
    
    fetchNotificationsFromDB();
  }, [currentUser]);

  // Load real support tickets from Supabase DB on user sign-in/mount
  const fetchTicketsFromDB = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Could not fetch support tickets from database (it might not be provisioned yet):", error.message);
        return;
      }

      if (data) {
        const mappedTickets: SupportTicket[] = data.map(item => ({
          id: item.id,
          userId: item.user_id,
          userName: item.user_name,
          userEmail: item.user_email,
          userDepartmentId: item.user_department_id || '',
          userRole: item.user_role as any,
          subject: item.subject,
          category: item.category as any,
          priority: item.priority as any,
          status: item.status as any,
          description: item.description,
          attachmentName: item.attachment_name || undefined,
          attachmentSize: item.attachment_size || undefined,
          assignedToId: item.assigned_to_id || undefined,
          assignedToName: item.assigned_to_name || undefined,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          comments: item.comments || [],
          activityLogs: item.activity_logs || []
        }));

        setTickets(mappedTickets);
      }
    } catch (err) {
      console.warn("Failed to load tickets from Supabase DB:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchTicketsFromDB();

    if (!currentUser) return;

    // Real-time Supabase subscription to automatically refresh the user's tickets list
    const channel = supabase
      .channel('realtime:support_tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        (payload) => {
          console.log('Real-time ticket update detected:', payload);
          fetchTicketsFromDB();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchTicketsFromDB, currentUser]);

  // Handle active session loading
  useEffect(() => {
    if (sessionUserEmail) {
      const trimKey = sessionUserEmail.toLowerCase().trim();
      const safeProfiles = Array.isArray(profiles) ? profiles.filter(Boolean) : [];
      const foundProfile = safeProfiles.find(p => 
        p.email.toLowerCase().trim() === trimKey
      );
      if (foundProfile) {
        // If account is deactivated, reject immediately
        if (foundProfile.status === 'Deactivated') {
          alert('This corporate account has been deactivated by IT administration.');
          handleLogout();
          return;
        }

        // Coerce manager email addresses to Manager role and correct department
        const emailLower = trimKey.toLowerCase();
        const isManagerEmail = emailLower.startsWith('manager.');
        if (isManagerEmail && (foundProfile.role !== 'Manager' || !foundProfile.departmentId.startsWith('dep-'))) {
          const resolvedDept = emailLower.startsWith('manager.eng') ? 'dep-eng' : 
                               emailLower.startsWith('manager.hr') ? 'dep-hr' : 
                               emailLower.startsWith('manager.mkt') ? 'dep-mkt' : 
                               emailLower.startsWith('manager.ops') ? 'dep-ops' : 
                               (emailLower.startsWith('manager.fin') || emailLower.startsWith('manager.bob') || emailLower === 'manager@company.com' ? 'dep-fin' : 'dep-eng');
          const upgradedProfile: UserProfile = {
            ...foundProfile,
            role: 'Manager',
            departmentId: resolvedDept
          };
          setCurrentUser(upgradedProfile);
          setProfiles(prev => prev.map(p => p.email.toLowerCase().trim() === trimKey ? upgradedProfile : p));
        } else {
          setCurrentUser(foundProfile);
        }
      } else {
        // Create an on-the-fly roster entry for new Supabase signups
        const emailLower = trimKey.toLowerCase();
        const isManagerEmail = emailLower.startsWith('manager.');
        const resolvedRole = isManagerEmail ? 'Manager' : 'User';
        const resolvedDept = emailLower.startsWith('manager.eng') ? 'dep-eng' : 
                             emailLower.startsWith('manager.hr') ? 'dep-hr' : 
                             emailLower.startsWith('manager.mkt') ? 'dep-mkt' : 
                             emailLower.startsWith('manager.ops') ? 'dep-ops' : 
                             (emailLower.startsWith('manager.fin') || emailLower.startsWith('manager.bob') || emailLower === 'manager@company.com' ? 'dep-fin' : 'dep-eng');

        const newProfile: UserProfile = {
          id: 'user-' + Math.random().toString(36).substr(2, 9),
          fullName: trimKey.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          email: trimKey,
          role: resolvedRole,
          departmentId: resolvedDept,
          status: 'Active',
          createdAt: new Date().toISOString()
        };
        setProfiles(prev => [...prev, newProfile]);
        setCurrentUser(newProfile);
      }
    } else {
      setCurrentUser(null);
    }
  }, [sessionUserEmail, profiles]);

  // Auth Operations
  const handleLoginSuccess = async (email: string) => {
    // Leverage supabase.auth session retrieval to match/confirm user email
    const { data: { user } } = await supabase.auth.getUser();
    let authenticatedEmail = user?.email || email;

    // Normalize manager@company.com or manager.bob@company.com to manager.fin@company.com
    if (authenticatedEmail) {
      const emailLower = authenticatedEmail.toLowerCase().trim();
      if (emailLower === 'manager@company.com' || emailLower === 'manager.bob@company.com') {
        authenticatedEmail = 'manager.fin@company.com';
      }
    }

    localStorage.setItem('ar_session_user_email', authenticatedEmail);
    setSessionUserEmail(authenticatedEmail);
    setCurrentPage('dashboard');
    setActiveTab('dashboard');

    // Detect role for log context mapping and update lastLogin
    const safeProfiles = Array.isArray(profiles) ? profiles.filter(Boolean) : [];
    const foundProfile = safeProfiles.find(p => p.email.toLowerCase() === authenticatedEmail.toLowerCase());
    const matchedRole = foundProfile?.role || 'User';

    if (foundProfile) {
      const loginTime = new Date().toISOString();
      const updatedWithLogin: UserProfile = {
        ...foundProfile,
        lastLogin: loginTime
      };
      
      setCurrentUser(updatedWithLogin);
      setProfiles(prev => prev.map(p => p.id === foundProfile.id ? updatedWithLogin : p));
      
      try {
        await supabase
          .from('profiles')
          .update({ last_login: loginTime })
          .eq('id', foundProfile.id);
      } catch (err) {
        console.error("Failed to update last login in Supabase:", err);
      }
    }

    // Create Audit entry for login
    logAuditEvent(
      authenticatedEmail,
      matchedRole,
      'User login success',
      `Centralized directory authenticated account session securely using Supabase Auth.`
    );
  };

  const handleRegisterSuccess = async (
    email: string, 
    details: { 
      fullName: string; 
      role: UserRole; 
      departmentId: string; 
    }
  ) => {
    // Leverage supabase.auth status to confirm the registered user account
    const { data: { user } } = await supabase.auth.getUser();
    const authenticatedEmail = user?.email || email;
    const userId = user?.id || 'user-' + Math.random().toString(36).substr(2, 9);

    const newProfile: UserProfile = {
      id: userId,
      fullName: details.fullName,
      email: authenticatedEmail,
      role: details.role,
      departmentId: details.departmentId,
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    setProfiles(prev => {
      const index = prev.findIndex(p => p.email.toLowerCase() === authenticatedEmail.toLowerCase());
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          id: userId,
          fullName: details.fullName,
          role: details.role,
          departmentId: details.departmentId,
          status: 'Active'
        };
        return updated;
      }
      return [...prev, newProfile];
    });

    // Explicitly write profile to Supabase database so all platforms see it immediately
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: details.fullName,
            email: authenticatedEmail,
            role: details.role,
            department_id: details.departmentId,
            status: 'Active'
          });
        if (error) {
          console.error("Error upserting profile in database:", error);
        }
      } catch (err) {
        console.error("Failed to upsert profile in database:", err);
      }
    }
    
    localStorage.setItem('ar_session_user_email', authenticatedEmail);
    setSessionUserEmail(authenticatedEmail);
    setCurrentPage('dashboard');
    setActiveTab('dashboard');

    // Create Audit entry for manual registration
    logAuditEvent(
      authenticatedEmail,
      details.role,
      'Profile Registration',
      `Centralized directory roster created for ${details.fullName} in department ${details.departmentId}.`
    );

    // Create startup welcome notification
    addNotification(
      authenticatedEmail,
      `Welcome to company IAM portal! Complete your first privilege request by selecting submit above.`,
      'info_requested'
    );
  };

  const handleLogout = async () => {
    if (sessionUserEmail) {
      logAuditEvent(
        sessionUserEmail,
        currentUser?.role || 'User',
        'User logout success',
        `Closed active browser directory session.`
      );
    }
    
    await supabase.auth.signOut();
    localStorage.removeItem('ar_session_user_email');
    setSessionUserEmail(null);
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  // Switch sandbox role on the fly
  const handleSwitchSandboxRole = async (newRole: UserRole) => {
    if (!currentUser) return;
    setGlobalSearchTerm('');
    
    // Determine the corresponding database role based on React UserRole check constraints
    const mapRoleForDatabase = (role: UserRole): string => {
      switch (role) {
        case 'Department Manager':
          return 'Manager';
        case 'IT Support':
          return 'IT Admin';
        default:
          return role;
      }
    };

    // Align department to 'dep-fin' (Finance) if simulating a Manager, so they can see Bob Manager's queue,
    // otherwise keep original department.
    const newDeptId = (newRole === 'Manager' || newRole === 'Department Manager') 
      ? 'dep-fin' 
      : currentUser.departmentId || 'dep-eng';

    const updated = { ...currentUser, role: newRole, departmentId: newDeptId };
    setCurrentUser(updated);
    setProfiles(prev => prev.map(p => p.id === currentUser.id ? updated : p));

    // Persist this sandbox role & department alignment to the database profile so RLS policies take effect!
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(currentUser.id);
    if (isUUID) {
      try {
        const dbRole = mapRoleForDatabase(newRole);
        const { error } = await supabase
          .from('profiles')
          .update({ 
            role: dbRole,
            department_id: newDeptId
          })
          .eq('id', currentUser.id);

        if (error) {
          console.error("Error updating profile role/department in database:", error);
        } else {
          console.log(`Database profile role aligned to: ${dbRole}, department aligned to: ${newDeptId}`);
          // Instantly refresh requests to apply updated RLS policies
          fetchRequestsFromDB();
        }
      } catch (err) {
        console.error("Failed to update database profile:", err);
      }
    }

    logAuditEvent(
      currentUser.email,
      newRole,
      'Sandbox Persona Swap',
      `Developer swapped sandbox session level to "${newRole}".`
    );

    addNotification(
      currentUser.email,
      `Your development session environment has been successfully mapped to: ${newRole}.`,
      'info_requested'
    );
  };

  // Helper constructors
  const logAuditEvent = async (email: string, role: UserRole, action: string, details: string) => {
    const detectDevice = () => {
      const ua = navigator.userAgent;
      if (/android/i.test(ua)) {
        return 'Android Mobile, Chrome';
      }
      if (/iPad|iPhone|iPod/.test(ua)) {
        return 'iOS Mobile, Safari';
      }
      if (/Windows/i.test(ua)) {
        return 'PC (Windows), Chrome/Edge';
      }
      if (/Macintosh/i.test(ua)) {
        return 'Macintosh (MacOS), Safari/Chrome';
      }
      if (/Linux/i.test(ua)) {
        return 'PC (Linux), Chrome';
      }
      return 'Web Browser, Portal Gateway';
    };

    const deviceName = detectDevice();
    const newLog: AuditLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      userEmail: email,
      userRole: role,
      action,
      details,
      createdAt: new Date().toISOString(),
      ipAddress: '159.20.104.' + Math.floor(Math.random() * 254),
      device: deviceName
    };
    
    setAuditLogs(prev => [newLog, ...prev]);

    try {
      await supabase.from('audit_logs').insert({
        id: newLog.id,
        user_email: newLog.userEmail,
        user_role: newLog.userRole,
        action: newLog.action,
        details: newLog.details,
        created_at: newLog.createdAt,
        ip_address: newLog.ipAddress,
        device: newLog.device
      });
    } catch (err) {
      console.error("Failed to sync audit log to Supabase:", err);
    }
  };

  const addNotification = async (email: string, message: string, type: AppNotification['type']) => {
    const newNotice: AppNotification = {
      id: 'notice-' + Math.random().toString(36).substr(2, 9),
      userEmail: email,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
      type
    };
    
    setNotifications(prev => [newNotice, ...prev]);

    try {
      await supabase.from('notifications').insert({
        id: newNotice.id,
        user_email: newNotice.userEmail,
        message: newNotice.message,
        is_read: newNotice.isRead,
        created_at: newNotice.createdAt,
        type: newNotice.type
      });
    } catch (err) {
      console.error("Failed to sync notification to Supabase:", err);
    }
  };

  // Request handlers
  const handleCreateRequestSubmit = async (newReq: Omit<AccessRequest, 'id' | 'userId' | 'userEmail' | 'userFullName' | 'createdAt' | 'status'> & { id?: string }) => {
    if (!currentUser) return;

    const createdAt = new Date().toISOString();
    const reqId = newReq.id || ('req-' + (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)));
    
    // Map accessType from UI ('New', 'Modify', 'Remove') to DB and Reporting compliant values
    const mappedAccessType = 
      newReq.accessType === 'New' ? 'Application Access' :
      newReq.accessType === 'Modify' ? 'Database Access' :
      newReq.accessType === 'Remove' ? 'Server Access' :
      newReq.accessType;

    const requestObj: AccessRequest = {
      ...newReq,
      id: reqId,
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userEmail: currentUser.email,
      status: 'Submitted', // 'Submitted' is DB compliant and triggers Manager Dashboard pending lists correctly
      accessType: mappedAccessType as any,
      createdAt,
      updatedAt: createdAt,
      commentsHistory: [
        {
          id: 'comment-initial-' + Math.random().toString(36).substring(2, 9),
          authorName: currentUser.fullName,
          authorRole: currentUser.role,
          action: 'Submit',
          text: newReq.justification || 'No justification provided.',
          timestamp: createdAt
        }
      ]
    };

    // Persist request directly to the Supabase Database table
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated session found. Please sign in again.");
      }

      // Ensure user can only create requests associated with their authenticated account
      if (user.id !== currentUser.id) {
        throw new Error("Unauthorized request submission. Authenticated user ID mismatch.");
      }

      const { error } = await supabase.from('access_requests').insert({
        id: reqId,
        user_id: user.id,
        user_email: currentUser.email,
        user_full_name: currentUser.fullName,
        department_id: newReq.departmentId,
        title: newReq.title,
        access_type: mappedAccessType,
        system_name: newReq.systemName,
        justification: newReq.justification,
        priority: newReq.priority,
        start_date: newReq.startDate,
        end_date: newReq.endDate || null,
        status: 'Submitted',
        created_at: createdAt,
        updated_at: createdAt,
        requested_role: newReq.requestedRole || null,
        manager: newReq.manager || null,
        current_approver: newReq.manager || null,
        attachments: newReq.attachments || [],
        comments: newReq.comments || null,
        comments_history: requestObj.commentsHistory,
        provisioned_credentials: null
      });

      if (error) {
        console.error("Error inserting request into Supabase DB:", error);
        throw new Error(error.message || "Failed to insert request into Supabase database.");
      }

      // Success! Update local state immediately for instant feedback
      setRequests(prev => [requestObj, ...prev]);

      // Refresh list from DB in background to guarantee full server sync
      fetchRequestsFromDB();

      // Send notification
      addNotification(
        currentUser.email,
        `Your request "${newReq.title}" for ${newReq.systemName} has been submitted for approval.`,
        'submitted'
      );

      // Audit trace
      logAuditEvent(
        currentUser.email,
        currentUser.role,
        'Submit Request',
        `Sourced access request ${reqId} for "${newReq.systemName}" prioritizing "${newReq.priority}".`
      );

      showToast("Access request created successfully!", "success");

    } catch (err: any) {
      console.error("Supabase request insertion exception:", err);
      showToast(err.message || "Failed to submit request.", "error");
      throw err;
    }
  };

  // Approver Action Matrix
  const handleRequestWorkflowAction = (
    requestId: string, 
    action: 'Approve' | 'Reject' | 'Request Info', 
    comments: string,
    provisionedCredentials?: {
      username?: string;
      tokenType?: string;
      secretValue?: string;
      connectionUri?: string;
      expiresAt?: string;
    }
  ) => {
    if (!currentUser) return;

    setRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;

      let nextStatus: RequestStatus = req.status;
      let notificationType: AppNotification['type'] = 'info_requested';

      if (currentUser.role === 'Manager' || currentUser.role === 'Department Manager' || currentUser.role === 'Super Admin') {
        if (action === 'Approve') {
          nextStatus = 'Approved';
          notificationType = 'approved';
        } else if (action === 'Reject') {
          nextStatus = 'Rejected';
          notificationType = 'rejected';
        } else {
          nextStatus = 'Under Review';
          notificationType = 'info_requested';
        }
      } else if (currentUser.role === 'IT Admin' || currentUser.role === 'IT Support') {
        // Complete workflow
        if (action === 'Approve') {
          nextStatus = 'Completed';
          notificationType = 'granted';
        }
      }

      // Notify original requester
      addNotification(
        req.userEmail,
        `Workflow updated: Request ${req.id} resolved as [${action}] by ${currentUser.fullName}. Notes: "${comments}"`,
        notificationType
      );

      // Log secure audit transaction
      logAuditEvent(
        currentUser.email,
        currentUser.role,
        action === 'Approve' ? 'Approve Request' : action === 'Reject' ? 'Reject Request' : 'Under Review Request',
        `Executed workflow transaction on ${req.id}. Result: ${action}. Notes: "${comments}"`
      );

      // Append to comments history
      const existingHistory = req.commentsHistory ? [...req.commentsHistory] : [];
      if (existingHistory.length === 0) {
        // Seed first
        existingHistory.push({
          id: 'comment-initial-' + req.id,
          authorName: req.userFullName,
          authorRole: 'User',
          action: 'Submit',
          text: req.justification || 'No justification provided.',
          timestamp: req.createdAt
        });
        if (req.comments) {
          existingHistory.push({
            id: 'comment-legacy-' + req.id,
            authorName: 'Sponsoring Approver (Legacy)',
            authorRole: 'Manager',
            action: 'Approve',
            text: req.comments,
            timestamp: req.createdAt
          });
        }
      }

      const newHistoryComment = {
        id: 'comment-' + Math.random().toString(36).substring(2, 9),
        authorName: currentUser.fullName,
        authorRole: currentUser.role,
        action: (currentUser.role === 'IT Admin' || currentUser.role === 'IT Support') && action === 'Approve' ? 'Complete' : action,
        text: comments || ((currentUser.role === 'IT Admin' || currentUser.role === 'IT Support') && action === 'Approve' ? 'Access provisioned and completed.' : `Workflow update [${action}]`),
        timestamp: new Date().toISOString()
      };

      const finalCommentsHistory = [...existingHistory, newHistoryComment];
      const finalComments = comments || undefined;
      const finalCredentials = provisionedCredentials || req.provisionedCredentials;

      // Asynchronous database update with metadata columns, proper try/catch, and user ID retrieval
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error("No authenticated session found. Please sign in again.");
          }

          const currentTimestamp = new Date().toISOString();
          const fullPayload: any = {
            status: nextStatus,
            comments: finalComments || null,
            comments_history: finalCommentsHistory,
            provisioned_credentials: finalCredentials || null,
            updated_at: currentTimestamp
          };

          if (currentUser.role === 'Manager' || currentUser.role === 'Department Manager' || currentUser.role === 'Super Admin') {
            if (action === 'Approve') {
              fullPayload.approved_by = user.id;
              fullPayload.approved_at = currentTimestamp;
            } else if (action === 'Reject') {
              fullPayload.rejected_by = user.id;
              fullPayload.rejected_at = currentTimestamp;
            }
          }

          const { error } = await supabase
            .from('access_requests')
            .update(fullPayload)
            .eq('id', req.id);

          if (error) {
            // Fallback for missing table columns in development/preview schema
            if (error.message && (error.message.includes("column") || error.message.includes("does not exist"))) {
              console.warn("Table access_requests is missing approved_by/rejected_by metadata columns. Executing schema-agnostic update.");
              
              const fallbackPayload = {
                status: nextStatus,
                comments: finalComments || null,
                comments_history: finalCommentsHistory,
                provisioned_credentials: finalCredentials || null
              };

              const { error: fallbackError } = await supabase
                .from('access_requests')
                .update(fallbackPayload)
                .eq('id', req.id);

              if (fallbackError) {
                throw fallbackError;
              }
            } else {
              throw error;
            }
          }

          // Output success toast notification
          if (action === 'Approve') {
            showToast("Request approved successfully!", "success");
          } else if (action === 'Reject') {
            showToast("Request rejected successfully!", "success");
          } else {
            showToast("Request updated successfully!", "success");
          }

          // Query invalidation: refresh requests list from database
          fetchRequestsFromDB();

        } catch (err: any) {
          console.error(`Error in Supabase workflow action update for request ${req.id}:`, err);
          showToast(err.message || "Failed to persist workflow updates in database.", "error");
        }
      })();

      return {
        ...req,
        status: nextStatus,
        comments: finalComments,
        commentsHistory: finalCommentsHistory,
        provisionedCredentials: finalCredentials
      };
    }));
  };

  const handleDeleteAttachment = async (requestId: string, attachmentIndex: number) => {
    const req = requests.find(r => r.id === requestId);
    if (!req || !req.attachments) return;

    const attachment = req.attachments[attachmentIndex];
    if (!attachment) return;

    if (attachment.filePath) {
      try {
        const { error } = await supabase.storage
          .from('app-files')
          .remove([attachment.filePath]);
        if (error) {
          console.error("Failed to delete file from Supabase Storage:", error);
        }
      } catch (err) {
        console.error("Error deleting file from Supabase Storage:", err);
      }
    }

    const updatedAttachments = req.attachments.filter((_, idx) => idx !== attachmentIndex);
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ attachments: updatedAttachments })
        .eq('id', requestId);

      if (error) {
        console.error("Failed to update attachments in Supabase DB:", error);
        return;
      }

      setRequests(prev => prev.map(r => {
        if (r.id === requestId) {
          const updated = { ...r, attachments: updatedAttachments };
          if (selectedRequest && selectedRequest.id === requestId) {
            setSelectedRequest(updated);
          }
          return updated;
        }
        return r;
      }));
    } catch (err) {
      console.error("Error updating attachments database reference:", err);
    }
  };

  // Bulk Approver Action Matrix
  const handleBulkWorkflowAction = (requestIds: string[], action: 'Approve' | 'Reject', comments: string) => {
    if (!currentUser) return;

    setRequests(prev => prev.map(req => {
      if (!requestIds.includes(req.id)) return req;

      let nextStatus: RequestStatus = req.status;
      let notificationType: AppNotification['type'] = 'info_requested';

      if (currentUser.role === 'Manager' || currentUser.role === 'Department Manager' || currentUser.role === 'Super Admin') {
        if (action === 'Approve') {
          nextStatus = 'Approved';
          notificationType = 'approved';
        } else if (action === 'Reject') {
          nextStatus = 'Rejected';
          notificationType = 'rejected';
        }
      }

      // Notify original requester
      addNotification(
        req.userEmail,
        `Workflow updated: Request ${req.id} resolved as [${action}] via Bulk Action by ${currentUser.fullName}. Notes: "${comments}"`,
        notificationType
      );

      // Log secure audit transaction
      logAuditEvent(
        currentUser.email,
        currentUser.role,
        action === 'Approve' ? 'Bulk Approve Requests' : 'Bulk Reject Requests',
        `Executed bulk workflow transaction on ${req.id}. Result: ${action}. Notes: "${comments}"`
      );

      // Append to comments history
      const existingHistory = req.commentsHistory ? [...req.commentsHistory] : [];
      if (existingHistory.length === 0) {
        // Seed first
        existingHistory.push({
          id: 'comment-initial-' + req.id,
          authorName: req.userFullName,
          authorRole: 'User',
          action: 'Submit',
          text: req.justification || 'No justification provided.',
          timestamp: req.createdAt
        });
        if (req.comments) {
          existingHistory.push({
            id: 'comment-legacy-' + req.id,
            authorName: 'Sponsoring Approver (Legacy)',
            authorRole: 'Manager',
            action: 'Approve',
            text: req.comments,
            timestamp: req.createdAt
          });
        }
      }

      const newHistoryComment = {
        id: 'comment-' + Math.random().toString(36).substring(2, 9),
        authorName: currentUser.fullName,
        authorRole: currentUser.role,
        action: action,
        text: comments || `Bulk workflow action: ${action}`,
        timestamp: new Date().toISOString()
      };

      const finalCommentsHistory = [...existingHistory, newHistoryComment];
      const finalComments = comments || undefined;

      supabase
        .from('access_requests')
        .update({
          status: nextStatus,
          comments: finalComments || null,
          comments_history: finalCommentsHistory
        })
        .eq('id', req.id)
        .then(({ error }) => {
          if (error) {
            console.error(`Error updating bulk request ${req.id} in Supabase:`, error);
          }
        });

      return {
        ...req,
        status: nextStatus,
        comments: finalComments,
        commentsHistory: finalCommentsHistory
      };
    }));
  };

  // Administration Updates
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (!currentUser) return;

    // Persist role update to Supabase database if UUID is valid
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    if (isUUID) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', userId);
        if (error) {
          console.error("Error updating profile role in DB:", error);
        }
      } catch (err) {
        console.error("Failed to update profile role in DB:", err);
      }
    }

    setProfiles(prev => prev.map(p => {
      if (p.id !== userId) return p;

      logAuditEvent(
        currentUser.email,
        currentUser.role,
        'Permission Change',
        `Modified security privileges of ${p.email} mapping custom scope to ${newRole}.`
      );

      addNotification(
        p.email,
        `Your security access parameters have been adjusted by IT Admin directory to Level: ${newRole}.`,
        'info_requested'
      );

      return { ...p, role: newRole };
    }));
  };

  const handleUpdateStatus = async (userId: string, newStatus: 'Active' | 'Deactivated') => {
    if (!currentUser) return;

    // Persist status update to Supabase database if UUID is valid
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    if (isUUID) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ status: newStatus })
          .eq('id', userId);
        if (error) {
          console.error("Error updating profile status in DB:", error);
        }
      } catch (err) {
        console.error("Failed to update profile status in DB:", err);
      }
    }

    setProfiles(prev => prev.map(p => {
      if (p.id !== userId) return p;

      logAuditEvent(
        currentUser.email,
        currentUser.role,
        newStatus === 'Active' ? 'Enable Account' : 'Deactivate Account',
        `Swapped identity registry execution level for ${p.email} to: ${newStatus}.`
      );

      return { ...p, status: newStatus };
    }));
  };

  const handleCreateNewUser = (user: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const fullObj: UserProfile = {
      ...user,
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setProfiles(prev => [...prev, fullObj]);

    if (currentUser) {
      logAuditEvent(
        currentUser.email,
        currentUser.role,
        'Create User Record',
        `Manually compiled organizational directory profile for ${user.email}.`
      );
    }
  };

  const handleForceResetPassword = (userEmail: string) => {
    if (!currentUser) return;
    
    logAuditEvent(
      currentUser.email,
      currentUser.role,
      'Password Reset Forced',
      `Triggered compliance bypass security credentials resets ticket to ${userEmail}.`
    );

    addNotification(
      userEmail,
      `Your directory password has been force-reset by IT Administration. Sign in using transient credentials.`,
      'security'
    );

    alert(`Compliance credentials ticket created and sent securely to ${userEmail}. Audit trails wrote complete trace log.`);
  };

  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    setCurrentUser(updatedProfile);
    setProfiles((prev) => prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p)));

    // Sync own profile settings to Supabase DB if UUID is valid
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(updatedProfile.id);
    if (isUUID) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: updatedProfile.fullName,
            role: updatedProfile.role,
            department_id: updatedProfile.departmentId,
            status: updatedProfile.status,
            mfa_enabled: updatedProfile.mfaEnabled || false,
            notification_preferences: updatedProfile.notificationPreferences || {},
            phone_number: updatedProfile.phoneNumber,
            job_title: updatedProfile.jobTitle,
            employee_id: updatedProfile.employeeId,
            avatar_url: updatedProfile.avatarUrl,
            last_login: updatedProfile.lastLogin
          })
          .eq('id', updatedProfile.id);
        if (error) {
          console.error("Error saving profile to DB (might be missing custom columns, falling back to local state):", error);
        }
      } catch (err) {
        console.error("Failed to save profile to DB:", err);
      }
    }

    logAuditEvent(
      updatedProfile.email,
      updatedProfile.role,
      'Profile Updated',
      'User updated profile fields, MFA preferences, and notification rules.'
    );

    addNotification(
      updatedProfile.email,
      'Your profile settings and notification rules were successfully updated in the IAM directory.',
      'security'
    );
  };

  const handleAddTicket = async (ticket: SupportTicket) => {
    // Auto-assignment logic: find appropriate IT Admin/Support based on department
    let assignedAdmin = profiles.find(p => p.role === 'IT Admin' && p.departmentId === ticket.userDepartmentId);
    if (!assignedAdmin) {
      assignedAdmin = profiles.find(p => p.role === 'IT Support' && p.departmentId === ticket.userDepartmentId);
    }
    if (!assignedAdmin) {
      assignedAdmin = profiles.find(p => p.role === 'IT Admin');
    }
    if (!assignedAdmin) {
      assignedAdmin = profiles.find(p => p.role === 'IT Support');
    }
    if (!assignedAdmin) {
      assignedAdmin = profiles.find(p => p.role === 'Super Admin');
    }

    const assignedToId = assignedAdmin ? assignedAdmin.id : undefined;
    const assignedToName = assignedAdmin ? assignedAdmin.fullName : undefined;

    const assignedTicket: SupportTicket = {
      ...ticket,
      assignedToId,
      assignedToName,
      activityLogs: assignedAdmin ? [
        ...ticket.activityLogs,
        {
          id: `act-${Math.random().toString(36).substr(2, 9)}`,
          action: `Auto-assigned to IT Admin: ${assignedAdmin.fullName} based on Department`,
          actorName: 'System Auto-Assign',
          timestamp: new Date().toISOString()
        }
      ] : ticket.activityLogs
    };

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          id: assignedTicket.id,
          user_id: assignedTicket.userId,
          user_name: assignedTicket.userName,
          user_email: assignedTicket.userEmail,
          user_department_id: assignedTicket.userDepartmentId || null,
          user_role: assignedTicket.userRole,
          subject: assignedTicket.subject,
          category: assignedTicket.category,
          priority: assignedTicket.priority,
          status: assignedTicket.status,
          description: assignedTicket.description,
          attachment_name: assignedTicket.attachmentName || null,
          attachment_size: assignedTicket.attachmentSize || null,
          assigned_to_id: assignedTicket.assignedToId || null,
          assigned_to_name: assignedTicket.assignedToName || null,
          created_at: assignedTicket.createdAt,
          updated_at: assignedTicket.updatedAt,
          comments: assignedTicket.comments,
          activity_logs: assignedTicket.activityLogs
        });
      
      if (error) {
        console.warn("Could not insert support ticket to database:", error.message);
      }
    } catch (err) {
      console.warn("Exception inserting support ticket to database:", err);
    }

    setTickets((prev) => [assignedTicket, ...prev]);

    logAuditEvent(
      assignedTicket.userEmail,
      assignedTicket.userRole,
      'Support Ticket Submitted',
      `Submitted support ticket ${assignedTicket.id} under category ${assignedTicket.category} with priority ${assignedTicket.priority}`
    );

    addNotification(
      assignedTicket.userEmail,
      `Your support ticket ${assignedTicket.id}: "${assignedTicket.subject}" has been submitted successfully to the Help Desk.`,
      'info_requested'
    );

    if (assignedAdmin) {
      addNotification(
        assignedAdmin.email,
        `📥 Support Ticket [${assignedTicket.id}] from ${assignedTicket.userName} has been auto-assigned to you based on department matching.`,
        'info_requested'
      );
    }

    const itStaff = profiles.filter(p => p.role === 'IT Admin' || p.role === 'Super Admin' || p.role === 'IT Support');
    itStaff.forEach(staff => {
      if (assignedAdmin && staff.id === assignedAdmin.id) return; // already notified above
      if (staff.email.toLowerCase() !== assignedTicket.userEmail.toLowerCase()) {
        addNotification(
          staff.email,
          `⚠️ New Support Ticket [${assignedTicket.id}] from ${assignedTicket.userName}: "${assignedTicket.subject}" (Priority: ${assignedTicket.priority})`,
          'info_requested'
        );
      }
    });
  };

  const handleUpdateTicket = async (updatedTicket: SupportTicket) => {
    const prevTicket = tickets.find(t => t.id === updatedTicket.id);
    if (!prevTicket) return;

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: updatedTicket.status,
          assigned_to_id: updatedTicket.assignedToId || null,
          assigned_to_name: updatedTicket.assignedToName || null,
          updated_at: updatedTicket.updatedAt,
          comments: updatedTicket.comments,
          activity_logs: updatedTicket.activityLogs
        })
        .eq('id', updatedTicket.id);

      if (error) {
        console.warn("Could not update support ticket in database:", error.message);
      }
    } catch (err) {
      console.warn("Exception updating support ticket in database:", err);
    }

    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));

    // 1. Status transition check
    if (prevTicket.status !== updatedTicket.status) {
      logAuditEvent(
        currentUser?.email || 'system',
        currentUser?.role || 'User',
        'Support Ticket Status Updated',
        `Ticket ${updatedTicket.id} status changed from ${prevTicket.status} to ${updatedTicket.status}`
      );

      addNotification(
        updatedTicket.userEmail,
        `🔄 Ticket [${updatedTicket.id}] status updated to: ${updatedTicket.status}`,
        'info_requested'
      );
    }

    // 2. Ticket Assignment check
    if (prevTicket.assignedToId !== updatedTicket.assignedToId) {
      logAuditEvent(
        currentUser?.email || 'system',
        currentUser?.role || 'User',
        'Support Ticket Assigned',
        `Ticket ${updatedTicket.id} assigned to ${updatedTicket.assignedToName || 'Unassigned'}`
      );

      if (updatedTicket.assignedToId) {
        const staff = profiles.find(p => p.id === updatedTicket.assignedToId);
        if (staff) {
          addNotification(
            staff.email,
            `📥 You have been assigned support ticket [${updatedTicket.id}]: "${updatedTicket.subject}"`,
            'info_requested'
          );
        }
      }

      addNotification(
        updatedTicket.userEmail,
        `👤 Ticket [${updatedTicket.id}] has been assigned to IT Agent: ${updatedTicket.assignedToName || 'Unassigned'}`,
        'info_requested'
      );
    }

    // 3. New Response check
    if (updatedTicket.comments.length > prevTicket.comments.length) {
      const latestComment = updatedTicket.comments[updatedTicket.comments.length - 1];
      
      logAuditEvent(
        latestComment.authorEmail,
        latestComment.authorRole,
        latestComment.isInternal ? 'Support Ticket Internal Note Added' : 'Support Ticket Reply Posted',
        `Added reply to ticket ${updatedTicket.id}`
      );

      if (!latestComment.isInternal) {
        if (latestComment.authorEmail.toLowerCase() !== updatedTicket.userEmail.toLowerCase()) {
          addNotification(
            updatedTicket.userEmail,
            `💬 Ticket [${updatedTicket.id}] received a response from IT Staff (${latestComment.authorName})`,
            'info_requested'
          );
        } else {
          if (updatedTicket.assignedToId) {
            const staff = profiles.find(p => p.id === updatedTicket.assignedToId);
            if (staff) {
              addNotification(
                staff.email,
                `💬 Client response received on [${updatedTicket.id}] from ${updatedTicket.userName}`,
                'info_requested'
              );
            }
          } else {
            const itStaff = profiles.filter(p => p.role === 'IT Admin' || p.role === 'Super Admin' || p.role === 'IT Support');
            itStaff.forEach(staff => {
              if (staff.email.toLowerCase() !== updatedTicket.userEmail.toLowerCase()) {
                addNotification(
                  staff.email,
                  `💬 Client response on unassigned Ticket [${updatedTicket.id}] from ${updatedTicket.userName}`,
                  'info_requested'
                );
              }
            });
          }
        }
      }
    }
  };

  // Notification mark as reads
  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    } catch (err) {
      console.error("Failed to update notification in Supabase:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => n.userEmail === currentUser.email ? { ...n, isRead: true } : n));
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_email', currentUser.email);
    } catch (err) {
      console.error("Failed to update all notifications in Supabase:", err);
    }
  };

  // Navigation tabs list depending on user level roles
  const renderDashboardContent = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case 'User':
        return (
          <UserDashboard
            requests={requests}
            userEmail={currentUser.email}
            onOpenCreateModal={() => setIsCreateRequestOpen(true)}
            onSelectRequest={setSelectedRequest}
            auditLogs={auditLogs}
            searchTerm={globalSearchTerm}
            onSearchChange={setGlobalSearchTerm}
          />
        );
      case 'Manager':
      case 'Department Manager':
        return (
          <ManagerDashboard
            requests={requests}
            currentUser={currentUser}
            onSelectRequest={setSelectedRequest}
            searchTerm={globalSearchTerm}
            onSearchChange={setGlobalSearchTerm}
            onBulkWorkflowAction={handleBulkWorkflowAction}
          />
        );
      case 'IT Support':
      case 'IT Admin':
      case 'Super Admin':
        // Display full Admin dashboard view metrics
        return (
          <AdminDashboard
            requests={requests}
            profiles={profiles}
            departments={departments}
            onSelectRequest={setSelectedRequest}
            searchTerm={globalSearchTerm}
            onSearchChange={setGlobalSearchTerm}
          />
        );
      default:
        return (
          <div className="p-8 text-center bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/40 rounded-2xl max-w-xl mx-auto space-y-3">
            <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-400">Unhandled Sandbox Role Context</h3>
            <p className="text-xs text-yellow-700/85 dark:text-yellow-300/80 leading-relaxed">
              Your identity directory profile is assigned the custom role <strong className="font-extrabold">"{currentUser.role}"</strong>, which does not map to a standard dashboard context.
            </p>
            <div className="pt-2">
              <button
                onClick={() => handleSwitchSandboxRole('User')}
                className="px-4 py-2 bg-yellow-650 hover:bg-yellow-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
              >
                Reset Session to Employee (User)
              </button>
            </div>
          </div>
        );
    }
  };

  // If simple quest, show single screens nicely
  if (currentPage !== 'dashboard') {
    return (
      <div className={`${theme} min-h-screen bg-white dark:bg-gray-950 font-sans transition-colors duration-200`}>
        {currentPage === 'landing' ? (
          <LandingPage onNavigate={setCurrentPage} />
        ) : (
          <AuthLayout currentPage={currentPage as any} onNavigate={setCurrentPage}>
            {currentPage === 'login' && <LoginScreen onSuccess={handleLoginSuccess} onNavigate={setCurrentPage} profiles={profiles} />}
            {currentPage === 'register' && <RegisterScreen onSuccess={handleRegisterSuccess} onNavigate={setCurrentPage} departments={departments} profiles={profiles} />}
            {currentPage === 'forgot' && <ForgotPasswordScreen onNavigate={setCurrentPage} />}
            {currentPage === 'reset' && <ResetPasswordScreen onNavigate={setCurrentPage} />}
          </AuthLayout>
        )}
      </div>
    );
  }

  // Dashboard workspace shell layout with lateral sidebar
  return (
    <div className={`${theme} min-h-screen bg-white dark:bg-gray-950 dark:text-gray-100 font-sans text-gray-900 transition-colors duration-200`}>
      
      {/* Shell Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchSandboxRole}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllAsRead}
        globalSearchTerm={globalSearchTerm}
        setGlobalSearchTerm={setGlobalSearchTerm}
        onOpenProfile={() => setIsProfileOpen(true)}
        onSelectProfileTab={() => setActiveTab('profile')}
      />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-5rem)]">
        
        {/* Navigation Sidebar Drawer */}
        {/* Navigation Sidebar Drawer */}
        <aside className="w-full lg:w-64 bg-[#0b1329] text-gray-300 p-6 flex flex-col gap-6 border-b lg:border-b-0 lg:border-r border-[#1e293b]">
          
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-3">Workspace Modules</h3>
            <nav className="space-y-1.5">
              
              {/* Tab Button */}
              <button
                id="btn-nav-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all rounded-xl ${
                  activeTab === 'dashboard'
                    ? 'text-white bg-[#0052cc] shadow-md shadow-blue-900/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Executive Dashboard</span>
              </button>

              {/* FAQ Tab Button */}
              <button
                id="btn-nav-faq"
                onClick={() => setActiveTab('faq')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all rounded-xl ${
                  activeTab === 'faq'
                    ? 'text-white bg-[#0052cc] shadow-md shadow-blue-900/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>Frequently Asked Questions</span>
              </button>

              {/* Profile & Security Tab Button */}
              <button
                id="btn-nav-profile"
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all rounded-xl ${
                  activeTab === 'profile'
                    ? 'text-white bg-[#0052cc] shadow-md shadow-blue-900/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Profile & Security</span>
              </button>

              {/* Support & Help Desk Tab Button */}
              <button
                id="btn-nav-support"
                onClick={() => setActiveTab('support')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all rounded-xl ${
                  activeTab === 'support'
                    ? 'text-white bg-[#0052cc] shadow-md shadow-blue-900/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <LifeBuoy className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Support & Help Desk</span>
              </button>

              {/* Only show User Directory, Auditing, Reports for Admin contexts */}
              {(currentUser?.role === 'IT Admin' || currentUser?.role === 'Super Admin' || currentUser?.role === 'IT Support') && (
                <>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all rounded-xl ${
                      activeTab === 'users'
                        ? 'text-white bg-[#0052cc] shadow-md shadow-blue-900/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                    }`}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Identity Directory</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all rounded-xl ${
                      activeTab === 'reports'
                        ? 'text-white bg-[#0052cc] shadow-md shadow-blue-900/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                    }`}
                  >
                    <FileBarChart className="w-4 h-4 shrink-0" />
                    <span>Compliance Reports</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('audit_logs')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all rounded-xl ${
                      activeTab === 'audit_logs'
                        ? 'text-white bg-[#0052cc] shadow-md shadow-blue-900/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                    }`}
                  >
                    <History className="w-4 h-4 shrink-0" />
                    <span>Security Audit Logs</span>
                  </button>
                </>
              )}

            </nav>
          </div>

          {/* Quick Stats sidebar widget */}
          {currentUser && (
            <div className="mt-auto hidden lg:block p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Session parameters:</div>
              <div className="text-xs text-gray-400 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">MFA Safe:</span>
                  <span className="font-bold text-green-400">ENFORCED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Connection:</span>
                  <span className="font-bold text-blue-400">SECURED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Host Tunnel:</span>
                  <span className="font-medium text-gray-300">Cloud Run TLS</span>
                </div>
              </div>
            </div>
          )}

          {/* Utility Secure Channel */}
          <div className="border-t border-[#1e293b] pt-4 flex items-center justify-between text-xs font-semibold text-gray-500 pl-2">
            <span>IAM Gateway</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              ● ONLINE
            </span>
          </div>

        </aside>

        {/* Central Workspace Canvas */}
        <main className="flex-1 p-6 lg:p-10 select-text overflow-x-hidden">
          
          {activeTab === 'dashboard' && renderDashboardContent()}

          {activeTab === 'users' && (
            <UserManagement
              profiles={profiles}
              departments={departments}
              onUpdateRole={handleUpdateRole}
              onUpdateStatus={handleUpdateStatus}
              onCreateUser={handleCreateNewUser}
              onResetPassword={handleForceResetPassword}
              currentUserRole={currentUser?.role}
            />
          )}

          {activeTab === 'reports' && (
            <ReportingModule 
              requests={requests} 
              departments={departments} 
            />
          )}

          {activeTab === 'audit_logs' && (
            <AuditLogView 
              auditLogs={auditLogs} 
            />
          )}

          {activeTab === 'faq' && (
            <FAQView />
          )}

          {activeTab === 'support' && currentUser && (
            <SupportView
              currentUser={currentUser}
              profiles={profiles}
              departments={departments}
              tickets={tickets}
              onAddTicket={handleAddTicket}
              onUpdateTicket={handleUpdateTicket}
              onOpenFAQ={() => setActiveTab('faq')}
              showToast={showToast}
            />
          )}

          {activeTab === 'profile' && currentUser && (
            <ProfileView
              currentUser={currentUser}
              departments={departments}
              profiles={profiles}
              auditLogs={auditLogs}
              onSaveProfile={handleSaveProfile}
              showToast={showToast}
            />
          )}

        </main>

      </div>

      {/* Creation and detail review modals */}
      <CreateRequestModal
        isOpen={isCreateRequestOpen}
        onClose={() => setIsCreateRequestOpen(false)}
        onSubmit={handleCreateRequestSubmit}
        departments={departments}
        systems={systems}
        profiles={profiles}
        currentUser={currentUser}
      />

      <RequestDetailsModal
        request={selectedRequest}
        isOpen={selectedRequest !== null}
        onClose={() => setSelectedRequest(null)}
        currentUserRole={currentUser?.role || 'User'}
        currentUserId={currentUser?.id || ''}
        currentUserFullName={currentUser?.fullName || ''}
        onWorkflowAction={handleRequestWorkflowAction}
        departments={departments}
        onDeleteAttachment={handleDeleteAttachment}
      />

      {currentUser && (
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          departments={departments}
          onSaveProfile={handleSaveProfile}
          profiles={profiles}
        />
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div 
          id="toast-notification"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-slide-in-right ${
            toast.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300' 
              : toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-450 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-450 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
