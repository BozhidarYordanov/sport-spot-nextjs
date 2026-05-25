import { cookies } from 'next/headers';

import { verifyToken } from '@/lib/auth';
import HeaderClient from './HeaderClient';

export default async function Header() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = sessionToken ? await verifyToken(sessionToken) : null;

  return (
    <HeaderClient
      userName={session?.fullName ?? null}
      isAuthenticated={Boolean(session)}
    />
  );
}
