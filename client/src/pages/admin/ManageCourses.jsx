import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      const response = await api.get('/admin/courses');
      setCourses(response.data);
    } catch {
      setError('Erreur lors de la récupération des cours.');
    }
  };

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await api.get('/admin/courses');
        setCourses(response.data);
      } catch {
        setError('Erreur lors de la récupération des cours.');
      }
    };
    loadCourses();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newTitle) return;

    setLoading(true);
    setError('');
    try {
      await api.post('/admin/courses', {
        title: newTitle,
        description: newDescription
      });
      setNewTitle('');
      setNewDescription('');
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du cours.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="admin-page-title">Cours & Contenus</h1>

      {error && <div className="message-box message-error">{error}</div>}
      
      <div className="grid-1-2">
        {/* Créer un cours */}
        <div className="bg-white padding-md border-radius-md shadow-sm" style={{ alignSelf: 'start' }}>
          <h2 className="card-title">
            Nouveau Cours
          </h2>
          
          <form onSubmit={handleCreateCourse}>
            <div className="margin-bottom-sm">
              <label className="input-label">Titre du cours</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="input-control"
                minLength={3}
                required
              />
            </div>
            <div className="margin-bottom-md">
              <label className="input-label">Description</label>
              <textarea 
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="input-control"
                style={{ minHeight: '100px', resize: 'none' }}
                minLength={10}
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-success btn-block margin-top-xs"
            >
              {loading ? 'Création...' : 'Créer le cours'}
            </button>
          </form>
        </div>

        {/* Liste des cours */}
        <div className="bg-white padding-md border-radius-md shadow-sm">
          <h2 className="card-title">
            Catalogue des cours
          </h2>
          
          <div className="flex-col gap-sm">
            {courses.length === 0 ? (
              <p className="text-muted" style={{ fontStyle: 'italic' }}>Aucun cours n'a été créé.</p>
            ) : (
              courses.map(course => (
                <div key={course._id} className="list-item align-center">
                  <div>
                    <h3 className="margin-none margin-bottom-xs text-primary">{course.title}</h3>
                    <p className="margin-none text-muted">
                      {course.lessons?.length || 0} Leçon(s) | {course.quizzes?.length || 0} QCM
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/admin/courses/${course._id}`)}
                    className="btn btn-primary"
                  >
                    Gérer le contenu
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCourses;
