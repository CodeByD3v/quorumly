import { Resend } from "resend"

// We use Resend because the project already targets Vercel + Neon, and
// Resend's free tier + API-only setup (no SMTP config) fits that stack
// well. Swap this file out if the project prefers a different provider.
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.EMAIL_FROM ?? "Quorumly <onboarding@resend.dev>"

function warnMissingConfig(context: string) {
  console.warn(
    `[email] RESEND_API_KEY is not set — skipping "${context}" email. ` +
      "Set RESEND_API_KEY (and optionally EMAIL_FROM) to send real emails."
  )
}

export async function sendInviteEmail({
  to,
  eventName,
  inviteUrl,
  hostNote,
}: {
  to: string
  eventName: string
  inviteUrl: string
  hostNote?: string | null
}) {
  if (!resend) {
    warnMissingConfig(`invite:${to}`)
    return
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You're invited: ${eventName}`,
    html: `
      <div style="font-family: monospace, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 4px;">${escapeHtml(eventName)}</h2>
        <p style="color: #475569;">
          You've been invited to add your availability for this event.
        </p>
        ${hostNote ? `<p style="color: #475569;">${escapeHtml(hostNote)}</p>` : ""}
        <p style="margin: 24px 0;">
          <a
            href="${inviteUrl}"
            style="background:#0f172a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;"
          >
            Add your availability
          </a>
        </p>
        <p style="color: #94a3b8; font-size: 12px;">
          This link is unique to you — no account or sign-in required.
        </p>
      </div>
    `,
  })
}

export async function sendMagicLinkEmail(to: string, url: string) {
  if (!resend) {
    warnMissingConfig(`magic-link:${to}`)
    return
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Your Quorumly sign-in link",
    html: `
      <div style="font-family: monospace, sans-serif; max-width: 480px; margin: 0 auto;">
        <p>Click the link below to sign in to Quorumly:</p>
        <p style="margin: 24px 0;">
          <a
            href="${url}"
            style="background:#0f172a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;"
          >
            Sign in
          </a>
        </p>
        <p style="color: #94a3b8; font-size: 12px;">
          If you didn't request this, you can ignore this email.
        </p>
      </div>
    `,
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}