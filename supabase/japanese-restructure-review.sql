-- REVIEW ONLY / NOT EXECUTED. Do not apply before reviewing live constraints,
-- exact vocabulary mappings, publication choices, and a database backup.
-- Lesson mappings approved by owner; constraint/publication final review pending.
-- 8 target units plus 3 retained unpublished legacy units = 11 physical units.
-- 48 target lessons plus 2 retained unpublished legacy lessons = 50 physical lessons.
-- New IDs use database defaults. No learning content or learner rewards are added.
begin;
do $review$
begin
  raise exception 'REVIEW ONLY: mappings approved, execution NOT approved. Keep guard until live constraints, final publication review, and rollback backup are approved';
end;
$review$;
lock table public.units,public.lessons in share row exclusive mode;
-- Prevent concurrent completion/progress writes during hierarchy and aggregate changes.
lock table public.lesson_progress,public.course_progress in share row exclusive mode;
create temporary table target_units (
  position integer primary key, existing_id uuid, title text, lesson_titles text[], resolved_id uuid
) on commit drop;
insert into target_units(position,existing_id,title,lesson_titles) values
(1,'6fa3790a-9162-4f49-98e9-3bf1148d7e10','Greetings & Introductions',array['Saying Hello','Introducing Yourself','Asking Someone''s Name','Polite Expressions','Basic Conversation','Unit Review']),
(2,'b735bff3-2b4f-4ad9-9a42-5dc3f907eb63','Numbers & Time',array['Numbers 1–10','Numbers 11–100','Asking the Time','Days of the Week','Dates','Unit Review']),
(3,'5ba31a7f-11c3-4c10-bb2a-42063762d6c3','Daily Life',array['Morning Routine','Family','School & Work','Everyday Actions','Likes & Dislikes','Unit Review']),
(4,'531834cc-9151-4f36-b8e4-b27cf9e05ada','Food & Eating Out',array['Food & Drinks','At a Café','Ordering Food','Asking for the Bill','Restaurant Conversation','Unit Review']),
(5,'1b829d7e-32b9-4bdf-a21e-c03272f52962','Around the City',array['Places in Town','Asking Where Something Is','Directions','Transportation','Finding a Destination','Unit Review']),
(6,null,'Shopping',array['Shopping Vocabulary','Asking the Price','Colors & Sizes','Numbers & Money','Buying Something','Unit Review']),
(7,null,'Travel & Experiences',array['At the Station','At the Hotel','Sightseeing','Asking for Help','Travel Conversation','Unit Review']),
(8,null,'Beginner Final Journey',array['Greeting Challenge','Daily Life Challenge','Food Challenge','City Challenge','Travel Challenge','Final Beginner Review']);
create temporary table reused_lessons (id uuid primary key,unit_position integer,position integer) on commit drop;
insert into reused_lessons values
('973d6664-259a-415e-a2b1-aa08fe71306b',1,1),
('4a779a6e-843f-494d-ad97-cee11eda57a3',1,2),
('1ff41ea4-d5ea-417b-8191-cc8d1928bc84',1,3),
('ba7bc0a6-d26e-e894-9e2f-756683f5f12b',1,4),
('1ecd32f1-fd52-4dbb-8f93-d40392b6a528',1,5),
('69beefe2-3dc3-465b-b918-e446e8b709ca',1,6),
('55093eaa-3366-b53f-e82f-e0b9a67cb45e',2,1),
('5aa65196-db60-464d-2a4c-6bee7d92b7e6',4,2),
('49134800-ec00-2804-4057-0321cadc50e9',5,1),
('9444a40d-3762-44fc-f507-2615cd50b347',6,3);
do $migration$
declare
  course constant uuid := 'c293f603-993b-4332-8dd8-afc0fd50ae04';
  unit_row record; lesson_row record; offset_order integer; found_id uuid;
