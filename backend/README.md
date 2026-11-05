# Backend - RK PRINTERS

Node.js (ESM) backend with Prisma ORM connecting to MySQL with full migration history tracking, separated authentication architectures for customers (`users`) and staff (`admins`), and Cloudinary media/file uploads.

## Environment Variables
Ensure `.env` in `backend/` contains:
```env
PORT=3000
DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<database>"
SECRET="rk_jwt_secret_aadi@"
EXPIRY="7d"
CLOUDINARY_URL="cloudinary://853181684846476:7whyWW9VV3zyQ4OI-pG4CXECoXw@ajphmpzc"
```

## API Structure (`/api/v1`)

All endpoints are organized under the `/api/v1` prefix.

### 1. Admins (`/api/v1/admins`)
Dedicated table `admins` for management and staff accounts.
- `POST /api/v1/admins/signup`: Registers a new admin (`name`, `email`, `phone`, `password`, `role`).
  - Available roles: `SUPER_ADMIN`, `ADMIN`, `MEMBER`.
- `POST /api/v1/admins/login`: Authenticates admin via email/phone and password. Returns JWT token with admin payload.
- `GET /api/v1/admins/profile`: Fetches currently authenticated admin profile (requires admin token).
- `GET /api/v1/admins`: Fetches paginated & filtered admins list (requires admin token).
- `GET /api/v1/admins/:id`: Fetches admin by ID (requires admin token).
- `POST /api/v1/admins/:id/reset-password`: Resets an admin's password (requires admin token).

### 2. Users / Customers (`/api/v1/users`)
Dedicated table `users` for public customer/client accounts and order tracking.
- `POST /api/v1/users/signup`: Registers a new customer (`name`, `phone`, `email`, `password`, `company`). Returns JWT token.
- `POST /api/v1/users/login`: Authenticates customer via phone or email and password.
- `GET /api/v1/users`: Fetches paginated & filtered users (requires user token).
- `GET /api/v1/users/:id`: Fetches single user by ID with associated orders (requires user token).
- `POST /api/v1/users/:id/reset-password`: Resets a customer's password (requires user token).

### 3. File & Media Uploads (`/api/v1/uploads`)
Unified Cloudinary upload pipeline for images, videos, design artworks, PDFs, and documents with memory buffering and automatic resource type detection:
- `POST /api/v1/uploads/single`: Uploads a single file.
  - Accepts `multipart/form-data` with field `file`, or `application/json` with `{ file: "<base64 or remote URL>" }`.
  - Optional fields: `folder` (default: `rk-printers/uploads`), `resourceType` (`auto`, `image`, `video`, `raw`), `publicId`.
  - Returns Cloudinary secure `url`, `public_id`, `bytes`, `format`, `resource_type`, etc.
- `POST /api/v1/uploads/multiple`: Uploads multiple files (up to 10 files per request).
  - Accepts `multipart/form-data` with field `files`.
  - Returns array of uploaded file objects with `count`.
- `DELETE /api/v1/uploads`: Deletes an asset from Cloudinary.
  - Accepts `{ publicId: "<public_id>", resourceType: "<image|video|raw>" }`.

---

## Programmatic Cloudinary Usage in Backend Services

Whenever uploading files, images, or videos anywhere in the backend services:

```javascript
import { UploadService } from "../services/index.js";
// OR direct utility functions:
import { uploadBufferToCloudinary, uploadFileOrUrlToCloudinary, deleteFromCloudinary } from "../utils/index.js";
import { cloudinary } from "../config/index.js";

// Upload a multer file buffer:
const uploaded = await UploadService.uploadSingle({
  file: req.file,
  folder: "rk-printers/products",
});
console.log(uploaded.url, uploaded.public_id);
```

---

## Migration Workflow (Zero Data Loss)

All database schema evolutions use **Prisma Migrate** to ensure full audit history, rollback safety, and zero data loss.

### 1. Developing New Schema Changes
Whenever you update `prisma/schema.prisma`:
```bash
npm run migrate:dev -- --name <descriptive_migration_name>
```

> **Note for remote MySQL without shadow DB permissions**:
> If running on remote hosting without `CREATE DATABASE` privilege for shadow databases:
> 1. Generate SQL migration script:
>    ```bash
>    npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > prisma/migrations/<timestamp>_<name>/migration.sql
>    ```
> 2. Apply cleanly to target:
>    ```bash
>    npm run migrate:deploy
>    ```
> 3. Regenerate client:
>    ```bash
>    npm run db:generate
>    ```

### 2. Checking Migration Status
```bash
npm run migrate:status
```

### 3. Deploying Migrations
```bash
npm run migrate:deploy
```

---

## Available Scripts

- **`npm run dev`**: Starts the Express server in development mode with `nodemon`.
- **`npm start`**: Runs the server in production mode.
- **`npm run db:generate`**: Regenerates Prisma Client types.
- **`npm run db:studio`**: Launches Prisma Studio web interface for viewing and editing records.
