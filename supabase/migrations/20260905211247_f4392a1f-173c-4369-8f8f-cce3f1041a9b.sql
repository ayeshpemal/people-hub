CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.person_tags (
  person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, tag_id)
);

CREATE INDEX idx_people_category_id ON public.people(category_id);
CREATE INDEX idx_people_name ON public.people(name);
CREATE INDEX idx_person_tags_person_id ON public.person_tags(person_id);
CREATE INDEX idx_person_tags_tag_id ON public.person_tags(tag_id);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

GRANT SELECT ON public.tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;

GRANT SELECT ON public.people TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people TO authenticated;
GRANT ALL ON public.people TO service_role;

GRANT SELECT ON public.person_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.person_tags TO authenticated;
GRANT ALL ON public.person_tags TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Tags are publicly readable" ON public.tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "People are publicly readable" ON public.people FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Person tags are publicly readable" ON public.person_tags FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.categories (name) VALUES ('Design'), ('Engineering'), ('Marketing'), ('Operations');

INSERT INTO public.tags (name) VALUES ('Figma'), ('Systems'), ('Motion'), ('Go'), ('K8s'), ('Data'), ('SEO'), ('Content'), ('Email'), ('Process'), ('People'), ('Finance'), ('React'), ('A11y'), ('Type'), ('Brand');

INSERT INTO public.people (name, description, image_url, category_id)
SELECT 'Maya Okonkwo', 'Product designer crafting calm, legible interfaces for early-stage tools.', '/images/people/p1.jpg', id FROM public.categories WHERE name = 'Design';
INSERT INTO public.people (name, description, image_url, category_id)
SELECT 'Devon Reyes', 'Infrastructure engineer who ships resilient, low-latency data pipelines.', '/images/people/p2.jpg', id FROM public.categories WHERE name = 'Engineering';
INSERT INTO public.people (name, description, image_url, category_id)
SELECT 'Priya Nambiar', 'Growth marketer building search engines and campaigns that actually convert.', '/images/people/p3.jpg', id FROM public.categories WHERE name = 'Marketing';
INSERT INTO public.people (name, description, image_url, category_id)
SELECT 'Sofia Lindqvist', 'Ops lead keeping cross-functional teams moving with clear process.', '/images/people/p4.jpg', id FROM public.categories WHERE name = 'Operations';
INSERT INTO public.people (name, description, image_url, category_id)
SELECT 'Kenji Watanabe', 'Frontend developer focused on tactile, accessible component libraries.', '/images/people/p5.jpg', id FROM public.categories WHERE name = 'Engineering';
INSERT INTO public.people (name, description, image_url, category_id)
SELECT 'Amara Diallo', 'Brand designer shaping identity systems with a modern, playful voice.', '/images/people/p6.jpg', id FROM public.categories WHERE name = 'Design';

INSERT INTO public.person_tags (person_id, tag_id)
SELECT p.id, t.id FROM public.people p, public.tags t
WHERE (p.name = 'Maya Okonkwo' AND t.name IN ('Figma', 'Systems', 'Motion'))
   OR (p.name = 'Devon Reyes' AND t.name IN ('Go', 'K8s', 'Data'))
   OR (p.name = 'Priya Nambiar' AND t.name IN ('SEO', 'Content', 'Email'))
   OR (p.name = 'Sofia Lindqvist' AND t.name IN ('Process', 'People', 'Finance'))
   OR (p.name = 'Kenji Watanabe' AND t.name IN ('React', 'A11y', 'Type'))
   OR (p.name = 'Amara Diallo' AND t.name IN ('Brand', 'Figma', 'Type'));