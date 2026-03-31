

/* ================================================================
   ExamFlow — app.js  (Flask API edition)
   All data goes to/from MySQL via api.py on http://localhost:5000
   ================================================================ */

const API = 'http://localhost:5000';

async function apiFetch(path, method = 'GET', body = null) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API + path, opts);
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Cannot reach server. Is api.py running?' };
  }
}

// ─── SESSION ─────────────────────────────────────────────────────

let currentUser = null;

function fullName(u) {
  const f = u.F_NAME || u.f_name || '';
  const m = u.MIDDLE_NAME || u.middle_name || '';
  const l = u.L_NAME || u.l_name || '';
  return [f, m, l].filter(Boolean).join(' ');
}

// ─── PAGES ───────────────────────────────────────────────────────

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ─── TABS (Login / Sign Up) ───────────────────────────────────────

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + target).classList.add('active');
  });
});

// Role picker
document.querySelectorAll('.role-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
  });
});

// ─── AUTH ─────────────────────────────────────────────────────────

function togglePwd(id, btn) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

function fillDemo(role) {
  if (role === 'student') {
    document.getElementById('login-email').value = 'riya@student.com';
    document.getElementById('login-password').value = '1234';
  } else {
    document.getElementById('login-email').value = 'john@teacher.com';
    document.getElementById('login-password').value = '1234';
  }
}

async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  const btn      = document.querySelector('#tab-login .btn-primary');

  errEl.classList.add('hidden');
  if (!email || !password) { showError(errEl, 'Please enter both email and password.'); return; }

  btn.textContent = 'Logging in...';
  btn.disabled = true;

  const data = await apiFetch('/login', 'POST', { email, password });

  btn.textContent = 'Login →';
  btn.disabled = false;

  if (!data.ok) {
    showError(errEl, data.error || 'Invalid email or password.');
    return;
  }

  currentUser = data.user;
  const role = (currentUser.ROLE || currentUser.role || '').toLowerCase();

  if (role === 'student') {
    document.getElementById('student-greeting').textContent = 'Hello, ' + (currentUser.F_NAME || currentUser.f_name) + '!';
    await loadStudentQuizzes();
    showPage('page-student');
    switchSidebarById('s-quizzes', 'student');
  } else if (role === 'supervisor') {
    document.getElementById('supervisor-greeting').textContent = 'Hello, ' + (currentUser.F_NAME || currentUser.f_name) + '!';
    await loadSupervisorQuizzes();
    await populateSupervisorResultPicker();
    initCreateQuiz();
    showPage('page-supervisor');
    switchSidebarById('sv-quizzes', 'supervisor');
  } else {
    showError(errEl, 'Unknown role: ' + role);
  }
}

