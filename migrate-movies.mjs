#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const ORIGINAL_URL = 'https://puzfyltsipetkzwhdinw.supabase.co';
const ORIGINAL_KEY = 'sb_publishable_OXxAvK5ohjhMNa1oSjaSng_TjCChjDu';

const PHONY_URL = 'https://feevusglessjovdiyaxg.supabase.co';
const PHONY_SERVICE_KEY = 'sb_secret_-Vz75JZDReAMAoy5iYX9EA_3rrpInqp';

async function migrateMovies() {
  try {
    console.log('Connecting to original database...');
    const originalSupabase = createClient(ORIGINAL_URL, ORIGINAL_KEY);

    console.log('Fetching movies from original database...');
    const { data: movies, error: fetchError } = await originalSupabase
      .from('movies')
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch movies: ${fetchError.message}`);
    }

    if (!movies || movies.length === 0) {
      console.log('No movies found in original database');
      return 0;
    }

    console.log(`Retrieved ${movies.length} movies from original database`);

    console.log('Connecting to Phony database...');
    const phonySupabase = createClient(PHONY_URL, PHONY_SERVICE_KEY);

    console.log('Inserting movies into Phony database...');
    const { error: insertError, data } = await phonySupabase
      .from('movies')
      .insert(movies)
      .select();

    if (insertError) {
      throw new Error(`Failed to insert movies: ${insertError.message}`);
    }

    console.log(`Successfully inserted ${movies.length} movies into Phony database`);
    return movies.length;
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrateMovies().then(count => {
  console.log('\nMigration complete!');
  console.log(`Total movies migrated: ${count}`);
  process.exit(0);
});
