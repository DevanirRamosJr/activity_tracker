-- ============================================
-- Make the list collaborative between signed-in users.
-- Run once in the Supabase SQL Editor.
-- ============================================

-- 1. Any signed-in user can edit any entry (changes are logged); deleting stays
--    restricted to the entry's creator.
drop policy if exists "entries_update" on entries;
create policy "entries_update" on entries
  for update using (auth.uid() is not null);

drop policy if exists "entries_delete" on entries;
create policy "entries_delete" on entries
  for delete using (user_id = auth.uid());

-- 2. Signed-in users can read every user's username — needed to show who made
--    each history change and whose desire/rating is whose. Password hashes stay
--    hidden via column-level grants (login/change_password use SECURITY DEFINER
--    functions, so they still work).
drop policy if exists "users_select_own" on users;
drop policy if exists "users_select_all" on users;
create policy "users_select_all" on users
  for select using (auth.uid() is not null);

revoke select on users from authenticated;
grant select (id, username, created_at) on users to authenticated;

-- (scores_select already allows reading every user's scores, so no change there.)
