import { Department, SystemApplication, AccessRequest, AuditLog, AppNotification } from './types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dep-eng', name: 'Engineering', description: 'Software engineering, DevOps, and cloud infrastructure operations' },
  { id: 'dep-fin', name: 'Finance & Accounting', description: 'Financial planning, accounting, and payroll systems' },
  { id: 'dep-hr', name: 'Human Resources', description: 'Talent acquisition, employee relations, and benefits' },
  { id: 'dep-ops', name: 'Operations & IT', description: 'Internal IT infrastructure, security, and administrative services' },
  { id: 'dep-mkt', name: 'Marketing & Sales', description: 'Growth, CRM management, and outward communications' }
];

export const INITIAL_SYSTEMS: SystemApplication[] = [
  { id: 'sys-aws', name: 'AWS Production environment', description: 'Production hosting services for SaaS apps and APIs', category: 'Infrastructure' },
  { id: 'sys-pg', name: 'PostgreSQL Database Server', description: 'Main relational databases hosting customer and transaction logs', category: 'Database' },
  { id: 'sys-fin', name: 'Quarterly Audits Sharepoint Folder', description: 'Confidential folder containing tax documents and spreadsheets', category: 'File Storage' },
  { id: 'sys-vpn', name: 'Secure Corporate VPN Cluster', description: 'Remote access gateway for internal web and secure hosts', category: 'Network' },
  { id: 'sys-slack', name: 'Executive Channels Email Group', description: 'Access to executive and sensitive communications', category: 'Email/Comm' },
  { id: 'sys-sap', name: 'SAP ERP Server', description: 'Enterprise resource planning and financial bookkeeping platform', category: 'Application' }
];

export const INITIAL_REQUESTS: AccessRequest[] = [
  {
    id: 'req-001',
    userId: 'user-emp-1',
    userEmail: 'employee.jane@company.com',
    userFullName: 'Jane Smith',
    departmentId: 'dep-eng',
    title: 'AWS Production Read Access',
    accessType: 'Application Access',
    systemName: 'AWS Production environment',
    justification: 'Need access to debug container scaling issues in the live production namespace.',
    priority: 'High',
    startDate: '2026-06-21',
    endDate: '2026-07-21',
    status: 'Under Review',
    createdAt: '2026-06-19T10:30:00Z',
    attachments: [{ name: 'project_brief_architecture.pdf', size: '1.2MB' }]
  },
  {
    id: 'req-002',
    userId: 'user-emp-2',
    userEmail: 'finance.mark@company.com',
    userFullName: 'Mark Fletcher',
    departmentId: 'dep-fin',
    title: 'Financial Audit Folder Write Access',
    accessType: 'Folder Access',
    systemName: 'Quarterly Audits Sharepoint Folder',
    justification: 'Responsible for uploading latest Q2 audit reports and ledger sheets.',
    priority: 'Medium',
    startDate: '2026-06-20',
    status: 'Approved',
    createdAt: '2026-06-18T14:15:00Z',
    attachments: []
  },
  {
    id: 'req-003',
    userId: 'user-emp-3',
    userEmail: 'hr.lucy@company.com',
    userFullName: 'Lucy Thorne',
    departmentId: 'dep-hr',
    title: 'HR VPN Access Renewal',
    accessType: 'VPN Access',
    systemName: 'Secure Corporate VPN Cluster',
    justification: 'Regular VPN access extension requested for secure remote working.',
    priority: 'Low',
    startDate: '2026-06-19',
    status: 'Completed',
    createdAt: '2026-06-15T09:00:00Z'
  },
  {
    id: 'req-004',
    userId: 'user-emp-1',
    userEmail: 'employee.jane@company.com',
    userFullName: 'Jane Smith',
    departmentId: 'dep-eng',
    title: 'PostgreSQL Root Access',
    accessType: 'Database Access',
    systemName: 'PostgreSQL Database Server',
    justification: 'Require full root superuser credentials to manual patch customer table schema indices.',
    priority: 'Critical',
    startDate: '2026-06-20',
    status: 'Rejected',
    createdAt: '2026-06-17T11:20:00Z',
    comments: 'Superuser database access rejected. Please request a read-only analyst credential instead.'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    userEmail: 'admin@company.com',
    userRole: 'IT Support',
    action: 'Grant Access',
    details: 'Completed access request req-003 and provisioned remote VPN profile.',
    createdAt: '2026-06-19T14:40:00Z',
    ipAddress: '192.168.1.100',
    device: 'MacBook Pro, Chrome MacOS'
  },
  {
    id: 'log-002',
    userEmail: 'manager.bob@company.com',
    userRole: 'Manager (Approver)',
    action: 'Approve Request',
    details: 'Approved quarterly audit folder access request for Mark Fletcher.',
    createdAt: '2026-06-18T16:22:00Z',
    ipAddress: '102.16.89.44',
    device: 'ThinkPad T14, Edge Windows'
  },
  {
    id: 'log-003',
    userEmail: 'manager.bob@company.com',
    userRole: 'Manager (Approver)',
    action: 'Reject Request',
    details: 'Rejected PostgreSQL DB superuser root credentials request due to security compliance constraints.',
    createdAt: '2026-06-17T13:45:00Z',
    ipAddress: '102.16.89.44',
    device: 'ThinkPad T14, Edge Windows'
  },
  {
    id: 'log-004',
    userEmail: 'employee.jane@company.com',
    userRole: 'Employee (Requester)',
    action: 'Submit Request',
    details: 'Created access request for AWS Production environment.',
    createdAt: '2026-06-19T10:30:00Z',
    ipAddress: '12.44.187.90',
    device: 'iPhone 15, Safari iOS'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'nt-1',
    userEmail: 'employee.jane@company.com',
    message: 'Your PostgreSQL Root Access request was rejected by Bob (Manager)',
    isRead: false,
    createdAt: '2026-06-17T13:45:00Z',
    type: 'rejected'
  },
  {
    id: 'nt-2',
    userEmail: 'employee.jane@company.com',
    message: 'Your AWS Production Read Access request has been successfully submitted.',
    isRead: true,
    createdAt: '2026-06-19T10:30:00Z',
    type: 'submitted'
  },
  {
    id: 'nt-3',
    userEmail: 'hr.lucy@company.com',
    message: 'IT Administration Team completed and granted your VPN Access request!',
    isRead: false,
    createdAt: '2026-06-19T14:40:00Z',
    type: 'granted'
  }
];
