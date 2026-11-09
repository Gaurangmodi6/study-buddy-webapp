-- Study Buddy – Mission Control Database Schema
-- Run this in your Supabase SQL Editor if connecting a live Supabase project

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create subjects (Orbits) table
create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#D4A017',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for subjects
alter table public.subjects enable row level security;

create policy "Users can view their own subjects"
  on public.subjects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subjects"
  on public.subjects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subjects"
  on public.subjects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own subjects"
  on public.subjects for delete
  using (auth.uid() = user_id);

-- 2. Create tasks (Missions) table
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  subject_id uuid references public.subjects(id) on delete set null,
  deadline timestamp with time zone not null,
  priority text check (priority in ('Low', 'Medium', 'High', 'Critical')) default 'Medium' not null,
  status text check (status in ('Pending', 'In Progress', 'Completed')) default 'Pending' not null,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for tasks
alter table public.tasks enable row level security;

create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_deadline_idx on public.tasks(deadline);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists subjects_user_id_idx on public.subjects(user_id);
