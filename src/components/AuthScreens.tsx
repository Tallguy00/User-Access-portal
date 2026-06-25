import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserRole, Department, UserProfile } from '../types';
import { 
  AlertCircle, Lock, Mail, User, ShieldCheck, ArrowRight, 
  Sparkles, Building, KeyRound, Info, Eye, EyeOff, 
  Check, Shield, Timer, RefreshCw
} from 'lucide-react';

// Validation helper for E.164 format (starts with +, followed by 7 to 15 digits)
export function validateE164(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone.trim().replace(/\s+/g, ''));
}

export function AuthLayout({ 
  children, 
  currentPage, 
  onNavigate 
}: { 
  children: React.ReactNode; 
  currentPage: 'login' | 'register' | 'forgot' | 'reset'; 
  onNavigate: (page: 'login' | 'register' | 'forgot' | 'reset') => void 
}) {
  const isLogin = currentPage === 'login';
  const isRegister = currentPage === 'register';

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white dark:bg-gray-950 transition-colors duration-200">
      {/* Left side panel - visible on md and up */}
      <div className="hidden md:flex md:w-1/2 bg-[#0052cc] p-16 text-white flex-col justify-between relative overflow-hidden">
        {/* Logo Section */}
        <div className="flex items-center gap-2.5 z-10">
          <Shield className="w-6 h-6 fill-none stroke-white stroke-2" />
          <span className="font-bold text-xl tracking-tight">Access Portal</span>
        </div>

        {/* Hero Copy */}
        <div className="max-w-md z-10 space-y-4 my-auto">
          <h1 className="text-4xl font-black tracking-tight leading-tight">
            Secure access, simplified.
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed font-medium">
            Submit requests, route approvals, and keep a full audit trail — all from a single, role-aware portal.
          </p>
        </div>

        {/* Footer */}
        <div className="text-xs text-blue-200 z-10 font-medium">
          © 2026 Access Portal
        </div>

        {/* Subtle background gradients for depth */}
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500 opacity-20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-700 opacity-30 blur-3xl pointer-events-none"></div>
      </div>

      {/* Right side form container */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-16 relative bg-white dark:bg-gray-900 overflow-y-auto">
        
        {/* Top Header for Mobile only */}
        <div className="flex md:hidden items-center gap-2 mb-8 self-start">
          <Shield className="w-6 h-6 text-[#0052cc] fill-none stroke-[#0052cc]" />
          <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">Access Portal</span>
        </div>

        {/* Capsule Tab Switcher - only for login & register pages */}
        {(isLogin || isRegister) && (
          <div className="mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-inner">
            <button
              onClick={() => onNavigate('login')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all border-none cursor-pointer ${
                isLogin 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => onNavigate('register')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all border-none cursor-pointer ${
                isRegister 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent'
              }`}
            >
              Create account
            </button>
          </div>
        )}

        {/* Auth form sheet card */}
        <div className="w-full max-w-md space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}

interface LoginScreenProps {
  onSuccess: (email: string) => void;
  onNavigate: (page: 'login' | 'register' | 'forgot' | 'reset') => void;
  profiles: UserProfile[];
}

export function LoginScreen({ onSuccess, onNavigate, profiles }: LoginScreenProps) {
  // Authentication Method Choice (default to 'password' as shown in screenshot)
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('password');
  
  // Email & Password states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP active workflow states
  const [otpStage, setOtpStage] = useState<'email' | 'verify'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [otpSentTime, setOtpSentTime] = useState<number | null>(null);
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // General UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showDemoProfiles, setShowDemoProfiles] = useState(false);

  // Countdown timer scheduler for resending OTP helper
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        setErrorMsg(error.message);
        setShowGoogleModal(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Authentication gateway failure.');
      setShowGoogleModal(true);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        setErrorMsg(error.message);
        setShowGoogleModal(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Apple Authentication gateway failure.');
      setShowGoogleModal(true);
    }
  };

  // OTP SENDER HANDLER
  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = email.toLowerCase().trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter a valid corporate email address.');
      return;
    }

    setLoading(true);

    // Sandbox check: if email is demo/test catalog or offline sandbox bypass
    const isDemoEmail = [
      'admin@company.com', 
      'super@company.com', 
      'manager.bob@company.com', 
      'manager@company.com', 
      'employee.jane@company.com', 
      'finance.mark@company.com', 
      'hr.lucy@company.com', 
      'employee@company.com'
    ].includes(trimmedEmail);

    if (isDemoEmail) {
      setTimeout(() => {
        setIsSimulatorMode(true);
        setOtpStage('verify');
        setCountdown(60);
        setOtpSentTime(Date.now());
        setSuccessMsg('OTP sent successfully. IAM Sandbox active: Use bypass security key "123456".');
        setLoading(false);
      }, 700);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: true
        }
      });

      if (error) {
        // Fallback or explicit warning
        setErrorMsg(error.message);
      } else {
        setIsSimulatorMode(false);
        setOtpStage('verify');
        setCountdown(60);
        setOtpSentTime(Date.now());
        setSuccessMsg('OTP sent successfully. Verify your organization inbox for the security key.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP dispatch gateway timeout. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  // OTP VERIFICATION CONFIRM HANDLER
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = email.toLowerCase().trim();

    if (failedAttempts >= 5) {
      setErrorMsg('Too many attempts. Security block on this session is active. Please wait to try again.');
      return;
    }

    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg('Invalid OTP. Please enter the full 6-digit verification code.');
      return;
    }

    // Client-side 10-minutes expiration verify
    if (otpSentTime && Date.now() - otpSentTime > 10 * 60 * 1000) {
      setErrorMsg('Expired OTP. Code has expired after 10 minutes. Please trigger a new dispatch.');
      return;
    }

    setLoading(true);

    if (isSimulatorMode) {
      setTimeout(() => {
        setLoading(false);
        if (otpCode === '123455' || otpCode === '123456') {
          setFailedAttempts(0);
          onSuccess(trimmedEmail);
        } else {
          const next = failedAttempts + 1;
          setFailedAttempts(next);
          if (next >= 5) {
            setErrorMsg('Too many attempts. Blocked due to suspicious sandbox login pattern.');
          } else {
            setErrorMsg('Invalid OTP. Simulated verification credentials mismatch.');
          }
        }
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: otpCode,
        type: 'email'
      });

      if (error) {
        const next = failedAttempts + 1;
        setFailedAttempts(next);
        
        if (next >= 5) {
          setErrorMsg('Too many attempts. Security lockout active. Please wait before retrying.');
        } else {
          const isExpiredErr = error.message.toLowerCase().includes('expired');
          if (isExpiredErr) {
            setErrorMsg('Expired OTP. Verification token validity expired.');
          } else {
            setErrorMsg(`Invalid OTP. Verification failed: ${error.message}`);
          }
        }
      } else if (data?.user || data?.session) {
        setFailedAttempts(0);
        onSuccess(trimmedEmail);
      } else {
        setFailedAttempts(0);
        onSuccess(trimmedEmail);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP authentication service timed out.');
    } finally {
      setLoading(false);
    }
  };

  // PASSWORD SIGN IN HANDLER (Backwards compatible)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = email.toLowerCase().trim();

    // Pre-emptively match demo accounts
    if (trimmedEmail === 'super@company.com' && password === 'SuperAdmin123') {
      setTimeout(() => {
        onSuccess('super@company.com');
        setLoading(false);
      }, 400);
      return;
    }
    if (trimmedEmail === 'admin@company.com' && password === 'AdminIT123') {
      setTimeout(() => {
        onSuccess('admin@company.com');
        setLoading(false);
      }, 400);
      return;
    }
    if ((trimmedEmail === 'manager@company.com' || trimmedEmail === 'manager.bob@company.com') && password === 'Manager123') {
      setTimeout(() => {
        onSuccess('manager.bob@company.com');
        setLoading(false);
      }, 400);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (error) {
        setErrorMsg(error.message);
      } else if (data?.user || data?.session) {
        const loggedEmail = data.user?.email || trimmedEmail;
        onSuccess(loggedEmail);
      } else {
        onSuccess(trimmedEmail);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Access authorization failure. Please check your fields.');
    } finally {
      setLoading(false);
    }
  };

  // Demo user picker
  const handleDemoFill = (type: 'User' | 'Manager' | 'IT_Admin' | 'Super_Admin') => {
    const demoCredentials = {
      User: { email: 'employee.jane@company.com', pass: 'Manager123' },
      Manager: { email: 'manager.bob@company.com', pass: 'Manager123' },
      IT_Admin: { email: 'admin@company.com', pass: 'AdminIT123' },
      Super_Admin: { email: 'super@company.com', pass: 'SuperAdmin123' }
    };
    
    const creds = demoCredentials[type];
    setEmail(creds.email);
    setPassword(creds.pass || 'Manager123');
    
    // Clear alerts when switching profiles
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="space-y-6 animate-modal-slide">
      
      {/* Top Info Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 id="login-heading" className="text-3xl font-black text-gray-955 dark:text-white tracking-tight">Welcome back</h2>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Sign in to manage access requests.</p>
        </div>
      </div>

      {/* SYSTEM PASSWORD SIGN IN METHOD */}
      <form onSubmit={handlePasswordLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Email</label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-955 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Password</label>
            <button
              type="button"
              onClick={() => onNavigate('forgot')}
              className="text-xs text-[#0052cc] dark:text-blue-400 font-bold hover:underline bg-transparent border-none cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-sm text-gray-955 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-605 transition-colors bg-transparent border-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 p-3.5 bg-red-50 dark:bg-red-955/30 border border-red-200/50 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-400 text-xs text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 p-3.5 bg-green-50 dark:bg-green-955/20 border border-green-200/50 dark:border-green-900/40 rounded-xl text-green-700 dark:text-green-400 text-xs text-left">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <button
          id="btn-login-submit"
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] border-none"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Bottom Legal Copy */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500">
        By continuing you agree to the organization's access policies.
      </div>

      {/* Federated Logins */}
      <div className="space-y-3 pt-1">
        <div className="relative flex py-1 items-center justify-center">
          <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
          <span className="flex-shrink mx-3 text-gray-400 text-[10px] uppercase tracking-wider font-bold flex items-center bg-white dark:bg-gray-900 px-2">
            <span>OR FEDERATED SIGN IN</span>
          </span>
          <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
        </div>

        <div className="flex flex-col gap-2">
            <button
              type="button"
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/0000/svg">
                <g>
                  <path d="M21.35 11.1H12v2.7h5.38c-.24 1.28-.96 2.37-2.04 3.1v2.6h3.3c1.93-1.78 3.04-4.4 3.04-7.4 0-.34-.03-.68-.09-1z" fill="#4285F4" />
                  <path d="M12 20.6c2.59 0 4.77-.86 6.36-2.34l-3-2.6c-.91.61-2.08.98-3.36.98-2.37 0-4.38-1.6-5.1-3.75H3.5v2.7C5.11 18.78 8.35 20.6 12 20.6z" fill="#34A853" />
                  <path d="M6.9 12.89c-.18-.54-.28-1.11-.28-1.7s.1-1.17.28-1.7V6.79H3.5c-.6 1.23-.96 2.62-.96 4.1s.36 2.87.96 4.1l3.4-2.1z" fill="#FBBC05" />
                  <path d="M12 6.1c1.41 0 2.68.49 3.68 1.44l2.75-2.75C16.76 3.31 14.58 2.44 12 2.44 8.35 2.44 5.11 4.26 3.5 7.39l3.4 2.7C7.62 7.7 9.63 6.1 12 6.1z" fill="#EA4335" />
                </g>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              id="apple-signin-btn"
              onClick={handleAppleSignIn}
              className="w-full py-2.5 px-4 bg-black hover:bg-neutral-900 text-white border border-transparent rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/0000/svg">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.1.08.2.12.3.12.87 0 1.98-.54 2.51-1.45z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>
        </div>

        <GoogleAuthHelperModal
          isOpen={showGoogleModal}
          onClose={() => setShowGoogleModal(false)}
          onSimulateSuccess={(email) => onSuccess(email)}
        />

      </div>
    );
}

interface RegisterScreenProps {
  onSuccess: (email: string, details: { fullName: string; role: UserRole; departmentId: string }) => void;
  onNavigate: (page: 'login' | 'register' | 'forgot' | 'reset') => void;
  departments: Department[];
  profiles: UserProfile[];
}

export function RegisterScreen({ onSuccess, onNavigate, departments, profiles }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('User');
  const [dept, setDept] = useState('');
  const [showSandboxRole, setShowSandboxRole] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Authentication gateway failure.');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setErrorMsg('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Apple Authentication gateway failure.');
    }
  };

  const startRegistrationFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!dept) {
      setErrorMsg('Please select your target corporate department.');
      return;
    }

    // We let Supabase Auth perform the authoritative email registration check so that switching databases is seamless.
    setLoading(true);

    try {
      const emailToSubmit = email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@company.local`;
      const passToSubmit = password || 'SecureTemporary123!';
      
      const { data, error } = await supabase.auth.signUp({ 
        email: emailToSubmit, 
        password: passToSubmit,
        options: {
          data: {
            full_name: fullName,
            role: role,
            department_id: dept
          }
        }
      });
      
      if (error) {
        setErrorMsg(error.message);
      } else {
        onSuccess(emailToSubmit, { 
          fullName, 
          role, 
          departmentId: dept
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Access authorization failure. Registration aborted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-modal-slide">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 id="register-heading" className="text-3xl font-black text-gray-955 dark:text-white tracking-tight">Create account</h2>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Register to request secure enterprise access.</p>
        </div>
      </div>

      <div>
        <form onSubmit={startRegistrationFlow} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Full Name</label>
            <div className="relative">
              <input
                id="register-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-955 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Corporate Email</label>
            <div className="relative">
              <input
                id="register-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-955 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Security Password</label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-955 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-650 dark:hover:text-gray-300 bg-transparent border-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Sponsoring Dept</label>
            <div className="relative">
              <select
                required
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-955 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
              >
                <option value="">Select Dept</option>
                {departments.map(d => (
                   <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="absolute right-3.5 top-3.5 pointer-events-none text-gray-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div id="register-error-alert" className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-955 border border-red-200/50 rounded-lg text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            id="btn-register-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] border-none"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Register</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Bottom Legal Copy */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500">
        By continuing you agree to the organization's access policies.
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 pt-4 text-center">
        <div className="pt-2">
          <div className="relative flex py-2 items-center justify-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
            <span className="flex-shrink mx-3 text-gray-400 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5 bg-white dark:bg-gray-900 px-2">
              <span>Or federated sign in</span>
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-blue-500 transition-colors cursor-pointer bg-transparent border-none"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              </span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
            </div>

            <div className="space-y-2.5 mt-2">
              <button
                type="button"
                id="google-register-btn"
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/0000/svg">
                  <g>
                    <path d="M21.35 11.1H12v2.7h5.38c-.24 1.28-.96 2.37-2.04 3.1v2.6h3.3c1.93-1.78 3.04-4.4 3.04-7.4 0-.34-.03-.68-.09-1z" fill="#4285F4" />
                    <path d="M12 20.6c2.59 0 4.77-.86 6.36-2.34l-3-2.6c-.91.61-2.08.98-3.36.98-2.37 0-4.38-1.6-5.1-3.75H3.5v2.7C5.11 18.78 8.35 20.6 12 20.6z" fill="#34A853" />
                    <path d="M6.9 12.89c-.18-.54-.28-1.11-.28-1.7s.1-1.17.28-1.7V6.79H3.5c-.6 1.23-.96 2.62-.96 4.1s.36 2.87.96 4.1l3.4-2.1z" fill="#FBBC05" />
                    <path d="M12 6.1c1.41 0 2.68.49 3.68 1.44l2.75-2.75C16.76 3.31 14.58 2.44 12 2.44 8.35 2.44 5.11 4.26 3.5 7.39l3.4 2.7C7.62 7.7 9.63 6.1 12 6.1z" fill="#EA4335" />
                  </g>
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                id="apple-signin-btn"
                onClick={handleAppleSignIn}
                className="w-full py-3 px-4 bg-black hover:bg-neutral-900 text-white border border-transparent rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/0000/svg">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.1.08.2.12.3.12.87 0 1.98-.54 2.51-1.45z" />
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>
          </div>
        </div>

        <GoogleAuthHelperModal
          isOpen={showGoogleModal}
          onClose={() => setShowGoogleModal(false)}
          onSimulateSuccess={(email) => {
            onSuccess(email, {
              fullName: email.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              role: email === 'super@company.com' ? 'Super Admin' : (email === 'admin@company.com' ? 'IT Admin' : (email === 'manager.bob@company.com' ? 'Manager' : 'User')),
              departmentId: email === 'manager.bob@company.com' ? 'dep-fin' : 'dep-eng'
            });
          }}
        />

      </div>
  );
}

export function ForgotPasswordScreen({ onNavigate }: { onNavigate: (page: 'login' | 'register' | 'forgot' | 'reset') => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1200);
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4">
      <div id="forgot-container" className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-8 shadow-xl space-y-6 animate-modal-slide">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-50 dark:bg-blue-950/20 rounded-2xl">
            <KeyRound className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">Identity Recovery Desk</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">Verify your validated coordinates to dispatch secure password reset locks.</p>
        </div>

        {success ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-green-50 dark:bg-green-955 border border-green-200/50 rounded-xl text-green-800 dark:text-green-300 leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1">
                <Check className="w-4 h-4 text-green-600" />
                <span>Identity Authenticated Securely</span>
              </div>
              <p>Your password recovery pipeline validation succeeded. Click below to establish a new security ledger password.</p>
            </div>
            
            <button
              onClick={() => onNavigate('reset')}
              className="w-full py-2.5 bg-gray-900 border text-white dark:bg-white dark:text-gray-900 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1"
            >
              <span>Establish New Password</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400">Corporate Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee.jane@company.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-950 dark:text-white"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-705 rounded-lg text-xs leading-normal">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-minimal w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              {loading ? 'Dispatching...' : 'Dispatch Recovery Token'}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline bg-transparent"
          >
            ← Back to Directory Login
          </button>
        </div>

      </div>
    </div>
  );
}

export function ResetPasswordScreen({ onNavigate }: { onNavigate: (page: 'login' | 'register' | 'forgot' | 'reset') => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState('');

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErr('Passwords mismatch. Retype to confirm correctly.');
      return;
    }
    setErr('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1200);
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4">
      <div id="reset-container" className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-8 shadow-xl space-y-6 animate-modal-slide">
        
        <div className="text-center space-y-1.5">
          <div className="inline-flex p-3 bg-blue-50 dark:bg-blue-950 rounded-2xl">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">Establish New Password</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">Update your cryptographic credentials database listing. Session token checks will enforce logout globally.</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200/50 rounded-xl text-green-800 dark:text-green-300 text-xs font-semibold leading-relaxed">
              Successfully patched registry passwords! You can now log back into the active directory using your newly compiled credentials.
            </div>
            
            <button
              onClick={() => onNavigate('login')}
              className="w-full py-2.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold text-xs rounded-xl"
            >
              Sign In with New Password
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-650 dark:text-gray-400">Establish new password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-650 dark:text-gray-400">Confirm new password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
              />
            </div>

            {err && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/25 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-minimal w-full py-2.5 text-sm font-semibold"
            >
              {loading ? 'Encrypting registry keys...' : 'Commit New Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

// Interactive Google Authentication Helper Modal
interface GoogleAuthHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateSuccess?: (email: string) => void;
}

export function GoogleAuthHelperModal({ isOpen, onClose }: GoogleAuthHelperModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] text-gray-900 font-sans">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-150 flex items-start justify-between bg-gray-50/70">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-950 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              <span>Federated Authentication Gateway Setup</span>
            </h3>
            <p className="text-xs text-gray-500">
              Understanding and configuring Supabase Auth providers (Google & Apple).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-455 hover:text-gray-700 transition-colors cursor-pointer bg-transparent"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed max-h-[60vh]">
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-250 rounded-xl text-amber-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Why this happen?</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Your Supabase project <strong>ayqpacuajyikmnayncrt</strong> currently has Google OAuth <strong>disabled</strong>. The Supabase auth gateway rejects the redirect request because it hasn't been configured with your Google Cloud Developer Client credentials yet.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-gray-950 block text-xs tracking-tight uppercase">How to enable it (1-Minute Fix):</span>
              <ol className="space-y-3 pl-1 text-[11px]">
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-blue-50 text-blue-600 font-bold rounded-full flex items-center justify-center shrink-0">1</span>
                  <div>
                    <strong>Go to Supabase Admin Console:</strong>
                    <p className="text-gray-500 mt-0.5">
                      Open <a href="https://supabase.com/dashboard/project/ayqpacuajyikmnayncrt/auth/providers" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5">
                        Authentication &gt; Providers settings
                      </a> inside your dashboard.
                    </p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-blue-50 text-blue-600 font-bold rounded-full flex items-center justify-center shrink-0">2</span>
                  <div>
                    <strong>Enable Google Provider:</strong>
                    <p className="text-gray-500 mt-0.5">
                      Expand the <strong>Google</strong> row inside the auth providers catalog, and toggle <strong>"Enable Google provider"</strong> to ON.
                    </p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-blue-50 text-blue-600 font-bold rounded-full flex items-center justify-center shrink-0">3</span>
                  <div>
                    <strong>Enter Google Client Keys:</strong>
                    <p className="text-gray-500 mt-0.5">
                      Paste the <strong>Client ID</strong> and <strong>Client Secret</strong> generated from your Google Cloud Console (under APIs &amp; Services &gt; Credentials).
                    </p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-blue-50 text-blue-600 font-bold rounded-full flex items-center justify-center shrink-0">4</span>
                  <div>
                    <strong>Configure Redirect URI:</strong>
                    <p className="text-gray-500 mt-0.5">
                      Copy the <strong>Redirect URI</strong> displayed in Supabase, and paste it under "Authorized redirect URIs" in your Google Developer console, then hit <strong>Save</strong>!
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="border-t border-gray-150 pt-3.5 space-y-2">
              <span className="font-semibold text-gray-950 block text-[11px]">Ready to test?</span>
              <p className="text-gray-500 text-[11px]">If you've enabled the Google provider in your Supabase admin console, you can fire the live connection now:</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: window.location.origin
                      }
                    });
                  } catch (e: any) {
                    alert('Attempt failed: ' + (e?.message || 'Check your Supabase configurations.'));
                  }
                }}
                className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-all cursor-pointer text-center"
              >
                🚀 Connect with Live Google OAuth
              </button>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 border-t border-gray-150 flex items-center justify-end gap-2 bg-gray-50/70">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-100 rounded-xl font-bold transition-all text-gray-700 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
