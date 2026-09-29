import sys
import os
import uuid
import sqlite3
import json

sys.path.insert(0, os.path.abspath('backend'))
from app.core.security import hash_password

db_path = os.path.abspath('backend/st_seva.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

# 1. officer@stseva.gov.in
officer_pw = hash_password('Officer@1234')
c.execute("SELECT id FROM users WHERE email = 'officer@stseva.gov.in'")
row = c.fetchone()
if row:
    c.execute("UPDATE users SET hashed_password = ?, is_active = 1, role = 'OFFICER', failed_login_attempts = 0 WHERE id = ?", (officer_pw, row[0]))
    print("Updated officer@stseva.gov.in")
else:
    uid = str(uuid.uuid4())
    c.execute(
        "INSERT INTO users (id, email, hashed_password, role, is_active, is_verified, failed_login_attempts) VALUES (?, 'officer@stseva.gov.in', ?, 'OFFICER', 1, 1, 0)",
        (uid, officer_pw)
    )
    c.execute(
        "INSERT INTO officer_profiles (id, user_id, full_name, designation, department, state, district, office_address, employee_id, assigned_schemes) VALUES (?, ?, 'Smt. Pratibha Soren', 'District Welfare Officer (DWO)', 'Tribal Welfare Department', 'Jharkhand', 'Ranchi', 'Collectorate Compound, Ranchi', 'DWO-JH-001', ?)",
        (str(uuid.uuid4()), uid, json.dumps(["ST_POST_MATRIC", "ST_PRE_MATRIC"]))
    )
    print("Created officer@stseva.gov.in and profile")

# 2. admin@stseva.gov.in
admin_pw = hash_password('Admin@1234')
c.execute("SELECT id FROM users WHERE email = 'admin@stseva.gov.in'")
row = c.fetchone()
if row:
    c.execute("UPDATE users SET hashed_password = ?, is_active = 1, role = 'SUPER_ADMIN', failed_login_attempts = 0 WHERE id = ?", (admin_pw, row[0]))
    print("Updated admin@stseva.gov.in")
else:
    uid = str(uuid.uuid4())
    c.execute(
        "INSERT INTO users (id, email, hashed_password, role, is_active, is_verified, failed_login_attempts) VALUES (?, 'admin@stseva.gov.in', ?, 'SUPER_ADMIN', 1, 1, 0)",
        (uid, admin_pw)
    )
    print("Created admin@stseva.gov.in")

# 3. Also ensure officer.ranchi@stseva.gov.in has Officer@1234
c.execute("SELECT id FROM users WHERE email = 'officer.ranchi@stseva.gov.in'")
row = c.fetchone()
if row:
    c.execute("UPDATE users SET hashed_password = ?, is_active = 1, failed_login_attempts = 0 WHERE id = ?", (officer_pw, row[0]))
    print("Updated officer.ranchi@stseva.gov.in")

# 4. Student account
student_pw = hash_password('Student@1234')
c.execute("SELECT id FROM users WHERE email = 'student@stseva.gov.in'")
row = c.fetchone()
if row:
    c.execute("UPDATE users SET hashed_password = ?, is_active = 1, failed_login_attempts = 0 WHERE id = ?", (student_pw, row[0]))
    print("Updated student@stseva.gov.in")

conn.commit()
conn.close()
print("Default credentials successfully seeded and verified!")