async function handleSignup() {
  const f_name      = document.getElementById('su-fname').value.trim();
  const middle_name = document.getElementById('su-mname').value.trim() || null;
  const l_name      = document.getElementById('su-lname').value.trim();
  const email       = document.getElementById('su-email').value.trim();
  const password    = document.getElementById('su-password').value;
  const role        = document.querySelector('input[name="role"]:checked').value;
  const errEl       = document.getElementById('signup-error');
  const sucEl       = document.getElementById('signup-success');
  const btn         = document.querySelector('#tab-signup .btn-primary');

  errEl.classList.add('hidden');
  sucEl.classList.add('hidden');

  if (!f_name || !l_name || !email || !password) {
    showError(errEl, 'Please fill in all required fields.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError(errEl, 'Please enter a valid email address.');
    return;
  }

  btn.textContent = 'Creating account...';
  btn.disabled = true;

  const data = await apiFetch('/signup', 'POST', { f_name, middle_name, l_name, email, password, role });

  btn.textContent = 'Create Account →';
  btn.disabled = false;

  if (!data.ok) {
    showError(errEl, data.error || 'Could not create account. Email may already exist.');
    return;
  }

  sucEl.textContent = 'Account created! You can now log in.';
  sucEl.classList.remove('hidden');
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
  setTimeout(() => document.querySelector('[data-tab="login"]').click(), 1200);
}

function logout() {
  currentUser = null;
  quizState = null;
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').classList.add('hidden');
  showPage('page-auth');
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ─── SIDEBAR ─────────────────────────────────────────────────────

function switchSidebar(btn, role) {
  const target = btn.dataset.target;
  btn.closest('.sidebar').querySelectorAll('.sidebar-item')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const prefix = role === 'student' ? 'page-student' : 'page-supervisor';
  document.getElementById(prefix).querySelectorAll('.dash-panel')
    .forEach(p => p.classList.remove('active'));
  document.getElementById(target).classList.add('active');

  if (target === 's-results')  loadStudentResults();
  if (target === 'sv-quizzes') loadSupervisorQuizzes();
  if (target === 'sv-create')  initCreateQuiz();
  if (target === 'sv-results') populateSupervisorResultPicker();
}

function switchSidebarById(targetId, role) {
  const page = role === 'student' ? 'page-student' : 'page-supervisor';
  const btn = document.querySelector('#' + page + ' [data-target="' + targetId + '"]');
  if (btn) switchSidebar(btn, role);
}

// ─── STUDENT: QUIZZES ─────────────────────────────────────────────

async function loadStudentQuizzes() {
  const grid = document.getElementById('quiz-grid');
  grid.innerHTML = loadingState('Loading quizzes...');

  const userId = currentUser.USER_ID || currentUser.id;
  const [quizzes, results] = await Promise.all([
    apiFetch('/quizzes'),
    apiFetch('/results/student/' + userId)
  ]);

  if (!Array.isArray(quizzes) || !quizzes.length) {
    grid.innerHTML = emptyState('📋', 'No quizzes available yet.');
    return;
  }

  // Set of quiz IDs already attempted
  const attemptedIds = new Set(
    Array.isArray(results) ? results.map(r => r.QUIZ_ID || r.quiz_id) : []
  );

  grid.innerHTML = quizzes.map(q => {
    const id       = q.QUIZ_ID    || q.quiz_id    || q.id;
    const name     = q.QUIZ_NAME  || q.quiz_name  || '';
    const marks    = q.TOTAL_MARKS || q.total_marks || 0;
    const attempted = attemptedIds.has(id);
    return '<div class="quiz-card' + (attempted ? ' attempted' : '') + '"' +
      (attempted ? '' : ' onclick="startQuizFlow(' + id + ')"') + '>' +
      '<div class="qc-top"><div class="qc-icon">📝</div>' +
      '<span class="qc-marks">' + marks + ' marks</span></div>' +
      '<div class="qc-name">' + escHtml(name) + '</div>' +
      '<div class="qc-footer"><span class="qc-action">' +
      (attempted ? '✓ Attempted' : 'Start Quiz') +
      '</span><span class="qc-arrow">→</span></div></div>';
  }).join('');
}

// ─── STUDENT: QUIZ TAKING ─────────────────────────────────────────

let quizState = null;

async function startQuizFlow(quiz_id) {
  const userId = currentUser.USER_ID || currentUser.id;
  const check  = await apiFetch('/results/check/' + userId + '/' + quiz_id);
  if (check.attempted) {
    alert('You have already attempted this quiz.');
    await loadStudentQuizzes();
    return;
  }

  const [questions, quizzes] = await Promise.all([
    apiFetch('/questions/' + quiz_id),
    apiFetch('/quizzes')
  ]);

  if (!Array.isArray(questions) || !questions.length) {
    alert('This quiz has no questions yet.');
    return;
  }

  const quiz = Array.isArray(quizzes)
    ? quizzes.find(q => (q.QUIZ_ID || q.quiz_id || q.id) == quiz_id)
    : null;

  quizState = { quiz, quiz_id, questions, current: 0, answers: {} };

  document.getElementById('taking-title').textContent =
    quiz ? (quiz.QUIZ_NAME || quiz.quiz_name || 'Quiz') : 'Quiz';
  document.getElementById('q-total').textContent = questions.length;

  renderQuestion();

  document.getElementById('page-student').querySelectorAll('.dash-panel')
    .forEach(p => p.classList.remove('active'));
  document.getElementById('s-taking').classList.add('active');
}

function renderQuestion() {
  const { questions, current, answers } = quizState;
  const q     = questions[current];
  const total = questions.length;
  const qId   = q.QUESTION_ID || q.question_id || q.id;

  document.getElementById('q-current').textContent = current + 1;
  document.getElementById('progress-bar').style.width = ((current + 1) / total * 100) + '%';
  document.getElementById('q-text').textContent = q.QUESTION_TEXT || q.question_text || '';

  const opts = [
    { letter: 'A', text: q.OPTION_A || q.option_a },
    { letter: 'B', text: q.OPTION_B || q.option_b },
    { letter: 'C', text: q.OPTION_C || q.option_c },
    { letter: 'D', text: q.OPTION_D || q.option_d },
  ].filter(o => o.text);

  document.getElementById('options-wrap').innerHTML = opts.map(o =>
    '<button class="option-btn' + (answers[qId] === o.letter ? ' selected' : '') + '"' +
    ' onclick="selectOption(\'' + o.letter + '\')">' +
    '<span class="option-letter">' + o.letter + '</span>' +
    '<span>' + escHtml(o.text) + '</span></button>'
  ).join('');

  document.getElementById('btn-prev').disabled = current === 0;
  const isLast = current === total - 1;
  document.getElementById('btn-next').classList.toggle('hidden', isLast);
  document.getElementById('btn-submit').classList.toggle('hidden', !isLast);
}

function selectOption(letter) {
  const q   = quizState.questions[quizState.current];
  const qId = q.QUESTION_ID || q.question_id || q.id;
  quizState.answers[qId] = letter;
  renderQuestion();
}

function prevQuestion() {
  if (quizState.current > 0) { quizState.current--; renderQuestion(); }
}

function nextQuestion() {
  if (quizState.current < quizState.questions.length - 1) {
    quizState.current++;
    renderQuestion();
  }
}

async function submitQuiz() {
  const { questions, answers, quiz_id } = quizState;
  const userId = currentUser.USER_ID || currentUser.id;

  let score = 0;
  const answersList = [];

  questions.forEach(q => {
    const qId      = q.QUESTION_ID || q.question_id || q.id;
    const correct  = q.CORRECT_OPTION || q.correct_option;
    const selected = answers[qId] || null;
    if (selected) answersList.push({ question_id: qId, selected_option: selected });
    if (selected === correct) score++;
  });

  const status = score >= Math.ceil(questions.length / 2) ? 'Pass' : 'Fail';

  const btn = document.getElementById('btn-submit');
  btn.textContent = 'Submitting...';
  btn.disabled = true;

  const res = await apiFetch('/results/submit', 'POST', {
    user_id: userId, quiz_id, score, status, answers: answersList
  });

  btn.textContent = 'Submit Quiz ✓';
  btn.disabled = false;

  if (!res.ok) {
    alert('Error submitting: ' + (res.error || 'Unknown error'));
    return;
  }

  document.getElementById('modal-icon').textContent  = status === 'Pass' ? '🎉' : '😞';
  document.getElementById('modal-title').textContent  = status === 'Pass' ? 'Well done!' : 'Keep practising!';
  document.getElementById('modal-score').textContent  = score + '/' + questions.length;
  const badge = document.getElementById('modal-status');
  badge.textContent = status;
  badge.className   = 'modal-badge ' + status.toLowerCase();
  document.getElementById('result-modal').classList.remove('hidden');
}

async function closeModal() {
  document.getElementById('result-modal').classList.add('hidden');
  quizState = null;
  await loadStudentQuizzes();
  switchSidebarById('s-quizzes', 'student');
}

function backToQuizList() {
  quizState = null;
  switchSidebarById('s-quizzes', 'student');
}

// ─── STUDENT: RESULTS ────────────────────────────────────────────

async function loadStudentResults() {
  const grid = document.getElementById('results-grid');
  grid.innerHTML = loadingState('Loading results...');

  const userId  = currentUser.USER_ID || currentUser.id;
  const results = await apiFetch('/results/student/' + userId);

  if (!Array.isArray(results) || !results.length) {
    grid.innerHTML = emptyState('📊', "You haven't attempted any quizzes yet.");
    return;
  }

  grid.innerHTML = results.map(r => {
    const name   = r.QUIZ_NAME || r.quiz_name || 'Unknown Quiz';
    const score  = r.SCORE  !== undefined ? r.SCORE  : (r.score  !== undefined ? r.score : '?');
    const status = r.STATUS || r.status || '-';
    return '<div class="result-card"><div>' +
      '<div class="rc-quiz">' + escHtml(name) + '</div>' +
      '<div class="rc-score">Score: ' + score + '</div></div>' +
      '<span class="rc-status ' + status.toLowerCase() + '">' + status + '</span></div>';
  }).join('');
}

// ─── SUPERVISOR: QUIZZES ─────────────────────────────────────────

async function loadSupervisorQuizzes() {
  const grid = document.getElementById('sv-quiz-grid');
  grid.innerHTML = loadingState('Loading quizzes...');

  const userId  = currentUser.USER_ID || currentUser.id;
  const quizzes = await apiFetch('/quizzes/mine/' + userId);

  if (!Array.isArray(quizzes) || !quizzes.length) {
    grid.innerHTML = emptyState('📋', "You haven't created any quizzes yet. Go to Create Quiz!");
    return;
  }

  grid.innerHTML = quizzes.map(q => {
    const id    = q.QUIZ_ID    || q.quiz_id    || q.id;
    const name  = q.QUIZ_NAME  || q.quiz_name  || '';
    const marks = q.TOTAL_MARKS || q.total_marks || 0;
    return '<div class="quiz-card">' +
      '<div class="qc-top"><div class="qc-icon">📝</div>' +
      '<span class="qc-marks">' + marks + ' marks</span></div>' +
      '<div class="qc-name">' + escHtml(name) + '</div>' +
      '<div class="qc-footer"><span class="qc-action">Quiz #' + id + '</span></div></div>';
  }).join('');
}

// ─── SUPERVISOR: CREATE QUIZ ──────────────────────────────────────

let questionBlockCount = 0;

function initCreateQuiz() {
  document.getElementById('sv-qname').value = '';
  document.getElementById('sv-qmarks').value = '';
  document.getElementById('q-blocks').innerHTML = '';
  document.getElementById('create-error').classList.add('hidden');
  document.getElementById('create-success').classList.add('hidden');
  questionBlockCount = 0;
  addQuestionBlock();
}

function addQuestionBlock() {
  questionBlockCount++;
  const n   = questionBlockCount;
  const div = document.createElement('div');
  div.className = 'q-block';
  div.id = 'qblock-' + n;
  div.innerHTML =
    '<div class="q-block-header"><span>Question ' + n + '</span>' +
    '<button class="btn-del-q" onclick="removeBlock(' + n + ')">✕</button></div>' +
    '<div class="form-group"><label>Question Text</label>' +
    '<input type="text" id="qt-' + n + '" placeholder="Enter the question..."></div>' +
    '<div class="options-grid">' +
    '<div class="form-group"><label>Option A</label><input type="text" id="oa-' + n + '" placeholder="Option A"></div>' +
    '<div class="form-group"><label>Option B</label><input type="text" id="ob-' + n + '" placeholder="Option B"></div>' +
    '<div class="form-group"><label>Option C (optional)</label><input type="text" id="oc-' + n + '" placeholder="Option C"></div>' +
    '<div class="form-group"><label>Option D</label><input type="text" id="od-' + n + '" placeholder="Option D"></div></div>' +
    '<div class="correct-row"><label>Correct Answer:</label>' +
    '<select id="cor-' + n + '"><option value="A">A</option><option value="B">B</option>' +
    '<option value="C">C</option><option value="D">D</option></select></div>';
  document.getElementById('q-blocks').appendChild(div);
}

function removeBlock(n) {
  const el = document.getElementById('qblock-' + n);
  if (el) el.remove();
}

async function createQuiz() {
  const quiz_name   = document.getElementById('sv-qname').value.trim();
  const total_marks = parseInt(document.getElementById('sv-qmarks').value);
  const errEl = document.getElementById('create-error');
  const sucEl = document.getElementById('create-success');
  const btn   = document.querySelector('#sv-create .btn-primary');
  errEl.classList.add('hidden');
  sucEl.classList.add('hidden');

  if (!quiz_name)                              { showError(errEl, 'Please enter a quiz name.');               return; }
  if (isNaN(total_marks) || total_marks < 1)   { showError(errEl, 'Please enter valid total marks (>= 1).'); return; }

  const blocks = document.querySelectorAll('.q-block');
  if (!blocks.length) { showError(errEl, 'Add at least one question.'); return; }

  const questionsData = [];
  for (const block of blocks) {
    const n    = block.id.split('-')[1];
    const text = document.getElementById('qt-' + n).value.trim();
    const oa   = document.getElementById('oa-' + n).value.trim();
    const ob   = document.getElementById('ob-' + n).value.trim();
    const oc   = document.getElementById('oc-' + n).value.trim() || null;
    const od   = document.getElementById('od-' + n).value.trim();
    const cor  = document.getElementById('cor-' + n).value;
    if (!text || !oa || !ob || !od) {
      showError(errEl, 'Please fill in all required fields (A, B, D at minimum).');
      return;
    }
    questionsData.push({ question_text: text, option_a: oa, option_b: ob, option_c: oc, option_d: od, correct_option: cor });
  }

  btn.textContent = 'Publishing...';
  btn.disabled    = true;

  const userId = currentUser.USER_ID || currentUser.id;
  const res    = await apiFetch('/quizzes', 'POST', {
    user_id: userId, quiz_name, total_marks, questions: questionsData
  });

  btn.textContent = 'Publish Quiz →';
  btn.disabled    = false;

  if (!res.ok) {
    showError(errEl, res.error || 'Failed to create quiz.');
    return;
  }

  sucEl.textContent = 'Quiz "' + quiz_name + '" published with ' + questionsData.length + ' question(s)!';
  sucEl.classList.remove('hidden');
  await populateSupervisorResultPicker();
  initCreateQuiz();
  setTimeout(() => sucEl.classList.add('hidden'), 3000);
}

// ─── SUPERVISOR: RESULTS ─────────────────────────────────────────

async function populateSupervisorResultPicker() {
  const sel     = document.getElementById('sv-result-picker');
  const userId  = currentUser.USER_ID || currentUser.id;
  const quizzes = await apiFetch('/quizzes/mine/' + userId);

  sel.innerHTML = '<option value="">— Choose a quiz —</option>';
  if (Array.isArray(quizzes)) {
    quizzes.forEach(q => {
      const id   = q.QUIZ_ID   || q.quiz_id   || q.id;
      const name = q.QUIZ_NAME || q.quiz_name || '';
      sel.innerHTML += '<option value="' + id + '">' + escHtml(name) + '</option>';
    });
  }
  document.getElementById('sv-results-table-wrap').innerHTML = '';
}

async function loadSupervisorResults() {
  const quiz_id = parseInt(document.getElementById('sv-result-picker').value);
  const wrap    = document.getElementById('sv-results-table-wrap');
  if (!quiz_id) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = loadingState('Loading results...');
  const results  = await apiFetch('/results/quiz/' + quiz_id);

  if (!Array.isArray(results) || !results.length) {
    wrap.innerHTML = emptyState('📊', 'No students have attempted this quiz yet.');
    return;
  }

  const rows = results.map(r => {
    const fn     = r.F_NAME || r.f_name || '';
    const mn     = r.MIDDLE_NAME || r.middle_name || '';
    const ln     = r.L_NAME || r.l_name || '';
    const name   = [fn, mn, ln].filter(Boolean).join(' ');
    const email  = r.EMAIL_ID || r.email || '';
    const score  = r.SCORE  !== undefined ? r.SCORE  : (r.score  !== undefined ? r.score : '?');
    const status = r.STATUS || r.status || '-';
    return '<tr><td>' + escHtml(name) + '</td><td>' + escHtml(email) +
      '</td><td><strong>' + score + '</strong></td>' +
      '<td><span class="rc-status ' + status.toLowerCase() + '">' + status + '</span></td></tr>';
  }).join('');

  wrap.innerHTML =
    '<div class="sv-table-wrap"><table class="sv-table"><thead><tr>' +
    '<th>Student Name</th><th>Email</th><th>Score</th><th>Status</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

// ─── HELPERS ─────────────────────────────────────────────────────

function emptyState(icon, msg) {
  return '<div class="empty-state"><div class="es-icon">' + icon + '</div><p>' + msg + '</p></div>';
}

function loadingState(msg) {
  return '<div class="empty-state"><div class="es-icon" style="font-size:28px;opacity:0.4;">⏳</div><p>' + (msg || 'Loading...') + '</p></div>';
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
