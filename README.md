# People Hub 👥

**People Hub** (also referred to as *Flock Directory*) is a high-performance directory web application built to display, search, filter, and manage profiles of people. Powered by **React 19**, **TanStack Start**, **Tailwind CSS v4**, and **Supabase**.

---

## 🚀 Features

- **Profile Directory (`/`)**
  - Responsive grid card layout displaying profile image, name, description, category, and tag pills.
  - Server-side filtering with debounced search, category dropdown, and interactive tag filtering.
  - Paginated queries (initial batch of 20 records) with skeleton loaders and error boundary handling.
- **Add Person (`/add-person`)**
  - Form for submitting new person profiles.
  - Client-side image compression prior to uploading to Supabase Storage.
- **Data Management Dashboard (`/manage-data`)**
  - Management UI to create, rename, and delete categories and tags.
  - Optimistic UI updates for snappy responsiveness.
- **Authentication (`/login`)**
  - Multi-tenant authentication integration using Supabase Auth.
- **Optimized Database Layer**
  - Normalized database tables with B-tree indexes for fast lookups and joins.
  - Row-Level Security (RLS) policies for data control.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/), [TanStack Start](https://tanstack.com/router/latest/docs/framework/react/start/overview) (Vite + `@tanstack/react-router`)
- **Styling & UI Components**: [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, RLS)
- **Data Fetching & State Management**: [TanStack React Query](https://tanstack.com/query/latest)
- **Forms & Validation**: React Hook Form, [Zod](https://zod.dev/)
- **Build & Developer Tools**: Vite 8, TypeScript, ESLint, Prettier, Bun / Node.js

---

## 🗄️ Database Schema & Architecture

The PostgreSQL database is organized into four core normalized tables:

1. **`categories`**: `id` (UUID PK), `name` (TEXT UNIQUE)
2. **`tags`**: `id` (UUID PK), `name` (TEXT UNIQUE)
3. **`people`**: `id` (UUID PK), `name` (TEXT), `description` (TEXT), `image_url` (TEXT), `category_id` (UUID FK -> `categories.id` ON DELETE SET NULL), `created_at` (TIMESTAMPTZ)
4. **`person_tags`**: `person_id` (UUID FK -> `people.id` ON DELETE CASCADE), `tag_id` (UUID FK -> `tags.id` ON DELETE CASCADE), PK (`person_id`, `tag_id`)

### Performance Indexing
To ensure fast joins and filtered lookups, explicit B-tree indexes exist on:
- `people(category_id)`
- `people(name)`
- `person_tags(person_id)`
- `person_tags(tag_id)`

Database migrations can be found in [`supabase/migrations`](file:///d:/GitHub/people-hub/supabase/migrations).

---

## ⚙️ Setup & Local Development

### Prerequisites

- **Node.js**: v18.0.0+ (or [install via nvm](https://github.com/nvm-sh/nvm))
- **npm** or **Bun** package manager
- A active **Supabase** project

### 1. Clone the Repository

```bash
git clone <repository-url>
cd people-hub
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in your Supabase connection settings in `.env`:

```env
SUPABASE_PROJECT_ID=your-supabase-project-id
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_URL=https://your-project-id.supabase.co

VITE_SUPABASE_PROJECT_ID=your-supabase-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
VITE_SUPABASE_URL=https://your-project-id.supabase.co
```

### 4. Database Setup & Migrations

Apply the migration scripts located in `supabase/migrations` using the Supabase CLI or SQL editor:

```bash
npx supabase db push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port indicated in terminal) in your browser.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Launches Vite development server |
| `npm run build` | Builds production artifacts |
| `npm run build:dev` | Builds app in development mode |
| `npm run preview` | Previews production build locally |
| `npm run lint` | Runs ESLint analysis across the workspace |
| `npm run format` | Formats code with Prettier |

---

## 🌐 Lovable Integration

This project is connected with [Lovable](https://lovable.dev). Commits pushed to the connected Git branch sync automatically with the Lovable editor.

> [!IMPORTANT]
> Avoid force-pushing or amending published Git commits, as rewriting history will desynchronize history in the Lovable platform.
