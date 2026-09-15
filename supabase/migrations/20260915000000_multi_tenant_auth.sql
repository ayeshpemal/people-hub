DELETE FROM public.person_tags;
DELETE FROM public.people;
DELETE FROM public.categories;
DELETE FROM public.tags;

ALTER TABLE public.categories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.tags ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.people ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.categories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.tags ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.people ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE public.tags DROP CONSTRAINT IF EXISTS tags_name_key;
ALTER TABLE public.categories ADD CONSTRAINT categories_name_user_id_key UNIQUE (name, user_id);
ALTER TABLE public.tags ADD CONSTRAINT tags_name_user_id_key UNIQUE (name, user_id);

DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
DROP POLICY IF EXISTS "Tags are publicly readable" ON public.tags;
DROP POLICY IF EXISTS "People are publicly readable" ON public.people;
DROP POLICY IF EXISTS "Person tags are publicly readable" ON public.person_tags;
DROP POLICY IF EXISTS "Anyone can add categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can edit categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can add tags" ON public.tags;
DROP POLICY IF EXISTS "Anyone can edit tags" ON public.tags;
DROP POLICY IF EXISTS "Anyone can delete tags" ON public.tags;
DROP POLICY IF EXISTS "Anyone can add people" ON public.people;
DROP POLICY IF EXISTS "Anyone can edit people" ON public.people;
DROP POLICY IF EXISTS "Anyone can delete people" ON public.people;
DROP POLICY IF EXISTS "Anyone can link tags to people" ON public.person_tags;
DROP POLICY IF EXISTS "Anyone can unlink tags from people" ON public.person_tags;
DROP POLICY IF EXISTS "Anyone can update person tags" ON public.person_tags;

CREATE POLICY "Users own categories" ON public.categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own tags" ON public.tags FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own people" ON public.people FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND (category_id IS NULL OR EXISTS (SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.user_id = auth.uid())));
CREATE POLICY "Users own person tags" ON public.person_tags FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.people p JOIN public.tags t ON t.id = tag_id WHERE p.id = person_id AND p.user_id = auth.uid() AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.people p JOIN public.tags t ON t.id = tag_id WHERE p.id = person_id AND p.user_id = auth.uid() AND t.user_id = auth.uid()));

REVOKE ALL ON public.categories, public.tags, public.people, public.person_tags FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories, public.tags, public.people, public.person_tags TO authenticated;

DROP POLICY IF EXISTS "Anyone can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete avatar files" ON storage.objects;
CREATE POLICY "Users upload own avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
UPDATE storage.buckets SET public = false WHERE id = 'avatars';
