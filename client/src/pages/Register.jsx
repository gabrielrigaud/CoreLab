import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './Login.css';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 9) {
      setError('Le mot de passe doit contenir au moins 9 caractères.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        password
      });

      // Inscription réussie, redirection vers le login
      navigate('/login', { state: { message: 'Inscription réussie ! Vous pouvez vous connecter.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription. Vérifiez vos informations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Créer un compte CoreLab</h2>
        <p className="login-subtitle">Rejoignez la plateforme d'apprentissage</p>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleRegister} className="login-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Prénom</label>
              <input 
                type="text" 
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Nom</label>
              <input 
                type="text" 
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Adresse e-mail</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <small className="help-text">
              Minimum 9 caractères
            </small>
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>

        <div className="login-divider">
          <span>Vous avez déjà un compte ?</span>
          <Link to="/login" className="login-link-btn">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
