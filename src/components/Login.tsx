import React, { useState, useRef } from 'react';
import { Shield, Key, Lock, AlertCircle, Phone, ArrowLeft, Send, CheckCircle2, RefreshCw } from 'lucide-react';
import { User } from '../types';
import { DB } from '../db/storage';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  // Login modes: 'phone' or 'password'
  const [loginMode, setLoginMode] = useState<'phone' | 'password'>('phone');
  
  // Username/password form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone/OTP form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpStep, setOtpStep] = useState<'send' | 'verify'>('send');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // SMS Notification box simulation state
  const [simulatedSms, setSimulatedSms] = useState<{
    phone: string;
    otp: string;
    name: string;
    role: string;
  } | null>(null);

  // Focus refs for 6 OTP input boxes
  const otpRefs = useRef<HTMLInputElement[]>([]);

  // Password Reset Modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Predefined phone logins list for validation & developer ease
  const PRESET_PHONES = [
    { name: 'Ms E.T Luthuli', role: 'Principal', phone: '+27739990099' },
    { name: 'Mr M.S Shange (Admin)', role: 'Administrator', phone: '0739990099' },
    { name: 'Ms E.T Luthuli', role: 'Principal', phone: '+27823456789' },
    { name: 'Sibusiso Khumalo', role: 'Administrator', phone: '+27821111111' },
    { name: 'Sarah Botha', role: 'Bursar/Cashier', phone: '+27822222222' },
    { name: 'Zanele Mthembu', role: 'Teacher', phone: '+27823333333' }
  ];

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username || !password) {
      setError('Please fill in both credential fields.');
      return;
    }

    setLoading(true);
    try {
      const user = await DB.login(username, password);
      setLoading(false);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Verification failed. Invalid username or security password.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Authentication pipeline run failed. Is the backend offline?');
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setSimulatedSms(null);
    
    if (!phoneNumber) {
      setError('Please submit a phone number.');
      return;
    }

    // Normalise phone number to check validity locally
    const normPhone = phoneNumber.replace(/[\s\-\+]/g, '');
    if (normPhone.length < 8) {
      setError('Please provide a valid phone number (e.g. +27 82 345 6789).');
      return;
    }

    setLoading(true);
    try {
      const res = await DB.sendOtp(phoneNumber);
      setLoading(false);
      if (res.success) {
        const matchingStaff = PRESET_PHONES.find(
          p => p.phone.replace(/[\s\-\+]/g, '') === normPhone
        ) || { name: 'Staff Member', role: 'Staff' };

        setSimulatedSms({
          phone: phoneNumber,
          otp: res.otp || '112233',
          name: matchingStaff.name,
          role: matchingStaff.role
        });

        setSuccess(`A 6-digit confirmation code has been dispatched to ${phoneNumber}.`);
        setOtpStep('verify');
        setOtpDigits(Array(6).fill(''));
        
        // Focus first OTP box on layout repaint
        setTimeout(() => {
          if (otpRefs.current[0]) otpRefs.current[0].focus();
        }, 150);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Failed to dispatch phone verification passcode.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const otpCode = otpDigits.join('');
    if (otpCode.length < 6) {
      setError('Please input the entire 6-digit verification security passcode.');
      return;
    }

    setLoading(true);
    try {
      const user = await DB.verifyOtp(phoneNumber, otpCode);
      setLoading(false);
      if (user) {
        setSimulatedSms(null);
        onLoginSuccess(user);
      } else {
        setError('Verification rejected. Invalid passcode.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Verification rejected. Please review code.');
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    if (/[^0-9]/.test(val) && val !== '') return;
    
    const nextDigits = [...otpDigits];
    nextDigits[index] = val.substring(val.length - 1);
    setOtpDigits(nextDigits);

    // Auto focus next box
    if (val !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otpDigits[index] === '' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleQuickOtpLogin = (phone: string) => {
    setPhoneNumber(phone);
    setLoginMode('phone');
    setOtpStep('send');
    setError('');
    setSuccess('');
    
    // Auto-fire send OTP
    setTimeout(() => {
      const fakeBtn = document.getElementById('btn-get-otp');
      if (fakeBtn) fakeBtn.click();
    }, 100);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUsername) {
      setError('Please provide your username or email address.');
      return;
    }
    setResetLoading(true);
    setTimeout(() => {
      setResetLoading(false);
      setResetMessage(`A password reset authorization link has been simulated & registered in the audit logs for "${resetUsername}".`);
      DB.log('Password Reset Requested', `Reset requested for username: ${resetUsername}`);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-slate-950 transition-colors duration-300">
      
      {/* GLOBAL SMS GATEWAY SIMULATION CARDS */}
      {simulatedSms && (
        <div className="w-full max-w-md mb-4 bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 rounded-xl p-4 shadow-md text-slate-800 dark:text-amber-200 text-xs flex flex-col gap-2.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
          <div className="flex items-center justify-between pl-2">
            <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-amber-800 dark:text-amber-400">
              <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-500 animate-pulse" />
              Simulated SMS Gateway Center
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/40 text-amber-900 font-bold">Secure Delivery</span>
          </div>
          <div className="pl-2 space-y-1 bg-white/60 dark:bg-slate-900/30 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/40">
            <p className="font-semibold text-[11px]">
              Recipient: <span className="text-amber-900 dark:text-amber-300 font-bold">{simulatedSms.name}</span> ({simulatedSms.role})
            </p>
            <p className="font-semibold text-[11px]">
              Phone: <span className="font-mono text-slate-900 dark:text-slate-200">{simulatedSms.phone}</span>
            </p>
            <p className="text-slate-600 dark:text-slate-350 pt-1 border-t border-amber-200/40 mt-1">
              "Your Blooming Kids ECD Fee Portal secure access code is:{' '}
              <span className="font-bold font-mono text-xs text-brand-red bg-brand-red/10 px-2 py-0.5 rounded ml-1 animate-bounce inline-block">
                {simulatedSms.otp}
              </span>"
            </p>
          </div>
          <button
            onClick={() => {
              const digits = simulatedSms.otp.split('');
              setOtpDigits(digits);
              setSuccess('Simulated OTP copied directly into entry fields!');
            }}
            className="self-end text-[10px] font-bold text-amber-800 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer bg-amber-200/35 hover:bg-amber-200/60 px-2.5 py-1 rounded transition"
          >
            Auto-Fill OTP Digits
          </button>
        </div>
      )}

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 animate-fade-in">
        
        {/* LOGO AREA */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
            <svg className="h-10 w-10 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0a5 5 0 00-5 5v3a5 5 0 005-5zm0 0a5 5 0 015 5v3a5 5 0 01-5-5z" />
            </svg>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Blooming Kids
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-red mt-0.5">
            ECD Learning Centre
          </p>
          <p className="text-xs text-slate-500 mt-1 font-semibold dark:text-slate-400">
            Secure Fee Management Portal
          </p>
        </div>

        {/* SECURE DUAL MODE AUTHENTICATION TAB SELECTOR */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-6 text-xs font-bold">
          <button
            onClick={() => {
              setLoginMode('phone');
              setError('');
              setSuccess('');
            }}
            className={`py-2 rounded-md transition ${
              loginMode === 'phone'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Phone Number OTP
          </button>
          <button
            onClick={() => {
              setLoginMode('password');
              setError('');
              setSuccess('');
            }}
            className={`py-2 rounded-md transition ${
              loginMode === 'password'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Credential Username
          </button>
        </div>

        {/* FEEDBACK STATUS */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400 animate-pulse">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="leading-tight font-medium">{success}</span>
          </div>
        )}

        {/* AUTH FORMS CONTAINER */}
        {loginMode === 'phone' ? (
          <div>
            {otpStep === 'send' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Enter Registered Phone Number
                    </label>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">e.g. +27823456789</span>
                  </div>
                  
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-xs text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono"
                      placeholder="+27823456789"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-get-otp"
                  disabled={loading}
                  className="w-full rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-white py-2.5 px-4 text-xs font-bold shadow hover:shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Analyzing Records...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Generate and Send SMS OTP
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 font-sans">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep('send');
                        setSimulatedSms(null);
                        setError('');
                        setSuccess('');
                      }}
                      className="text-xs text-brand-blue hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Change phone number
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Resend SMS
                    </button>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center leading-relaxed">
                    Enter the 6-digit confirmation code code sent to{' '}
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{phoneNumber}</span>
                  </p>

                  {/* 6 BOX OTP ENTRANCE */}
                  <div className="flex items-center justify-center gap-2 py-2">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => { if (el) otpRefs.current[index] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpDigitChange(index, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(index, e)}
                        className="w-10 h-12 text-center text-lg font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30 focus:outline-none"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-white py-2.5 px-4 text-xs font-bold shadow hover:shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer mt-4"
                >
                  {loading ? 'Validating Authenticity...' : 'Confirm & Access Workspace'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Username Identifier
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Shield className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-xs text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Security Password
                </label>
                <button
                  type="button"
                  onClick={() => { setShowResetModal(true); setResetMessage(''); }}
                  className="text-[11px] text-brand-blue hover:underline font-bold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-xs text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-white py-2.5 px-4 text-xs font-semibold shadow hover:shadow-md transition-all active:scale-98 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In Now'}
            </button>
          </form>
        )}

        {/* DEMO ACCOUNTS HELPER */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2.5 flex items-center justify-between">
            <span>Direct Authenticator Panel:</span>
            <span className="text-[10px] text-brand-blue animate-pulse">Test Click Below</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <button
              onClick={() => handleQuickOtpLogin('+27739990099')}
              className="flex flex-col p-2.5 text-left bg-gradient-to-br from-amber-50 to-amber-50/20 dark:from-amber-950/20 dark:to-transparent border border-amber-200/50 dark:border-amber-900/30 rounded-lg hover:border-amber-400/80 transition cursor-pointer"
            >
              <span className="font-bold text-amber-900 dark:text-amber-300">Ms E.T Luthuli</span>
              <span className="text-slate-500 text-[9px] mt-0.5 font-semibold">Principal Role</span>
              <span className="text-brand-red text-[8.5px] font-mono mt-1 font-bold">OTP: +27 73 999 0099</span>
            </button>
            <button
              onClick={() => handleQuickOtpLogin('+27821111111')}
              className="flex flex-col p-2.5 text-left bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-brand-blue/40 transition cursor-pointer"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200">Sibusiso Khumalo</span>
              <span className="text-slate-500 text-[9px] mt-0.5 font-semibold">Administrator Role</span>
              <span className="text-slate-600 text-[8.5px] font-mono mt-1 font-bold">OTP: +27 82 111 1111</span>
            </button>
            <button
              onClick={() => handleQuickOtpLogin('+27822222222')}
              className="flex flex-col p-2.5 text-left bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-brand-blue/40 transition cursor-pointer"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200">Sarah Botha</span>
              <span className="text-slate-500 text-[9px] mt-0.5 font-semibold">Bursar / Cashier Role</span>
              <span className="text-slate-600 text-[8.5px] font-mono mt-1 font-bold">OTP: +27 82 222 2222</span>
            </button>
            <button
              onClick={() => handleQuickOtpLogin('+27823333333')}
              className="flex flex-col p-2.5 text-left bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-brand-blue/40 transition cursor-pointer"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200">Zanele Mthembu</span>
              <span className="text-slate-500 text-[9px] mt-0.5 font-semibold">Teacher (View Only)</span>
              <span className="text-slate-600 text-[8.5px] font-mono mt-1 font-bold">OTP: +27 82 333 3333</span>
            </button>
          </div>

          <div className="mt-3.5 text-center text-[10px] text-slate-400 dark:text-slate-500 italic leading-tight select-none">
            Clicking any card triggers dispatch, prints OTP key details above to copy, and focuses verification cells.
          </div>
        </div>

      </div>

      {/* PASSWORD RESET MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-brand-red" />
              Reset Account Access Password
            </h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Submit your staff username details and we will register an access ticket on the secure server.
            </p>

            <form onSubmit={handlePasswordReset} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username Identifier
                </label>
                <input
                  type="text"
                  required
                  value={resetUsername}
                  onChange={e => setResetUsername(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 px-3 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-brand-blue focus:outline-none"
                  placeholder="e.g. principal"
                />
              </div>

              {resetMessage && (
                <p className="bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-[11px] p-2.5 rounded leading-tight">
                  {resetMessage}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="rounded px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="rounded bg-brand-blue text-white px-3 py-1.5 shadow hover:bg-brand-blue/90 disabled:opacity-50 cursor-pointer"
                >
                  {resetLoading ? 'Authorizing...' : 'Request Validation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
