const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const Assignment = require('../models/Assignment');
const Cohort = require('../models/Cohort');
const Progress = require('../models/Progress');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const fs = require('fs');

async function getAssignedCourses(req, res) {
    try {
        const studentId = req.user.id;
        
        // 1. Trouver les cohortes de l'étudiant
        const cohorts = await Cohort.find({ students: studentId });
        const cohortIds = cohorts.map(c => c._id);
        
        // 2. Trouver les assignations (pour l'étudiant ou ses cohortes)
        const assignments = await Assignment.find({
            $or: [
                { assignedToUser: studentId },
                { assignedToCohort: { $in: cohortIds } }
            ]
        }).populate('courseId');

        // Génération automatique des notifications pour les leçons planifiées
        const now = new Date();
        for (const assignment of assignments) {
            if (assignment.lessonUnlockDates) {
                for (const unlockData of assignment.lessonUnlockDates) {
                    if (unlockData.unlockDate && new Date(unlockData.unlockDate) <= now) {
                        const exists = await Notification.findOne({
                            userId: studentId,
                            lessonId: unlockData.lessonId
                        });
                        if (!exists) {
                            const lessonInfo = await Lesson.findById(unlockData.lessonId);
                            if (lessonInfo) {
                                await Notification.create({
                                    userId: studentId,
                                    message: `Nouvelle leçon disponible : ${lessonInfo.title}`,
                                    lessonId: unlockData.lessonId
                                });
                            }
                        }
                    }
                }
            }
        }
        
        // 3. Récupérer la progression pour ces cours
        const coursesWithProgress = await Promise.all(assignments.map(async (assignment) => {
            const course = assignment.courseId;
            if (!course) return null;
            
            const progress = await Progress.findOne({ userId: studentId, courseId: course._id });
            const completedCount = progress ? progress.completedLessons.length : 0;
            const totalLessons = course.lessons.length;
            const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
            
            return {
                course,
                progress: {
                    completedLessons: completedCount,
                    totalLessons,
                    percentage
                }
            };
        }));
        
        res.status(200).json(coursesWithProgress.filter(c => c !== null));
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des cours assignés", error: error.message });
    }
}

async function getLesson(req, res) {
    const { courseId, lessonId } = req.params;
    const studentId = req.user.id;
    
    try {
        // Vérifier l'accès au cours (assignation)
        const cohorts = await Cohort.find({ students: studentId });
        const cohortIds = cohorts.map(c => c._id);
        
        const assignment = await Assignment.findOne({
            courseId,
            $or: [
                { assignedToUser: studentId },
                { assignedToCohort: { $in: cohortIds } }
            ]
        });
        
        if (!assignment) {
            return res.status(403).json({ message: "Vous n'avez pas accès à ce cours." });
        }
        
        // Verrouillage temporel
        if (assignment.lessonUnlockDates && assignment.lessonUnlockDates.length > 0) {
            const unlockData = assignment.lessonUnlockDates.find(l => l.lessonId.toString() === lessonId);
            if (unlockData && unlockData.unlockDate) {
                if (new Date() < new Date(unlockData.unlockDate)) {
                    return res.status(403).json({ 
                        message: "Cette leçon est verrouillée.",
                        unlockDate: unlockData.unlockDate 
                    });
                }
            }
        }
        
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) return res.status(404).json({ message: "Leçon introuvable" });
        
        // Charger dynamiquement le contenu si manquant (pour la rétrocompatibilité)
        if (!lesson.htmlContent && lesson.contentUrl) {
            try {
                if (fs.existsSync(lesson.contentUrl)) {
                    lesson.htmlContent = fs.readFileSync(lesson.contentUrl, 'utf-8');
                    await lesson.save(); // On le sauvegarde pour la prochaine fois
                }
            } catch (err) {
                console.error("Erreur lors de la lecture du fichier HTML de la leçon", err);
            }
        }
        
        res.status(200).json(lesson);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération de la leçon", error: error.message });
    }
}

async function getCourse(req, res) {
    const { courseId } = req.params;
    const studentId = req.user.id;
    
    try {
        const cohorts = await Cohort.find({ students: studentId });
        const cohortIds = cohorts.map(c => c._id);
        
        const assignment = await Assignment.findOne({
            courseId,
            $or: [
                { assignedToUser: studentId },
                { assignedToCohort: { $in: cohortIds } }
            ]
        });
        
        if (!assignment) {
            return res.status(403).json({ message: "Vous n'avez pas accès à ce cours." });
        }

        const course = await Course.findById(courseId).populate('lessons').populate('quizzes');
        if (!course) return res.status(404).json({ message: "Cours introuvable" });

        const progress = await Progress.findOne({ userId: studentId, courseId: course._id });

        res.status(200).json({ course, progress: progress || { completedLessons: [] }, assignment });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération du cours", error: error.message });
    }
}

