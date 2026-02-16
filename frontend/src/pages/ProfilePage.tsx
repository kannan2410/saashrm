import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import {
  Save, User, Briefcase, MapPin, Phone, Mail, Calendar,
  Shield, Lock, Camera, Trash2, BadgeCheck, Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function ProfilePage() {
  const { user, fetchProfile } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    workLocation: '',
  });

  // Photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Change password
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    if (user?.employee) {
      setForm({
        fullName: user.employee.fullName || '',
        phone: user.employee.phone || '',
        workLocation: user.employee.workLocation || '',
      });
    }
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    setPhotoUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('photo', file);
      await api.post('/employees/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchProfile();
      setSuccess('Photo uploaded successfully');
    } catch {
      setError('Failed to upload photo');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePhotoDelete = async () => {
    setPhotoUploading(true);
    setError('');
    try {
      await api.delete('/employees/me/photo');
      await fetchProfile();
      setSuccess('Photo removed');
    } catch {
      setError('Failed to remove photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.patch('/employees/me', {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        workLocation: form.workLocation.trim(),
      });
      setSuccess('Profile updated successfully');
      await fetchProfile();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      setPwError('All fields are required');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setPwError('');
    setPwSuccess('');
    setPwSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      setPwError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const emp = user?.employee;

  const roleColorMap: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700',
    HR: 'bg-purple-100 text-purple-700',
    MANAGER: 'bg-emerald-100 text-emerald-700',
    TEAM_LEAD: 'bg-amber-100 text-amber-700',
    EMPLOYEE: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content-primary">My Profile</h1>
        <p className="text-sm text-content-muted mt-1">View and update your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Profile Card with Curved Banner ── */}
        <div className="lg:col-span-1">
          <div className="card !p-0 overflow-hidden">
            {/* Curved gradient banner */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400" />
              <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 400 30" preserveAspectRatio="none">
                <path d="M0,30 Q200,-10 400,30 Z" className="fill-[rgb(var(--color-card-bg))]" />
              </svg>

              {/* Avatar floating on the curve */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div className="relative">
                  {emp?.profilePhoto ? (
                    <img
                      src={emp.profilePhoto}
                      alt={emp.fullName}
                      className="w-24 h-24 rounded-2xl object-cover border-4 shadow-lg"
                      style={{ borderColor: 'rgb(var(--color-card-bg))' }}
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-3xl font-bold border-4 shadow-lg"
                      style={{ borderColor: 'rgb(var(--color-card-bg))' }}
                    >
                      {emp?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center shadow-md transition-colors border-2"
                    style={{ borderColor: 'rgb(var(--color-card-bg))' }}
                    title="Upload photo"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Profile info below avatar */}
            <div className="pt-14 pb-6 px-5 text-center">
              {emp?.profilePhoto && (
                <button
                  type="button"
                  onClick={handlePhotoDelete}
                  disabled={photoUploading}
                  className="text-xs text-danger-500 hover:text-danger-700 flex items-center gap-1 mx-auto mb-2 transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> Remove photo
                </button>
              )}
              {photoUploading && <p className="text-xs text-content-muted mb-2">Uploading...</p>}

              <h2 className="text-xl font-bold text-content-primary">{emp?.fullName || user?.email}</h2>
              <p className="text-sm text-content-muted mt-0.5">{emp?.designation}</p>

              {/* Role badge */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className={clsx(
                  'px-3 py-1 text-xs font-semibold rounded-full',
                  roleColorMap[user?.role || ''] || roleColorMap.EMPLOYEE
                )}>
                  {user?.role?.replace('_', ' ')}
                </span>
                {emp?.status && (
                  <span className={clsx(
                    'px-3 py-1 text-xs font-semibold rounded-full',
                    emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  )}>
                    {emp.status}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="mt-5 border-t border-surface-border" />

              {/* Info list */}
              <div className="mt-5 space-y-3.5 text-left">
                <InfoRow icon={Mail} label="Email" value={user?.email} />
                {emp?.phone && <InfoRow icon={Phone} label="Phone" value={emp.phone} />}
                <InfoRow icon={Briefcase} label="Department" value={emp?.department} />
                <InfoRow icon={MapPin} label="Location" value={emp?.workLocation || '-'} />
                <InfoRow icon={BadgeCheck} label="Employee Code" value={emp?.employeeCode} />
                {emp?.dateOfJoining && (
                  <InfoRow icon={Calendar} label="Joined" value={format(new Date(emp.dateOfJoining), 'dd MMM yyyy')} />
                )}
                <InfoRow icon={Building2} label="Company" value={user?.company?.name} />
                {emp?.employmentType && (
                  <InfoRow icon={Shield} label="Type" value={emp.employmentType.replace('_', ' ')} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile Card */}
          <div className="card">
            <div className="flex items-start gap-3 mb-6">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-content-primary">Edit Profile</h2>
                <p className="text-sm text-content-muted">Update your personal details</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">{success}</div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="input-field"
                  placeholder="Enter your full name"
                  required
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input-field"
                    placeholder="Enter your phone number"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="label">Work Location</label>
                  <input
                    type="text"
                    value={form.workLocation}
                    onChange={(e) => setForm({ ...form, workLocation: e.target.value })}
                    className="input-field"
                    placeholder="Enter your work location"
                    maxLength={200}
                  />
                </div>
              </div>

              {/* Read-only fields */}
              <div className="pt-4 border-t border-surface-border">
                <p className="text-[10px] text-content-muted mb-3 uppercase tracking-wider font-semibold">Managed by HR / Admin</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReadOnlyField label="Email" value={user?.email || ''} />
                  <ReadOnlyField label="Employee Code" value={emp?.employeeCode || ''} />
                  <ReadOnlyField label="Department" value={emp?.department || ''} />
                  <ReadOnlyField label="Designation" value={emp?.designation || ''} />
                  <ReadOnlyField label="Employment Type" value={emp?.employmentType?.replace('_', ' ') || ''} />
                  <ReadOnlyField label="Status" value={emp?.status || ''} />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="card">
            <div className="flex items-start gap-3 mb-6">
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <Lock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-content-primary">Change Password</h2>
                <p className="text-sm text-content-muted">Update your account password</p>
              </div>
            </div>

            {pwError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{pwError}</div>
            )}
            {pwSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">{pwSuccess}</div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="label">Current Password *</label>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="input-field"
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">New Password *</label>
                  <input
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    className="input-field"
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="label">Confirm New Password *</label>
                  <input
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    className="input-field"
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={pwSaving} className="btn-primary flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {pwSaving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ─────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-surface-bg flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-content-muted" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-content-muted uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-content-primary truncate">{value || '-'}</p>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="w-full px-3.5 py-2.5 border rounded-xl text-sm bg-surface-bg text-content-muted border-surface-border">
        {value || '-'}
      </div>
    </div>
  );
}
