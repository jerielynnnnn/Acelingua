-- PROPOSED / NOT APPLIED. Review before applying.
-- Shared rule: 100 total XP per account level. Never lower historical saved levels.
-- A profile trigger covers lessons, missions, achievements and other XP reward sources.
begin;
create function public.acelingua_sync_xp_level()
returns trigger language plpgsql set search_path='' as $$
begin
 new.level:=greatest(case when tg_op='UPDATE' then old.level else 1 end,
   coalesce(new.level,1),(new.xp/100)+1);
 return new;
end; $$;
revoke all on function public.acelingua_sync_xp_level() from public,anon,authenticated;
create trigger acelingua_profile_xp_level before insert or update of xp on public.profiles
for each row execute function public.acelingua_sync_xp_level();
update public.profiles set level=greatest(level,(xp/100)+1) where level<(xp/100)+1;
commit;
