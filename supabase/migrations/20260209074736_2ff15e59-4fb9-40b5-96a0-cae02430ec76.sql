-- Drop and recreate calculate_prize_pool with correct search_path
DROP FUNCTION IF EXISTS public.calculate_prize_pool(TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION public.calculate_prize_pool(
    period_type TEXT,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    total_hours DECIMAL,
    total_amount DECIMAL,
    first_prize DECIMAL,
    second_prize DECIMAL,
    third_prize DECIMAL
)
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
    WITH gameplay_stats AS (
        SELECT 
            COALESCE(SUM(duration_seconds) / 3600.0, 0) as hours_played
        FROM public.game_sessions
        WHERE played_at >= period_start AND played_at < period_end
    ),
    base_amounts AS (
        SELECT 
            hours_played,
            (hours_played / 5.0) * 1.0 as earned_amount
        FROM gameplay_stats
    )
    SELECT 
        hours_played as total_hours,
        earned_amount as total_amount,
        CASE 
            WHEN period_type = 'daily' THEN earned_amount * 0.10 / 0.22
            WHEN period_type = 'weekly' THEN earned_amount * 0.05 / 0.22
            WHEN period_type = 'monthly' THEN earned_amount * 0.025 / 0.22
            WHEN period_type = 'annual' THEN earned_amount * 0.0125 / 0.22
        END as first_prize,
        CASE 
            WHEN period_type = 'daily' THEN earned_amount * 0.07 / 0.22
            WHEN period_type = 'weekly' THEN earned_amount * 0.035 / 0.22
            WHEN period_type = 'monthly' THEN earned_amount * 0.0175 / 0.22
            WHEN period_type = 'annual' THEN earned_amount * 0.00875 / 0.22
        END as second_prize,
        CASE 
            WHEN period_type = 'daily' THEN earned_amount * 0.05 / 0.22
            WHEN period_type = 'weekly' THEN earned_amount * 0.025 / 0.22
            WHEN period_type = 'monthly' THEN earned_amount * 0.0125 / 0.22
            WHEN period_type = 'annual' THEN earned_amount * 0.00625 / 0.22
        END as third_prize
    FROM base_amounts;
$$;