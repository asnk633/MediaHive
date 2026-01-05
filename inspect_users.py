import sqlite3
import os

db_path = 'dev.db'
if not os.path.exists(db_path):
    print("dev.db not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    print("Users table columns:")
    for col in columns:
        print(f"- {col[1]}")
    
    # Also list all rows just to see available emails
    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()
    print(f"\nFound {len(rows)} users")
    if len(rows) > 0:
        # Print first row to see data structure
        print(f"First user: {rows[0]}")

except Exception as e:
    print(f"Error querying users: {e}")

conn.close()
