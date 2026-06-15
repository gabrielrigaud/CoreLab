const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { importStudents, getAllStudents, getAllCourses, createCourse, getCourseById, updateCourse, createLesson, updateLesson, importQuiz, createCohort, getAllCohorts, addStudentsToCohort, assignCourse, getQuizResults, exportQuizResultsCSV } = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { courseSchema, assignSchema, cohortSchema } = require('../validators/courseValidator');

router.post('/import-students', verifyToken, isAdmin, upload.single('file'), importStudents);
router.get('/students', verifyToken, isAdmin, getAllStudents);

router.get('/courses', verifyToken, isAdmin, getAllCourses);
router.post('/courses', verifyToken, isAdmin, validate(courseSchema), createCourse);
router.get('/courses/:id', verifyToken, isAdmin, getCourseById);
router.put('/courses/:id', verifyToken, isAdmin, validate(courseSchema), updateCourse);

router.post('/courses/:courseId/lessons', verifyToken, isAdmin, upload.single('file'), createLesson);
router.put('/lessons/:id', verifyToken, isAdmin, upload.single('file'), updateLesson);
router.post('/courses/:courseId/quizzes/import', verifyToken, isAdmin, upload.single('file'), importQuiz);
router.post('/cohorts', verifyToken, isAdmin, validate(cohortSchema), createCohort);
router.get('/cohorts', verifyToken, isAdmin, getAllCohorts);
router.post('/cohorts/:id/students', verifyToken, isAdmin, addStudentsToCohort);

router.post('/assignments', verifyToken, isAdmin, validate(assignSchema), assignCourse);

router.get('/results', verifyToken, isAdmin, getQuizResults);
router.get('/results/export', verifyToken, isAdmin, exportQuizResultsCSV);

module.exports = router;