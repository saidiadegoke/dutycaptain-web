import { AuthLayout } from '@/components/auth/AuthLayout';

/** Sign-in, sign-up and password reset: outside both the website and the console. */
export default function Layout({ children }: {children: React.ReactNode;}) {
  return <AuthLayout>{children}</AuthLayout>;
}
