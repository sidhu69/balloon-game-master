-- Create users table for username/password authentication
CREATE TABLE public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game sessions table to track gameplay time
CREATE TABLE public.game_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table for winner announcements
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    prize_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ranking_type TEXT NOT NULL CHECK (ranking_type IN ('daily', 'weekly', 'monthly', 'annual')),
    ranking_position INTEGER NOT NULL CHECK (ranking_position >= 1 AND ranking_position <= 3),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create prize pool tracking table
CREATE TABLE public.prize_pools (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'annual')),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_distributed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX idx_game_sessions_played_at ON public.game_sessions(played_at);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unlocked_at ON public.notifications(unlocked_at);
CREATE INDEX idx_prize_pools_period ON public.prize_pools(period_type, period_start);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_pools ENABLE ROW LEVEL SECURITY;

-- Users table policies (public read for rankings, no direct password access)
CREATE POLICY "Users can view all usernames for rankings"
ON public.users FOR SELECT
USING (true);

CREATE POLICY "Anyone can register"
ON public.users FOR INSERT
WITH CHECK (true);

-- Game sessions policies
CREATE POLICY "Anyone can view game sessions for rankings"
ON public.game_sessions FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert game sessions"
ON public.game_sessions FOR INSERT
WITH CHECK (true);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (true);

-- Prize pools policies (public read)
CREATE POLICY "Anyone can view prize pools"
ON public.prize_pools FOR SELECT
USING (true);

-- Create a view for safe user data (without password)
CREATE VIEW public.users_public AS
SELECT id, username, created_at
FROM public.users;

-- Function to get rankings by period
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

-- Function to calculate prize pool
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
            (hours_played / 5.0) * 1.0 as earned_amount  -- 5 hours = 1 rs
        FROM gameplay_stats
    )
    SELECT 
        hours_played as total_hours,
        earned_amount as total_amount,
        CASE 
            WHEN period_type = 'daily' THEN earned_amount * 0.10 / 0.22  -- 10rs proportion
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

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();