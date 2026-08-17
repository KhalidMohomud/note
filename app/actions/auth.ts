"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  deleteCurrentSession,
} from "@/lib/auth/session";
import {
  credentialsSchema,
  type AuthActionState,
} from "@/lib/auth/validation";

const DUMMY_PASSWORD_HASH =
  "$2b$12$LfL06gLbbNwcyIGdPPBNS./3HmySvZFXS63YSr1K2.Za62AWkwtDW";
const REGISTRATION_ERROR =
  "Unable to create your account. Try logging in if you already registered.";
const LOGIN_ERROR = "Unable to log in. Please try again.";

function readCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = readCredentials(formData);

  if (!credentials.success) {
    return { errors: credentials.error.flatten().fieldErrors };
  }

  const { email, password } = credentials.data;
  let passwordHash: string;
  let userId: number;

  try {
    passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true },
    });
    userId = user.id;
  } catch {
    return { message: REGISTRATION_ERROR };
  }

  try {
    await createSession(userId);
  } catch {
    return { message: REGISTRATION_ERROR };
  }

  redirect("/dashboard");
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = readCredentials(formData);

  if (!credentials.success) {
    return { errors: credentials.error.flatten().fieldErrors };
  }

  const { email, password } = credentials.data;
  let user: { id: number; passwordHash: string } | null;

  try {
    user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });
  } catch {
    return { message: LOGIN_ERROR };
  }

  let passwordMatches: boolean;

  try {
    passwordMatches = await verifyPassword(
      password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
  } catch {
    return { message: LOGIN_ERROR };
  }

  if (!user || !passwordMatches) {
    return { message: "Invalid email or password." };
  }

  try {
    await createSession(user.id);
  } catch {
    return { message: LOGIN_ERROR };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteCurrentSession();
  redirect("/login");
}
