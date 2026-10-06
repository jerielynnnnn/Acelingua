-- READ ONLY. Run each numbered query separately in Supabase SQL Editor.
-- Share every result, including "Success. No rows returned" with its query number.
-- No learner records, emails, tokens, or credentials are selected.

-- 1. Exact curriculum, progress, and reward columns/defaults.
select table_name, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in (
  'activities', 'questions', 'vocabulary', 'lesson_progress', 'activity_progress',
  'question_answers', 'xp_transactions', 'coin_transactions', 'course_progress',
  'profiles', 'lessons', 'units', 'user_courses'
)
order by table_name, ordinal_position;

-- 2. RLS enabled state and exact policies, including restrictive guards.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
  p.policyname, p.permissive, p.roles, p.cmd, p.qual, p.with_check
from pg_class c join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public' and c.relname in (
  'activities', 'questions', 'vocabulary', 'lesson_progress', 'activity_progress',
  'question_answers', 'xp_transactions', 'coin_transactions', 'course_progress', 'profiles'
)
order by c.relname, p.policyname;

-- 3. Keys, checks, unique constraints, and indexes for safe retries.
select c.relname as table_name, con.conname, pg_get_constraintdef(con.oid) as definition
from pg_constraint con join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in (
  'activities', 'questions', 'lesson_progress', 'activity_progress', 'question_answers',
  'xp_transactions', 'coin_transactions', 'course_progress', 'profiles'
)
order by c.relname, con.conname;

-- 4. Includes standalone unique indexes omitted from constraint results.
select tablename, indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename in (
  'lesson_progress', 'activity_progress', 'question_answers', 'xp_transactions',
  'coin_transactions', 'course_progress', 'profiles'
)
order by tablename, indexname;

-- 5. Triggers may already update balances or progress. Inspect their functions
-- so we do not create competing reward logic or award the same reward twice.
select c.relname as table_name, t.tgname,
  pg_get_triggerdef(t.oid) as trigger_definition,
  pg_get_functiondef(t.tgfoid) as function_definition
from pg_trigger t join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in (
  'lesson_progress', 'activity_progress', 'question_answers', 'xp_transactions',
  'coin_transactions', 'course_progress', 'profiles'
) and not t.tgisinternal
order by c.relname, t.tgname;

-- 6. Existing public functions that might provide atomic completion/rewards.
-- Review function grants too: existence alone does not prove browser access.
select p.proname, pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer, p.proconfig, p.proacl,
  pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f'
  and (p.proname ~* '(lesson|reward|coin|xp|progress|answer|activity)'
    or p.prosrc ~* '(lesson_progress|xp_transactions|coin_transactions)')
order by p.proname;

-- 7. API role grants (RLS and table privileges are separate checks).
select table_name, grantee, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('authenticated', 'anon')
  and table_name in ('lesson_progress', 'activity_progress', 'question_answers',
    'xp_transactions', 'coin_transactions', 'course_progress', 'profiles')
order by table_name, grantee, privilege_type;

-- 8. Real published Japanese lessons with activity/question/vocabulary counts.
select course.id as course_id, course.title as course_title,
  unit.unit_order, unit.title as unit_title, lesson.id as lesson_id,
  lesson.lesson_order, lesson.title, lesson.xp_reward, lesson.coin_reward,
  (select count(*) from public.activities a where a.lesson_id = lesson.id) as activities,
  (select count(*) from public.questions q join public.activities a on a.id = q.activity_id
    where a.lesson_id = lesson.id) as questions,
  (select count(*) from public.vocabulary v where v.lesson_id = lesson.id) as vocabulary
from public.lessons lesson
join public.units unit on unit.id = lesson.unit_id
join public.courses course on course.id = unit.course_id
join public.languages lang on lang.id = course.language_id
where lang.code = 'ja' and course.is_published and unit.is_published and lesson.is_published
order by course.id, unit.unit_order, unit.id, lesson.lesson_order, lesson.id;

-- 9. Actual Japanese activity content, without guessing additional fields.
select to_jsonb(a) as activity
from public.activities a join public.lessons l on l.id = a.lesson_id
join public.units u on u.id = l.unit_id
join public.courses c on c.id = u.course_id
join public.languages lang on lang.id = c.language_id
where lang.code = 'ja' and c.is_published and u.is_published and l.is_published
order by u.unit_order, l.lesson_order, a.activity_order, a.id;

-- 10. Actual question types/options/answers/audio fields used by Japanese.
select to_jsonb(q) as question
from public.questions q join public.activities a on a.id = q.activity_id
join public.lessons l on l.id = a.lesson_id
join public.units u on u.id = l.unit_id
join public.courses c on c.id = u.course_id
join public.languages lang on lang.id = c.language_id
where lang.code = 'ja' and c.is_published and u.is_published and l.is_published
order by u.unit_order, l.lesson_order, a.activity_order, q.question_order, q.id;

-- 11. Enum values for the inspected lesson/activity/question/progress fields.
select distinct cols.table_name, cols.column_name, enums.enumlabel, enums.enumsortorder
from information_schema.columns cols
join pg_namespace ns on ns.nspname = cols.udt_schema
join pg_type typ on typ.typnamespace = ns.oid and typ.typname = cols.udt_name
join pg_enum enums on enums.enumtypid = typ.oid
where cols.table_schema = 'public' and cols.table_name in (
  'activities', 'questions', 'lesson_progress', 'activity_progress',
  'question_answers', 'xp_transactions', 'coin_transactions'
)
order by cols.table_name, cols.column_name, enums.enumsortorder;
