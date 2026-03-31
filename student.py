from database import get_connection
def student_menu(user_id):
    while True:
        print("\n===== STUDENT DASHBOARD =====")
        print("1. View Quizzes")
        print("2. View Results")
        print("3. Logout")

        choice = input("Enter choice: ")

        if choice == "1":
            view_quizzes(user_id)
        elif choice == "2":
            view_results(user_id)
        elif choice == "3":
            print("Logging out...")
            break
        else:
            print("Invalid choice. Try again.")
def view_quizzes(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT quiz_id, quiz_name FROM Quizzes")
    quizzes = cursor.fetchall()

    if quizzes:
        print("\nAvailable Quizzes:")
        for quiz in quizzes:
            print(f"{quiz[0]}. {quiz[1]}")

        quiz_id = input("\nEnter Quiz ID to start: ")
        start_quiz(user_id, quiz_id)
    else:
        print("No quizzes available.")

    conn.close()

def start_quiz(user_id, quiz_id):
    conn = get_connection()
    cursor = conn.cursor()

    # 🔒 Check if student already attempted quiz
    cursor.execute(
        "SELECT * FROM results WHERE USER_ID=%s AND QUIZ_ID=%s",
        (user_id, quiz_id)
    )

    if cursor.fetchone():
        print("\n⚠ You have already attempted this quiz.")
        conn.close()
        return

    cursor.execute(
        "SELECT question_id, question_text, option_a, option_b, option_c, option_d, correct_option FROM Questions WHERE quiz_id=%s",
        (quiz_id,)
    )

    questions = cursor.fetchall()
    score = 0

    for q in questions:
        print("\n" + q[1])
        print("A.", q[2])
        print("B.", q[3])
        print("C.", q[4])
        print("D.", q[5])

        answer = input("Enter option (A/B/C/D): ").upper()

        cursor.execute(
            "INSERT INTO Student_Answers (user_id, question_id, selected_option) VALUES (%s,%s,%s)",
            (user_id, q[0], answer)
        )

        if answer == q[6]:
            score += 1

    status = "Pass" if score >= len(questions)/2 else "Fail"

    cursor.execute(
        "INSERT INTO Results (user_id, quiz_id, score, status) VALUES (%s,%s,%s,%s)",
        (user_id, quiz_id, score, status)
    )

    conn.commit()

    print("\n===== EXAM COMPLETED =====")
    print(f"Score: {score}/{len(questions)}")
    print("Result:", status)

    conn.close()
def view_results(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT q.quiz_name, r.score, r.status
        FROM results r
        JOIN quizzes q ON r.quiz_id = q.quiz_id
        WHERE r.user_id = %s
    """, (user_id,))

    results = cursor.fetchall()

    if results:
        print("\n===== YOUR RESULTS =====")
        for r in results:
            print(f"Quiz: {r[0]}")
            print(f"Score: {r[1]}")
            print(f"Status: {r[2]}")
            print("-----------------------")
    else:
        print("No results found.")

    conn.close()