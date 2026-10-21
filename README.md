# ASNOR Inventory Management System

[![CI](https://github.com/Hadjiiiiii/asnor-inventory/actions/workflows/ci.yml/badge.svg)](https://github.com/Hadjiiiiii/asnor-inventory/actions/workflows/ci.yml)

A web-based inventory management system built for tech resale businesses. Track phones, tablets, laptops, and accessories with buy/sell transaction tracking, profit calculation, and team collaboration.

## Features

- **Inventory Management** — Individual device tracking (serial/IMEI) and quantity-based accessory stock
- **Buy/Sell Transactions** — Record purchases and sales with automatic profit calculation
- **Condition Grading** — Track device condition: New, Like New, Good, Fair, Parts
- **Supplier & Customer Management** — Contact directory linked to transaction history
- **Image Uploads** — Multiple photos per product via Cloudinary (25GB free tier)
- **Dashboard & Reports** — Real-time metrics, monthly trends chart, low-stock alerts
- **Role-Based Access** — Admin and Staff roles with protected routes
- **Responsive Design** — Works on desktop and tablet (Claude-inspired UI)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL with Prisma 7 ORM
- **Auth:** Auth.js v5 (next-auth@beta) with JWT sessions
- **Images:** Cloudinary (free tier)
- **UI:** Tailwind CSS v4 + custom components (shadcn/ui-inspired)
- **Charts:** Recharts
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud — [Neon](https://neon.tech) has a free tier)
- Cloudinary account (free: [cloudinary.com](https://cloudinary.com))

### Setup

1. **Clone and install dependencies:**
   ```bash
   cd ASNOR
   npm install --legacy-peer-deps
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your credentials:
   - `DATABASE_URL` — PostgreSQL connection string
   - `AUTH_SECRET` — Generate with `openssl rand -base64 32`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — From Cloudinary dashboard

3. **Set up the database:**
   ```bash
   npm run db:generate   # Generate Prisma client
   npm run db:push       # Push schema to database
   npm run db:seed       # Seed with sample data
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

| Role  | Email             | Password |
|-------|-------------------|----------|
| Admin | admin@asnor.com   | admin123 |
| Staff | staff@asnor.com   | staff123 |

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated app routes
│   │   ├── dashboard/      # Dashboard with metrics & charts
│   │   ├── inventory/      # Product CRUD & management
│   │   ├── transactions/   # Buy/sell transaction tracking
│   │   ├── contacts/       # Supplier & customer management
│   │   └── users/          # Admin user management
│   ├── api/                # API routes (auth, images, data)
│   └── login/              # Login page
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── sidebar.tsx         # Navigation sidebar
│   ├── providers.tsx       # Session & toast providers
│   └── image-upload.tsx    # Cloudinary upload component
├── lib/
│   ├── auth.ts             # Auth.js configuration
│   ├── prisma.ts           # Database client
│   └── utils.ts            # Utility functions
└── generated/prisma/       # Generated Prisma client (gitignored)
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema changes to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:migrate` | Create and apply migrations |
| `npm run db:generate` | Regenerate Prisma client |

## Deployment (Vercel)

1. Push your code to GitHub
2. Connect the repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy — Vercel will automatically build and deploy

**Build command** is already configured: `npx prisma generate && next build`

## Design System

The UI is inspired by Claude's design language:
- **Font:** Inter
- **Colors:** Warm whites/cream (#FAF9F7), subtle borders (#e8e2db), terracotta accent (#ad4f2d, deepened from #c96442 to meet AA contrast), control borders (#8f8780)
- **Components:** Rounded corners (0.75rem), generous spacing, soft shadows
- **Feel:** Calm, professional, highly readable
