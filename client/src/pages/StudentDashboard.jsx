import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import CourseCard from '../components/CourseCard';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/student/courses');
        // Mapper la réponse de l'API pour qu'elle corresponde au composant CourseCard
        const mappedCourses = response.data.map(item => {
          const { course, progress } = item;
          
          let status = 'pending';
          if (progress.percentage === 100) status = 'passed';
          else if (progress.percentage > 0) status = 'in-progress';

          return {
            id: course._id,
            title: course.title,
            description: course.description,
            coverImage: course.coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            status: status,
            progress: progress.percentage,
            completedLessons: progress.completedLessons,
            totalLessons: progress.totalLessons,
            failedAttempts: 0 // Simplification pour le dashboard
          };
        });
        
        setCourses(mappedCourses);
      } catch (err) {
        setError('Impossible de charger vos cours.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const response = await api.get('/student/notifications');
        setNotifications(response.data);
      } catch (err) {
        console.error("Erreur chargement notifications", err);
      }
    };

    fetchCourses().then(() => fetchNotifications());
  }, []);

  const totalCourses = courses.length;
  const passedCourses = courses.filter(c => c.status === 'passed').length;
  const overallProgress = totalCourses > 0 
    ? Math.round(courses.reduce((acc, curr) => acc + curr.progress, 0) / totalCourses) 
    : 0;

  if (loading) {
    return <div className="page-container flex-center padding-lg">Chargement de votre espace...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/student/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {
      // ignore transient notification read error
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="page-container">
      <header className="dashboard-header flex-between align-center margin-bottom-lg">
        <div className="header-text">
          <h1>Tableau de bord</h1>
          <p>Bienvenue dans votre espace d'apprentissage.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{overallProgress}%</span>
              <span className="stat-desc">Progression globale</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{passedCourses}/{totalCourses}</span>
              <span className="stat-desc">Cours terminés</span>
            </div>
          </div>
          
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', position: 'relative', top: '2px' }}
            >
              🔔
              {unreadCount > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger, #e74c3c)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{unreadCount}</span>}
            </button>
            {showNotifications && (
                <div style={{ position: 'absolute', top: '100%', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', width: '300px', zIndex: 100, maxHeight: '400px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginTop: '10px' }}>
                    <h3 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid #e2e8f0', fontSize: '1rem', color: 'var(--text-primary, #1e293b)' }}>Notifications</h3>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>Aucune notification</div>
                    ) : (
                        notifications.map(n => (
                            <div key={n._id} style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', background: n.read ? '#fff' : '#eff6ff' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary, #1e293b)' }}>{n.message}</p>
                                {!n.read && (
                                    <button onClick={() => handleMarkAsRead(n._id)} style={{ fontSize: '0.8rem', marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--accent-primary, #4361ee)', cursor: 'pointer', padding: 0, fontWeight: '500' }}>
                                        Marquer comme lue
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
          </div>

          <button onClick={handleLogout} className="btn btn-danger">
            Se déconnecter
          </button>
        </div>
      </header>

      <main>
        {error && <div className="message-error margin-bottom-lg">{error}</div>}
        
        <section className="courses-section">
          <h2>Mes cours</h2>
          {courses.length === 0 && !error ? (
            <p>Vous n'êtes inscrit à aucun cours pour le moment.</p>
          ) : (
            <div className="courses-grid">
              {courses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
