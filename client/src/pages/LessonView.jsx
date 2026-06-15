import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './StudentDashboard.css';

const LessonView = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await api.get(`/student/courses/${courseId}/lessons/${lessonId}`);
        setLesson(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Impossible de charger la leçon.');
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [courseId, lessonId]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api.post(`/student/courses/${courseId}/lessons/${lessonId}/complete`);
      navigate(`/student/courses/${courseId}`);
    } catch (err) {
      alert('Erreur lors de la validation de la leçon.');
      setCompleting(false);
    }
  };

  if (loading) return <div className="page-container text-center padding-lg">Chargement de la leçon...</div>;
  if (error) return <div className="page-container text-center padding-lg text-danger">{error}</div>;
  if (!lesson) return <div className="page-container">Leçon introuvable</div>;

  return (
    <div className="page-container">
      <header className="dashboard-header margin-bottom-lg">
        <nav>
          <Link to={`/student/courses/${courseId}`} className="link-back">
            &larr; Retour au cours
          </Link>
          <h1>{lesson.title}</h1>
        </nav>
      </header>

      <main className="bg-white padding-md border-radius-md shadow-md">
        {lesson.htmlContent ? (
          <div 
            className="lesson-content" 
            dangerouslySetInnerHTML={{ __html: lesson.htmlContent }} 
          />
        ) : (
          <div>
            <p>Le contenu textuel n'est pas disponible pour cette leçon.</p>
            {lesson.contentUrl && (
              <a href={lesson.contentUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                Ouvrir le contenu externe
              </a>
            )}
          </div>
        )}

        <div className="margin-top-lg border-top-light padding-y-lg text-center">
          <button 
            onClick={handleComplete} 
            disabled={completing}
            className="btn btn-success"
          >
            {completing ? 'Validation...' : 'J\'ai terminé cette leçon'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default LessonView;
