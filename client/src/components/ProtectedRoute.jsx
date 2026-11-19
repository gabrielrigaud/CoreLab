import { Navigate } from 'react-router-dom';
import { decodeToken, isTokenExpired } from '../utils/auth';

const ProtectedRoute = ({ children, requireAdmin = false, allowFirstLogin = false }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const decoded = decodeToken(token);

  if (!decoded || isTokenExpired(decoded)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  if (decoded.firstLogin && !allowFirstLogin) {
    return <Navigate to="/first-login" replace />;
  }

  if (requireAdmin && decoded.role !== 'admin') {
    return <Navigate to="/student/dashboard" replace />;
  }

  if (!requireAdmin && !allowFirstLogin && decoded.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
