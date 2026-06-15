import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const ManageGrades = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await api.get('/admin/results');
      setResults(response.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des notes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/admin/results/export', {
        responseType: 'blob' // Important pour recevoir le fichier !
      });
      
      // Création d'un lien invisible pour déclencher le téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'resultats_qcm.csv');
      document.body.appendChild(link);
      link.click();
      
      // Nettoyage
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erreur lors du téléchargement du CSV');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div className="flex-between align-center margin-bottom-lg">
        <h1 className="admin-page-title margin-none">Notes & Résultats</h1>
        
        <button 
          onClick={handleExportCSV}
          disabled={downloading || results.length === 0}
          className="btn btn-success flex-center gap-sm"
        >
          {downloading ? 'Préparation...' : 'Exporter au format CSV'}
        </button>
      </div>
      
      <div className="bg-white padding-md border-radius-md shadow-sm">
        {loading ? (
          <p>Chargement des résultats...</p>
        ) : results.length === 0 ? (
          <p className="text-muted" style={{ fontStyle: 'italic' }}>Aucun résultat de QCM n'a encore été enregistré.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>QCM</th>
                  <th>Score</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result._id}>
                    <td>
                      {result.studentId ? `${result.studentId.firstName} ${result.studentId.lastName}` : 'Utilisateur supprimé'}
                    </td>
                    <td>
                      {result.quizId ? result.quizId.title : 'QCM supprimé'}
                    </td>
                    <td className="text-bold">
                      {result.score}%
                    </td>
                    <td>
                      <span className={result.passed ? 'badge-success' : 'badge-error'}>
                        {result.passed ? 'Réussi' : 'Échoué'}
                      </span>
                    </td>
                    <td className="text-muted">
                      {new Date(result.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageGrades;
