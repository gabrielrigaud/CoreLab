const express = require('express');
const router = express.Router();
const { getAssignedCourses, getCourse, getLesson, completeLesson, getQuiz, submitQuiz, getNotifications, markNotificationAsRead, getMyQuizResults } = require('../controllers/studentController');
const { verifyToken, isStudent } = require('../middlewares/authMiddleware');

router.get('/courses', verifyToken, isStudent, getAssignedCourses);
router.get('/courses/:courseId', verifyToken, isStudent, getCourse);
router.get('/courses/:courseId/lessons/:lessonId', verifyToken, isStudent, getLesson);
router.post('/courses/:courseId/lessons/:lessonId/complete', verifyToken, isStudent, completeLesson);
router.get('/quizzes/:quizId', verifyToken, isStudent, getQuiz);
router.post('/quizzes/:quizId/submit', verifyToken, isStudent, submitQuiz);

// Notifications
router.get('/notifications', verifyToken, isStudent, getNotifications);
router.put('/notifications/:id/read', verifyToken, isStudent, markNotificationAsRead);

// Résultats QCM de l'étudiant
router.get('/quiz-results', verifyToken, isStudent, getMyQuizResults);

module.exports = router;
