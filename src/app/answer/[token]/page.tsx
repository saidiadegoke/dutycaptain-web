import type { Metadata } from 'next';
import { AnswerPage } from '@/components/views/AnswerPage';
import { NOINDEX } from '@/lib/seo';

export const metadata: Metadata = { title: 'Answer a request', robots: NOINDEX };

/**
 * The private answer link (phase 6): a colleague answers one request without
 * a DutyCaptain account. Outside the console and its sign-in on purpose.
 */
export default function Page() {
  return <AnswerPage />;
}
