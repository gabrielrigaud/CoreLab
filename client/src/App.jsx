import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import StudentDashboard from './pages/StudentDashboard'
import CourseDetails from './pages/CourseDetails'
import LessonView from './pages/LessonView'
import QuizView from './pages/QuizView'
import Login from './pages/Login'
import Register from './pages/Register'
import FirstLogin from './pages/FirstLogin'
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageUsers from './pages/admin/ManageUsers'
import ManageCourses from './pages/admin/ManageCourses'
import AdminCourseDetails from './pages/admin/AdminCourseDetails'
import ManageGrades from './pages/admin/ManageGrades'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/first-login" element={<ProtectedRoute allowFirstLogin={true}><FirstLogin /></ProtectedRoute>} />
        <Route path="/student/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/courses/:id" element={<ProtectedRoute><CourseDetails /></ProtectedRoute>} />
        <Route path="/student/courses/:courseId/lessons/:lessonId" element={<ProtectedRoute><LessonView /></ProtectedRoute>} />
        <Route path="/student/courses/:courseId/quizzes/:quizId" element={<ProtectedRoute><QuizView /></ProtectedRoute>} />
        
        {/* Routes Admin */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="courses" element={<ManageCourses />} />
          <Route path="courses/:id" element={<AdminCourseDetails />} />
          <Route path="grades" element={<ManageGrades />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
