import { eq } from "drizzle-orm"

import db from "@/db"
import { responses } from "@/db/schema"

export async function getResponses(meetingId: string) {
  const rows = await db
    .select()
    .from(responses)
    .where(eq(responses.meetingId, meetingId))
    .orderBy(responses.createdAt)

  return rows
}
