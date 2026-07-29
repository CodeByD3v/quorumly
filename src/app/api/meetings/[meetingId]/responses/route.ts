import { NextRequest, NextResponse } from "next/server"

import db from "@/db"
import { meetingDates, meetings, responses } from "@/db/schema"
import { eq } from "drizzle-orm"

type SaveResponseBody = {
  name: string
  timeSlots: string[]
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
