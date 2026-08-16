#!/usr/bin/env python3
"""
Kaikki Dictionary Import Script for AdultEdu
============================================
Imports the 2.6GB kaikki-english.jsonl file into PostgreSQL.

Usage:
    cd backend
    python scripts/import_kaikki.py

Requirements:
    pip install psycopg2-binary python-dotenv

Estimated time: 30-60 minutes for ~1M entries
"""

import json
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path

# Load environment
from dotenv import load_dotenv

# Try to load .env from backend directory
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

# PostgreSQL connection
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in .env")
    sys.exit(1)

# Kaikki source file
KAIKKI_PATH = Path("/Users/mobolaji/rackrush/server/data/kaikki-english.jsonl")

# Batch size for bulk inserts
BATCH_SIZE = 1000

def parse_database_url(url: str) -> dict:
    """Parse PostgreSQL URL into connection params."""
    # postgresql://user:pass@host:port/dbname
    import re
    pattern = r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)'
    match = re.match(pattern, url)
    if not match:
        raise ValueError(f"Invalid DATABASE_URL format: {url}")
    return {
        "user": match.group(1),
        "password": match.group(2),
        "host": match.group(3),
        "port": int(match.group(4)),
        "dbname": match.group(5).split("?")[0],  # Remove query params
    }


def extract_definition(entry: dict) -> dict | None:
    """Extract fields from a Kaikki entry."""
    word = entry.get("word", "").strip()
    if not word or len(word) < 2 or len(word) > 50:
        return None
    
    # Skip non-English entries
    if entry.get("lang_code") != "en" and entry.get("lang") != "English":
        return None
    
    # Get part of speech
    pos = entry.get("pos", "word")
    
    # Get first definition from senses
    senses = entry.get("senses", [])
    if not senses:
        return None
    
    definition = None
    examples = []
    
    for sense in senses:
        # Get glosses (definitions)
        glosses = sense.get("glosses", [])
        raw_glosses = sense.get("raw_glosses", [])
        
        if glosses:
            definition = glosses[0]
            break
        elif raw_glosses:
            definition = raw_glosses[0]
            break
    
    if not definition:
        return None
    
    # Get examples
    for sense in senses:
        for ex in sense.get("examples", []):
            text = ex.get("text", "")
            if text and len(text) < 500:
                examples.append(text)
                if len(examples) >= 3:
                    break
        if len(examples) >= 3:
            break
    
    # Get IPA pronunciation
    ipa = None
    sounds = entry.get("sounds", [])
    for sound in sounds:
        if "ipa" in sound:
            ipa = sound["ipa"]
            break
    
    # Get etymology
    etymology = entry.get("etymology_text", "")
    if len(etymology) > 1000:
        etymology = etymology[:1000] + "..."
    
    return {
        "id": str(uuid.uuid4()),
        "word": word.upper(),
        "pos": pos,
        "definition": definition[:2000] if len(definition) > 2000 else definition,
        "examples": json.dumps(examples) if examples else None,
        "ipa": ipa,
        "etymology": etymology if etymology else None,
        "synonyms": None,  # Can be enhanced later
        "antonyms": None,
        "tags": None,
        "created_at": datetime.utcnow(),
    }


def main():
    import psycopg2
    from psycopg2.extras import execute_values
    
    print(f"Kaikki Import for AdultEdu")
    print(f"=" * 50)
    print(f"Source: {KAIKKI_PATH}")
    print(f"File size: {KAIKKI_PATH.stat().st_size / (1024**3):.2f} GB")
    print()
    
    # Connect to PostgreSQL
    conn_params = parse_database_url(DATABASE_URL)
    print(f"Connecting to {conn_params['host']}:{conn_params['port']}/{conn_params['dbname']}...")
    
    conn = psycopg2.connect(**conn_params)
    cur = conn.cursor()
    
    # Check if table exists
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'definitions'
        );
    """)
    if not cur.fetchone()[0]:
        print("ERROR: 'definitions' table does not exist.")
        print("Run: npx prisma migrate dev --name add_definitions")
        sys.exit(1)
    
    # Clear existing data (optional - comment out to append)
    print("Clearing existing definitions...")
    cur.execute("DELETE FROM definitions;")
    conn.commit()
    
    # Import
    print(f"Importing from {KAIKKI_PATH.name}...")
    
    batch = []
    total = 0
    duplicates = 0
    seen_words = set()
    
    with open(KAIKKI_PATH, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            if not line.strip():
                continue
            
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            
            parsed = extract_definition(entry)
            if not parsed:
                continue
            
            # Skip duplicates (keep first occurrence)
            if parsed["word"] in seen_words:
                duplicates += 1
                continue
            seen_words.add(parsed["word"])
            
            batch.append((
                parsed["id"],
                parsed["word"],
                parsed["pos"],
                parsed["definition"],
                parsed["examples"],
                parsed["ipa"],
                parsed["etymology"],
                parsed["synonyms"],
                parsed["antonyms"],
                parsed["tags"],
                parsed["created_at"],
            ))
            
            if len(batch) >= BATCH_SIZE:
                execute_values(
                    cur,
                    """
                    INSERT INTO definitions 
                    (id, word, pos, definition, examples, ipa, etymology, synonyms, antonyms, tags, created_at)
                    VALUES %s
                    ON CONFLICT (word) DO NOTHING
                    """,
                    batch
                )
                conn.commit()
                total += len(batch)
                print(f"  Imported {total:,} entries (line {line_num:,}, skipped {duplicates:,} dupes)...", end="\r")
                batch = []
    
    # Final batch
    if batch:
        execute_values(
            cur,
            """
            INSERT INTO definitions 
            (id, word, pos, definition, examples, ipa, etymology, synonyms, antonyms, tags, created_at)
            VALUES %s
            ON CONFLICT (word) DO NOTHING
            """,
            batch
        )
        conn.commit()
        total += len(batch)
    
    print()
    print(f"=" * 50)
    print(f"COMPLETE!")
    print(f"  Total entries: {total:,}")
    print(f"  Duplicates skipped: {duplicates:,}")
    
    # Verify
    cur.execute("SELECT COUNT(*) FROM definitions;")
    count = cur.fetchone()[0]
    print(f"  Database count: {count:,}")
    
    # Sample
    cur.execute("SELECT word, pos, definition FROM definitions LIMIT 5;")
    print(f"\nSample entries:")
    for row in cur.fetchall():
        print(f"  {row[0]} ({row[1]}): {row[2][:60]}...")
    
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
