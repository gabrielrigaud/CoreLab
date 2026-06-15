import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Login.css';

const FirstLogin = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 9) {
      setError('Le mot de passe doit faire au moins 9 caractères.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/updatePassword', {
        newPassword
      });

      // Mot de passe changé avec succès
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Bienvenue sur CoreLab</h2>
        <p className="login-subtitle">Pour votre sécurité, veuillez choisir un nouveau mot de passe pour votre première connexion.</p>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="newPassword">Nouveau mot de passe</label>
            <input 
              type="password" 
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input 
              type="password" 
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
            />
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Valider'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FirstLogin;
