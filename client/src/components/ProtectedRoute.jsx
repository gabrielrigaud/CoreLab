import React from 'react';
import { Navigate } from 'react-router-dom';

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    // Non connecté, redirection vers le login
    return <Navigate to="/login" replace />;
  }

  const decoded = decodeToken(token);

  if (!decoded) {
    // Token invalide
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // Vérifier si le token est expiré (si le champ exp existe)
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // Vérifier le rôle
  if (requireAdmin && decoded.role !== 'admin') {
    // Connecté mais pas admin, on redirige vers son dashboard étudiant
    return <Navigate to="/student/dashboard" replace />;
  }

  // Tout est ok, on affiche le composant enfant
  return children;
};

export default ProtectedRoute;
