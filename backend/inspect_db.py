import sqlite3

conn = sqlite3.connect("scholarpulse.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
for r in cursor.execute("SELECT id, email, name, role, created_at, last_login FROM users").fetchall():
    print(dict(r))
