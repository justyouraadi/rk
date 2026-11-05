# AGENTS.md

## Project Context

This is the RK Printers application repository. It consists of:
- `src/`: Astro JS public website with React islands.
- `admin/`: Standalone React + Vite Admin Panel.
- `backend/`: Node.js Express + Prisma ORM + MySQL backend with Cloudinary uploads.

Start with `README.md` for local setup, environment variables, and workflow.

## Key Files & Directories

- `backend/src/`: Backend controllers, services, middlewares, and `/api/v1` routes.
- `backend/prisma/schema.prisma`: Prisma schema for MySQL.
- `backend/prisma/migrations/`: Tracked Prisma migrations with zero data loss.
- `admin/src/`: Admin panel frontend source.
- `src/`: Public website Astro and React components.
- `src/api/apiClient.js` & `admin/src/api/apiClient.js`: Native backend API client (connecting to `/api/v1`).

## Working Notes

- Run `npm run dev:backend` to start the backend on port 3000.
- Run `npm run dev:admin` to start the admin dashboard on port 5174.
- Run `npm run dev` to start the Astro website on port 4321.
- All file/media uploads must use Cloudinary via `/api/v1/uploads`.
- Preserve the established Controller, Service, and `/api/v1` route patterns.
