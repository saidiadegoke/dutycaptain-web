'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, ApiError, session } from '@/lib/api';
import {
  AuthCard,
  FormError,
  fieldClass,
  labelClass,
  primaryButtonClass,
  safeNext } from
'@/components/auth/AuthLayout';

export function SignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const justReset = params.get('reset') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in: there is nothing to do here.
  useEffect(() => {
    if (session.isSignedIn()) router.replace(next);
  }, [next, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await auth.signIn(email.trim(), password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach DutyCaptain. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      lede="Welcome back. Sign in to see your tasks, approvals and computers."
      footer={
      <>
          No account yet?{' '}
          <Link href="/signup" className="font-medium text-brand-700 hover:text-brand-500">
            Create one
          </Link>
        </>
      }>
      
      {justReset &&
      <p className="mb-4 rounded-md border border-ok-100 bg-ok-50 px-3 py-2 text-[12px] leading-relaxed text-ok-700">
          Your password has been changed. Sign in with the new one.
        </p>
      }
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1.5 ${fieldClass}`} />
          
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className={labelClass}>Password</label>
            <Link href="/forgot-password" className="text-[12px] text-brand-700 hover:text-brand-500">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-1.5 ${fieldClass}`} />
          
        </div>

        <FormError message={error} />

        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthCard>);

}
