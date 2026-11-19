import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

const AdminCourseDetails = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lesson form
  const [lessonFile, setLessonFile] = useState(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [uploadingLesson, setUploadingLesson] = useState(false);
  
  // Quiz form
  const [quizFile, setQuizFile] = useState(null);
  const [uploadingQuiz, setUploadingQuiz] = useState(false);

  // Assign form
  const [selectedCohort, setSelectedCohort] = useState('');
  const [unlockDates, setUnlockDates] = useState({});
  const [assigning, setAssigning] = useState(false);
  
  const [message, setMessage] = useState({ text: '', type: '' });

  // Edit Lesson
  const [editingLesson, setEditingLesson] = useState(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonFile, setEditLessonFile] = useState(null);
  const [updatingLesson, setUpdatingLesson] = useState(false);

  // Edit Threshold
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editThreshold, setEditThreshold] = useState(50);

  // Edit Course
  const [editingCourse, setEditingCourse] = useState(false);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseDescription, setEditCourseDescription] = useState('');
  const [updatingCourse, setUpdatingCourse] = useState(false);
  const [updatingThreshold, setUpdatingThreshold] = useState(false);

  const fetchCourseAndCohorts = async () => {
    try {
      const [courseRes, cohortsRes] = await Promise.all([
        api.get(`/admin/courses/${id}`),
        api.get('/admin/cohorts')
      ]);
      setCourse(courseRes.data);
      setCohorts(cohortsRes.data);
    } catch {
      setMessage({ text: 'Erreur de chargement', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCourseAndCohorts = async () => {
      try {
        const [courseRes, cohortsRes] = await Promise.all([
          api.get(`/admin/courses/${id}`),
          api.get('/admin/cohorts')
        ]);
        setCourse(courseRes.data);
        setCohorts(cohortsRes.data);
      } catch {
        setMessage({ text: 'Erreur de chargement', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    loadCourseAndCohorts();
  }, [id]);

  const handleLessonUpload = async (e) => {
    e.preventDefault();
    if (!lessonFile) return;

    setUploadingLesson(true);
    const formData = new FormData();
    formData.append('file', lessonFile);
    if (lessonTitle) formData.append('title', lessonTitle);

    try {
      const response = await api.post(`/admin/courses/${id}/lessons`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ text: response.data.message, type: 'success' });
      setLessonFile(null);
      setLessonTitle('');
      document.getElementById('lessonFile').value = '';
      fetchCourseAndCohorts();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Erreur lors de l\'upload de la leçon', type: 'error' });
    } finally {
      setUploadingLesson(false);
    }
  };

  const handleQuizUpload = async (e) => {
    e.preventDefault();
    if (!quizFile) return;

    setUploadingQuiz(true);
    const formData = new FormData();
    formData.append('file', quizFile);

    try {
      const response = await api.post(`/admin/courses/${id}/quizzes/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ text: response.data.message, type: 'success' });
      setQuizFile(null);
      document.getElementById('quizFile').value = '';
      fetchCourseAndCohorts();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Erreur lors de l\'import du QCM', type: 'error' });
    } finally {
      setUploadingQuiz(false);
    }
  };

  const handleDateChange = (lessonId, date) => {
    setUnlockDates(prev => ({ ...prev, [lessonId]: date }));
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedCohort) return;

    setAssigning(true);
    
    const formattedDates = Object.keys(unlockDates).map(lessonId => ({
        lessonId,
        unlockDate: unlockDates[lessonId]
    })).filter(item => item.unlockDate);

    try {
      const response = await api.post('/admin/assignments', {
        courseId: id,
        assignedToCohort: selectedCohort,
        lessonUnlockDates: formattedDates
      });
      setMessage({ text: response.data.message, type: 'success' });
      setUnlockDates({});
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Erreur lors de l\'assignation', type: 'error' });
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    if (!editingLesson) return;

    setUpdatingLesson(true);
    const formData = new FormData();
    if (editLessonFile) formData.append('file', editLessonFile);
    if (editLessonTitle) formData.append('title', editLessonTitle);

    try {
      const response = await api.put(`/admin/lessons/${editingLesson}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ text: response.data.message, type: 'success' });
      setEditingLesson(null);
      setEditLessonFile(null);
      fetchCourseAndCohorts();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Erreur lors de la mise à jour de la leçon', type: 'error' });
    } finally {
      setUpdatingLesson(false);
    }
  };

  const handleUpdateThreshold = async (e) => {
    e.preventDefault();
    if (!editingQuiz) return;

    setUpdatingThreshold(true);
    try {
      const response = await api.put(`/quizzes/${editingQuiz}/threshold`, { threshold: Number(editThreshold) });
      setMessage({ text: response.data.message, type: 'success' });
      setEditingQuiz(null);
      fetchCourseAndCohorts();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Erreur', type: 'error' });
    } finally {
      setUpdatingThreshold(false);
    }
  };

  const startEditCourse = () => {
    setEditCourseTitle(course.title || '');
    setEditCourseDescription(course.description || '');
    setEditingCourse(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    setUpdatingCourse(true);
    try {
      const response = await api.put(`/admin/courses/${id}`, {
        title: editCourseTitle,
        description: editCourseDescription
      });
      setMessage({ text: response.data.message || 'Cours mis à jour !', type: 'success' });
      setEditingCourse(false);
      fetchCourseAndCohorts();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Erreur lors de la mise à jour du cours', type: 'error' });
    } finally {
      setUpdatingCourse(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!course) return <div>Cours introuvable</div>;

  return (
    <div>
      <Link to="/admin/courses" className="link-back">
        &larr; Retour aux cours
      </Link>
      
      <div className="flex-between align-center margin-bottom-md">
        <div>
          <h1 className="admin-page-title margin-none">{course.title}</h1>
          {course.description && <p className="text-muted margin-top-xs">{course.description}</p>}
        </div>
        {!editingCourse && (
          <button type="button" onClick={startEditCourse} className="btn btn-primary btn-small">
            Modifier le cours
          </button>
        )}
      </div>

      {editingCourse && (
        <form onSubmit={handleUpdateCourse} className="bg-white padding-md border-radius-md shadow-sm margin-bottom-md">
          <h2 className="card-title">Modifier les informations du cours</h2>
          <div className="margin-bottom-sm">
            <label className="input-label">Titre du cours</label>
            <input
              type="text"
              value={editCourseTitle}
              onChange={(e) => setEditCourseTitle(e.target.value)}
              className="input-control"
              minLength={3}
              required
            />
          </div>
          <div className="margin-bottom-md">
            <label className="input-label">Description</label>
            <textarea
              value={editCourseDescription}
              onChange={(e) => setEditCourseDescription(e.target.value)}
              className="input-control"
              style={{ minHeight: '90px', resize: 'vertical' }}
              minLength={10}
              required
            />
          </div>
          <div className="flex-row gap-sm">
            <button type="submit" disabled={updatingCourse} className="btn btn-success btn-small">
              {updatingCourse ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setEditingCourse(false)} className="btn btn-secondary btn-small">
              Annuler
            </button>
          </div>
        </form>
      )}
      
      {message.text && (
        <div className={`message-box ${message.type === 'error' ? 'message-error' : 'message-success'}`}>
          {message.text}
        </div>
      )}

      <div className="grid-auto">
        
        {/* Contenus existants */}
        <div className="bg-white padding-md border-radius-md shadow-sm" style={{ gridColumn: '1 / -1' }}>
          <h2 className="card-title">Contenu du cours</h2>
          <div className="flex-col gap-sm">
            {course.lessons && course.lessons.length > 0 && (
              <div className="margin-bottom-md">
                <h3 className="text-muted">Leçons</h3>
                {course.lessons.map(lesson => (
                  <div key={lesson._id} className="list-item flex-between align-center margin-bottom-xs">
                    <div>
                      <strong>{lesson.title}</strong>
                    </div>
                    {editingLesson === lesson._id ? (
                      <form onSubmit={handleUpdateLesson} className="flex-row gap-xs">
                        <input type="text" value={editLessonTitle} onChange={(e) => setEditLessonTitle(e.target.value)} className="input-control" placeholder="Titre" style={{ padding: '0.2rem' }} />
                        <input type="file" accept=".html" onChange={(e) => setEditLessonFile(e.target.files[0])} className="input-control" style={{ padding: '0.2rem' }} />
                        <button type="submit" disabled={updatingLesson} className="btn btn-success btn-small">Valider</button>
                        <button type="button" onClick={() => setEditingLesson(null)} className="btn btn-danger btn-small">Annuler</button>
                      </form>
                    ) : (
                      <button onClick={() => { setEditingLesson(lesson._id); setEditLessonTitle(lesson.title); }} className="btn btn-primary btn-small">Modifier</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {course.quizzes && course.quizzes.length > 0 && (
              <div>
                <h3 className="text-muted">QCM</h3>
                {course.quizzes.map(quiz => (
                  <div key={quiz._id} className="list-item flex-between align-center margin-bottom-xs">
                    <div>
                      <strong>{quiz.title}</strong> (Seuil : {quiz.passingThreshold}%)
                    </div>
                    {editingQuiz === quiz._id ? (
                      <form onSubmit={handleUpdateThreshold} className="flex-row gap-xs">
                        <input type="number" min="0" max="100" value={editThreshold} onChange={(e) => setEditThreshold(e.target.value)} className="input-control" style={{ width: '80px', padding: '0.2rem' }} />
                        <button type="submit" disabled={updatingThreshold} className="btn btn-success btn-small">Valider</button>
                        <button type="button" onClick={() => setEditingQuiz(null)} className="btn btn-danger btn-small">Annuler</button>
                      </form>
                    ) : (
                      <button onClick={() => { setEditingQuiz(quiz._id); setEditThreshold(quiz.passingThreshold || 50); }} className="btn btn-primary btn-small">Définir le seuil</button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {(!course.lessons || course.lessons.length === 0) && (!course.quizzes || course.quizzes.length === 0) && (
              <p className="text-muted italic">Aucun contenu n'a été ajouté à ce cours pour le moment.</p>
            )}
          </div>
        </div>
        
        {/* Ajouter une leçon */}
        <div className="bg-white padding-md border-radius-md shadow-sm">
          <h2 className="card-title">
            Ajouter une Leçon (HTML)
          </h2>
          <form onSubmit={handleLessonUpload}>
            <div className="margin-bottom-sm">
              <label className="input-label">Titre de la leçon</label>
              <input 
                type="text" 
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="input-control"
              />
            </div>
            <div className="margin-bottom-md">
              <label className="input-label">Fichier HTML</label>
              <input 
                type="file" 
                id="lessonFile"
                accept=".html" 
                onChange={(e) => setLessonFile(e.target.files[0])}
                className="input-control border-dashed"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={uploadingLesson || !lessonFile}
              className="btn btn-primary btn-block"
            >
              {uploadingLesson ? 'Upload...' : 'Ajouter la leçon'}
            </button>
          </form>
        </div>

        {/* Importer un QCM */}
        <div className="bg-white padding-md border-radius-md shadow-sm">
          <h2 className="card-title">
            Importer un QCM (JSON)
          </h2>
          <form onSubmit={handleQuizUpload}>
            <div className="margin-bottom-md">
              <label className="input-label">Fichier JSON</label>
              <input 
                type="file" 
                id="quizFile"
                accept=".json" 
                onChange={(e) => setQuizFile(e.target.files[0])}
                className="input-control border-dashed"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={uploadingQuiz || !quizFile}
              className="btn btn-purple btn-block"
            >
              {uploadingQuiz ? 'Import...' : 'Importer le QCM'}
            </button>
          </form>
        </div>

        {/* Assigner à une cohorte */}
        <div className="bg-white padding-md border-radius-md shadow-sm">
          <h2 className="card-title">
            Assigner le cours
          </h2>
          <form onSubmit={handleAssign}>
            <div className="margin-bottom-md">
              <label className="input-label">Sélectionner une cohorte</label>
              <select 
                value={selectedCohort}
                onChange={(e) => setSelectedCohort(e.target.value)}
                className="input-control"
                required
              >
                <option value="">-- Choisir une cohorte --</option>
                {cohorts.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.students?.length || 0} étudiants)</option>
                ))}
              </select>
            </div>

            {course.lessons && course.lessons.length > 0 && (
              <div className="margin-bottom-md">
                <label className="input-label">Planification des leçons (Optionnel)</label>
                <div className="flex-col gap-xs">
                  {course.lessons.map(lesson => (
                    <div key={lesson._id} className="flex-between align-center" style={{ background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px' }}>
                      <span style={{ fontSize: '0.9rem' }}>{lesson.title}</span>
                      <input 
                        type="date" 
                        value={unlockDates[lesson._id] || ''}
                        onChange={(e) => handleDateChange(lesson._id, e.target.value)}
                        className="input-control"
                        style={{ width: 'auto', padding: '0.2rem' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={assigning || !selectedCohort}
              className="btn btn-success btn-block"
            >
              {assigning ? 'Assignation...' : 'Assigner'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminCourseDetails;
