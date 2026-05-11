import sqlite3
import sys

db_path = "rpg_system.db"

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if user table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
    if cursor.fetchone():
        cursor.execute("SELECT COUNT(*) FROM users;")
        count = cursor.fetchone()[0]
        print(f"✓ Database exists with {count} users")
        
        cursor.execute("SELECT id, login, role FROM users;")
        for user in cursor.fetchall():
            print(f"  - ID: {user[0]}, Login: {user[1]}, Role: {user[2]}")
    else:
        print("✗ Users table not found in database")
        print("Database tables:")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        for table in cursor.fetchall():
            print(f"  - {table[0]}")
    
    conn.close()
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

