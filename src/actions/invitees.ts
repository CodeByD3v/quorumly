"use server"

import { and, eq } from "drizzle-orm"

import db from "@/db"
import { invitees } from "@/db/schema"

export type InviteeLookupResult =
  | { valid: true; email: string; alreadyResponded: boolean }
  | { valid: false }

/**
 * Looks up the invitee behind a `?token=` invite link, scoped to the
 * meeting it was created for. Returns `{ valid: false }` for any bad,
 * unknown, or mismatched token instead of throwing, since an invalid token
 * should just fall back to the normal "anonymous, name-only" flow.
 */
export async function getInviteeByToken(
  meetingId: string,
  token: string
): Promise<InviteeLookupResult> {
  if (!token) {
    return { valid: false }
  }

  const [invitee] = await db
    .select({ email: invitees.email, status: invitees.status })
    .from(invitees)
    .where(and(eq(invitees.meetingId, meetingId), eq(invitees.token, token)))
    .limit(1)

  if (!invitee) {
    return { valid: false }
  }

  return {
    valid: true,
    email: invitee.email,
    alreadyResponded: invitee.status === "responded",
  }
}