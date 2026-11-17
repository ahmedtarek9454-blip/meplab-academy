-- students can hand in and re-hand in, but never write a score, a grade or feedback (only the admin or the server)
drop policy if exists "subs_insert_own" on public.task_submissions;
create policy "subs_insert_own" on public.task_submissions
  for insert with check (user_id = auth.uid() and status = 'submitted' and score is null and feedback is null and graded_at is null
    and exists (select 1 from public.course_tasks t where t.id = task_id and t.published and public.has_course(t.course_id)));
drop policy if exists "subs_update_own_until_graded" on public.task_submissions;
create policy "subs_update_own_until_graded" on public.task_submissions
  for update using ((user_id = auth.uid() and status = 'submitted') or public.is_admin())
  with check (public.is_admin() or (user_id = auth.uid() and status = 'submitted' and score is null and feedback is null and graded_at is null));
