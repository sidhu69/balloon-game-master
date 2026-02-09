-- Fix remaining security issues

-- Drop and recreate get_rankings with search_path
DROP FUNCTION IF EXISTS public.get_rankings(TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION public.get_rankings(
    period_type TEXT,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    total_score BIGINT,
    total_duration_seconds BIGINT,
    rank BIGINT
)
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
    SELECT 
        u.id as user_id,
        u.username,
        COALESCE(SUM(gs.score), 0)::BIGINT as total_score,
        COALESCE(SUM(gs.duration_seconds), 0)::BIGINT as total_duration_seconds,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(gs.score), 0) DESC)::BIGINT as rank
    FROM public.users u
    LEFT JOIN public.game_sessions gs ON u.id = gs.user_id 
        AND gs.played_at >= period_start 
        AND gs.played_at < period_end
    GROUP BY u.id, u.username
    ORDER BY total_score DESC;
$$;

-- Fix update_updated_at_column function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recreate trigger
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Drop and recreate the view properly with security_invoker
DROP VIEW IF EXISTS public.users_public;
CREATE VIEW public.users_public
WITH (security_invoker = true) AS
SELECT id, username, created_at
FROM public.users;