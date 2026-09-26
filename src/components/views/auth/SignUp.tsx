'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, ApiError, configApi, session } from '@/lib/api';
import { EarlyAccessForm } from '@/components/marketing/EarlyAccessForm';
import {
  AuthCard,
  FormError,
  fieldClass,
  labelClass,
  primaryButtonClass } from
'@/components/auth/AuthLayout';

const signInLink =
<>
    Already have an account?{' '}
    <Link href="/signin" className="font-medium text-brand-700 hover:text-brand-500">
      Sign in
    </Link>
  </>;


/**
 * "Create an account". While early-access mode is on (an admin setting read
 * from the API), this shows the early-access form instead. Registration itself
 * stays open, so with the mode off the normal flow works end to end.
 */
export function SignUp() {
  const router = useRouter();
  const [mode, setMode] = useState<'loading' | 'early-access' | 'open'>('loading');

  useEffect(() => {
    if (session.isSignedIn()) {
      router.replace('/app');
      return;
    }
    configApi.get().
    then((c) => setMode(c.early_access ? 'early-access' : 'open')).
    // If the setting cannot be read, the site is in early access.
    catch(() => setMode('early-access'));
  }, [router]);

  if (mode === 'loading') {
    return (
      <div className="rounded-xl border border-line bg-panel p-8 text-center text-[13px] text-ink-500 shadow-panel">
        Loading…
      </div>);

  }

  if (mode === 'early-access') {
    return (
      <AuthCard
        title="DutyCaptain is in early access"
        lede="We are opening accounts in stages. Tell us the task you would hand over first and we will reply within one business day."
        footer={signInLink}>
        
        <EarlyAccessForm source="/signup" framed={false} />
      </AuthCard>);

  }

  return <OpenSignUp />;
}

function OpenSignUp() {
  const router = useRouter();
  const [form, setForm] = useState({ first: '', last: '', email: '', password: '', agree: false });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
  setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      setError('Choose a password of at least 8 characters.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await auth.register({
        email: form.email.trim(),
        password: form.password,
        first_name: form.first.trim(),
        last_name: form.last.trim()
      });
      router.replace('/app');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach DutyCaptain. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      lede="Describe a task, and DutyCaptain plans it, does it, and checks the result."
      footer={signInLink}>
      
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first" className={labelClass}>First name</label>
            <input id="first" required autoComplete="given-name" value={form.first}
            onChange={set('first')} className={`mt-1.5 ${fieldClass}`} />
          </div>
          <div>
            <label htmlFor="last" className={labelClass}>Last name</label>
            <input id="last" required autoComplete="family-name" value={form.last}
            onChange={set('last')} className={`mt-1.5 ${fieldClass}`} />
          </div>
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" type="email" required autoComplete="email" value={form.email}
          onChange={set('email')} className={`mt-1.5 ${fieldClass}`} />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <input id="password" type="password" required minLength={8} autoComplete="new-password"
          value={form.password} onChange={set('password')} className={`mt-1.5 ${fieldClass}`} />
          <p className="mt-1 text-[11px] text-ink-500">At least 8 characters.</p>
        </div>
        <label htmlFor="agree" className="flex items-start gap-2.5 text-[12px] leading-relaxed text-ink-700">
          <input id="agree" type="checkbox" required checked={form.agree} onChange={set('agree')}
          className="mt-0.5 h-3.5 w-3.5 accent-brand-600" />
          <span>
            I agree to the{' '}
            <Link href="/terms" target="_blank" className="text-brand-700 underline">Terms of use</Link>
            {' '}and{' '}
            <Link href="/privacy" target="_blank" className="text-brand-700 underline">Privacy policy</Link>.
          </span>
        </label>

        <FormError message={error} />

        <button type="submit" disabled={busy || !form.agree} className={primaryButtonClass}>
          {busy ? 'Creating your account…' : 'Create account'}
        </button>
      </form>
    </AuthCard>);

}
