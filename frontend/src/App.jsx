import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import PageTransition from './components/PageTransition';

// ── Layouts (not lazy — tiny, always needed) ──────────────────────────────────
import PublicLayout    from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout     from './layouts/AdminLayout';

// ── Public pages ──────────────────────────────────────────────────────────────
const LandingPage   = lazy(() => import('./pages/LandingPage'));
const LoginPage     = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage  = lazy(() => import('./pages/auth/RegisterPage'));
const AuthCallback  = lazy(() => import('./pages/auth/AuthCallback'));

// ── Shared public pages ───────────────────────────────────────────────────────
const CourseCatalog    = lazy(() => import('./pages/learner/CourseCatalog'));
const CourseDetail     = lazy(() => import('./pages/learner/CourseDetail'));
const TutorMarketplace = lazy(() => import('./pages/learner/TutorMarketplace'));
const TutorProfile     = lazy(() => import('./pages/learner/TutorProfile'));

// ── Learner pages ─────────────────────────────────────────────────────────────
const Dashboard     = lazy(() => import('./pages/learner/Dashboard'));
const CourseLearn   = lazy(() => import('./pages/learner/CourseLearn'));
const GenerateCourse = lazy(() => import('./pages/learner/GenerateCourse'));
const Roadmap       = lazy(() => import('./pages/learner/Roadmap'));
const AIChat        = lazy(() => import('./pages/learner/AIChat'));
const QuizPage      = lazy(() => import('./pages/learner/QuizPage'));
const Achievements  = lazy(() => import('./pages/learner/Achievements'));
const Leaderboard   = lazy(() => import('./pages/learner/Leaderboard'));

// ── Tutor pages ───────────────────────────────────────────────────────────────
const TutorDashboard = lazy(() => import('./pages/tutor/TutorDashboard'));

// ── Admin pages ───────────────────────────────────────────────────────────────
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers     = lazy(() => import('./pages/admin/AdminUsers'));
const AdminTutors    = lazy(() => import('./pages/admin/AdminTutors'));
const AdminCourses   = lazy(() => import('./pages/admin/AdminCourses'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));

// ── Shared pages ──────────────────────────────────────────────────────────────
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const NotFound     = lazy(() => import('./pages/NotFound'));

// ── Spinner shown while lazy chunks load ─────────────────────────────────────
function PageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Route guard ───────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

// ── Animated page wrapper used inside each route ──────────────────────────────
function AnimatedPage({ children }) {
  return <PageTransition>{children}</PageTransition>;
}

export default function App() {
  const location = useLocation();

  return (
    <Suspense fallback={<PageSpinner />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* ── Public ───────────────────────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/"              element={<AnimatedPage><LandingPage /></AnimatedPage>} />
            <Route path="/login"         element={<AnimatedPage><LoginPage /></AnimatedPage>} />
            <Route path="/register"      element={<AnimatedPage><RegisterPage /></AnimatedPage>} />
            <Route path="/auth/callback" element={<AnimatedPage><AuthCallback /></AnimatedPage>} />
            <Route path="/courses"       element={<AnimatedPage><CourseCatalog /></AnimatedPage>} />
            <Route path="/courses/:id"   element={<AnimatedPage><CourseDetail /></AnimatedPage>} />
            <Route path="/tutors"        element={<AnimatedPage><TutorMarketplace /></AnimatedPage>} />
            <Route path="/tutors/:id"    element={<AnimatedPage><TutorProfile /></AnimatedPage>} />
          </Route>

          {/* ── Learner ──────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute roles={['learner']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard"       element={<AnimatedPage><Dashboard /></AnimatedPage>} />
            <Route path="/generate"        element={<AnimatedPage><GenerateCourse /></AnimatedPage>} />
            <Route path="/roadmap"         element={<AnimatedPage><Roadmap /></AnimatedPage>} />
            <Route path="/chat"            element={<AnimatedPage><AIChat /></AnimatedPage>} />
            <Route path="/learn/:courseId" element={<AnimatedPage><CourseLearn /></AnimatedPage>} />
            <Route path="/quiz/:quizId"    element={<AnimatedPage><QuizPage /></AnimatedPage>} />
            <Route path="/achievements"    element={<AnimatedPage><Achievements /></AnimatedPage>} />
            <Route path="/leaderboard"     element={<AnimatedPage><Leaderboard /></AnimatedPage>} />
          </Route>

          {/* ── Tutor ────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute roles={['tutor']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/tutor/dashboard" element={<AnimatedPage><TutorDashboard /></AnimatedPage>} />
          </Route>

          {/* ── Admin ────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route path="/admin"           element={<AnimatedPage><AdminDashboard /></AnimatedPage>} />
            <Route path="/admin/users"     element={<AnimatedPage><AdminUsers /></AnimatedPage>} />
            <Route path="/admin/tutors"    element={<AnimatedPage><AdminTutors /></AnimatedPage>} />
            <Route path="/admin/courses"   element={<AnimatedPage><AdminCourses /></AnimatedPage>} />
            <Route path="/admin/analytics" element={<AnimatedPage><AdminAnalytics /></AnimatedPage>} />
          </Route>

          {/* ── Settings — shared across all authenticated roles ──────── */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/settings" element={<AnimatedPage><SettingsPage /></AnimatedPage>} />
          </Route>

          {/* ── 404 ──────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
