import sqlite3

conn = sqlite3.connect('rpg_system.db')
cursor = conn.cursor()

print("=== CHARACTERS ===")
cursor.execute("SELECT id, name, tipo, user_id FROM characters LIMIT 10")
for row in cursor.fetchall():
    print(f"ID: {row[0]}, Name: {row[1]}, Tipo: {row[2]}, User ID: {row[3]}")

print("\n=== CHARACTER_REQUESTS ===")
cursor.execute("SELECT id, name, user_id, status FROM character_requests ORDER BY id DESC LIMIT 5")
for row in cursor.fetchall():
    print(f"ID: {row[0]}, Name: {row[1]}, User ID: {row[2]}, Status: {row[3]}")

conn.close()
