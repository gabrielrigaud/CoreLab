import React from 'react';
import { Navigate } from 'react-router-dom';

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const GuestRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (token) {
    const decoded = decodeToken(token);
    
    // Si le token est valide et non expiré
    if (decoded && (!decoded.exp || decoded.exp * 1000 >= Date.now())) {
      // Utilisateur déjà connecté, on le redirige selon son rôle
      if (decoded.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      } else {
        return <Navigate to="/student/dashboard" replace />;
      }
    } else {
      // Token invalide ou expiré, on nettoie
      localStorage.removeItem('token');
    }
  }

  // Pas de token valide, on affiche la page de login/register
  return children;
};

export default GuestRoute;
