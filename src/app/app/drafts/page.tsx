import type { Metadata } from 'next';
import { Drafts } from '@/components/views/Drafts';

export const metadata: Metadata = { title: 'Drafts' };

export default function Page() {
  return <Drafts />;
}
