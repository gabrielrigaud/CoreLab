import { useState, useEffect } from 'react';
import api from '../../api/axios';

const ManageUsers = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [cohorts, setCohorts] = useState([]);
  const [students, setStudents] = useState([]);
  const [newCohortName, setNewCohortName] = useState('');

  // Pour l'ajout d'un étudiant à une cohorte : { cohortId: studentId }
  const [selectedStudentForCohort, setSelectedStudentForCohort] = useState({});

  const fetchCohorts = async () => {
    try {
      const response = await api.get('/admin/cohorts');
      setCohorts(response.data);
    } catch {
      setMessage({ text: 'Erreur lors de la récupération des cohortes', type: 'error' });
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students');
      setStudents(response.data);
    } catch {
      setMessage({ text: 'Erreur lors de la récupération des étudiants', type: 'error' });
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [cohortsRes, studentsRes] = await Promise.all([
          api.get('/admin/cohorts'),
          api.get('/admin/students')
        ]);
        setCohorts(cohortsRes.data);
        setStudents(studentsRes.data);
      } catch {
        setMessage({ text: 'Erreur lors du chargement des données.', type: 'error' });
      }
    };
    loadInitialData();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage({ text: 'Veuillez sélectionner un fichier CSV', type: 'error' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/admin/import-students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ text: response.data.message || 'Import réussi !', type: 'success' });
      setFile(null);
      document.getElementById('csvFile').value = '';
      fetchStudents();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Erreur lors de l\'import', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    if (!newCohortName) return;

    try {
      await api.post('/admin/cohorts', { name: newCohortName });
      setNewCohortName('');
      fetchCohorts();
      setMessage({ text: 'Cohorte créée avec succès', type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Erreur lors de la création de la cohorte', type: 'error' });
    }
  };

  const handleAddStudentToCohort = async (cohortId) => {
    const studentId = selectedStudentForCohort[cohortId];
    if (!studentId) return;

    try {
      await api.post(`/admin/cohorts/${cohortId}/students`, { studentIds: [studentId] });
      fetchCohorts();
      setMessage({ text: 'Étudiant ajouté à la cohorte', type: 'success' });
      setSelectedStudentForCohort(prev => ({ ...prev, [cohortId]: '' }));
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Erreur lors de l\'ajout', type: 'error' });
    }
  };

  return (
    <div>
      <h1 className="admin-page-title">Étudiants & Cohortes</h1>

      {message.text && (
        <div className={`message-box ${message.type === 'error' ? 'message-error' : 'message-success'}`}>
          {message.text}
        </div>
      )}

      <div className="grid-2">
        {/* Import CSV */}
        <div className="bg-white padding-md border-radius-md shadow-sm">
          <h2 className="card-title">
            Importer des étudiants
          </h2>
          <p className="text-muted margin-bottom-md">
            Uploadez un fichier CSV au format <code>email,firstName,lastName</code>.
          </p>

          <form onSubmit={handleUpload}>
            <div className="margin-bottom-md">
              <input
                type="file"
                id="csvFile"
                accept=".csv"
                onChange={handleFileChange}
                className="input-control border-dashed"
              />
            </div>
            <button
              type="submit"
              disabled={uploading || !file}
              className="btn btn-primary"
            >
              {uploading ? 'Import en cours...' : 'Importer la liste'}
            </button>
          </form>
        </div>

        {/* Gestion des cohortes */}
        <div className="bg-white padding-md border-radius-md shadow-sm">
          <h2 className="card-title">
            Cohortes actives
          </h2>

          <form onSubmit={handleCreateCohort} className="flex-row gap-sm margin-bottom-md">
            <input
              type="text"
              placeholder="Nom de la nouvelle cohorte..."
              value={newCohortName}
              onChange={(e) => setNewCohortName(e.target.value)}
              className="input-control"
              style={{ flex: 1 }}
              required
            />
            <button
              type="submit"
              className="btn btn-success"
            >
              Créer
            </button>
          </form>

          <ul className="margin-none" style={{ listStyle: 'none', padding: 0 }}>
            {cohorts.map(cohort => (
              <li key={cohort._id} className="list-item margin-bottom-sm" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
                <div className="flex-between align-center">
                  <strong>{cohort.name}</strong>
                  <span className="text-muted">{cohort.students?.length || 0} étudiant(s)</span>
                </div>

                {/* Formulaire ajout étudiant */}
                <div className="flex-row gap-xs">
                  <select
                    value={selectedStudentForCohort[cohort._id] || ''}
                    onChange={(e) => setSelectedStudentForCohort(prev => ({ ...prev, [cohort._id]: e.target.value }))}
                    className="input-control"
                    style={{ flex: 1, padding: '0.2rem' }}
                  >
                    <option value="">-- Ajouter un étudiant --</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.email})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddStudentToCohort(cohort._id)}
                    className="btn btn-primary btn-small"
                    disabled={!selectedStudentForCohort[cohort._id]}
                  >
                    Ajouter
                  </button>
                </div>
              </li>
            ))}
            {cohorts.length === 0 && <li className="text-muted" style={{ fontStyle: 'italic' }}>Aucune cohorte trouvée.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
