# People Hub

I want to build a high-performance directory web application to display profiles of people. First, configure my connected Supabase project to create the following normalized database tables with performance indexes:

categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE)

tags (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE)

people (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, description TEXT, image_url TEXT, category_id UUID REFERENCES categories(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now())

person_tags (person_id UUID REFERENCES people(id) ON DELETE CASCADE, tag_id UUID REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY(person_id, tag_id))

Optimization requirements:

Add explicit B-tree indexes on people(category_id), people(name), person_tags(person_id), and person_tags(tag_id) to ensure fast lookups and joins.

Build a clean, responsive React frontend with Tailwind CSS. The home page should display a grid of cards showing image, name, description, category, and tags.

Paginate or limit initial queries to 20 records at a time rather than fetching the entire table at once.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4127f891-786f-490c-bc5a-856a0a5b0d05).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
