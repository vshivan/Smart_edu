import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthCallback from './pages/auth/AuthCallback';

// Learner pages
import Dashboard from './pages/learner/Dashboard';
import CourseCatalog from './pages/learner/CourseCatalog';
import CourseDetail from './pages/learner/CourseDetail';
import CourseLearn from './pages/learner/CourseLearn';
import GenerateCourse from './pages/learner/GenerateCourse';
import Roadmap from './pages/learner/Roadmap';
import AIChat from './pages/learner/AIChat';
import QuizPage from './pages/learner/QuizPage';
import Achievements from './pages/learner/Achievements';
import Leaderboard from './pages/learner/Leaderboard';

// Tutor pages
import TutorDashboard from './pages/tutor/TutorDashboard';
import TutorMarketplace from './pages/learner/TutorMarketplace';
import TutorProfile from './pages/learner/TutorProfile';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTutors from './pages/admin/AdminTutors';
import AdminCourses from './pages/admin/AdminCourses';
import AdminAnalytics from './pages/admin/AdminAnalytics';

const ProtectedRoute = ({ children, roles }) => {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/courses" element={<CourseCatalog />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/tutors" element={<TutorMarketplace />} />
        <Route path="/tutors/:id" element={<TutorProfile />} />
      </Route>

      {/* Learner */}
      <Route element={<ProtectedRoute roles={['learner']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/generate" element={<GenerateCourse />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/chat" element={<AIChat />} />
        <Route path="/learn/:courseId" element={<CourseLearn />} />
        <Route path="/quiz/:quizId" element={<QuizPage />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Route>

      {/* Tutor */}
      <Route element={<ProtectedRoute roles={['tutor']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/tutor/dashboard" element={<TutorDashboard />} />
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/tutors" element={<AdminTutors />} />
        <Route path="/admin/courses" element={<AdminCourses />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
