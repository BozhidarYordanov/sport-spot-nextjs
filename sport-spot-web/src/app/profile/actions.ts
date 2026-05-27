'use server';

import bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { profiles } from '@/db/schema';
import { getSession } from '@/lib/auth';

type ActionResult = { success: true } | { error: string };

const getFormValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
};

const isPhoneValid = (phone: string) =>
  /^\d{10}$/.test(phone) || /^0\d{9}$/.test(phone) || /^\+359\d{9}$/.test(phone);

const isPasswordValid = (password: string) =>
  password.length >= 8 &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

export const updateProfileDetailsAction = async (
  formData: FormData
): Promise<ActionResult> => {
  const session = await getSession();

  if (!session) {
    return { error: 'unauthenticated' };
  }

  const fullName = getFormValue(formData, 'fullName');
  const phone = getFormValue(formData, 'phone');

  if (!fullName || fullName.length < 3) {
    return { error: 'Full name must be at least 3 characters.' };
  }

  if (!isPhoneValid(phone)) {
    return { error: 'Please enter a valid phone number.' };
  }

  try {
    await db
      .update(profiles)
      .set({ fullName, phone })
      .where(eq(profiles.id, session.id));

    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('updateProfileDetailsAction failed', error);
    return { error: 'Unable to update profile details.' };
  }
};

export const changePasswordAction = async (
  formData: FormData
): Promise<ActionResult> => {
  const session = await getSession();

  if (!session) {
    return { error: 'unauthenticated' };
  }

  const newPassword = getFormValue(formData, 'newPassword');
  const confirmPassword = getFormValue(formData, 'confirmPassword');

  if (!isPasswordValid(newPassword)) {
    return {
      error:
        'Password must be at least 8 characters and include a number and special character.',
    };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db
      .update(profiles)
      .set({ passwordHash })
      .where(eq(profiles.id, session.id));

    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('changePasswordAction failed', error);
    return { error: 'Unable to change password.' };
  }
};
