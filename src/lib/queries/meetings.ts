import { eq } from "drizzle-orm"

import db from "@/db"
import { meetingDates, meetings } from "@/db/schema"

export async function getMeetingBySlug(slug: string) {
  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.slug, slug))
    .limit(1)

  if (!meeting) {
    return null
  }

  const dates = await db
    .select()
    .from(meetingDates)
    .where(eq(meetingDates.meetingId, meeting.id))

  return { meeting, dates }
}
