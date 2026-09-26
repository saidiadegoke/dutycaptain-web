'use client';

import { useState } from 'react';
import Link from 'next/link';
import { auth, ApiError } from '@/lib/api';
import {
  AuthCard,
  FormError,
  fieldClass,
  labelClass,
  primaryButtonClass } from
'@/components/auth/AuthLayout';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await auth.forgotPassword(email.trim());
      setSentTo(res.data?.masked_recipient || email.trim());
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429 ?
        'Too many attempts. Please wait a few minutes and try again.' :
        err instanceof ApiError ? err.message : 'Could not reach DutyCaptain. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  const back =
  <Link href="/signin" className="font-medium text-brand-700 hover:text-brand-500">
      Back to sign in
    </Link>;


  if (sentTo) {
    return (
      <AuthCard
        title="Check your email"
        lede={
        <>
            If an account exists for <span className="font-medium text-ink-900">{sentTo}</span>, we
            have sent a link to reset its password. The link works once and expires in 15 minutes.
          </>
        }
        footer={back}>
        
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className="w-full rounded-md border border-line px-3 py-2.5 text-[13px] font-medium text-ink-900 transition-colors duration-150 ease-out hover:bg-canvas">
          
          Use a different email
        </button>
      </AuthCard>);

  }

  return (
    <AuthCard
      title="Reset your password"
      lede="Enter the email you signed up with and we will send you a link to choose a new password."
      footer={back}>
      
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" type="email" required autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} className={`mt-1.5 ${fieldClass}`} />
        </div>
        <FormError message={error} />
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthCard>);

}
