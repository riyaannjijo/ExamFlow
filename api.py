from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_connection

app = Flask(__name__)
CORS(app)  # allows the browser to call this server

# ── LOGIN ──────────────────────────────────────────────────────
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT USER_ID, F_NAME, MIDDLE_NAME, L_NAME, ROLE FROM users WHERE EMAIL_ID=%s AND PASSWORD=%s",
        (data['email'], data['password'])
    )
    user = cursor.fetchone()
    conn.close()
    if user:
        return jsonify({"ok": True, "user": user})
    return jsonify({"ok": False, "error": "Invalid email or password"}), 401

# ── SIGNUP ─────────────────────────────────────────────────────
@app.route('/signup', methods=['POST'])
def signup():
    d = request.json
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (F_NAME, MIDDLE_NAME, L_NAME, EMAIL_ID, PASSWORD, ROLE) VALUES (%s,%s,%s,%s,%s,%s)",
            (d['f_name'], d.get('middle_name'), d['l_name'], d['email'], d['password'], d['role'])
        )
        conn.commit()
        conn.close()
        return jsonify({"ok": True})
    except Exception as e:
        conn.close()
        return jsonify({"ok": False, "error": str(e)}), 400

# ── QUIZZES ────────────────────────────────────────────────────
@app.route('/quizzes', methods=['GET'])
def get_quizzes():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM quizzes")
    quizzes = cursor.fetchall()
    conn.close()
    return jsonify(quizzes)

@app.route('/quizzes/mine/<int:user_id>', methods=['GET'])
def get_my_quizzes(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM quizzes WHERE USER_ID=%s", (user_id,))
    quizzes = cursor.fetchall()
    conn.close()
    return jsonify(quizzes)

@app.route('/quizzes', methods=['POST'])
def create_quiz():
    d = request.json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO quizzes (USER_ID, QUIZ_NAME, TOTAL_MARKS) VALUES (%s,%s,%s)",
        (d['user_id'], d['quiz_name'], d['total_marks'])
    )
    quiz_id = cursor.lastrowid
    for q in d['questions']:
        cursor.execute(
            "INSERT INTO questions (QUIZ_ID, QUESTION_TEXT, OPTION_A, OPTION_B, OPTION_C, OPTION_D, CORRECT_OPTION) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            (quiz_id, q['question_text'], q['option_a'], q['option_b'], q.get('option_c'), q['option_d'], q['correct_option'])
        )
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "quiz_id": quiz_id})

# ── QUESTIONS ──────────────────────────────────────────────────
@app.route('/questions/<int:quiz_id>', methods=['GET'])
def get_questions(quiz_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM questions WHERE QUIZ_ID=%s", (quiz_id,))
    questions = cursor.fetchall()
    conn.close()
    return jsonify(questions)

# ── RESULTS ────────────────────────────────────────────────────
@app.route('/results/submit', methods=['POST'])
def submit_result():
    d = request.json
    conn = get_connection()
    cursor = conn.cursor()
    # save answers
    for ans in d['answers']:
        try:
            cursor.execute(
                "INSERT INTO student_answers (USER_ID, QUESTION_ID, SELECTED_OPTION) VALUES (%s,%s,%s)",
                (d['user_id'], ans['question_id'], ans['selected_option'])
            )
        except: pass
    # save result
    cursor.execute(
        "INSERT INTO results (USER_ID, QUIZ_ID, SCORE, STATUS) VALUES (%s,%s,%s,%s)",
        (d['user_id'], d['quiz_id'], d['score'], d['status'])
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})

@app.route('/results/student/<int:user_id>', methods=['GET'])
def get_student_results(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT q.QUIZ_NAME, r.SCORE, r.STATUS
        FROM results r JOIN quizzes q ON r.QUIZ_ID = q.QUIZ_ID
        WHERE r.USER_ID = %s
    """, (user_id,))
    results = cursor.fetchall()
    conn.close()
    return jsonify(results)

@app.route('/results/quiz/<int:quiz_id>', methods=['GET'])
def get_quiz_results(quiz_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT u.F_NAME, u.MIDDLE_NAME, u.L_NAME, u.EMAIL_ID, r.SCORE, r.STATUS
        FROM results r JOIN users u ON r.USER_ID = u.USER_ID
        WHERE r.QUIZ_ID = %s
    """, (quiz_id,))
    results = cursor.fetchall()
    conn.close()
    return jsonify(results)

@app.route('/results/check/<int:user_id>/<int:quiz_id>', methods=['GET'])
def check_attempted(user_id, quiz_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM results WHERE USER_ID=%s AND QUIZ_ID=%s", (user_id, quiz_id))
    attempted = cursor.fetchone() is not None
    conn.close()
    return jsonify({"attempted": attempted})

if __name__ == '__main__':
    app.run(debug=True, port=5000)