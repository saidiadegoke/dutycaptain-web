'use client';

import { useEffect, useState } from 'react';
import { MailIcon, XIcon } from 'lucide-react';
import { ApiError, auth, session } from '@/lib/api';
import type { SessionUser } from '@/lib/types';

const DISMISS_KEY = 'dc.verify-email-dismissed';

/**
 * Asks an account to confirm its email. DutyCaptain emails only verified
 * addresses (a task waiting for you, an approval, your computer), so an
 * unconfirmed address means those emails never arrive.
 */
export function VerifyEmailBanner({ user }: {user: SessionUser | null;}) {
  const [stage, setStage] = useState<'idle' | 'sent' | 'done'>('idle');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!user || !user.email || user.email_verified !== false || dismissed || stage === 'done') return null;

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const out = await auth.sendEmailCode();
      if (out.already_verified) {
        const token = session.accessToken();
        if (token) session.save(token, null, { ...user!, email_verified: true });
        setStage('done');
      } else {
        setSentTo(out.sent_to);
        setStage('sent');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the code.');
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await auth.confirmEmailCode(code.trim());
      setStage('done');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That code did not work.');
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode: dismissed for this page view only */
    }
    setDismissed(true);
  }

  return (
    <div className="border-b border-warn-100 bg-warn-50 px-5 py-2.5 lg:px-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-warn-700">
        <MailIcon className="h-4 w-4 shrink-0" strokeWidth={2} />
        {stage === 'idle' ?
        <>
            <span className="min-w-0 flex-1">
              Confirm your email so DutyCaptain can tell you when a task needs you.
            </span>
            <button type="button" onClick={send} disabled={busy}
          className="rounded-md bg-warn-700 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-warn-600 disabled:opacity-60">
              {busy ? 'Sending…' : 'Send a code'}
            </button>
          </> :

        <form onSubmit={confirm} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span>Enter the 6-digit code sent to {sentTo}:</span>
            <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="Verification code"
            className="w-24 rounded-md border border-warn-100 bg-white px-2 py-1 text-center font-mono text-[13px] tracking-widest text-ink-900 focus:outline-none" />
          
            <button type="submit" disabled={busy || code.length !== 6}
          className="rounded-md bg-warn-700 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-warn-600 disabled:opacity-60">
              {busy ? 'Checking…' : 'Confirm'}
            </button>
            <button type="button" onClick={send} disabled={busy} className="text-[12px] underline">Send again</button>
          </form>
        }
        {error && <span role="alert" className="basis-full text-danger-700">{error}</span>}
        <button type="button" onClick={dismiss} aria-label="Not now" className="rounded p-1 hover:bg-warn-100">
          <XIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>
      </div>
    </div>);

}
