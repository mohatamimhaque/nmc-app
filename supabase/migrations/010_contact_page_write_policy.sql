-- Allow authenticated users to update Contact page content
create policy "Admin write contact page"
  on public.contact_page
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
