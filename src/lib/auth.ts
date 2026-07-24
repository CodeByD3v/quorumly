import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { magicLink } from "better-auth/plugins"

import db from "@/db"
import * as schema from "@/db/schema"
import { sendMagicLinkEmail } from "@/lib/email"

// Better-Auth is wired up now so that:
//  - invitee responses can create a real `user` row for their email
//    (see src/actions/responses.ts -> saveInviteeResponse)
//  - magic-link sign in is available for a *future* "manage your responses"
//    feature, per issue #3. No sign-in UI exists yet.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  // Only magic link is enabled — no password auth, no OAuth providers yet.
  emailAndPassword: { enabled: false },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url)
      },
    }),
  ],
})