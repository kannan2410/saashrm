import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Building2, Mail, Lock, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const { login, sendOtp, verifyOtpAndSignup, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        if (otpSent) {
          await verifyOtpAndSignup(email, otp);
          navigate('/dashboard');
        } else {
          await sendOtp(companyName, fullName, email, password);
          setOtpSent(true);
          setCooldown(60);
        }
      } else {
        await login(email, password);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (isSignUp ? (otpSent ? 'Verification failed' : 'Failed to send OTP') : 'Login failed');
      setError(message);
    }
  };

  const handleResendOtp = useCallback(async () => {
    if (cooldown > 0) return;
    setError('');
    try {
      await sendOtp(companyName, fullName, email, password);
      setCooldown(60);
      setOtp('');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to resend OTP';
      setError(message);
    }
  }, [cooldown, companyName, fullName, email, password, sendOtp]);

  const handleBackToForm = () => {
    setOtpSent(false);
    setOtp('');
    setError('');
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setOtpSent(false);
    setOtp('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-4">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-content-primary">SaaS HRM</h1>
          <p className="text-sm text-content-muted mt-1">
            {isSignUp
              ? (otpSent ? 'Enter the verification code sent to your email' : 'Create your company account')
              : 'Sign in to your account'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-surface-card rounded-2xl shadow-card border border-surface-border p-8">
          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-red-200 rounded-xl text-sm text-danger-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && otpSent ? (
              <>
                <div>
                  <label className="label">Verification Code</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input-field pl-10 text-center text-lg tracking-[0.5em]"
                      placeholder="000000"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-xs text-content-muted">
                    Code sent to <span className="font-medium text-content-secondary">{email}</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="btn-primary w-full"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                </button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBackToForm}
                    className="inline-flex items-center gap-1 text-sm text-content-muted hover:text-content-secondary transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || isLoading}
                    className="text-sm text-primary-600 hover:text-primary-700 transition-colors disabled:text-content-muted disabled:cursor-not-allowed"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {isSignUp && (
                  <>
                    <div>
                      <label className="label">Company Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="input-field pl-10"
                          placeholder="Your company name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="input-field pl-10"
                          placeholder="Your full name"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder={isSignUp ? 'Min 6 characters' : 'Enter your password'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full"
                >
                  {isLoading
                    ? (isSignUp ? 'Sending OTP...' : 'Signing in...')
                    : (isSignUp ? 'Send Verification Code' : 'Sign In')}
                </button>
              </>
            )}
          </form>

          {!otpSent && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-content-muted mt-6">
          SaaS HRM Platform &middot; Enterprise Edition
        </p>
      </div>
    </div>
  );
}
