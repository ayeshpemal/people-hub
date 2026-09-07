CREATE POLICY "Anyone can add categories" ON public.categories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can edit categories" ON public.categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete categories" ON public.categories FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can add tags" ON public.tags FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can edit tags" ON public.tags FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete tags" ON public.tags FOR DELETE TO anon, authenticated USING (true);

GRANT INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tags TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.tags TO service_role;