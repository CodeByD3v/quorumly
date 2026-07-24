import { notFound } from "next/navigation"

import { getMeetingBySlug } from "@/actions/create-meeting"
import { getResponses } from "@/actions/responses"
import { getInviteeByToken } from "@/actions/invitees"
import { MeetingContent } from "@/components/meeting/meeting-content"

export default async function MeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { slug } = await params
  const { token } = await searchParams
  const data = await getMeetingBySlug(slug)

  if (!data) {
    notFound()
  }

  const responses = await getResponses(data.meeting.id)

  const invitee = token
    ? await getInviteeByToken(data.meeting.id, token)
    : null

  return (
    <MeetingContent
      meeting={data.meeting}
      dates={data.dates}
      initialResponses={responses}
      invite={
        invitee?.valid
          ? { token: token!, email: invitee.email }
          : null
      }
    />
  )
}