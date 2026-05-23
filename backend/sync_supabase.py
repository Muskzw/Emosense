#!/usr/bin/env python3
"""
EmoSense Supabase Synchronization Script
────────────────────────────────────────
Downloads face samples stored in the Supabase 'collected_samples' table
and restores them in the local dataset directory structure for CNN training.

Usage:
  pip install psycopg2-binary
  python sync_supabase.py
"""

import os
import base64
import sys
import hashlib
from pathlib import Path

# ── PARSE BACKEND .ENV / ENVIRONMENT VARIABLES ─────────────────────────────────
def load_db_url():
    # 1. Check environment variables first (for cloud runners/GitHub Actions)
    import os
    env_url = os.environ.get('DATABASE_URL')
    db_url = None
    if env_url:
        db_url = env_url
    else:
        # 2. Fallback to local .env file
        env_path = Path(__file__).resolve().parent / '.env'
        if not env_path.exists():
            print(f"Error: .env file not found at {env_path}")
            return None

        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('DATABASE_URL='):
                    db_url = line.split('=', 1)[1]
                    break

    if not db_url:
        return None

    # 3. Clean and sanitize the URL (removes quotes, whitespaces, or accidental prefix key)
    db_url = db_url.strip().strip("'\"")
    if db_url.startswith("DATABASE_URL="):
        db_url = db_url.split("DATABASE_URL=", 1)[1].strip().strip("'\"")
        
    return db_url

def main():
    print("--- EmoSense Supabase Dataset Sync Utility ---")

    # Install psycopg2-binary automatically if not present
    try:
        import psycopg2
    except ImportError:
        print("[psycopg2] Missing. Attempting to install psycopg2-binary...")
        import subprocess
        import sys
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
        import psycopg2
        print("[psycopg2] Successfully installed!")

    db_url = load_db_url()
    if not db_url:
        print("Fatal: Could not parse DATABASE_URL from .env")
        sys.exit(1)

    # Normalize connection string prefix (e.g. postgres:// to postgresql://)
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    print("Connecting to Supabase PostgreSQL database...")
    try:
        # Robust manual parser to handle passwords containing '@' symbols
        if db_url.startswith("postgresql://"):
            clean_str = db_url[len("postgresql://"):]
            if '@' in clean_str:
                creds, connection_part = clean_str.rsplit('@', 1)
                
                # Parse user & password
                if ':' in creds:
                    user, password = creds.split(':', 1)
                else:
                    user = creds
                    password = ""
                
                # Parse host, port, db
                if '/' in connection_part:
                    host_port, db = connection_part.split('/', 1)
                else:
                    host_port = connection_part
                    db = "postgres"
                    
                if ':' in host_port:
                    host, port = host_port.split(':', 1)
                else:
                    host = host_port
                    port = "5432"
                
                conn = psycopg2.connect(
                    user=user,
                    password=password,
                    host=host,
                    port=port,
                    database=db
                )
            else:
                conn = psycopg2.connect(db_url)
        else:
            conn = psycopg2.connect(db_url)
            
        cur = conn.cursor()
    except Exception as e:
        print(f"Fatal Connection Error: {e}")
        sys.exit(1)

    # Check if table exists
    try:
        cur.execute("SELECT to_regclass('public.collected_samples');")
        if not cur.fetchone()[0]:
            print("Error: The 'collected_samples' table does not exist in Supabase yet.")
            print("Please start the Node.js server first to initialize the tables.")
            cur.close()
            conn.close()
            sys.exit(1)
    except Exception as e:
        print(f"Error checking table: {e}")
        sys.exit(1)

    # Retrieve all collected samples
    print("Fetching collected samples from 'collected_samples'...")
    try:
        cur.execute("""
            SELECT id, image_b64, emotion, confidence, culture 
            FROM collected_samples 
            ORDER BY id ASC
        """)
        rows = cur.fetchall()
    except Exception as e:
        print(f"Database query failed: {e}")
        cur.close()
        conn.close()
        sys.exit(1)

    # Local dataset base directory (matches what data_pipeline.py uses)
    base_dir = Path(__file__).resolve().parent / 'emosense-dataset'
    # Always create the base directory on startup so downstream scripts don't crash
    base_dir.mkdir(parents=True, exist_ok=True)

    total_records = len(rows)
    print(f"Found {total_records} total samples in the cloud database.")

    if total_records == 0:
        print("No samples to synchronize. Exiting.")
        cur.close()
        conn.close()
        sys.exit(0)

    synced_count = 0
    skipped_count = 0
    error_count = 0

    for record in rows:
        rec_id, image_b64, emotion, confidence, culture = record
        
        emotion = str(emotion).lower().strip()
        culture = str(culture).upper().strip()
        confidence = float(confidence)

        # ── DECODE IMAGE
        try:
            # Strip base64 headers if present (e.g. "data:image/png;base64,")
            if ',' in image_b64:
                header, raw_b64 = image_b64.split(',', 1)
            else:
                raw_b64 = image_b64

            img_bytes = base64.b64decode(raw_b64)
        except Exception as err:
            print(f"  [Error] Failed to decode image for record ID {rec_id}: {err}")
            error_count += 1
            continue

        # ── ANONYMIZED FILENAME GENERATION
        # Hash the decoded PNG bytes to get a unique identifier (matches local logic)
        img_hash = hashlib.md5(img_bytes).hexdigest()[:12]
        
        # Format: {hash}_{culture}_{confidence_scaled}.png (e.g. a3b5c6d7e8f9_ZW_085.png)
        confidence_scaled = int(confidence * 100)
        filename = f"{img_hash}_{culture}_{confidence_scaled:03d}.png"

        # ── ENSURE TARGET FOLDER EXISTS
        target_dir = base_dir / emotion / culture
        target_dir.mkdir(parents=True, exist_ok=True)

        target_file = target_dir / filename

        # ── SAVE
        if target_file.exists():
            skipped_count += 1
        else:
            try:
                with open(target_file, 'wb') as f:
                    f.write(img_bytes)
                synced_count += 1
            except Exception as err:
                print(f"  [Error] Failed to write file {target_file}: {err}")
                error_count += 1

    cur.close()
    conn.close()

    print("\n--- Synchronization Complete! ---")
    print(f"Successfully downloaded & saved: {synced_count} new images")
    print(f"Already existed locally (skipped): {skipped_count} images")
    if error_count > 0:
        print(f"Errors encountered:               {error_count} records")
    print(f"Dataset path:                      {base_dir.resolve()}")

if __name__ == '__main__':
    main()
