import { NextRequest, NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"

import db from "@/db"
import {
  invitees,
  meetingDates,
  meetings,
  responses,
  user,
} from "@/db/schema"

type SaveResponseBody = {
  name: string
  timeSlots: string[]
  token?: string
}

function isValidTimeSlotsInput(timeSlots: unknown): timeSlots is string[] {
  return (
    Array.isArray(timeSlots) &&
    timeSlots.length > 0 &&
    timeSlots.every((s) => typeof s === "string" && s.length > 0)
  )
}

async function getValidTimeSlots(meetingId: string, timeSlots: string[]) {
  const [meeting] = await db
    .select({
      showFromHour: meetings.showFromHour,
      showToHour: meetings.showToHour,
    })
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1)

  if (!meeting) {
    return null
  }

  const dates = await db
    .select({ date: meetingDates.date })
    .from(meetingDates)
    .where(eq(meetingDates.meetingId, meetingId))

  const validKeys = new Set<string>()
  for (const d of dates) {
    for (let h = meeting.showFromHour; h <= meeting.showToHour; h++) {
      validKeys.add(`${d.date}T${String(h).padStart(2, "0")}:00`)
      if (h < meeting.showToHour) {
        validKeys.add(`${d.date}T${String(h).padStart(2, "0")}:30`)
      }
    }
  }

  return timeSlots.filter((s) => validKeys.has(s))
}

/**
 * Save a response for a meeting. If a token is provided, this handles invitee
 * responses with the following additional features:
 *  - re-verifies the token server-side (never trusts the client's claimed email)
 *  - finds-or-creates a `user` row for the invitee's email so an "account"
 *    exists for them going forward (issue #3) — no session/sign-in is
 *    created, this is purely a backend record
 *  - links the response to that user via the hidden `userId` column, while
 *    still storing the display `name` the same way anonymous responses do
 *  - marks the invitee row as responded
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params
    const body = (await request.json()) as SaveResponseBody

    const trimmed = body.name.trim()

    if (!trimmed) {
      return NextResponse.json(
        { success: false, error: "Name is required." },
        { status: 400 }
      )
    }

    if (!isValidTimeSlotsInput(body.timeSlots)) {
      return NextResponse.json(
        { success: false, error: "At least one valid time slot is required." },
        { status: 400 }
      )
    }

    const valid = await getValidTimeSlots(meetingId, body.timeSlots)

    if (valid === null) {
      return NextResponse.json(
        { success: false, error: "Meeting not found." },
        { status: 404 }
      )
    }
    if (valid.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid time slots provided." },
        { status: 400 }
      )
    }

    // Handle invitee response with token
    if (body.token) {
      const [invitee] = await db
        .select({ id: invitees.id, email: invitees.email })
        .from(invitees)
        .where(
          and(eq(invitees.meetingId, meetingId), eq(invitees.token, body.token))
        )
        .limit(1)

      if (!invitee) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired invite link." },
          { status: 404 }
        )
      }

      await db.transaction(async (tx) => {
        const [existingUser] = await tx
          .select({ id: user.id })
          .from(user)
          .where(eq(user.email, invitee.email))
          .limit(1)

        const userId =
          existingUser?.id ??
          (
            await tx
              .insert(user)
              .values({
                id: crypto.randomUUID(),
                name: trimmed,
                email: invitee.email,
                emailVerified: false,
              })
              .returning({ id: user.id })
          )[0].id

        await tx
          .insert(responses)
          .values({
            meetingId,
            name: trimmed,
            timeSlots: valid,
            userId,
          })
          .onConflictDoUpdate({
            target: [responses.meetingId, responses.name],
            set: { timeSlots: valid, userId },
          })

        await tx
          .update(invitees)
          .set({ status: "responded", respondedAt: new Date() })
          .where(eq(invitees.id, invitee.id))
      })

      return NextResponse.json({ success: true })
    }

    // Handle anonymous response without token
    await db
      .insert(responses)
      .values({
        meetingId,
        name: trimmed,
        timeSlots: valid,
      })
      .onConflictDoUpdate({
        target: [responses.meetingId, responses.name],
        set: { timeSlots: valid },
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save response:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save. Please try again." },
      { status: 500 }
    )
  }
}