begin
  if not exists(select 1 from public.courses c join public.languages l on l.id=c.language_id
    where c.id=course and c.title='Japanese Beginner' and l.code='ja') then
    raise exception 'Course no longer matches audit'; end if;
  -- Refuse unknown units or lessons rather than silently reclassifying new work.
  if exists(select 1 from public.units u where u.course_id=course and not (
    u.id in (select existing_id from target_units where existing_id is not null)
    or u.id in ('14f6a633-e2b1-2ceb-497d-44fce4662be5'::uuid,'9e13f82e-c538-74d9-d791-e34da6f7cd6c'::uuid,'d49b00bb-9a58-670b-092d-c5906208c94e'::uuid)
    or u.title in ('Shopping','Travel & Experiences','Beginner Final Journey'))) then
    raise exception 'Unexpected unit: inspect before proceeding'; end if;
  for unit_row in select * from target_units order by position loop
    if unit_row.existing_id is not null then
      select id into strict found_id from public.units where id=unit_row.existing_id and course_id=course;
    else
      if (select count(*) from public.units where course_id=course and title=unit_row.title)>1 then
        raise exception 'Ambiguous target unit %',unit_row.title; end if;
      select id into found_id from public.units where course_id=course and title=unit_row.title;
    end if;
    update target_units set resolved_id=found_id where position=unit_row.position;
  end loop;
  -- Dynamic unused positive range avoids immediate uniqueness collisions.
  select coalesce(max(unit_order),0)+100 into offset_order from public.units where course_id=course;
  for unit_row in select id,row_number() over(order by unit_order,id)::integer as n
    from public.units where course_id=course loop
    update public.units set unit_order=offset_order+unit_row.n where id=unit_row.id;
  end loop;
  for unit_row in select * from target_units order by position loop
    found_id:=unit_row.resolved_id;
    if found_id is null then
      insert into public.units(course_id,title,unit_order,is_published)
      values(course,unit_row.title,unit_row.position,false) returning id into found_id;
      update target_units set resolved_id=found_id where position=unit_row.position;
    else
      update public.units set unit_order=unit_row.position,title=unit_row.title where id=found_id;
    end if;
  end loop;
  update public.units set is_published=false where course_id=course
    and id not in(select resolved_id from target_units);
  -- Verify all reused IDs still belong to this course; preserve their content/FKs.
  if (select count(*) from reused_lessons r join public.lessons l on l.id=r.id
    join public.units u on u.id=l.unit_id where u.course_id=course)<>10 then
    raise exception 'Reused lesson association differs from audit'; end if;
  if (select count(*) from public.lessons l join public.units u on u.id=l.unit_id
    where u.course_id=course and l.id in
    ('d89e8b91-8bf0-1092-fe5b-3179a295f7a1'::uuid,'49521111-6a03-456b-84d5-f6d0bbf46cf7'::uuid))<>2 then
    raise exception 'Historical lesson associations differ from audit'; end if;
  if exists(select 1 from public.vocabulary where lesson_id='49521111-6a03-456b-84d5-f6d0bbf46cf7')
    or exists(select 1 from public.activities where lesson_id='49521111-6a03-456b-84d5-f6d0bbf46cf7')
    or exists(select 1 from public.lesson_progress where lesson_id='49521111-6a03-456b-84d5-f6d0bbf46cf7') then
    raise exception 'Original Polite Expressions shell now has content/progress; mapping must be reviewed again'; end if;
  -- Temporary lesson orders, unique even while moving between units.
  select coalesce(max(l.lesson_order),0)+100 into offset_order from public.lessons l
    join public.units u on u.id=l.unit_id where u.course_id=course;
  for lesson_row in select l.id,row_number() over(order by l.id)::integer as n
    from public.lessons l join public.units u on u.id=l.unit_id where u.course_id=course loop
    update public.lessons set lesson_order=offset_order+lesson_row.n where id=lesson_row.id;
  end loop;
  -- Old Hello and goodbye and the replaced empty Polite Expressions survive.
  update public.lessons set is_published=false where id in
    ('d89e8b91-8bf0-1092-fe5b-3179a295f7a1'::uuid,'49521111-6a03-456b-84d5-f6d0bbf46cf7'::uuid);
  -- Move the replaced empty shell into an archived unit to retain six target slots.
  update public.lessons set unit_id='14f6a633-e2b1-2ceb-497d-44fce4662be5'
    where id='49521111-6a03-456b-84d5-f6d0bbf46cf7';
  for lesson_row in select r.*,u.resolved_id,u.lesson_titles[r.position] as title
    from reused_lessons r join target_units u on u.position=r.unit_position loop
    update public.lessons set unit_id=lesson_row.resolved_id,lesson_order=lesson_row.position,
      title=lesson_row.title where id=lesson_row.id;
  end loop;
  for unit_row in select * from target_units order by position loop
    for lesson_row in select title,ordinality::integer as position
      from unnest(unit_row.lesson_titles) with ordinality as titles(title,ordinality) loop
      if not exists(select 1 from reused_lessons where unit_position=unit_row.position and position=lesson_row.position) then
        if (select count(*) from public.lessons where unit_id=unit_row.resolved_id and title=lesson_row.title)>1 then
          raise exception 'Ambiguous existing shell %',lesson_row.title; end if;
        select id into found_id from public.lessons where unit_id=unit_row.resolved_id and title=lesson_row.title;
        if found_id is null then
          insert into public.lessons(unit_id,title,lesson_order,is_published)
            values(unit_row.resolved_id,lesson_row.title,lesson_row.position,false);
        else
          update public.lessons set lesson_order=lesson_row.position where id=found_id;
        end if;
      end if;
    end loop;
  end loop;
  -- Explicit known empty reused shells remain drafts. Stop if new content was
  -- added since inspection; do not infer readiness from vocabulary row counts.
  if exists(select 1 from public.vocabulary where lesson_id in
    ('4a779a6e-843f-494d-ad97-cee11eda57a3'::uuid,'1ff41ea4-d5ea-417b-8191-cc8d1928bc84'::uuid,
     '1ecd32f1-fd52-4dbb-8f93-d40392b6a528'::uuid,'69beefe2-3dc3-465b-b918-e446e8b709ca'::uuid))
    or exists(select 1 from public.activities where lesson_id in
    ('4a779a6e-843f-494d-ad97-cee11eda57a3'::uuid,'1ff41ea4-d5ea-417b-8191-cc8d1928bc84'::uuid,
     '1ecd32f1-fd52-4dbb-8f93-d40392b6a528'::uuid,'69beefe2-3dc3-465b-b918-e446e8b709ca'::uuid)) then
    raise exception 'An empty reused shell has gained content; review publication again'; end if;
  update public.lessons set is_published=false where id in
    ('4a779a6e-843f-494d-ad97-cee11eda57a3'::uuid,'1ff41ea4-d5ea-417b-8191-cc8d1928bc84'::uuid,
     '1ecd32f1-fd52-4dbb-8f93-d40392b6a528'::uuid,'69beefe2-3dc3-465b-b918-e446e8b709ca'::uuid);
  -- All eight target units represent the curriculum, including draft-only units.
  -- Six content-bearing reused lessons retain their existing publication flags.
  update public.units set is_published=true where id in(select resolved_id from target_units);
  if exists(select 1 from target_units t left join public.lessons l on l.unit_id=t.resolved_id
    group by t.position having count(l.id)<>6 or count(distinct l.lesson_order)<>6
      or min(l.lesson_order)<>1 or max(l.lesson_order)<>6) then
    raise exception 'Each target unit must have six unique lesson positions 1–6'; end if;
  if (select count(*) from public.lessons l where l.unit_id in(select resolved_id from target_units))<>48 then
    raise exception 'Target must contain exactly 48 lesson records'; end if;
  -- Same published-unit/published-lesson denominator as current roadmap/RPC.
  update public.course_progress cp set
    total_lessons=s.total,completed_lessons=s.completed,
    progress_percentage=case when s.total=0 then 0 else s.completed::numeric/s.total*100 end,
    updated_at=now()
  from (select cp2.id,count(l.id)::integer as total,
    count(l.id) filter(where lp.status='completed')::integer as completed
    from public.course_progress cp2
    left join public.units u on u.course_id=cp2.course_id and u.is_published
    left join public.lessons l on l.unit_id=u.id and l.is_published
    left join public.lesson_progress lp on lp.lesson_id=l.id and lp.user_id=cp2.user_id
    where cp2.course_id=course group by cp2.id) s where cp.id=s.id;
end;
$migration$;
commit;
