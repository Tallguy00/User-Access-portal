export type UserRole = 
  | 'Admin' 
  | 'Employee (Requester)' 
  | 'Manager (Approver)' 
  | 'IT Support' 
  | 'Super Admin';

export function mapUiToDbRole(uiRole: UserRole): 'User' | 'Manager' | 'IT Admin' | 'Super Admin' {
  switch (uiRole) {
    case 'Employee (Requester)': return 'User';
    case 'Manager (Approver)': return 'Manager';
    case 'IT Support': return 'IT Admin';
    case 'Admin': return 'IT Admin';
    case 'Super Admin': return 'Super Admin';
    default: return 'User';
  }
}

export function mapDbToUiRole(dbRole: string, email?: string, uiPrefRole?: string): UserRole {
  if (uiPrefRole === 'Admin' || uiPrefRole === 'Employee (Requester)' || uiPrefRole === 'Manager (Approver)' || uiPrefRole === 'IT Support' || uiPrefRole === 'Super Admin') {
    return uiPrefRole as UserRole;
  }
  switch (dbRole) {
    case 'User': return 'Employee (Requester)';
    case 'Manager': return 'Manager (Approver)';
    case 'IT Admin': 
      if (email?.toLowerCase().includes('admin')) {
        return 'Admin';
      }
      return 'IT Support';
    case 'Super Admin': return 'Super Admin';
    default: return 'Employee (Requester)';
  }
}

export type RequestStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Completed';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type AccessType = 
  | 'Application Access' 
  | 'Database Access' 
  | 'Folder Access' 
  | 'Email Group Access' 
  | 'VPN Access' 
  | 'Server Access';

export interface NotificationPreferences {
  onSubmitted?: boolean;
  onUnderReview?: boolean;
  onApproved?: boolean;
  onRejected?: boolean;
  onCompleted?: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  departmentId: string;
  status: 'Active' | 'Deactivated';
  createdAt: string;
  mfaEnabled?: boolean;
  notificationPreferences?: NotificationPreferences;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface RequestComment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  action?: string;
  text: string;
  timestamp: string;
}

export interface AccessRequest {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  departmentId: string;
  title: string;
  accessType: AccessType;
  systemName: string; // system/application
  justification: string;
  priority: PriorityLevel;
  startDate: string;
  endDate?: string;
  status: RequestStatus;
  createdAt: string;
  attachments?: { name: string; size: string; previewUrl?: string; filePath?: string }[];
  comments?: string;
  commentsHistory?: RequestComment[];
  provisionedCredentials?: {
    username?: string;
    tokenType?: string;
    secretValue?: string;
    connectionUri?: string;
    expiresAt?: string;
  };
}

export interface ApprovalAction {
  id: string;
  requestId: string;
  approverId: string;
  approverName: string;
  approverRole: UserRole;
  action: 'Approve' | 'Reject' | 'Request Info';
  comments: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  userEmail: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'submitted' | 'approved' | 'rejected' | 'granted' | 'info_requested' | 'security';
}

export interface AuditLog {
  id: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  details: string;
  createdAt: string;
  ipAddress: string;
  device: string;
}

export interface SystemApplication {
  id: string;
  name: string;
  description: string;
  category: string;
}
