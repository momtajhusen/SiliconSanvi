import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import BrandLogo from '../../components/brand/BrandLogo';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { FormBanner } from '../../components/ui/FormBanner';
import { useAuth } from '../../hooks/useAuth';
import api, { apiError } from '../../lib/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(() =>
    new URLSearchParams(location.search).get('expired') ? 'Your session expired. Please sign in again.' : ''
  );
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const redirectTo = location.state?.from || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  const onSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!EMAIL_PATTERN.test(email)) nextErrors.email = 'Enter a valid email';
    if (!password) nextErrors.password = 'Enter your password';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setFormError('Please fix the highlighted fields.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/login', { email: email.trim(), password });
      login(data);
      toast.success(`Signed in as ${data.user.name}`);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(apiError(error, 'Could not sign in.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="relative rounded-[1.75rem] bg-gradient-to-br from-blue-950 via-blue-700 to-blue-600 p-[1.5px] shadow-[0_28px_70px_-24px_rgba(13,92,69,0.55)]">
        <div className="relative overflow-hidden rounded-[1.65rem] bg-white px-7 pb-8 pt-10 sm:px-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-100/80 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-blue-100/70 blur-2xl" />

          <div className="relative mb-7 text-center">
            <span className="mkt-brand-mark mx-auto mb-4 rounded-2xl">
              <BrandLogo className="relative h-16 w-16" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[1.9rem]">
              Welcome <span className="mkt-gradient-text">back</span>
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">Sign in to the Silicon &amp; Sanvi staff portal.</p>
          </div>

          <form onSubmit={onSubmit} className="relative space-y-4" noValidate>
            {formError && (
              <FormBanner tone="error" title="Could not sign in">
                {formError}
              </FormBanner>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                iconLeft={<Mail className="h-4 w-4" />}
                className="mkt-field h-12 rounded-xl bg-slate-50"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={errors.email}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                iconLeft={<Lock className="h-4 w-4" />}
                className="mkt-field h-12 rounded-xl bg-slate-50 pr-12"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-1.5 top-[1.875rem] flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-500">
                <input type="checkbox" className="rounded border-slate-300" />
                Remember me
              </label>
            </div>
            <Button type="submit" disabled={submitting} className="mkt-cta-solid group h-12 w-full gap-2 rounded-full bg-gradient-to-r from-blue-900 to-blue-700 text-sm font-semibold shadow-lg shadow-blue-700/25 hover:from-blue-950 hover:to-blue-800">
              {submitting ? 'Signing in…' : 'Sign in'}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </form>

          <p className="relative mt-6 flex items-start justify-center gap-1.5 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
            Staff access only. Ask the administrator if you need an account.
          </p>
        </div>
      </div>
    </div>
  );
}
