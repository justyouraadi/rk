# RK Printers - Multi-App Monorepo

Complete enterprise web presence and administration suite for **RK Printers** (Kotputli, Rajasthan) powered by a custom Node.js Express, Prisma ORM, and MySQL backend.

## Architecture Overview

```
.
├── admin/                 # Standalone React + Vite Admin Panel
│   ├── src/               # Admin pages, layout, CRUD, and auth
│   ├── package.json       # Admin dependencies (Vite, React 18, Radix, Lucide, Recharts)
│   └── vite.config.js     # Admin Vite configuration (port 5174)
│
├── backend/               # Custom Node.js (ESM) + Express + Prisma ORM Backend
│   ├── src/               # Controllers, services, routes (/api/v1), middlewares, utils
│   ├── prisma/            # MySQL schema & versioned migrations
│   └── package.json       # Backend dependencies (Express, Prisma, Cloudinary, Multer, JWT, Bcrypt)
│
├── src/                   # Astro JS Public Website
│   ├── layouts/           # Astro layouts (Layout.astro with SEO, fonts, header, footer)
│   ├── pages/             # Astro static routes (43 pre-rendered pages)
│   ├── views/             # Interactive React island views (Home, Products, Detail pages)
│   ├── components/        # PublicNavbar, PublicFooter, EnquiryCartDrawer, ProductConfigurator
│   └── api/               # Native API client connecting directly to custom backend
│
├── astro.config.mjs       # Astro configuration with @astrojs/react and Tailwind
└── package.json           # Root scripts for Astro website, admin, and backend
```

---

## Getting Started

### 1. Backend Server (Express + Prisma + MySQL + Cloudinary)
```bash
# Start backend server (http://localhost:3000)
npm run dev:backend
```

### 2. Astro Website (Public Front-End)
Runs the blazingly fast Astro JS website with React client islands:
```bash
# Start website development server (http://localhost:4321)
npm run dev

# Build for production (43 static pages pre-rendered to /dist)
npm run build

# Preview production build
npm run preview
```

### 3. Admin Panel (React + Vite)
Runs the React + Vite admin dashboard connected to the custom backend:
```bash
# Start admin development server (http://localhost:5174)
npm run dev:admin

# Build admin panel for production
npm run build:admin
```

---

## Features & Tech Stack

- **Astro JS (v5)**: Static-site generation (SSG) for SEO, sub-second TTFB, and minimal JS footprint.
- **Custom Backend**: Built on Node.js, Express, Prisma ORM, MySQL, and Cloudinary for file/image uploads.
- **React 18 & Islands Architecture**: Interactive islands for quotation cart (`EnquiryCartDrawer`), product configurator, industry filters, and customer portal.
- **Tailwind CSS**: Custom branding theme tokens (`--rk-red`, `--ink`, `--ink-soft`), CMYK design accents, and typography.
- **Admin Panel**: Complete order management, sales pipeline, quotation builder, product catalog CRUD, image library, and analytics charts with Recharts.
