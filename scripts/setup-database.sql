-- Phony Box Office Game Database Schema
-- Run this in the Supabase SQL Editor to set up the database

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create movies table
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  release_date DATE NOT NULL,
  opening_weekend_gross NUMERIC,
  status TEXT,
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create picks table
CREATE TABLE IF NOT EXISTS picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  rank INTEGER,
  is_alternate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, movie_id)
);

-- Create weekly_grosses table
CREATE TABLE IF NOT EXISTS weekly_grosses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  gross_millions NUMERIC NOT NULL,
  week_start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create player_standings view
CREATE OR REPLACE VIEW player_standings AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  COALESCE(SUM(wg.gross_millions * (16 - pk.rank)), 0) AS total_score
FROM players p
LEFT JOIN picks pk ON p.id = pk.player_id AND pk.is_alternate = FALSE
LEFT JOIN movies m ON pk.movie_id = m.id
LEFT JOIN weekly_grosses wg ON m.id = wg.movie_id
WHERE wg.week_start_date IS NULL OR wg.week_start_date < '2026-10-01'
GROUP BY p.id, p.name
ORDER BY total_score DESC;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_picks_player_id ON picks(player_id);
CREATE INDEX IF NOT EXISTS idx_picks_movie_id ON picks(movie_id);
CREATE INDEX IF NOT EXISTS idx_weekly_grosses_movie_id ON weekly_grosses(movie_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_grosses ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (true);
CREATE POLICY "Movies are viewable by everyone" ON movies FOR SELECT USING (true);
CREATE POLICY "Picks are viewable by everyone" ON picks FOR SELECT USING (true);
CREATE POLICY "Weekly grosses are viewable by everyone" ON weekly_grosses FOR SELECT USING (true);

-- Allow authenticated inserts/updates (you can restrict this further)
CREATE POLICY "Enable insert for authenticated users" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users" ON movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users" ON picks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users" ON weekly_grosses FOR INSERT WITH CHECK (true);
