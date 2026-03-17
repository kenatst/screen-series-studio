-- Atomic credit deduction: returns new balance or NULL if insufficient
CREATE OR REPLACE FUNCTION public.debit_credits(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
  UPDATE profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id AND credits >= p_amount
  RETURNING credits INTO new_balance;

  RETURN new_balance; -- NULL if no row matched (insufficient credits)
END;
$$;

-- Atomic credit addition with optional cap: returns new balance
CREATE OR REPLACE FUNCTION public.credit_credits(p_user_id uuid, p_amount integer, p_cap integer DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
  IF p_cap IS NOT NULL THEN
    UPDATE profiles
    SET credits = LEAST(credits + p_amount, p_cap)
    WHERE id = p_user_id
    RETURNING credits INTO new_balance;
  ELSE
    UPDATE profiles
    SET credits = credits + p_amount
    WHERE id = p_user_id
    RETURNING credits INTO new_balance;
  END IF;

  RETURN new_balance;
END;
$$;