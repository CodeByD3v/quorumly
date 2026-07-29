"use server"

import { eq } from "drizzle-orm"
import { unstable_after as after } from "next/server"

import db from "@/db"
import { invitees, meetingDates, meetings } from "@/db/schema"
import { createMeetingInputSchema } from "@/lib/schemas/create-meeting"
import { sendInviteEmail } from "@/lib/email"

function generateSlug() {
  return crypto.randomUUID()
}

function generateInviteToken() {
  // 32 bytes of randomness, base64url-encoded — used as the identification
  // parameter in the emailed invite link (see issue #3).
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
    "base64url"
  )
}

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"
  )
}

function parseHour(value: string, fallback: number) {
  if (!value) {
    return fallback
  }

  const hour = Number.parseInt(value, 10)
  return Number.isNaN(hour) ? fallback : hour
}

export type CreateMeetingResult =
  | { success: true; slug: string }
  | { success: false; error: string }

export async function createMeeting(
  input: unknown
): Promise<CreateMeetingResult> {
  const parsed = createMeetingInputSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: "Invalid form data." }
  }

  const {
    eventName,
    description,
    fromTime,
    toTime,
    timezone,
    availableDates,
    inviteEmails,
  } = parsed.data

  try {
    const slug = generateSlug()

    const [meeting] = await db.transaction(async (tx) => {
      const [newMeeting] = await tx
        .insert(meetings)
        .values({
          slug,
          eventName,
          description: description.trim() || null,
          timezone,
          showFromHour: parseHour(fromTime, 0),
          showToHour: parseHour(toTime, 23),
        })
        .returning({ id: meetings.id, slug: meetings.slug })

      await tx.insert(meetingDates).values(
        availableDates.map((date) => ({
          meetingId: newMeeting.id,
          date,
        }))
      )
      
      return [newMeeting]
    })

    if (inviteEmails.length > 0) {
      const createdInvitees = await db
        .insert(invitees)
        .values(
          inviteEmails.map((email) => ({
            meetingId: meeting.id,
            email,
            token: generateInviteToken(),
          }))
        )
        .onConflictDoNothing()
        .returning({ email: invitees.email, token: invitees.token })

      const appUrl = getAppUrl()

      // Send invite emails in the background without blocking the response.
      // Using unstable_after to send emails after the response is returned.
      after(
        Promise.allSettled(
          createdInvitees.map((invitee) =>
            sendInviteEmail({
              to: invitee.email,
              eventName,
              inviteUrl: `${appUrl}/m/${meeting.slug}?token=${invitee.token}`,
              hostNote: description.trim() || null,
            })
          )
        )
      )
    }

    return { success: true, slug: meeting.slug }
  } catch (error) {
    console.error("Failed to create meeting:", error)
    return {
      success: false,
      error: "Failed to create event. Please try again.",
    }
  }

}
}

export async function getMeetingBySlug(slug: string) {
  const meetingWithDates = await db.query.meetings.findFirst({
    where: eq(meetings.slug, slug),
    with: {
      dates: true,
    },
  })

  if (!meetingWithDates) {
    return null
  }

  const { dates, ...meeting } = meetingWithDates
  return { meeting, dates }
}

