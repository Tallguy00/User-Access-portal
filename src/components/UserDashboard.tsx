import React, { useState } from 'react';
import { AccessRequest, AuditLog } from '../types';
import { FolderUp, ShieldCheck, Activity, PlusCircle, Search, Filter, ShieldAlert, CheckCircle, Clock, XCircle, ArrowUpRight } from 'lucide-react';
import HighlightText from './HighlightText';

interface UserDashboardProps {
  requests: AccessRequest[];
  userEmail: string;
  onOpenCreateModal: () => void;
  onSelectRequest: (request: AccessRequest) => void;
  auditLogs: AuditLog[];
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
}

export default function UserDashboard({ 
  requests: rawRequests, 
  userEmail, 
  onOpenCreateModal, 
  onSelectRequest, 
  auditLogs: rawAuditLogs,
  searchTerm: externalSearchTerm,
  onSearchChange: externalOnSearchChange
}: UserDashboardProps) {
  const requests = Array.isArray(rawRequests) ? rawRequests.filter(Boolean) : [];
  const auditLogs = Array.isArray(rawAuditLogs) ? rawAuditLogs.filter(Boolean) : [];
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : localSearchTerm;
  const setSearchTerm = externalOnSearchChange !== undefined ? externalOnSearchChange : setLocalSearchTerm;

  // Filter requests for currently logged in user
  const userRequests = requests.filter(req => req.userEmail === userEmail);
  const userLogs = auditLogs.filter(log => log.userEmail === userEmail);

  const activeCount = userRequests.filter(r => ['Submitted', 'Under Review', 'Approved'].includes(r.status)).length;
  const approvedCount = userRequests.filter(r => r.status === 'Completed').length;
  const rejectedCount = userRequests.filter(r => r.status === 'Rejected').length;

  const filteredRequests = React.useMemo(() => {
    const filtered = userRequests.filter(req => {
      const titleStr = req.title || '';
      const systemNameStr = req.systemName || '';
      const accessTypeStr = req.accessType || '';
      const searchStr = searchTerm || '';
      const matchesSearch = titleStr.toLowerCase().includes(searchStr.toLowerCase()) || 
                            systemNameStr.toLowerCase().includes(searchStr.toLowerCase()) ||
                            accessTypeStr.toLowerCase().includes(searchStr.toLowerCase());
      
      if (statusFilter === 'All') return matchesSearch;
      if (statusFilter === 'Active') return matchesSearch && ['Submitted', 'Under Review', 'Approved'].includes(req.status);
      return matchesSearch && req.status === statusFilter;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'priority-desc') {
        const priorityScore: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        const scoreA = priorityScore[a.priority] || 0;
        const scoreB = priorityScore[b.priority] || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'priority-asc') {
        const priorityScore: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        const scoreA = priorityScore[a.priority] || 0;
        const scoreB = priorityScore[b.priority] || 0;
        if (scoreA !== scoreB) return scoreA - scoreB;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });
  }, [userRequests, searchTerm, statusFilter, sortBy]);

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'Low': return 'bg-green-50 text-green-700 border-green-150 text-[10px] uppercase font-bold px-2 py-0.5 rounded border';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-150 text-[10px] uppercase font-bold px-2 py-0.5 rounded border';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-150 text-[10px] uppercase font-bold px-2 py-0.5 rounded border';
      case 'Critical': return 'bg-red-50 text-red-700 border-red-150 text-[10px] uppercase font-bold px-2 py-0.5 rounded border animate-pulse';
      default: return '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft': return 'badge-review';
      case 'Submitted': return 'badge-pending';
      case 'Under Review': return 'badge-review';
      case 'Approved': return 'badge-approved';
      case 'Rejected': return 'badge-rejected';
      case 'Completed': return 'badge-approved';
      case 'Pending': return 'badge-pending';
      default: return 'badge-review';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Title Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">Employee Access Workspace</h1>
          <p className="text-sm text-gray-500 mt-1">Submit, monitor, and audit your organization security and systems access permissions.</p>
        </div>
        <button
          id="btn-trigger-request"
          onClick={onOpenCreateModal}
          className="btn-primary-minimal shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Access Request</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active reqs card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Requests</div>
            <div className="text-2xl font-black text-gray-950 dark:text-white mt-1">{activeCount}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Pending security approval loop</div>
          </div>
        </div>

        {/* Approved reqs card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Approved & Active Access</div>
            <div className="text-2xl font-black text-gray-950 dark:text-white mt-1">{approvedCount}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Permissions written to IAM system</div>
          </div>
        </div>

        {/* Rejected reqs card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rejected Requests</div>
            <div className="text-2xl font-black text-gray-950 dark:text-white mt-1">{rejectedCount}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Access denied or revision requested</div>
          </div>
        </div>
      </div>

      {/* Main Request Pool */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column - list of requests */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-bold text-gray-950 dark:text-white">Your Submission History</h2>
            
            {/* Search & filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-1.5 w-full sm:w-56 md:w-64 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Loop</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-[11px] text-gray-700 dark:text-gray-300 focus:outline-none font-medium"
                title="Sort by"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="priority-desc">Priority: High to Low</option>
                <option value="priority-asc">Priority: Low to High</option>
                <option value="status">Status: Alphabetical</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800/60 overflow-y-auto max-h-[500px]">
            {userRequests.length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-2">
                <FolderUp className="w-10 h-10 text-gray-300 animate-bounce" />
                <div className="font-semibold text-gray-500">No requests found</div>
                <div className="text-xs">Submit a request above to initialize privileges.</div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
                <Search className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                <div className="font-semibold text-gray-500 dark:text-gray-400">No results found</div>
                <div className="text-xs text-gray-400">No requests match your current search queries or filters.</div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                    setSortBy('date-desc');
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow"
                >
                  Clear search & filters
                </button>
              </div>
            ) : (
              filteredRequests.map(req => (
                <div 
                  key={req.id} 
                  className="p-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400 font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                        {req.id}
                      </span>
                      <span className={getPriorityBadge(req.priority)}>
                        {req.priority}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        <HighlightText text={req.accessType} search={searchTerm} />
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-gray-950 dark:text-white leading-snug">
                      <HighlightText text={req.title} search={searchTerm} />
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>System: <strong className="text-gray-600 dark:text-gray-300 font-medium"><HighlightText text={req.systemName} search={searchTerm} /></strong></span>
                      <span>•</span>
                      <span>Created {new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full text-center shrink-0 ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => onSelectRequest(req)}
                      className="btn-secondary-minimal py-1.5 px-3 text-xs shrink-0"
                    >
                      <span>Review Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column - personal activities log */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-gray-950 dark:text-white">Active Activity Feed</h2>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[420px]">
            {userLogs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs italic">
                No recent workspace operations recorded.
              </div>
            ) : (
              userLogs.map(log => (
                <div key={log.id} className="relative flex gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5"></div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-gray-800 dark:text-gray-200">
                      {log.action}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 leading-relaxed">
                      {log.details}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
