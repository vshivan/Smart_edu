import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  User, Lock, Bell, Palette, Shield,
  Save, Eye, EyeOff, Check,
} from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'security',      label: 'Security',       icon: Lock },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'appearance',    label: 'Appearance',     icon: Palette },
];

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    email:      user?.email      || '',
    bio:        user?.bio        || '',
  });

  const mutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data),
    onSuccess: (res) => {
      updateUser(res.data.data);
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Profile Information</h2>
        <p className="text-sm text-text-muted mt-0.5">Update your personal details</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 border-2 border-brand-200 flex items-center justify-center text-2xl font-bold text-brand-700">
          {user?.first_name?.[0]}{user?.last_name?.[0]}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{user?.first_name} {user?.last_name}</p>
          <p className="text-xs text-text-muted capitalize">{user?.role} · {user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="input-label">First Name</label>
          <input
            className="input"
            value={form.first_name}
            onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
          />
        </div>
        <div>
          <label className="input-label">Last Name</label>
          <input
            className="input"
            value={form.last_name}
            onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="input-label">Email</label>
          <input
            className="input bg-surface-muted cursor-not-allowed"
            value={form.email}
            disabled
            title="Email cannot be changed"
          />
          <p className="text-xs text-text-muted mt-1">Email address cannot be changed</p>
        </div>
        <div className="sm:col-span-2">
          <label className="input-label">Bio <span className="text-text-muted font-normal">(optional)</span></label>
          <textarea
            className="input resize-none h-24"
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Tell us a bit about yourself..."
          />
        </div>
      </div>

      <button
        onClick={() => mutation.mutate(form)}
        disabled={mutation.isPending}
        className="btn-primary flex items-center gap-2 text-sm"
      >
        <Save size={15} />
        {mutation.isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });

  const mutation = useMutation({
    mutationFn: (data) => api.put('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to change password'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) return toast.error('Passwords do not match');
    if (form.new_password.length < 8) return toast.error('Password must be at least 8 characters');
    mutation.mutate({ current_password: form.current_password, new_password: form.new_password });
  };

  const PasswordField = ({ label, field, showKey }) => (
    <div>
      <label className="input-label">{label}</label>
      <div className="relative">
        <input
          type={show[showKey] ? 'text' : 'password'}
          className="input pr-10"
          value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
        >
          {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Change Password</h2>
        <p className="text-sm text-text-muted mt-0.5">Keep your account secure with a strong password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <PasswordField label="Current Password"  field="current_password" showKey="current" />
        <PasswordField label="New Password"      field="new_password"     showKey="new" />
        <PasswordField label="Confirm Password"  field="confirm_password" showKey="confirm" />

        {/* Password strength hints */}
        {form.new_password && (
          <div className="space-y-1.5 p-3 bg-surface-muted rounded-xl border border-surface-border">
            {[
              { label: 'At least 8 characters', ok: form.new_password.length >= 8 },
              { label: 'Contains a number',     ok: /\d/.test(form.new_password) },
              { label: 'Contains uppercase',    ok: /[A-Z]/.test(form.new_password) },
            ].map(({ label, ok }) => (
              <div key={label} className={`flex items-center gap-2 text-xs ${ok ? 'text-emerald-600' : 'text-text-muted'}`}>
                <Check size={11} className={ok ? 'text-emerald-500' : 'text-slate-300'} />
                {label}
              </div>
            ))}
          </div>
        )}

        <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2 text-sm">
          <Shield size={15} />
          {mutation.isPending ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

// ── Notifications Tab ─────────────────────────────────────────────────────────
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    email_course_updates:  true,
    email_session_reminders: true,
    email_achievements:    false,
    email_announcements:   true,
    push_xp_earned:        true,
    push_streak_reminder:  true,
    push_new_messages:     true,
  });

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const Toggle = ({ label, desc, pref }) => (
    <div className="flex items-center justify-between py-3 border-b border-surface-border last:border-0">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {desc && <p className="text-xs text-text-muted mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => toggle(pref)}
        className={`relative w-10 h-5.5 rounded-full transition-colors ${prefs[pref] ? 'bg-brand-600' : 'bg-slate-200'}`}
        style={{ height: '22px', width: '40px' }}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${prefs[pref] ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Notification Preferences</h2>
        <p className="text-sm text-text-muted mt-0.5">Choose what you want to be notified about</p>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 bg-surface-muted border-b border-surface-border">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Email Notifications</p>
        </div>
        <div className="px-5">
          <Toggle label="Course Updates"      desc="New lessons, course changes"         pref="email_course_updates" />
          <Toggle label="Session Reminders"   desc="Upcoming tutor session alerts"       pref="email_session_reminders" />
          <Toggle label="Achievements"        desc="Badge earned, level up"              pref="email_achievements" />
          <Toggle label="Announcements"       desc="Platform news and updates"           pref="email_announcements" />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 bg-surface-muted border-b border-surface-border">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">In-App Notifications</p>
        </div>
        <div className="px-5">
          <Toggle label="XP Earned"           desc="When you complete lessons or quizzes" pref="push_xp_earned" />
          <Toggle label="Streak Reminder"     desc="Daily login streak alerts"            pref="push_streak_reminder" />
          <Toggle label="New Messages"        desc="Tutor and system messages"            pref="push_new_messages" />
        </div>
      </div>

      <button
        onClick={() => toast.success('Notification preferences saved')}
        className="btn-primary flex items-center gap-2 text-sm"
      >
        <Save size={15} /> Save Preferences
      </button>
    </div>
  );
}

// ── Appearance Tab ────────────────────────────────────────────────────────────
function AppearanceTab() {
  const { theme, setTheme } = require('../../store/themeStore').useThemeStore();

  const colors = [
    { id: 'indigo', label: 'Indigo',  bg: 'bg-indigo-500' },
    { id: 'violet', label: 'Violet',  bg: 'bg-violet-500' },
    { id: 'blue',   label: 'Blue',    bg: 'bg-blue-500' },
    { id: 'emerald',label: 'Emerald', bg: 'bg-emerald-500' },
    { id: 'rose',   label: 'Rose',    bg: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-text-primary dark:text-white">Appearance</h2>
        <p className="text-sm text-text-muted mt-0.5">Customize how SmartEduLearn looks</p>
      </div>

      {/* Theme */}
      <div className="card dark:bg-dark-card dark:border-dark-border">
        <p className="text-sm font-semibold text-text-primary dark:text-white mb-3">Theme</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'light', label: 'Light', icon: '☀️', desc: 'Clean white interface' },
            { id: 'dark',  label: 'Dark',  icon: '🌙', desc: 'Easy on the eyes' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                theme === t.id
                  ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-surface-border dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="text-2xl mb-2">{t.icon}</div>
              <p className="text-sm font-semibold text-text-primary dark:text-white">{t.label}</p>
              <p className="text-xs text-text-muted">{t.desc}</p>
              {theme === t.id && <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-1">✓ Active</p>}
            </button>
          ))}
        </div>
      </div>

      {/* Accent colors */}
      <div className="card dark:bg-dark-card dark:border-dark-border">
        <p className="text-sm font-semibold text-text-primary dark:text-white mb-3">Accent Color</p>
        <div className="flex gap-3">
          {colors.map(c => (
            <button
              key={c.id}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all"
            >
              <div className={`w-8 h-8 rounded-full ${c.bg}`} />
              <span className="text-xs text-text-muted">{c.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3">More accent colors coming in v1.2</p>
      </div>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const ActiveComponent = { profile: ProfileTab, security: SecurityTab, notifications: NotificationsTab, appearance: AppearanceTab }[activeTab];

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-slide-up">
      <Breadcrumb />
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account, security, and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab sidebar */}
        <aside className="md:w-48 shrink-0">
          <nav className="card p-2 space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeTab === id
                    ? 'bg-brand-50 text-brand-700 border border-brand-100'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                <Icon size={16} className={activeTab === id ? 'text-brand-600' : 'text-text-muted'} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Tab content */}
        <div className="flex-1 card">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
