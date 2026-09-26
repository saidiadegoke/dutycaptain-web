'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from 'lucide-react';
import { ApiError, earlyAccessApi } from '@/lib/api';
import { CONTACT_EMAIL } from '@/lib/seo';

/**
 * The early-access request form. Used on the Company page and, while
 * early-access mode is on, in place of the sign-up form.
 */
export function EarlyAccessForm({ source = '/company', framed = true }: {source?: string;framed?: boolean;}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', company: '', task: '', website: '' });

  const valid = form.name.trim() !== '' && form.email.includes('@') && form.task.trim() !== '';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    setError(null);
    try {
      await earlyAccessApi.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim() || undefined,
        task: form.task.trim(),
        source,
        website: form.website || undefined
      });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429 ?
        'Too many requests from this connection. Please try again in a few minutes.' :
        err instanceof ApiError && err.status === 422 ?
        (Array.isArray(err.details) && (err.details[0] as {msg?: string;})?.msg) || err.message :
        `Your request could not be sent. Please try again, or email us at ${CONTACT_EMAIL}.`
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
          {sent ?
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-xl border border-ok-100 bg-ok-50 p-6">
      
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ok-600">
          <CheckIcon className="h-4 w-4 text-white" strokeWidth={3} />
        </span>
        <h3 className="mt-4 text-[16px] font-semibold tracking-tight text-ok-700">
          Request received
        </h3>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ok-700">
          We will reply within one business day with two times and a short list of questions
          about the process you described.
        </p>
      </motion.div> :

    <form
      onSubmit={submit}
      className={framed ? 'relative rounded-xl border border-line bg-panel p-6 shadow-panel' : 'relative'}>
      
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-[12px] font-medium text-ink-900">
              Name
            </label>
            <input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1.5 w-full rounded-md border border-line bg-canvas px-3 py-2 text-[13px] text-ink-900 focus:border-brand-500 focus:bg-panel focus:outline-none"
            placeholder="Adaeze Bello" />
          
          </div>
          <div>
            <label htmlFor="email" className="block text-[12px] font-medium text-ink-900">
              Work email
            </label>
            <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1.5 w-full rounded-md border border-line bg-canvas px-3 py-2 text-[13px] text-ink-900 focus:border-brand-500 focus:bg-panel focus:outline-none"
            placeholder="you@company.com" />
          
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="company" className="block text-[12px] font-medium text-ink-900">
            Company
          </label>
          <input
          id="company"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          className="mt-1.5 w-full rounded-md border border-line bg-canvas px-3 py-2 text-[13px] text-ink-900 focus:border-brand-500 focus:bg-panel focus:outline-none"
          placeholder="Your company, if any" />
        
        </div>

        <div className="mt-4">
          <label htmlFor="task" className="block text-[12px] font-medium text-ink-900">
            The task you would hand over first
          </label>
          <textarea
          id="task"
          rows={4}
          value={form.task}
          onChange={(e) => setForm({ ...form, task: e.target.value })}
          className="mt-1.5 w-full resize-none rounded-md border border-line bg-canvas px-3 py-2 text-[13px] leading-relaxed text-ink-900 focus:border-brand-500 focus:bg-panel focus:outline-none"
          placeholder="e.g. preparing the monthly sales report from our online store and emailing it to our accountant" />
        
        </div>

        {/* Honeypot: hidden from people and from screen readers. */}
        <div aria-hidden="true" className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input
          id="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })} />
        
        </div>

        {error &&
      <p role="alert" className="mt-4 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] leading-relaxed text-danger-700">
            {error}
          </p>
      }

        <button
        type="submit"
        disabled={!valid || sending}
        className="mt-5 w-full rounded-md bg-brand-600 px-3 py-2.5 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-500">
        
          {sending ? 'Sending…' : 'Request early access'}
        </button>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
          We use this only to reply to you. No sequences, no newsletter. See our{' '}
          <a href="/privacy" className="underline hover:text-ink-900">privacy policy</a>.
        </p>
      </form>
    }
    </>);

}
