import Image from 'next/image';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { profiles } from '@/db/schema';
import { getSession } from '@/lib/auth';
import ProfileForms from './ProfileForms';

const placeholderAvatar =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 96 96%22%3E%3Crect width=%2296%22 height=%2296%22 rx=%2248%22 fill=%22%23f3e8ff%22/%3E%3Ccircle cx=%2248%22 cy=%2238%22 r=%2216%22 fill=%22%238b5cf6%22/%3E%3Cpath d=%22M20 82c4-18 16-28 28-28s24 10 28 28%22 fill=%22%23c4b5fd%22/%3E%3C/svg%3E';

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const profileRows = await db
    .select({
      fullName: profiles.fullName,
      email: profiles.email,
      phone: profiles.phone,
      avatarUrl: profiles.avatarUrl,
    })
    .from(profiles)
    .where(eq(profiles.id, session.id))
    .limit(1);
  const profile = profileRows[0];

  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="bg-slate-50 pb-16">
      <main className="mx-auto w-full max-w-7xl px-1 pt-2 sm:px-4 lg:px-8">
        <div className="rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.22),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.14),_transparent_42%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_44%,_#faf5ff_100%)] p-4 shadow-xl shadow-slate-200/70 sm:p-8 lg:p-11">
          <section className="rounded-3xl border border-white/70 bg-white/82 px-8 py-10 shadow-sm backdrop-blur sm:px-11">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="h-28 w-28 overflow-hidden rounded-full border border-white bg-white shadow-sm">
                <Image
                  src={profile.avatarUrl || placeholderAvatar}
                  alt={`${profile.fullName} avatar`}
                  width={112}
                  height={112}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <span className="text-sm font-bold uppercase tracking-wider text-indigo-600">
                  Account
                </span>
                <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                  Your Profile
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
                  Manage your account details and security settings.
                </p>
              </div>
            </div>
          </section>

          <ProfileForms
            fullName={profile.fullName}
            email={profile.email}
            phone={profile.phone}
          />
        </div>
      </main>
    </div>
  );
}
