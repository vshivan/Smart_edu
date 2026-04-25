import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

// Map path segments to human-readable labels
const LABELS = {
  dashboard:    'Dashboard',
  generate:     'AI Course Generator',
  roadmap:      'Learning Roadmap',
  chat:         'AI Tutor',
  courses:      'Courses',
  tutors:       'Tutors',
  leaderboard:  'Leaderboard',
  achievements: 'Achievements',
  learn:        'Course Viewer',
  quiz:         'Quiz',
  settings:     'Settings',
  notifications:'Notifications',
  // tutor
  tutor:        'Tutor',
  // admin
  admin:        'Admin',
  users:        'Users',
  analytics:    'Analytics',
};

function getLabel(segment) {
  // UUID-like segment → shorten
  if (/^[0-9a-f-]{20,}$/i.test(segment)) return segment.slice(0, 8) + '…';
  return LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => ({
    label: getLabel(seg),
    path:  '/' + segments.slice(0, i + 1).join('/'),
  }));

  return (
    <nav className="flex items-center gap-1 text-xs text-text-muted mb-4 flex-wrap">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-brand-600 transition-colors">
        <Home size={12} />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1">
          <ChevronRight size={11} className="text-slate-300" />
          {i === crumbs.length - 1 ? (
            <span className="text-text-primary font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-brand-600 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
