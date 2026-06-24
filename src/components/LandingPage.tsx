import React from 'react';
import { 
  Shield, 
  FileText, 
  GitBranch, 
  Users, 
  Lock, 
  Bell, 
  BarChart3, 
  CheckCircle2 
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: 'landing' | 'login' | 'register' | 'forgot' | 'reset' | 'dashboard') => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const features = [
    {
      icon: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "Access Requests",
      description: "Capture justification, priority, dates and attachments."
    },
    {
      icon: <GitBranch className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "Approval Workflow",
      description: "User → Manager → IT Admin with comments at every step."
    },
    {
      icon: <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "Role Management",
      description: "Employee, Manager, IT Admin and Super Admin scopes."
    },
    {
      icon: <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "RBAC + RLS",
      description: "Row-level policies keep data scoped to the right people."
    },
    {
      icon: <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "Notifications",
      description: "In-app alerts for submissions, approvals and grants."
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "Reports",
      description: "Department breakdowns, approval times, active access."
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "Audit Trail",
      description: "Every action logged with user, time and context."
    },
    {
      icon: <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "Security First",
      description: "Tight policies, departmental scoping, admin overrides."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 font-sans transition-colors duration-200">
      
      {/* Top Navbar Header */}
      <header className="border-b border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#004bb6] p-2 rounded-lg text-white">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-[#0c2444] dark:text-gray-100 tracking-tight">Access Portal</span>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onNavigate('login')}
            className="text-sm font-semibold text-[#0c2444]/80 dark:text-gray-300 hover:text-[#004bb6] dark:hover:text-[#004bb6] transition-colors cursor-pointer"
          >
            Sign in
          </button>
          <button 
            onClick={() => onNavigate('register')}
            className="bg-[#004bb6] hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Get started
          </button>
        </div>
      </header>

      {/* Main Body Content Hero */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 flex flex-col items-center justify-center">
        
        {/* Banner pill */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-full text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>Centralized access governance</span>
          </div>
        </div>

        {/* Jumbo Headline */}
        <div className="text-center max-w-3xl space-y-6">
          <h1 className="text-4xl md:text-5xl font-black text-[#0c2444] dark:text-white tracking-tight leading-[1.12]">
            One portal for every access request, approval and audit.
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
            Submit, route and track requests across applications, databases, folders, VPN and more — with role-based controls and a full audit trail.
          </p>
        </div>

        {/* Call to Actions */}
        <div className="mt-10 mb-16 flex items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('register')}
            className="bg-[#004bb6] hover:bg-blue-700 text-white font-bold text-sm px-7 py-3.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
            id="hero-create-acc-btn"
          >
            Create account
          </button>
          <button
            onClick={() => onNavigate('login')}
            className="bg-white dark:bg-gray-905 hover:bg-gray-50 border border-gray-200 dark:border-gray-800 text-[#0c2444] dark:text-gray-300 font-bold text-sm px-7 py-3.5 rounded-lg transition-all cursor-pointer dark:hover:bg-gray-850"
            id="hero-signin-btn"
          >
            Sign in
          </button>
        </div>

        {/* Features Grid layout */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="bg-white dark:bg-gray-900 border border-gray-150/70 dark:border-gray-850 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-start gap-4"
            >
              <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl inline-flex items-center justify-center">
                {feature.icon}
              </div>
              <div className="space-y-1.5 text-left">
                <h3 className="font-extrabold text-sm text-[#0c2444] dark:text-gray-150 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-[12px] leading-relaxed text-gray-500 dark:text-gray-400 font-medium">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Footer copyright */}
      <footer className="border-t border-gray-100 dark:border-gray-900 py-8 text-center bg-gray-50/50 dark:bg-gray-950/50 mt-auto">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold">
          © 2026 Access Portal
        </p>
      </footer>

    </div>
  );
}
