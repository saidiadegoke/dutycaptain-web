'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, ApiError } from '@/lib/api';

/**
 * Sign in (P1-15).
 *
 * The console had no authentication at all — it never needed any, because it
 * never called anything. Every task endpoint is scoped to the caller, so a
 * client without a session can do nothing, and a sign-in is part of wiring the
 * app up rather than a separate feature.
 *
 * Register is on the same screen deliberately: this is a single-user product
 * until P7-01 adds accounts and invitations, so "sign up" and "sign in" are the
 * same moment for the first person to open it.
 */
export function SignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/app/tasks';

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        await auth.signIn(identifier.trim(), password);
      } else {
        await auth.register({
          email: identifier.trim(), password, first_name: firstName.trim(), last_name: lastName.trim()
        });
      }
      router.replace(next);
    } catch (err) {
      // The API's own message is more useful than anything invented here — it
      // distinguishes a wrong password from an unverified email from a
      // password that fails the policy.
      setError(err instanceof ApiError ? err.message : 'Could not reach the API.');
    } finally {
      setBusy(false);
    }
  }

  const field =
  'w-full rounded-md border border-line bg-panel px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none';

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[420px] flex-col justify-center">
      <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">
        {mode === 'signin' ? 'Sign in' : 'Create an account'}
      </h1>
      <p className="mt-1 text-[13px] text-ink-500">
        {mode === 'signin' ?
        'The console talks to your DutyCaptain runtime.' :
        'The first account on this runtime.'}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        {mode === 'register' &&
        <div className="flex gap-3">
            <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            aria-label="First name"
            required
            className={field} />
          
            <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            aria-label="Last name"
            required
            className={field} />
          
          </div>
        }
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Email"
          aria-label="Email"
          type="email"
          autoComplete="username"
          required
          className={field} />
        
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          aria-label="Password"
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          required
          className={field} />
        

        {error &&
        <p role="alert" className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">
            {error}
          </p>
        }

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500 disabled:opacity-60">
          
          {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => { setMode(mode === 'signin' ? 'register' : 'signin'); setError(null); }}
        className="mt-4 text-[12px] text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline">
        
        {mode === 'signin' ? 'No account yet? Create one' : 'Already have an account? Sign in'}
      </button>
    </div>);

}
