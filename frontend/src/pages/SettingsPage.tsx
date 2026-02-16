import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { CompanyLogo } from '../types';
import {
  Trash2,
  Building2,
  Image,
  Save,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileImage,
  X,
} from 'lucide-react';
import clsx from 'clsx';

function Alert({ type, message, onClose }: { type: 'success' | 'error'; message: string; onClose?: () => void }) {
  const isError = type === 'error';
  return (
    <div className={clsx(
      'flex items-start gap-3 p-3 rounded-xl border text-sm',
      isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
    )}>
      {isError
        ? <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        : <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
      }
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="p-0.5 hover:opacity-70">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user, fetchProfile } = useAuthStore();
  const [logo, setLogo] = useState<CompanyLogo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Company name
  const [companyName, setCompanyName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');

  useEffect(() => {
    api.get('/company/logo').then((res) => setLogo(res.data.data)).catch(() => {});
    if (user?.company?.name) {
      setCompanyName(user.company.name);
    }
  }, [user?.company?.name]);

  const validateAndUpload = async (file: File) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PNG, JPG, and SVG files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.post('/company/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLogo(res.data.data);
      setSuccess('Logo uploaded successfully');
      await fetchProfile();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndUpload(file);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the company logo?')) return;
    try {
      await api.delete('/company/logo');
      setLogo(null);
      setSuccess('Logo deleted');
      await fetchProfile();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Delete failed');
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setNameError('Company name is required');
      return;
    }
    setNameError('');
    setNameSuccess('');
    setSavingName(true);
    try {
      await api.patch('/company/name', { name: companyName.trim() });
      setNameSuccess('Company name updated');
      await fetchProfile();
    } catch (err: unknown) {
      setNameError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed');
    } finally {
      setSavingName(false);
    }
  };


  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-content-primary">Company Settings</h1>
        <p className="text-sm text-content-muted mt-1">Manage your company branding and information</p>
      </div>

      {/* ── Company Name ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2.5 bg-emerald-50 rounded-xl">
            <Building2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-content-primary">Company Information</h2>
            <p className="text-sm text-content-muted">Update your company display name</p>
          </div>
        </div>

        {nameError && <div className="mb-4"><Alert type="error" message={nameError} onClose={() => setNameError('')} /></div>}
        {nameSuccess && <div className="mb-4"><Alert type="success" message={nameSuccess} onClose={() => setNameSuccess('')} /></div>}

        <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1">
            <label className="label">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input-field"
              placeholder="Enter company name"
              maxLength={200}
            />
          </div>
          <button type="submit" disabled={savingName} className="btn-primary flex items-center justify-center gap-2 sm:w-auto">
            <Save className="h-4 w-4" />
            {savingName ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>

      {/* ── Company Logo ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2.5 bg-purple-50 rounded-xl">
            <Image className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-content-primary">Company Logo</h2>
            <p className="text-sm text-content-muted">Upload your logo to display across the platform</p>
          </div>
        </div>

        {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}
        {success && <div className="mb-4"><Alert type="success" message={success} onClose={() => setSuccess('')} /></div>}

        {/* Current Logo Preview */}
        {logo && (
          <div className="mb-5 p-4 bg-surface-bg rounded-xl border border-surface-border">
            <p className="text-xs text-content-muted uppercase tracking-wider font-medium mb-3">Current Logo</p>
            <div className="flex items-center gap-5">
              {/* Preview on light bg */}
              <div className="relative group">
                <div className="w-24 h-24 bg-white rounded-xl border border-surface-border flex items-center justify-center p-3 shadow-sm">
                  <img src={logo.url} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                </div>
                <p className="text-[10px] text-content-muted text-center mt-1.5">Light</p>
              </div>
              {/* Preview on dark bg */}
              <div className="relative group">
                <div className="w-24 h-24 bg-gray-800 rounded-xl border border-gray-700 flex items-center justify-center p-3 shadow-sm">
                  <img src={logo.url} alt="Logo preview dark" className="max-w-full max-h-full object-contain" />
                </div>
                <p className="text-[10px] text-content-muted text-center mt-1.5">Dark</p>
              </div>
              {/* File info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-content-muted flex-shrink-0" />
                  <span className="text-sm font-medium text-content-primary truncate">{logo.fileName}</span>
                </div>
                <p className="text-xs text-content-muted">
                  Uploaded {new Date(logo.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 transition-colors mt-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove logo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={clsx(
            'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
            dragOver
              ? 'border-primary-500 bg-primary-50'
              : 'border-surface-border hover:border-primary-400 hover:bg-surface-bg',
            uploading && 'opacity-60 pointer-events-none'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />

          <div className={clsx(
            'mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors',
            dragOver ? 'bg-primary-100' : 'bg-surface-bg border border-surface-border'
          )}>
            {uploading ? (
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className={clsx(
                'h-6 w-6 transition-colors',
                dragOver ? 'text-primary-600' : 'text-content-muted'
              )} />
            )}
          </div>

          <p className="text-sm font-medium text-content-primary mb-1">
            {uploading ? 'Uploading...' : dragOver ? 'Drop your file here' : logo ? 'Replace company logo' : 'Upload company logo'}
          </p>
          <p className="text-xs text-content-muted mb-3">
            Drag and drop or <span className="text-primary-600 font-medium">browse files</span>
          </p>

          {/* Format chips */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {['PNG', 'JPG', 'SVG'].map((fmt) => (
              <span key={fmt} className="px-2 py-0.5 bg-surface-bg border border-surface-border rounded text-[10px] font-medium text-content-muted">
                {fmt}
              </span>
            ))}
            <span className="px-2 py-0.5 bg-surface-bg border border-surface-border rounded text-[10px] font-medium text-content-muted">
              Max 5MB
            </span>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-2 p-3 bg-surface-bg rounded-lg border border-surface-border">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
            <p className="text-xs text-content-muted">Use a <strong className="text-content-secondary">transparent PNG</strong> for best results across themes</p>
          </div>
          <div className="flex items-start gap-2 p-3 bg-surface-bg rounded-lg border border-surface-border">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
            <p className="text-xs text-content-muted">Recommended size: <strong className="text-content-secondary">200×60px</strong> or similar aspect ratio</p>
          </div>
          <div className="flex items-start gap-2 p-3 bg-surface-bg rounded-lg border border-surface-border">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
            <p className="text-xs text-content-muted">Logo appears in <strong className="text-content-secondary">sidebar, header</strong>, and payslips</p>
          </div>
        </div>
      </div>
    </div>
  );
}
