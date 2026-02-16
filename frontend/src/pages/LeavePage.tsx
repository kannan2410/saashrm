import { useEffect, useState } from 'react';
import api from '../services/api';
import { Leave, LeaveBalance } from '../types';
import { useAuthStore } from '../stores/authStore';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function LeavePage() {
  const { user } = useAuthStore();
  const [myLeaves, setMyLeaves] = useState<Leave[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'pending'>('my');
  const [form, setForm] = useState({ leaveType: 'CASUAL' as const, startDate: '', endDate: '', reason: '' });

  const canApprove = ['TEAM_LEAD', 'MANAGER', 'HR', 'ADMIN'].includes(user?.role || '');

  const fetchData = () => {
    api.get('/leaves/my').then((r) => setMyLeaves(r.data.data));
    api.get('/leaves/balances').then((r) => setBalances(r.data.data));
    if (canApprove) {
      api.get('/leaves/pending').then((r) => setPendingLeaves(r.data.data));
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/leaves/apply', form);
    setIsApplyOpen(false);
    setForm({ leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });
    fetchData();
  };

  const handleApprove = async (leaveId: string, action: 'APPROVED' | 'REJECTED') => {
    await api.post(`/leaves/${leaveId}/approve`, { action });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Leave Management</h1>
          <p className="text-sm text-content-muted mt-1">Apply and manage leave requests</p>
        </div>
        <button onClick={() => setIsApplyOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Apply Leave
        </button>
      </div>

      {/* Leave Balances */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {balances.map((b) => (
          <div key={b.id} className="card text-center">
            <p className="text-xs font-medium text-content-muted uppercase">{b.leaveType}</p>
            <p className="text-3xl font-bold text-content-primary mt-2">{b.remaining}</p>
            <p className="text-xs text-content-muted mt-1">{b.used} used / {b.total} total</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-border">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my' ? 'border-primary-600 text-primary-600' : 'border-transparent text-content-muted hover:text-content-primary'}`}
          >
            My Leaves
          </button>
          {canApprove && (
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending' ? 'border-primary-600 text-primary-600' : 'border-transparent text-content-muted hover:text-content-primary'}`}
            >
              Pending Approvals
              {pendingLeaves.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{pendingLeaves.length}</span>
              )}
            </button>
          )}
        </nav>
      </div>

      {/* My Leaves Table */}
      {activeTab === 'my' && (
        <div className="bg-surface-card rounded-xl shadow-card border border-surface-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-bg border-b border-surface-border">
                <th className="table-header">Type</th>
                <th className="table-header">From</th>
                <th className="table-header">To</th>
                <th className="table-header">Days</th>
                <th className="table-header">Reason</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {myLeaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-surface-bg">
                  <td className="table-cell"><StatusBadge status={leave.leaveType} /></td>
                  <td className="table-cell">{format(new Date(leave.startDate), 'MMM dd, yyyy')}</td>
                  <td className="table-cell">{format(new Date(leave.endDate), 'MMM dd, yyyy')}</td>
                  <td className="table-cell font-medium">{leave.totalDays}</td>
                  <td className="table-cell max-w-xs truncate">{leave.reason}</td>
                  <td className="table-cell"><StatusBadge status={leave.status} /></td>
                </tr>
              ))}
              {myLeaves.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-content-muted">No leave records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending Approvals */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {pendingLeaves.map((leave) => (
            <div key={leave.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-content-primary">{leave.employee?.fullName}</p>
                    <StatusBadge status={leave.leaveType} />
                    <StatusBadge status={leave.status} />
                  </div>
                  <p className="text-sm text-content-muted mt-1">
                    {leave.employee?.employeeCode} &middot; {leave.employee?.department}
                  </p>
                  <p className="text-sm text-content-secondary mt-2">
                    {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')} ({leave.totalDays} days)
                  </p>
                  <p className="text-sm text-content-muted mt-1">{leave.reason}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(leave.id, 'APPROVED')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleApprove(leave.id, 'REJECTED')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
              {/* Approval chain */}
              {leave.approvals.length > 0 && (
                <div className="mt-3 pt-3 border-t border-surface-border">
                  <p className="text-xs font-medium text-content-muted mb-2">Approval Chain</p>
                  <div className="flex gap-2">
                    {leave.approvals.map((a) => (
                      <span key={a.id} className={`text-xs px-2 py-1 rounded ${a.action === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {a.role}: {a.action}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {pendingLeaves.length === 0 && (
            <div className="card text-center py-8 text-content-muted">No pending approvals</div>
          )}
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} title="Apply for Leave">
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="label">Leave Type</label>
            <select className="input-field" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value as typeof form.leaveType })}>
              <option value="CASUAL">Casual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="EARNED">Earned Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea className="input-field" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsApplyOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
