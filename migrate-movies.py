#!/usr/bin/env python3

import requests
import json
import sys

ORIGINAL_URL = 'https://puzfyltsipetkzwhdinw.supabase.co'
ORIGINAL_KEY = 'sb_publishable_OXxAvK5ohjhMNa1oSjaSng_TjCChjDu'

PHONY_URL = 'https://feevusglessjovdiyaxg.supabase.co'
PHONY_SERVICE_KEY = 'sb_secret_-Vz75JZDReAMAoy5iYX9EA_3rrpInqp'

def fetch_movies():
    """Fetch all movies from original database"""
    print('Fetching movies from original database...')

    headers = {
        'apikey': ORIGINAL_KEY,
        'Authorization': f'Bearer {ORIGINAL_KEY}',
        'Content-Type': 'application/json',
    }

    url = f'{ORIGINAL_URL}/rest/v1/movies'

    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f'Failed to fetch movies: {e}')
        return None

    movies = response.json()
    print(f'Retrieved {len(movies)} movies from original database')
    return movies

def insert_movies(movies):
    """Insert movies into Phony database"""
    print('Inserting movies into Phony database...')

    headers = {
        'apikey': PHONY_SERVICE_KEY,
        'Authorization': f'Bearer {PHONY_SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
    }

    url = f'{PHONY_URL}/rest/v1/movies'

    try:
        response = requests.post(url, headers=headers, json=movies, timeout=30)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f'Failed to insert movies: {e}')
        return 0

    print(f'Successfully inserted {len(movies)} movies into Phony database')
    return len(movies)

def main():
    movies = fetch_movies()
    if movies is None or len(movies) == 0:
        print('No movies to migrate')
        sys.exit(1)

    count = insert_movies(movies)

    print('\nMigration complete!')
    print(f'Total movies migrated: {count}')
    sys.exit(0)

if __name__ == '__main__':
    main()
