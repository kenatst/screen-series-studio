create or replace function public.debit_credits(
  p_user_id uuid,
  p_amount integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_credits integer;
begin
  if p_amount is null or p_amount <= 0 then
    select credits into next_credits from public.profiles where id = p_user_id;
    return next_credits;
  end if;

  update public.profiles
  set credits = credits - p_amount
  where id = p_user_id
    and credits >= p_amount
  returning credits into next_credits;

  return next_credits;
end;
$$;

create or replace function public.credit_credits(
  p_user_id uuid,
  p_amount integer,
  p_cap integer default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_credits integer;
begin
  if p_amount is null or p_amount <= 0 then
    select credits into next_credits from public.profiles where id = p_user_id;
    return next_credits;
  end if;

  if p_cap is null or p_cap <= 0 then
    update public.profiles
    set credits = credits + p_amount
    where id = p_user_id
    returning credits into next_credits;
  else
    update public.profiles
    set credits = least(credits + p_amount, p_cap)
    where id = p_user_id
    returning credits into next_credits;
  end if;

  return next_credits;
end;
$$;
