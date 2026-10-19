-- Keep Japanese lesson city names consistent with the unit shown on the roadmap.
-- This changes display names only; lesson IDs, ordering, content and progress remain intact.
begin;

-- Correct the original convenience-store scene for existing seeded destinations.
update public.units u
set location_name = 'Osaka Convenience Store'
from public.courses c
join public.languages lang on lang.id = c.language_id
where u.course_id = c.id and lang.code = 'ja'
  and u.location_name = 'Tokyo Convenience Store';

update public.units u
set title = 'Osaka Convenience Store'
from public.courses c
join public.languages lang on lang.id = c.language_id
where u.course_id = c.id and lang.code = 'ja'
  and u.title = 'Tokyo Convenience Store';

-- Use the actual destination label, rather than unit order or a hard-coded course ID.
-- Unknown or country-wide destinations are left as authored.
with destinations as (
  select u.id,
    substring(coalesce(nullif(u.location_name, ''), u.title) from
      '\m(Tokyo|Osaka|Kyoto|Nara|Kobe|Nagoya|Yokohama|Hiroshima|Fukuoka|Sapporo|Sendai|Kanazawa|Nagasaki|Naha|Hakone|Nikko|Kamakura)\M') as city
  from public.units u
  join public.courses c on c.id = u.course_id
  join public.languages lang on lang.id = c.language_id
  where lang.code = 'ja'
), corrected as (
  select l.id, regexp_replace(l.title,
    '\m(Tokyo|Osaka|Kyoto|Nara|Kobe|Nagoya|Yokohama|Hiroshima|Fukuoka|Sapporo|Sendai|Kanazawa|Nagasaki|Naha|Hakone|Nikko|Kamakura)\M',
    d.city, 'g') as title
  from public.lessons l
  join destinations d on d.id = l.unit_id
  where d.city is not null
)
update public.lessons l set title = corrected.title
from corrected where l.id = corrected.id and l.title is distinct from corrected.title;

commit;
