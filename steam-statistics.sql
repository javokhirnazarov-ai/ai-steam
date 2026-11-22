-- Isolated data for the public site. No personal details or IP addresses are stored.
create schema if not exists steam_private;
revoke all on schema steam_private from public, anon, authenticated;
create table if not exists steam_private.visitors (
  browser_id uuid primary key,
  page_views bigint not null default 1 check (page_views > 0)
);
revoke all on steam_private.visitors from public, anon, authenticated;

-- Public, narrowly scoped operation: increment one browser and return aggregate counts.
create or replace function public.steam_statistics(visitor_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare result jsonb;
begin
  if visitor_id is null then raise exception 'visitor_id is required'; end if;
  insert into steam_private.visitors as v (browser_id, page_views)
  values (visitor_id, 1)
  on conflict (browser_id) do update set page_views = v.page_views + 1;
  select pg_catalog.jsonb_build_object('visitors', pg_catalog.count(*), 'views', coalesce(pg_catalog.sum(page_views), 0))
    into result from steam_private.visitors;
  return result;
end;
$$;
revoke all on function public.steam_statistics(uuid) from public, anon, authenticated;
grant execute on function public.steam_statistics(uuid) to anon, authenticated;
