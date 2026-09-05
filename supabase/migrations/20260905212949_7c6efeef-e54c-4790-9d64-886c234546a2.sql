CREATE POLICY "Anyone can add people" ON public.people FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can link tags to people" ON public.person_tags FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT INSERT ON public.people TO anon;
GRANT INSERT ON public.person_tags TO anon;

CREATE POLICY "Anyone can upload avatars" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can read avatars" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');