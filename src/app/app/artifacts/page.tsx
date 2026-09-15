import type { Metadata } from 'next';
import { Artifacts } from '@/components/views/Artifacts';

export const metadata: Metadata = { title: 'Artifacts' };

export default function Page() {
  return <Artifacts />;
}
