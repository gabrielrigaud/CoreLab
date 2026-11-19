import { Navigate } from 'react-router-dom';
import { decodeToken, isTokenExpired } from '../utils/auth';

const GuestRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (token) {
    const decoded = decodeToken(token);

    if (decoded && !isTokenExpired(decoded)) {
      if (decoded.firstLogin) {
        return <Navigate to="/first-login" replace />;
      }
      if (decoded.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      }
      return <Navigate to="/student/dashboard" replace />;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return children;
};

export default GuestRoute;
