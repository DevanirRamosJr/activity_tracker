-- Add user tracking to entry history.
-- Run this once in the Supabase SQL Editor.

alter table entry_history add column if not exists user_id uuid references users(id);
