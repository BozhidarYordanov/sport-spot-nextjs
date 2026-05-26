import { getSession, isAdmin } from '@/lib/auth';
import HeaderClient from './HeaderClient';

export default async function Header() {
  const [session, hasAdminAccess] = await Promise.all([getSession(), isAdmin()]);

  return (
    <HeaderClient
      userName={session?.fullName ?? null}
      isAuthenticated={Boolean(session)}
      isAdmin={hasAdminAccess}
    />
  );
}
