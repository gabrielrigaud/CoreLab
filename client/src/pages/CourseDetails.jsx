import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './StudentDashboard.css';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizResults, setQuizResults] = useState([]);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const response = await api.get(`/student/courses/${id}`);
        setData(response.data);
      } catch {
        setError('Impossible de charger les détails du cours.');
      } finally {
        setLoading(false);
      }
    };

    const fetchQuizResults = async () => {
      try {
        const response = await api.get('/student/quiz-results');
        setQuizResults(response.data);
      } catch (err) {
        console.error('Erreur chargement résultats QCM', err);
      }
    };

    fetchCourseDetails();
    fetchQuizResults();
  }, [id]);

  if (loading) return <div className="page-container text-center padding-lg">Chargement...</div>;
  if (error) return <div className="page-container text-center padding-lg text-danger">{error}</div>;
  if (!data || !data.course) return <div className="page-container">Cours introuvable</div>;

  const { course, progress, assignment } = data;
  const completedLessons = progress?.completedLessons || [];

  return (
    <div className="page-container">
      <header className="dashboard-header margin-bottom-lg">
        <nav>
          <Link to="/student/dashboard" className="link-back">
            &larr; Retour au tableau de bord
          </Link>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
        </nav>
      </header>

      <main>
        <section className="courses-section">
          <h2>Programme du cours</h2>
          
          <div className="lessons-list flex-col gap-md margin-top-sm">
            <h3>Leçons ({course.lessons?.length || 0})</h3>
            {course.lessons && course.lessons.length > 0 ? (
              course.lessons.map((lesson, index) => {
                const isCompleted = completedLessons.includes(lesson._id);
                
                // Vérifier si la leçon est verrouillée temporellement
                let isLocked = false;
                let unlockDate = null;
                if (assignment?.lessonUnlockDates) {
                  const unlockData = assignment.lessonUnlockDates.find(l => l.lessonId === lesson._id);
                  if (unlockData && new Date() < new Date(unlockData.unlockDate)) {
                    isLocked = true;
                    unlockDate = new Date(unlockData.unlockDate).toLocaleDateString();
                  }
                }

                return (
                  <div key={lesson._id} className={`list-item ${isLocked ? 'locked' : ''}`}>
                    <div>
                      <h4 className="margin-none margin-bottom-xs">{`Leçon ${index + 1} : ${lesson.title}`}</h4>
                      {isCompleted && <span className="text-success text-bold">✓ Terminée</span>}
                      {isLocked && <span className="text-warning">🔒 Débloquée le {unlockDate}</span>}
                    </div>
                    
                    <button 
                      className={`btn ${isLocked ? 'btn-disabled' : 'btn-primary'}`}
                      onClick={() => navigate(`/student/courses/${course._id}/lessons/${lesson._id}`)}
                      disabled={isLocked}
                    >
                      {isCompleted ? 'Revoir' : 'Commencer'}
                    </button>
                  </div>
                );
              })
            ) : (
              <p>Aucune leçon disponible.</p>
            )}

            <h3 className="margin-top-lg">Évaluations ({course.quizzes?.length || 0})</h3>
            {course.quizzes && course.quizzes.length > 0 ? (
              course.quizzes.map((quiz, index) => {
                // Chercher le dernier résultat de cet étudiant pour ce quiz
                const myResults = quizResults.filter(r => r.quizId && r.quizId._id === quiz._id);
                const lastResult = myResults.length > 0 ? myResults[0] : null; // déjà trié par -createdAt

                return (
                  <div key={quiz._id} className="list-item quiz-item">
                    <div>
                      <h4 className="margin-none margin-bottom-xs">{`QCM ${index + 1} : ${quiz.title}`}</h4>
                      <span className="text-muted">Seuil de réussite : {quiz.passingThreshold}%</span>
                      {lastResult && (
                        <div style={{ marginTop: '0.3rem' }}>
                          <span className={lastResult.passed ? 'badge-success' : 'badge-error'}>
                            {lastResult.passed ? '✓ Réussi' : '✗ Échoué'} — {lastResult.score}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      className={`btn ${lastResult?.passed ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => navigate(`/student/courses/${course._id}/quizzes/${quiz._id}`)}
                    >
                      {lastResult ? (lastResult.passed ? 'Revoir' : 'Retenter') : 'Passer le QCM'}
                    </button>
                  </div>
                );
              })
            ) : (
              <p>Aucune évaluation pour ce cours.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default CourseDetails;
