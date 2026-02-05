# Thoughtbase

Thoughtbase is an open-source feedback management platform that helps product teams collect user feedback, prioritize their roadmap, and share updates through changelogs.

## Features

- **Feedback Collection** - Embeddable widget to collect ideas and suggestions from users
- **Roadmap Planning** - Kanban-style board to organize and prioritize features
- **Changelogs** - Publish product updates to keep users informed
- **Team Collaboration** - Invite team members with role-based permissions
- **Automatic logins** - Automatic login support for seamless user identification

## Project Structure

This is a monorepo managed with [Turborepo](https://turbo.build/) and [Bun](https://bun.sh/).

### Apps

| App            | Description                                      |
| -------------- | ------------------------------------------------ |
| `apps/app`     | Main web application built with TanStack Start   |
| `apps/docs`    | Documentation site built with Astro and Fumadocs |
| `apps/landing` | Marketing landing page built with Astro          |

### Packages

| Package            | Description                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| `packages/backend` | Convex backend functions and database schema                           |
| `packages/widget`  | Embeddable feedback widget (built with Preact for minimal bundle size) |

## Self-Hosting Guide

Thoughtbase can be deployed to any platform that supports [Tanstack Start](https://tanstack.com/start/latest/docs/framework/react/guide/hosting). The Convex backend can be self-hosted as well, but [is a little more involved](https://docs.convex.dev/self-hosting). Self-hosted deployments have all features enabled with no subscription required.

### Prerequisites

- [Bun](https://bun.sh/)
- [Convex](https://convex.dev/) account (free tier available)
- Hosting platform for the web app (Vercel, Netlify, Cloudflare Pages, etc.)

### Step 1: Clone and Install

```bash
git clone https://github.com/wolkwork/thoughtbase.git
cd thoughtbase
bun install
```

### Step 2: Deploy the Backend to Convex

1. Create a new project in the [Convex Dashboard](https://dashboard.convex.dev/)

2. Navigate to the backend package and deploy:

```bash
cd packages/backend
bunx convex deploy
```

3. Note your Convex deployment URL (e.g., `https://your-project.convex.cloud`)

### Step 3: Configure Environment Variables

Create environment variables for your web app deployment:

```bash
# Convex
VITE_CONVEX_URL=https://your-project.convex.cloud

# Authentication (Better Auth)
BETTER_AUTH_SECRET=<generate-a-secret>
BETTER_AUTH_URL=https://your-app-domain.com
```

### Step 4: Deploy the Web App

The app can be deployed to any platform that supports Node.js or edge functions. Check out the Convex docs on [hosting and deployment](https://docs.convex.dev/production/hosting/) to setup automatic deployments for backend and frontend together.

### Step 5: Integrate the widget

To build the entire monorepo (frontend, backend, widgets, etc.), run:

```bash
bun run build
```

This runs the production build for all packages using Turborepo.

The widget is automatically built and copied in the app's public folder. After deploying, it will be available at:

```
https://your-app-domain.com/widget.js
```

## Development

```bash
# cd into app directory
cd apps/app

# Install dependencies
bun install

# Start all apps in development mode
bun run dev
```

## Tech Stack

- **Frontend**: React 19, TanStack Start, Tailwind CSS
- **Backend**: Convex
- **Authentication**: Better Auth
- **Widget**: Preact
- **Documentation**: Astro, Fumadocs
- **Package Manager**: Bun
- **Monorepo**: Turborepo
