import { redirect } from 'next/navigation';

/** The admin area opens on its first tool. */
export default function AdminIndex() {
  redirect('/admin/simulator');
}
