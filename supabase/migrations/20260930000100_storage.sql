-- RankPulse — private Supabase Storage buckets for generated reports and profile pictures.
-- Files live under a folder named after the owner's user id ("<user id>/<file>"), and a user can
-- only read or write objects inside their own folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('reports', 'reports', false, 20971520, array[
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]),
  ('avatars', 'avatars', false, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "Users manage their own report files"
  on storage.objects for all to authenticated
  using (bucket_id = 'reports' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'reports' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users manage their own avatar files"
  on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
