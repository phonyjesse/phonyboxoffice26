#!/usr/bin/env node

/**
 * Migration script to copy movies from original Supabase to Phony Supabase
 */

const ORIGINAL_URL = 'https://puzfyltsipetkzwhdinw.supabase.co';
const ORIGINAL_KEY = 'sb_publishable_OXxAvK5ohjhMNa1oSjaSng_TjCChjDu';

const PHONY_URL = 'https://feevusglessjovdiyaxg.supabase.co';
const PHONY_SERVICE_KEY = 'sb_secret_-Vz75JZDReAMAoy5iYX9EA_3rrpInqp';

async function fetchMovies() {
  console.log('Fetching movies from original database...');

  const response = await fetch(`${ORIGINAL_URL}/rest/v1/movies`, {
    method: 'GET',
    headers: {
      'apikey': ORIGINAL_KEY,
      'Authorization': `Bearer ${ORIGINAL_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch movies: ${response.status} - ${error}`);
  }

  const movies = await response.json();
  console.log(`Retrieved ${movies.length} movies from original database`);
  return movies;
}

async function insertMovies(movies) {
  console.log('Inserting movies into Phony database...');

  const response = await fetch(`${PHONY_URL}/rest/v1/movies`, {
    method: 'POST',
    headers: {
      'apikey': PHONY_SERVICE_KEY,
      'Authorization': `Bearer ${PHONY_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(movies),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to insert movies: ${response.status} - ${error}`);
  }

  console.log(`Successfully inserted ${movies.length} movies into Phony database`);
  return movies.length;
}

async function main() {
  try {
    const movies = await fetchMovies();
    const count = await insertMovies(movies);
    console.log('\nMigration complete!');
    console.log(`Total movies migrated: ${count}`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

main();
