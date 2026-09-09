CREATE POLICY "Anyone can edit people" ON public.people FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete people" ON public.people FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can unlink tags from people" ON public.person_tags FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update person tags" ON public.person_tags FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.people TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.person_tags TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can delete avatar files" ON storage.objects;
CREATE POLICY "Anyone can delete avatar files" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'avatars');