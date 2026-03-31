#DATABASE PY      
import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Riya@1234",  # replace this
        database="online_exam"
    )

# TEST CONNECTION
if __name__ == "__main__":
    try:
        conn = get_connection()
        print("✅ Connected successfully!")
        conn.close()
    except Exception as e:
        print("❌ Connection failed:", e)