async function findStudentAssignment(studentId, courseId) {
    const cohorts = await Cohort.find({ students: studentId }).select('_id');
    const cohortIds = cohorts.map(c => c._id);
    return Assignment.findOne({
        courseId,
        $or: [
            { assignedToUser: studentId },
            { assignedToCohort: { $in: cohortIds } }
        ]
    });
}

async function completeLesson(req, res) {
    const { courseId, lessonId } = req.params;
    const studentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
        return res.status(400).json({ message: "Identifiant invalide." });
    }

    try {
        const assignment = await findStudentAssignment(studentId, courseId);
        if (!assignment) {
            return res.status(403).json({ message: "Accès refusé à ce cours." });
        }

        const lesson = await Lesson.findOne({ _id: lessonId, courseId });
        if (!lesson) {
            return res.status(404).json({ message: "Leçon introuvable dans ce cours." });
        }

        let progress = await Progress.findOne({ userId: studentId, courseId });
        if (!progress) {
            progress = new Progress({ userId: studentId, courseId, completedLessons: [] });
        }

        if (!progress.completedLessons.some(id => id.toString() === lessonId)) {
            progress.completedLessons.push(lessonId);
            await progress.save();
        }

        res.status(200).json({ message: "Leçon marquée comme terminée.", progress });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour de la progression" });
    }
}

async function getQuiz(req, res) {
    const { quizId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
        return res.status(400).json({ message: "Identifiant de quiz invalide." });
    }

    try {
        const quiz = await Quiz.findById(quizId).lean();
        if (!quiz) return res.status(404).json({ message: "Quiz introuvable" });

        const assignment = await findStudentAssignment(req.user.id, quiz.courseId);
        if (!assignment) {
            return res.status(403).json({ message: "Accès refusé à ce quiz." });
        }

        if (Array.isArray(quiz.questions)) {
            quiz.questions.forEach(q => {
                delete q.correctAnswerIndex;
                delete q.correctAnswers;
            });
        }

        res.status(200).json(quiz);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération du quiz" });
    }
}

async function submitQuiz(req, res) {
    const { quizId } = req.params;
    const { answers } = req.body; // Array of { questionId, selectedIndex }
    const studentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
        return res.status(400).json({ message: "Identifiant de quiz invalide." });
    }
    if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: "Veuillez fournir vos réponses au format correct." });
    }

    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: "Quiz introuvable" });

        const assignment = await findStudentAssignment(studentId, quiz.courseId);
        if (!assignment) {
            return res.status(403).json({ message: "Accès refusé à ce quiz." });
        }

        let correctCount = 0;
        const totalQuestions = quiz.questions.length;

        answers.forEach(ans => {
            const question = quiz.questions.id(ans.questionId);
            if (!question) return;
            if (typeof question.correctAnswerIndex === 'number' && question.correctAnswerIndex === ans.selectedIndex) {
                correctCount++;
            } else if (Array.isArray(question.correctAnswers) && question.correctAnswers.includes(ans.selectedIndex)) {
                correctCount++;
            }
        });

        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const passed = score >= quiz.passingThreshold;

        const quizResult = new QuizResult({
            quizId,
            studentId,
            score,
            passed
        });

        await quizResult.save();

        res.status(201).json({
            message: "Quiz soumis avec succès !",
            result: quizResult,
            correctCount,
            totalQuestions
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la soumission du quiz" });
    }
}

async function getNotifications(req, res) {
    try {
        const notifications = await Notification.find({ userId: req.user.id }).sort('-createdAt');
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Erreur" });
    }
}

async function markNotificationAsRead(req, res) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Identifiant invalide." });
    }
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { read: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: "Notification introuvable." });
        }
        res.status(200).json({ message: "Notification lue" });
    } catch (error) {
        res.status(500).json({ message: "Erreur" });
    }
}

async function getMyQuizResults(req, res) {
    try {
        const results = await QuizResult.find({ studentId: req.user.id })
            .populate('quizId', 'title passingThreshold')
            .sort('-createdAt');
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: "Erreur", error: error.message });
    }
}

module.exports = { getAssignedCourses, getCourse, getLesson, completeLesson, getQuiz, submitQuiz, getNotifications, markNotificationAsRead, getMyQuizResults };
