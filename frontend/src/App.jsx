import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import PageTransition from './components/PageTransition';

// ── Layouts ───────────────────────────────────────────────────────────────────
import PublicLayout    from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout     from './layouts/AdminLayout';

// ── Public pages (no auth required) ──────────────────────────────────────────
const LandingPage        = lazy(() => import('./pages/LandingPage'));
const LoginPage          = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/auth/RegisterPage'));
const AuthCallback       = lazy(() => import('./pages/auth/AuthCallback'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('./pages/auth/ResetPasswordPage'));
const PaymentCallback    = lazy(() => import('./pages/PaymentCallback'));

// ── Learner pages (auth required) ─────────────────────────────────────────────
const Dashboard      = lazy(() => import('./pages/learner/Dashboard'));
const CourseCatalog  = lazy(() => import('./pages/learner/CourseCatalog'));
const CourseDetail   = lazy(() => import('./pages/learner/CourseDetail'));
const CourseLearn    = lazy(() => import('./pages/learner/CourseLearn'));
const GenerateCourse = lazy(() => import('./pages/learner/GenerateCourse'));
const Roadmap        = lazy(() => import('./pages/learner/Roadmap'));
const AIChat         = lazy(() => import('./pages/learner/AIChat'));
const QuizPage       = lazy(() => import('./pages/learner/QuizPage'));
const Achievements   = lazy(() => import('./pages/learner/Achievements'));
const Leaderboard    = lazy(() => import('./pages/learner/Leaderboard'));
const TutorMarketplace = lazy(() => import('./pages/learner/TutorMarketplace'));
const TutorProfile   = lazy(() => import('./pages/learner/TutorProfile'));

// ── Tutor pages ───────────────────────────────────────────────────────────────
const TutorDashboard = lazy(() => import('./pages/tutor/TutorDashboard'));

// ── Admin pages ───────────────────────────────────────────────────────────────
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers     = lazy(() => import('./pages/admin/AdminUsers'));
const AdminTutors    = lazy(() => import('./pages/admin/AdminTutors'));
const AdminCourses   = lazy(() => import('./pages/admin/AdminCourses'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));

// ── Shared authenticated pages ────────────────────────────────────────────────
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const NotFound     = lazy(() => import('./pages/NotFound'));

// ── Loading spinner ───────────────────────────────────────────────────────────
function PageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface dark:bg-dark-bg">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Route guards ──────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

// Redirect logged-in users away from login/register
const GuestRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  if (token) {
    const dest = user?.role === 'admin' ? '/admin' : user?.role === 'tutor' ? '/tutor/dashboard' : '/dashboard';
    return <Navigate to={dest} replace />;
  }
  return children;
};

function AnimatedPage({ children }) {
  return <PageTransition>{children}</PageTransition>;
}

export default function App() {
  const location = useLocation();

  return (
    <Suspense fallback={<PageSpinner />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* ── Fully public (no auth) ────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<AnimatedPage><LandingPage /></AnimatedPage>} />
            <Route path="/login"          element={<GuestRoute><AnimatedPage><LoginPage /></AnimatedPage></GuestRoute>} />
            <Route path="/register"       element={<GuestRoute><AnimatedPage><RegisterPage /></AnimatedPage></GuestRoute>} />
            <Route path="/auth/callback"  element={<AnimatedPage><AuthCallback /></AnimatedPage>} />
            <Route path="/forgot-password" element={<AnimatedPage><ForgotPasswordPage /></AnimatedPage>} />
            <Route path="/reset-password"  element={<AnimatedPage><ResetPasswordPage /></AnimatedPage>} />
            <Route path="/payment/callback" element={<AnimatedPage><PaymentCallback /></AnimatedPage>} />
          </Route>

          {/* ── Learner (auth required) ───────────────────────────── */}
          <Route element={<ProtectedRoute roles={['learner']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard"       element={<AnimatedPage><Dashboard /></AnimatedPage>} />
            <Route path="/generate"        element={<AnimatedPage><GenerateCourse /></AnimatedPage>} />
            <Route path="/roadmap"         element={<AnimatedPage><Roadmap /></AnimatedPage>} />
            <Route path="/chat"            element={<AnimatedPage><AIChat /></AnimatedPage>} />
            {/* Courses & Tutors — login required */}
            <Route path="/courses"         element={<AnimatedPage><CourseCatalog /></AnimatedPage>} />
            <Route path="/courses/:id"     element={<AnimatedPage><CourseDetail /></AnimatedPage>} />
            <Route path="/learn/:courseId" element={<AnimatedPage><CourseLearn /></AnimatedPage>} />
            <Route path="/tutors"          element={<AnimatedPage><TutorMarketplace /></AnimatedPage>} />
            <Route path="/tutors/:id"      element={<AnimatedPage><TutorProfile /></AnimatedPage>} />
            <Route path="/quiz/:quizId"    element={<AnimatedPage><QuizPage /></AnimatedPage>} />
            <Route path="/achievements"    element={<AnimatedPage><Achievements /></AnimatedPage>} />
            <Route path="/leaderboard"     element={<AnimatedPage><Leaderboard /></AnimatedPage>} />
          </Route>

          {/* ── Tutor ─────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute roles={['tutor']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/tutor/dashboard" element={<AnimatedPage><TutorDashboard /></AnimatedPage>} />
            {/* Tutors can also browse courses */}
            <Route path="/courses"         element={<AnimatedPage><CourseCatalog /></AnimatedPage>} />
            <Route path="/courses/:id"     element={<AnimatedPage><CourseDetail /></AnimatedPage>} />
          </Route>

          {/* ── Admin ─────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route path="/admin"           element={<AnimatedPage><AdminDashboard /></AnimatedPage>} />
            <Route path="/admin/users"     element={<AnimatedPage><AdminUsers /></AnimatedPage>} />
            <Route path="/admin/tutors"    element={<AnimatedPage><AdminTutors /></AnimatedPage>} />
            <Route path="/admin/courses"   element={<AnimatedPage><AdminCourses /></AnimatedPage>} />
            <Route path="/admin/analytics" element={<AnimatedPage><AdminAnalytics /></AnimatedPage>} />
          </Route>

          {/* ── Settings — all authenticated roles ────────────────── */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/settings" element={<AnimatedPage><SettingsPage /></AnimatedPage>} />
          </Route>

          {/* ── 404 ───────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
