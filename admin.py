#ADMIN.PY          
from database import get_connection

def admin_menu(user_id):
    while True:
        print("\n===== ADMIN DASHBOARD =====")
        print("1. Create Quiz")
        print("2. View My Quizzes")
        print("3. View Results")
        print("4. Logout")

        choice = input("Enter choice: ")

        if choice == "1":
            create_quiz(user_id)
        elif choice == "2":
            view_my_quizzes(user_id)
        elif choice == "3":
            view_results(user_id)
        elif choice == "4":
            print("Logging out...")
            break
        else:
            print("Invalid choice.")

def create_quiz(user_id):
    from database import get_connection
    conn = get_connection()
    cursor = conn.cursor()

    quiz_name = input("Enter quiz name: ")
    total_marks = int(input("Enter total marks: "))

    # Insert quiz with creator id
    cursor.execute(
        "INSERT INTO quizzes (USER_ID, quiz_name, total_marks) VALUES (%s, %s, %s)",
        (user_id, quiz_name, total_marks)
    )
    conn.commit()

    # Get last inserted quiz_id
    quiz_id = cursor.lastrowid

    print("Quiz created successfully!")

    # Ask to add questions
    add_questions(quiz_id)

    conn.close()
def add_questions(quiz_id):
    from database import get_connection
    conn = get_connection()
    cursor = conn.cursor()

    n = int(input("How many questions to add? "))

    for i in range(n):
        print(f"\nEnter details for Question {i+1}")
        question_text = input("Question: ")
        option1 = input("Option 1: ")
        option2 = input("Option 2: ")
        option3 = input("Option 3: ")
        option4 = input("Option 4: ")
        correct_option = input("Correct option (A/B/C/D): ").upper()
        cursor.execute("""
    INSERT INTO questions (QUIZ_ID, QUESTION_TEXT, OPTION_A, OPTION_B, OPTION_C, OPTION_D, CORRECT_OPTION)
    VALUES (%s,%s,%s,%s,%s,%s,%s)""", (quiz_id, question_text, option1, option2, option3, option4, correct_option))

    conn.commit()
    print("Questions added successfully!")
    conn.close()
def view_my_quizzes(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT quiz_id, quiz_name FROM quizzes WHERE USER_ID=%s",
        (user_id,)
    )

    quizzes = cursor.fetchall()

    if quizzes:
        print("\nYour Quizzes:")
        for q in quizzes:
            print(f"{q[0]} - {q[1]}")
    else:
        print("No quizzes created yet.")

    conn.close()
def view_results(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    # Step 1: Show quizzes created by this admin
    cursor.execute(
        "SELECT quiz_id, quiz_name FROM quizzes WHERE USER_ID=%s",
        (user_id,)
    )

    quizzes = cursor.fetchall()

    if not quizzes:
        print("You have not created any quizzes yet.")
        conn.close()
        return

    print("\n===== YOUR QUIZZES =====")
    for q in quizzes:
        print(f"{q[0]}. {q[1]}")

    quiz_id = input("\nEnter Quiz ID to view results: ")

    # Step 2: Show results for selected quiz
    cursor.execute("""
        SELECT 
            u.F_NAME, u.MIDDLE_NAME, u.L_NAME,
            r.score,
            r.status
        FROM results r
        JOIN users u ON r.user_id = u.USER_ID
        WHERE r.quiz_id = %s
    """, (quiz_id,))

    records = cursor.fetchall()

    if records:
        print("\n===== RESULTS =====")
        for row in records:
            first = row[0]
            middle = row[1] if row[1] else ""
            last = row[2]

            student_name = f"{first} {middle} {last}".strip()

            print(f"Student: {student_name}")
            print(f"Score: {row[3]}")
            print(f"Status: {row[4]}")
            print("-------------------------")
    else:
        print("No students have attempted this quiz yet.")

    conn.close()