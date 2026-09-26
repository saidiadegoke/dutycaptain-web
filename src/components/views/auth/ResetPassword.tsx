'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, ApiError } from '@/lib/api';
import {
  AuthCard,
  FormError,
  fieldClass,
  labelClass,
  primaryButtonClass } from
'@/components/auth/AuthLayout';

/** Reached from the emailed link: `/reset-password?token=…`. */
export function ResetPassword() {
  const router = useRouter();
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <AuthCard
        title="This link is incomplete"
        lede="Password reset links come by email. Request a new one and use the link exactly as it arrives."
        footer={
        <Link href="/signin" className="font-medium text-brand-700 hover:text-brand-500">Back to sign in</Link>
        }>
        
        <Link href="/forgot-password" className={`block text-center ${primaryButtonClass}`}>
          Request a new link
        </Link>
      </AuthCard>);

  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError('Choose a password of at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setError(null);
    setBusy(true);
    try {
      await auth.resetPassword(token, password);
      router.replace('/signin?reset=1');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach DutyCaptain. Please try again.');
    } finally {
      setBusy(false);
    }
    return undefined;
  }

  const expired = error && /expired|already been used|invalid/i.test(error);

  return (
    <AuthCard
      title="Choose a new password"
      lede="Pick something you have not used here before."
      footer={
      <Link href="/signin" className="font-medium text-brand-700 hover:text-brand-500">Back to sign in</Link>
      }>
      
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="password" className={labelClass}>New password</label>
          <input id="password" type="password" required minLength={8} autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)} className={`mt-1.5 ${fieldClass}`} />
          <p className="mt-1 text-[11px] text-ink-500">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="confirm" className={labelClass}>Confirm new password</label>
          <input id="confirm" type="password" required autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`mt-1.5 ${fieldClass}`} />
        </div>

        <FormError message={error} />
        {expired &&
        <p className="text-[12px] text-ink-700">
            <Link href="/forgot-password" className="font-medium text-brand-700 hover:text-brand-500">
              Request a new link
            </Link>
          </p>
        }

        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </AuthCard>);

}
