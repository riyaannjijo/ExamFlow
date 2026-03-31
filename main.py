#MAIN.PY      
from database import get_connection
import student
import admin

def signup():
    conn = get_connection()
    cursor = conn.cursor()

    print("\n===== SIGN UP =====")

    f_name = input("First Name: ")
    middle_name = input("Middle Name (optional): ")
    l_name = input("Last Name: ")
    email = input("Email: ")
    password = input("Password: ")
    role = input("Role (student/supervisor): ").lower()

    try:
        cursor.execute(
            """
            INSERT INTO users 
            (F_NAME, MIDDLE_NAME, L_NAME, EMAIL_ID, PASSWORD, ROLE)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (f_name, middle_name or None, l_name, email, password, role)
        )

        conn.commit()
        print("User registered successfully!")

    except Exception as e:
        print("Error:", e)

    conn.close()
def login():
    conn = get_connection()
    cursor = conn.cursor()
    print("===== ONLINE EXAM SYSTEM =====")
    email = input("Enter your email: ")
    password = input("Enter your password: ")

    cursor.execute(
    """SELECT USER_ID, F_NAME, MIDDLE_NAME, L_NAME, ROLE 
    FROM users 
    WHERE EMAIL_ID=%s AND PASSWORD=%s
    """,(email, password))

    user = cursor.fetchone()
    if user:
        full_name = f"{user[1]} {user[2] or ''} {user[3]}"
        print(f"\nWelcome {full_name}!")
        role = user[4]

        if role == "student":
            student.student_menu(user[0])
        elif role == "supervisor":
            admin.admin_menu(user[0])
        else:
            print("Invalid role.")
    else:
        print("User not found!")

    conn.close()
def main_menu():
    while True:
        print("\n===== ONLINE EXAM SYSTEM =====")
        print("1. Login")
        print("2. Sign Up")
        print("3. Exit")

        choice = input("Enter choice: ")

        if choice == "1":
            login()
        elif choice == "2":
            signup()
        elif choice == "3":
            print("Exiting system...")
            break
        else:
            print("Invalid choice. Try again.")
if __name__ == "__main__":
    main_menu()