import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './StudentDashboard.css';

const QuizView = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await api.get(`/student/quizzes/${quizId}`);
        setQuiz(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Impossible de charger le QCM.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleOptionSelect = (questionId, index) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: index
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Formater les réponses pour l'API : Array of { questionId, selectedIndex }
    const formattedAnswers = Object.keys(answers).map(qId => ({
      questionId: qId,
      selectedIndex: answers[qId]
    }));

    if (formattedAnswers.length < quiz.questions.length) {
      if (!window.confirm("Vous n'avez pas répondu à toutes les questions. Voulez-vous vraiment soumettre ?")) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/student/quizzes/${quizId}/submit`, {
        answers: formattedAnswers
      });
      setResult(response.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la soumission du quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-container text-center padding-lg">Chargement du QCM...</div>;
  if (error) return <div className="page-container text-center padding-lg text-danger">{error}</div>;
  if (!quiz) return <div className="page-container">QCM introuvable</div>;

  return (
    <div className="page-container">
      <header className="dashboard-header margin-bottom-lg">
        <div className="header-text">
          <Link to={`/student/courses/${courseId}`} className="link-back">
            &larr; Retour au cours
          </Link>
          <h1>{quiz.title}</h1>
          <p>Seuil de réussite : {quiz.passingThreshold}%</p>
        </div>
      </header>

      <main className="bg-white padding-md border-radius-md shadow-md">
        {result ? (
          <div className="text-center padding-y-lg">
            <h2>Résultat du QCM</h2>
            <div className={`score-display ${result.result.passed ? 'text-success' : 'text-danger'}`}>
              {result.result.score}%
            </div>
            <p className="margin-bottom-lg" style={{ fontSize: '1.2rem' }}>
              {result.result.passed 
                ? 'Félicitations, vous avez réussi ce QCM ! 🎉' 
                : 'Dommage, vous n\'avez pas atteint le seuil de réussite. Vous ferez mieux la prochaine fois ! 💪'}
            </p>
            <p className="text-muted">Vous avez eu {result.correctCount} bonne(s) réponse(s) sur {result.totalQuestions}.</p>
            
            <button 
              onClick={() => navigate(`/student/courses/${courseId}`)}
              className="btn btn-primary margin-top-lg"
            >
              Retourner au cours
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {quiz.questions && quiz.questions.map((question, qIndex) => (
              <div key={question._id} className="padding-sm margin-bottom-lg border-light border-radius-md">
                <h3 className="card-title">
                  {qIndex + 1}. {question.questionText || question.text}
                </h3>
                
                <div className="flex-col gap-sm">
                  {question.options.map((option, oIndex) => (
                    <label 
                      key={oIndex} 
                      className={`radio-option ${answers[question._id] === oIndex ? 'radio-option-active' : 'radio-option-inactive'}`}
                    >
                      <input 
                        type="radio" 
                        name={`question-${question._id}`}
                        value={oIndex}
                        checked={answers[question._id] === oIndex}
                        onChange={() => handleOptionSelect(question._id, oIndex)}
                        className="radio-input"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="margin-top-lg text-center">
              <button 
                type="submit" 
                disabled={submitting || !quiz.questions || quiz.questions.length === 0}
                className="btn btn-purple"
              >
                {submitting ? 'Correction en cours...' : 'Soumettre mes réponses'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default QuizView;
