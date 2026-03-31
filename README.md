# ExamFlow — Online Examination System

> A role-based online examination platform where supervisors create quizzes and students attempt them — built with vanilla HTML/CSS/JS, Python Flask, and MySQL.

---

## 👥 Team

| Name | Role |
|------|------|
| Riya Ann Jijo | Frontend & Backend |
| Riya Mary Vinson | Frontend & Backend |

---

## 📌 Features

### Student
- Register and log in securely
- Browse all available quizzes
- Attempt quizzes one question at a time with progress tracking
- View score and Pass/Fail result instantly after submission
- View full exam history

### Supervisor
- Create quizzes with any number of multiple-choice questions
- View all quizzes created
- View per-quiz student results with scores and status

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, JavaScript (ES2017+) |
| Backend | Python, Flask, Flask-CORS |
| Database | MySQL |
| DB Driver | mysql-connector-python |

---

## 📁 Project Structure

```
examflow/
├── index.html        # All UI pages in one file
├── style.css         # Dark theme styling
├── app.js            # Frontend logic and API calls
├── api.py            # Flask REST API (11 endpoints)
├── database.py       # MySQL connection helper
├── main.py           # Original CLI entry point
├── admin.py          # CLI supervisor functions
├── student.py        # CLI student functions
├── schema.sql        # Database setup script
└── requirements.txt  # Python dependencies
```

---

## 🗄️ Database Schema

```
USERS ──< QUIZZES ──< QUESTIONS
  │                      │
  └──< RESULTS           └──< STUDENT_ANSWERS
```

**Tables:** `USERS`, `QUIZZES`, `QUESTIONS`, `STUDENT_ANSWERS`, `RESULTS`

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.x
- MySQL (running locally)
- A modern web browser

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/examflow.git
cd examflow
```

### 2. Install Python dependencies
```bash
pip install flask flask-cors mysql-connector-python
```

### 3. Set up the database
Open MySQL and run:
```bash
source schema.sql
```

### 4. Update database credentials
In `database.py`, update with your MySQL password:
```python
def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="YOUR_PASSWORD",
        database="online_exam"
    )
```

### 5. Run the backend
```bash
python api.py
```
Flask starts at `http://localhost:5000`

### 6. Run the frontend
```bash
python -m http.server 8000
```
Open `http://localhost:8000` in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | riya@student.com | 1234 |
| Supervisor | john@teacher.com | 1234 |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Authenticate user |
| POST | `/signup` | Register new user |
| GET | `/quizzes` | Get all quizzes |
| GET | `/quizzes/mine/:id` | Get supervisor's quizzes |
| POST | `/quizzes` | Create a new quiz |
| GET | `/questions/:id` | Get questions for a quiz |
| POST | `/results/submit` | Submit quiz answers |
| GET | `/results/student/:id` | Get student's results |
| GET | `/results/quiz/:id` | Get all results for a quiz |
| GET | `/results/check/:uid/:qid` | Check if already attempted |

---

## 📸 Screenshots

| Login Page | Student Dashboard | Quiz Taking |
|------------|-------------------|-------------|
| ![Login](screenshots/login.png) | ![Student](screenshots/student.png) | ![Quiz](screenshots/quiz.png) |

---

## 🚀 Deployment

| Part | Platform |
|------|----------|
| Frontend | GitHub Pages |
| Backend | Render |
| Database | Railway (MySQL) |

---

## 📄 License

This project was developed as a DBMS academic project.  
© 2026 Riya Ann Jijo & Riya Mary Vinson
