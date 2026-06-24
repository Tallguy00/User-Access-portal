import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  UserProfile, 
  AccessRequest, 
  AuditLog, 
  AppNotification, 
  Department, 
  SystemApplication, 
  UserRole,
  RequestStatus
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

import { ShieldCheck, Users, LayoutDashboard, FileBarChart, History, Settings, Sun, Moon } from 'lucide-react';

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
      { id: 'user-ops-admin', fullName: 'IT Director Admin', email: 'admin@company.com', role: 'IT Admin', departmentId: 'dep-ops', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true },
      { id: 'user-super-admin', fullName: 'Chief Information Officer', email: 'super@company.com', role: 'Super Admin', departmentId: 'dep-ops', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true },
      { id: 'user-mgr-bob', fullName: 'Bob Vance', email: 'manager.bob@company.com', role: 'Manager', departmentId: 'dep-fin', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true },
      { id: 'user-emp-jane', fullName: 'Jane Smith', email: 'employee.jane@company.com', role: 'User', departmentId: 'dep-eng', status: 'Active', createdAt: '2026-06-05T00:00:00Z', mfaEnabled: true },
      { id: 'user-emp-mark', fullName: 'Mark Fletcher', email: 'finance.mark@company.com', role: 'User', departmentId: 'dep-fin', status: 'Active', createdAt: '2026-06-06T00:00:00Z', mfaEnabled: true },
      { id: 'user-emp-lucy', fullName: 'Lucy Thorne', email: 'hr.lucy@company.com', role: 'User', departmentId: 'dep-hr', status: 'Active', createdAt: '2026-06-07T00:00:00Z', mfaEnabled: true }
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

  // Layout Tab select
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'audit_logs' | 'reports'>('dashboard');

  // Modals view controllers
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
    const pendingReqs = requests.filter(req => req.status === 'Submitted' || req.status === 'Under Review');
    if (pendingReqs.length === 0) return;

    const now = new Date();
    const fortyEightHoursInMs = 48 * 60 * 60 * 1000;
    const managers = profiles.filter(p => p.role === 'Manager');
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
        
        if (data) {
          // Map snake_case columns back to camelCase models
          const mappedProfiles: UserProfile[] = data.map(item => ({
            id: item.id,
            fullName: item.full_name,
            email: item.email,
            role: item.role as any,
            departmentId: item.department_id || 'dep-eng',
            status: item.status as any,
            createdAt: item.created_at,
            mfaEnabled: item.mfa_enabled,
            notificationPreferences: item.notification_preferences
          }));
          
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
  useEffect(() => {
    const fetchRequestsFromDB = async () => {
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
            provisionedCredentials: item.provisioned_credentials || undefined
          }));
          
          setRequests(mappedRequests);
        } else {
          setRequests([]);
        }
      } catch (err) {
        console.error("Failed to load requests from DB:", err);
      }
    };
    
    fetchRequestsFromDB();
  }, [currentUser]);

  // Automatically heal/sync profiles for users who have submitted requests but are missing from public.profiles
  useEffect(() => {
    if (requests.length > 0 && profiles.length > 0) {
      const missingProfiles = requests.filter(req => 
        req.userEmail && !profiles.some(p => p.email.toLowerCase().trim() === req.userEmail.toLowerCase().trim())
      );
      
      if (missingProfiles.length > 0) {
        const uniqueEmails = Array.from(new Set(missingProfiles.map(r => r.userEmail.toLowerCase().trim()))) as string[];
        const newProfilesToAdd: UserProfile[] = [];
        
        uniqueEmails.forEach((email: string) => {
          const req = missingProfiles.find(r => r.userEmail.toLowerCase().trim() === email)!;
          const newProfile: UserProfile = {
            id: req.userId || 'user-' + Math.random().toString(36).substr(2, 9),
            fullName: req.userFullName || email.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            email: email,
            role: 'User',
            departmentId: req.departmentId || 'dep-eng',
            status: 'Active',
            createdAt: req.createdAt || new Date().toISOString()
          };
          newProfilesToAdd.push(newProfile);
        });
        
        setProfiles(prev => {
          const updated = [...prev];
          newProfilesToAdd.forEach(newP => {
            if (!updated.some(p => p.email.toLowerCase().trim() === newP.email)) {
              updated.push(newP);
              
              // Background heal: write profile to Supabase database so all sessions see it immediately!
              const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(newP.id);
              if (isUUID) {
                supabase
                  .from('profiles')
                  .upsert({
                    id: newP.id,
                    full_name: newP.fullName,
                    email: newP.email,
                    role: 'User',
                    department_id: newP.departmentId,
                    status: 'Active'
                  })
                  .then(({ error }) => {
                    if (error) {
                      console.error("Failed to auto-heal missing database profile:", error);
                    } else {
                      console.log("Successfully auto-healed missing database profile for", newP.email);
                    }
                  });
              }
            }
          });
          return updated;
        });
      }
    }
  }, [requests, profiles]);

  // Handle active session loading
  useEffect(() => {
    if (sessionUserEmail) {
      const trimKey = sessionUserEmail.toLowerCase().trim();
      const foundProfile = profiles.find(p => 
        p.email.toLowerCase().trim() === trimKey
      );
      if (foundProfile) {
        // If account is deactivated, reject immediately
        if (foundProfile.status === 'Deactivated') {
          alert('This corporate account has been deactivated by IT administration.');
          handleLogout();
          return;
        }
        setCurrentUser(foundProfile);
      } else {
        // Fetch the actual user ID from Supabase Auth to ensure we use the correct UUID
        const syncProfile = async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            const actualId = user?.id || 'user-' + Math.random().toString(36).substr(2, 9);
            const newProfile: UserProfile = {
              id: actualId,
              fullName: trimKey.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              email: trimKey,
              role: 'User',
              departmentId: 'dep-eng',
              status: 'Active',
              createdAt: new Date().toISOString()
            };
            setProfiles(prev => {
              if (prev.some(p => p.email.toLowerCase().trim() === trimKey)) return prev;
              return [...prev, newProfile];
            });
            setCurrentUser(newProfile);
            
            // Upsert to Supabase profiles table to heal database missing records!
            if (user?.id) {
              await supabase.from('profiles').upsert({
                id: user.id,
                full_name: newProfile.fullName,
                email: newProfile.email,
                role: 'User',
                department_id: 'dep-eng',
                status: 'Active'
              });
            }
          } catch (err) {
            console.error("Failed to sync profile:", err);
          }
        };
        syncProfile();
      }
    } else {
      setCurrentUser(null);
    }
  }, [sessionUserEmail, profiles]);

  // Auth Operations
  const handleLoginSuccess = async (email: string) => {
    // Leverage supabase.auth session retrieval to match/confirm user email
    const { data: { user } } = await supabase.auth.getUser();
    const authenticatedEmail = user?.email || email;

    localStorage.setItem('ar_session_user_email', authenticatedEmail);
    setSessionUserEmail(authenticatedEmail);
    setCurrentPage('dashboard');
    setActiveTab('dashboard');

    // Detect role for log context mapping
    const foundProfile = profiles.find(p => p.email.toLowerCase() === authenticatedEmail.toLowerCase());
    const matchedRole = foundProfile?.role || 'User';

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
  const handleSwitchSandboxRole = (newRole: UserRole) => {
    if (!currentUser) return;
    setGlobalSearchTerm('');
    const updated = { ...currentUser, role: newRole };
    setCurrentUser(updated);
    setProfiles(prev => prev.map(p => p.id === currentUser.id ? updated : p));

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
  const logAuditEvent = (email: string, role: UserRole, action: string, details: string) => {
    const newLog: AuditLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      userEmail: email,
      userRole: role,
      action,
      details,
      createdAt: new Date().toISOString(),
      ipAddress: '159.20.104.' + Math.floor(Math.random() * 254),
      device: 'MacBook Air M3, Safari MacOS'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addNotification = (email: string, message: string, type: AppNotification['type']) => {
    const newNotice: AppNotification = {
      id: 'notice-' + Math.random().toString(36).substr(2, 9),
      userEmail: email,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
      type
    };
    setNotifications(prev => [newNotice, ...prev]);
  };

  // Request handlers
  const handleCreateRequestSubmit = async (newReq: Omit<AccessRequest, 'id' | 'userId' | 'userEmail' | 'userFullName' | 'createdAt' | 'status'> & { id?: string }) => {
    if (!currentUser) return;

    const createdAt = new Date().toISOString();
    const reqId = newReq.id || ('req-' + Math.floor(100 + Math.random() * 900));
    const requestObj: AccessRequest = {
      ...newReq,
      id: reqId,
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userEmail: currentUser.email,
      status: 'Submitted',
      createdAt,
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

    setRequests(prev => [requestObj, ...prev]);

    // Send notifications to operator
    addNotification(
      currentUser.email,
      `Your request "${newReq.title}" for ${newReq.systemName} has been submitted for manager approval.`,
      'submitted'
    );

    // Audit trace
    logAuditEvent(
      currentUser.email,
      currentUser.role,
      'Submit Request',
      `Sourced access request ${reqId} for "${newReq.systemName}" prioritizing "${newReq.priority}".`
    );

    // Persist request directly to the Supabase Database table
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('access_requests').insert({
          id: reqId,
          user_id: user.id,
          user_email: currentUser.email,
          user_full_name: currentUser.fullName,
          department_id: newReq.departmentId,
          title: newReq.title,
          access_type: newReq.accessType,
          system_name: newReq.systemName,
          justification: newReq.justification,
          priority: newReq.priority,
          start_date: newReq.startDate,
          end_date: newReq.endDate || null,
          status: 'Submitted',
          created_at: createdAt,
          attachments: newReq.attachments || [],
          comments: newReq.comments || null,
          comments_history: requestObj.commentsHistory,
          provisioned_credentials: null
        });
        if (error) {
          console.error("Error inserting request into Supabase DB:", error);
        }
      }
    } catch (err) {
      console.error("Supabase request insertion exception:", err);
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

      if (currentUser.role === 'Manager' || currentUser.role === 'Super Admin') {
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
      } else if (currentUser.role === 'IT Admin') {
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
        action: currentUser.role === 'IT Admin' && action === 'Approve' ? 'Complete' : action,
        text: comments || (currentUser.role === 'IT Admin' && action === 'Approve' ? 'Access provisioned and completed.' : `Workflow update [${action}]`),
        timestamp: new Date().toISOString()
      };

      const finalCommentsHistory = [...existingHistory, newHistoryComment];
      const finalComments = comments || undefined;
      const finalCredentials = provisionedCredentials || req.provisionedCredentials;

      supabase
        .from('access_requests')
        .update({
          status: nextStatus,
          comments: finalComments || null,
          comments_history: finalCommentsHistory,
          provisioned_credentials: finalCredentials || null
        })
        .eq('id', req.id)
        .then(({ error }) => {
          if (error) {
            console.error(`Error updating request ${req.id} in Supabase:`, error);
          }
        });

      return {
        ...req,
        status: nextStatus,
        comments: finalComments,
        commentsHistory: finalCommentsHistory,
        provisionedCredentials: finalCredentials
      };
    }));
  };

  // Bulk Approver Action Matrix
  const handleBulkWorkflowAction = (requestIds: string[], action: 'Approve' | 'Reject', comments: string) => {
    if (!currentUser) return;

    setRequests(prev => prev.map(req => {
      if (!requestIds.includes(req.id)) return req;

      let nextStatus: RequestStatus = req.status;
      let notificationType: AppNotification['type'] = 'info_requested';

      if (currentUser.role === 'Manager' || currentUser.role === 'Super Admin') {
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
            notification_preferences: updatedProfile.notificationPreferences || {}
          })
          .eq('id', updatedProfile.id);
        if (error) {
          console.error("Error saving profile to DB:", error);
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

  // Notification mark as reads
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => n.userEmail === currentUser.email ? { ...n, isRead: true } : n));
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
        return (
          <ManagerDashboard
            requests={requests}
            onSelectRequest={setSelectedRequest}
            searchTerm={globalSearchTerm}
            onSearchChange={setGlobalSearchTerm}
            onBulkWorkflowAction={handleBulkWorkflowAction}
          />
        );
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

              {/* Only show User Directory, Auditing, Reports for Admin contexts */}
              {(currentUser?.role === 'IT Admin' || currentUser?.role === 'Super Admin') && (
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

        </main>

      </div>

      {/* Creation and detail review modals */}
      <CreateRequestModal
        isOpen={isCreateRequestOpen}
        onClose={() => setIsCreateRequestOpen(false)}
        onSubmit={handleCreateRequestSubmit}
        departments={departments}
        systems={systems}
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

    </div>
  );
}
