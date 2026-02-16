import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import StatsCard from '../components/ui/StatsCard';
import { Users, Clock, CalendarDays, Wallet } from 'lucide-react';
import { TodayAttendance, LeaveBalance } from '../types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [todayStatus, setTodayStatus] = useState<TodayAttendance | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);

  const fetchToday = () => {
    api.get('/attendance/today').then((res) => setTodayStatus(res.data.data)).catch(() => {});
  };

  useEffect(() => {
    fetchToday();
    api.get('/leaves/balances').then((res) => setLeaveBalances(res.data.data)).catch(() => {});
  }, []);

  const totalLeaveBalance = leaveBalances.reduce((sum, b) => sum + b.remaining, 0);

  const getStatusText = () => {
    if (!todayStatus) return 'Not Checked In';
    if (todayStatus.isCheckedIn) return 'Checked In';
    return `${todayStatus.totalWorkedHours} hrs worked`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-content-primary">Dashboard</h1>
        <p className="text-sm text-content-muted mt-1">
          Welcome back, {user?.employee?.fullName || user?.email}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Status"
          value={getStatusText()}
          icon={Clock}
          color={todayStatus ? 'green' : 'amber'}
          subtitle={todayStatus ? `${todayStatus.sessionCount} session(s)` : undefined}
        />
        <StatsCard
          title="Leave Balance"
          value={totalLeaveBalance}
          icon={CalendarDays}
          color="blue"
          subtitle="Total remaining days"
        />
        <StatsCard
          title="Department"
          value={user?.employee?.department || '-'}
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Designation"
          value={user?.employee?.designation || '-'}
          icon={Wallet}
          color="green"
        />
      </div>

      {/* Leave Balances */}
      <div className="card">
        <h2 className="text-lg font-semibold text-content-primary mb-4">Leave Balances</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {leaveBalances.map((balance) => (
            <div key={balance.id} className="bg-surface-bg rounded-lg p-4 border border-surface-border">
              <p className="text-sm font-medium text-content-muted">{balance.leaveType.replace('_', ' ')}</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-bold text-content-primary">{balance.remaining}</span>
                <span className="text-sm text-content-muted mb-0.5">/ {balance.total}</span>
              </div>
              <div className="mt-2 w-full bg-surface-border rounded-full h-1.5">
                <div
                  className="bg-primary-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(balance.remaining / balance.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-content-primary mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {(!todayStatus || !todayStatus.isCheckedIn) && (
            <button
              onClick={async () => {
                await api.post('/attendance/check-in');
                fetchToday();
              }}
              className="btn-primary"
            >
              Check In
            </button>
          )}
          {todayStatus?.isCheckedIn && (
            <button
              onClick={async () => {
                await api.post('/attendance/check-out');
                fetchToday();
              }}
              className="btn-danger"
            >
              Check Out
            </button>
          )}
          <button
            onClick={() => navigate('/leave')}
            className="btn-secondary"
          >
            Apply Leave
          </button>
          <button
            onClick={() => navigate('/payroll')}
            className="btn-secondary"
          >
            View Payslips
          </button>
        </div>
      </div>
    </div>
  );
}
