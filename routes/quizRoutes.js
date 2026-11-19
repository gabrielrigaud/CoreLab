const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const validate = require('../middlewares/validate');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const { importQuiz, updateThreshold } = require('../controllers/quizController');
const { thresholdSchema } = require('../validators/quizValidator');

// Routes Admin
router.post('/import', verifyToken, isAdmin, upload.single('file'), importQuiz);
router.put('/:id/threshold', verifyToken, isAdmin, validate(thresholdSchema), updateThreshold);

module.exports = router;