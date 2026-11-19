const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'CoreLabTestSecretKey2026!';
process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:3001';

const app = require('../server/server');
const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Cohort = require('../models/Cohort');
const Assignment = require('../models/Assignment');
const Progress = require('../models/Progress');
const QuizResult = require('../models/QuizResult');
const Notification = require('../models/Notification');

let server;
let baseUrl;

async function api(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, options);
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();
  return { status: res.status, headers: res.headers, body };
}

async function clearDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Lesson.deleteMany({}),
    Quiz.deleteMany({}),
    Cohort.deleteMany({}),
    Assignment.deleteMany({}),
    Progress.deleteMany({}),
    QuizResult.deleteMany({}),
    Notification.deleteMany({})
  ]);
}

test.before(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/corelab_test');
  await clearDatabase();
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await clearDatabase();
  await mongoose.disconnect();
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test.beforeEach(async () => {
  await clearDatabase();
});

test('Auth: Zod validation, register, duplicate rejection, login & missing token handling', async () => {
  const invalidReg = await api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: '123', firstName: 'A', lastName: 'B' })
  });
  assert.equal(invalidReg.status, 400);
  assert.ok(invalidReg.body.message);
  assert.ok(Array.isArray(invalidReg.body.details));

  const validPayload = {
    email: 'student1@corelab.fr',
    password: 'StrongPassword123',
    firstName: 'Camille',
    lastName: 'Martin'
  };

  const reg = await api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validPayload)
  });
  assert.equal(reg.status, 201);
  assert.ok(reg.body.userId);

  const dup = await api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validPayload)
  });
  assert.equal(dup.status, 400);

  const badLogin = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: validPayload.email, password: 'WrongPassword123' })
  });
  assert.equal(badLogin.status, 401);

  const login = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: validPayload.email, password: validPayload.password })
  });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
  assert.equal(login.body.user.role, 'student');

  const noToken = await api('/api/student/courses');
  assert.equal(noToken.status, 401);
  assert.equal(noToken.body.message, 'Token manquant');

  const adminDenied = await api('/api/admin/students', {
    headers: { Authorization: `Bearer ${login.body.token}` }
  });
  assert.equal(adminDenied.status, 403);
});

test('LMS Flow: course, lesson, quiz answer stripping, IDOR protection, grading & CSV export', async () => {
  const hashedPassword = await bcrypt.hash('AdminPassword123', 10);
  await User.create({
    email: 'admin@corelab.fr',
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'CoreLab',
    role: 'admin',
    firstLogin: false
  });

  const studentPass = await bcrypt.hash('StudentPassword123', 10);
  const enrolledStudent = await User.create({
    email: 'enrolled@corelab.fr',
    password: studentPass,
    firstName: 'Alice',
    lastName: 'Dupont',
    role: 'student',
    firstLogin: false
  });
  const outsiderStudent = await User.create({
    email: 'outsider@corelab.fr',
    password: studentPass,
    firstName: 'Bob',
    lastName: 'Martin',
    role: 'student',
    firstLogin: false
  });

  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@corelab.fr', password: 'AdminPassword123' })
  });
  const adminToken = adminLogin.body.token;

  const enrolledLogin = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'enrolled@corelab.fr', password: 'StudentPassword123' })
  });
  const enrolledToken = enrolledLogin.body.token;

  const outsiderLogin = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'outsider@corelab.fr', password: 'StudentPassword123' })
  });
  const outsiderToken = outsiderLogin.body.token;

  const courseRes = await api('/api/admin/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Sécurité Web',
      description: 'Introduction complète à la sécurité des applications web.'
    })
  });
  assert.equal(courseRes.status, 201);
  const courseId = courseRes.body.course._id;

  const lesson = await Lesson.create({
    title: 'XSS & Sandbox',
    contentUrl: 'uploads/sample.html',
    htmlContent: '<h1>Leçon 1</h1>',
    courseId
  });

  const quiz = await Quiz.create({
    title: 'Quiz Sécurité',
    courseId,
    passingThreshold: 50,
    questions: [
      {
        questionText: 'Quel attribut isole une iframe ?',
        options: ['sandbox', 'unsafe', 'eval'],
        correctAnswerIndex: 0
      }
    ]
  });
  await Course.findByIdAndUpdate(courseId, { lessons: [lesson._id], quizzes: [quiz._id] });

  const cohort = await Cohort.create({ name: 'Promo 2026', students: [enrolledStudent._id] });
  await Assignment.create({ courseId, assignedToCohort: cohort._id });

  const outsiderQuiz = await api(`/api/student/quizzes/${quiz._id}`, {
    headers: { Authorization: `Bearer ${outsiderToken}` }
  });
  assert.equal(outsiderQuiz.status, 403);

  const outsiderLesson = await api(`/api/student/courses/${courseId}/lessons/${lesson._id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${outsiderToken}` }
  });
  assert.equal(outsiderLesson.status, 403);

  const studentQuiz = await api(`/api/student/quizzes/${quiz._id}`, {
    headers: { Authorization: `Bearer ${enrolledToken}` }
  });
  assert.equal(studentQuiz.status, 200);
  assert.equal(studentQuiz.body.questions[0].correctAnswerIndex, undefined);
  assert.equal(studentQuiz.body.questions[0].correctAnswers, undefined);

  const completeRes = await api(`/api/student/courses/${courseId}/lessons/${lesson._id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${enrolledToken}` }
  });
  assert.equal(completeRes.status, 200);
  assert.equal(completeRes.body.progress.completedLessons.length, 1);

  const submitRes = await api(`/api/student/quizzes/${quiz._id}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${enrolledToken}` },
    body: JSON.stringify({
      answers: [{ questionId: quiz.questions[0]._id, selectedIndex: 0 }]
    })
  });
  assert.equal(submitRes.status, 201);
  assert.equal(submitRes.body.result.score, 100);
  assert.equal(submitRes.body.result.passed, true);

  const notif = await Notification.create({
    userId: enrolledStudent._id,
    message: 'Leçon débloquée'
  });
  const outsiderNotif = await api(`/api/student/notifications/${notif._id}/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${outsiderToken}` }
  });
  assert.equal(outsiderNotif.status, 404);

  const exportRes = await api('/api/admin/results/export', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(exportRes.status, 200);
  assert.match(exportRes.body, /Alice Dupont/);
  assert.match(exportRes.body, /Quiz Sécurité/);
});

test('Upload filter rejects disallowed file extensions', async () => {
  const hashedPassword = await bcrypt.hash('AdminPassword123', 10);
  await User.create({
    email: 'admin2@corelab.fr',
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'Upload',
    role: 'admin',
    firstLogin: false
  });
  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin2@corelab.fr', password: 'AdminPassword123' })
  });

  const form = new FormData();
  form.append('file', new Blob(['console.log("xss")'], { type: 'application/javascript' }), 'evil.js');

  const res = await api('/api/admin/import-students', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminLogin.body.token}` },
    body: form
  });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /Format de fichier non autorisé/);
});
