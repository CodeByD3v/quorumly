# Quorumly

A when2meet alternative — create events, share a link, and let participants drag to select their available time slots. Find the best meeting time for everyone. Better UI, no ads, fully free and open source.


Join our community at: https://discord.gg/Ez6QAGGT2W (for any queries regarding contributing)


<div align="center">
  <a href="https://quorumly.vercel.app/">
    <img src="https://img.shields.io/badge/Try%20Now-quorumly.vercel.app-black?style=for-the-badge&logo=vercel" alt="Try Now" />
  </a>
</div>


<img width="3388" height="1858" alt="Home Page" src="https://github.com/user-attachments/assets/f646404c-4707-4128-aa4a-c9342d042da7" />
<img width="3388" height="1904" alt="Meeting Page" src="https://github.com/user-attachments/assets/3a26c6f5-1f21-4b05-bd74-f26b9aeb373b" />

## Quick Start
1. Open https://quorumly.vercel.app/
2. Enter the relevent meeting details
3. Once created, you can share the link with others, and also add your availability
4. Once everyone has added their availability, the interactive grid map allows you to see who all are available at a time, and you can schedule a meeting accordingly

## Contributing 
Please check the contributing guidelines at [CONTRIBUTING.md](./CONTRIBUTING.md). Please note we are looking for PRs from people who want to take it as an opportunity to learn while contributing. We expect you to minimize the use of AI, and use it solely for assistance. We may usually not add a strict restriction, but if the code seems like its obviously AI, we will be closing the Pull Request.

Before making any changes, please create an issue for it, and we will assign the issue to you, and then you can proceed to create a PR linked to the issue. Please note that if the issue is assigned to you, we expect you to compete it within a reasonable time, or we might have to reassign it, or merge any other PRs which close the same issue.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Docker in development, Neon in non-development) |
| ORM | Drizzle |
| Forms | TanStack Form + Zod |
| UI | Tailwind CSS, shadcn/ui |
| Calendar | react-day-picker |

## How AI was used

- **UI design** — The UI was manually designed in Figma, then quickly integrated into code with the help of AI.
- **Availability grid** — The drag-to-select time slot grid on the `/m/[slug]` page was implemented primarily with AI assistance.
- **Enhancements & bug fixes** — AI (CodeRabbit suggestions and general prompting) was used for incremental improvements, edge case handling, and fixing issues found during development.

## Local Development

**Prerequisites:** Node.js, pnpm, and Docker installed and running.

```bash
# 1. Install dependencies
pnpm install

# 2. Start local Postgres
docker compose up -d

# 3. Set up environment variables
cp .env.example .env.local

# 4. Migrate the database schema
pnpm db:push

# 5. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

Stop local Postgres when done:

```bash
docker compose down
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Build for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:migrate` | Migrate the database |
| `pnpm db:generate` | Generate a new migration |

## Project Structure

```
src/
├── actions/          # Server actions (create meeting, save responses)
├── app/
│   ├── page.tsx      # Home page (create event form)
│   └── m/[slug]/     # Individual meeting page
├── components/
│   ├── home/         # Home page form components
│   ├── meeting/      # Meeting page components (grid, layout)
│   └── ui/           # Shared UI components (shadcn)
├── db/
│   ├── index.ts      # Database client
│   └── schema.ts     # Drizzle schema (meetings, meeting_dates, responses)
└── lib/
    ├── schemas/      # Zod validation schemas
    └── utils/        # Helpers (timezone, etc.)
```
