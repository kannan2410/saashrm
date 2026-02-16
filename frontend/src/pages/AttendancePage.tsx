import { useEffect, useState } from 'react';
import api from '../services/api';
import { TodayAttendance, AttendanceRecord } from '../types';
import { Clock, LogIn, LogOut, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function AttendancePage() {
  const [todayStatus, setTodayStatus] = useState<TodayAttendance | null>(null);
  const [monthlyData, setMonthlyData] = useState<{ records: AttendanceRecord[]; summary: { totalDays: number; totalHours: string; month: number; year: number } } | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchToday = () => {
    api.get('/attendance/today').then((res) => setTodayStatus(res.data.data)).catch(() => {});
  };

  useEffect(() => {
    fetchToday();
  }, []);

  useEffect(() => {
    api.get(`/attendance/monthly?month=${month}&year=${year}`).then((res) => setMonthlyData(res.data.data)).catch(() => {});
  }, [month, year]);

  const handleCheckIn = async () => {
    await api.post('/attendance/check-in');
    fetchToday();
  };

  const handleCheckOut = async () => {
    await api.post('/attendance/check-out');
    fetchToday();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content-primary">Attendance</h1>
        <p className="text-sm text-content-muted mt-1">Track your daily attendance</p>
      </div>

      {/* Today's Status Card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-content-primary">Today's Status</h2>
            <p className="text-sm text-content-muted mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="flex gap-3">
            {(!todayStatus || !todayStatus.isCheckedIn) && (
              <button onClick={handleCheckIn} className="btn-primary flex items-center gap-2">
                <LogIn className="h-4 w-4" /> Check In
              </button>
            )}
            {todayStatus?.isCheckedIn && (
              <button onClick={handleCheckOut} className="btn-danger flex items-center gap-2">
                <LogOut className="h-4 w-4" /> Check Out
              </button>
            )}
          </div>
        </div>

        {todayStatus && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-xs font-medium text-emerald-600">First Check In</p>
              <p className="text-lg font-bold text-emerald-700 mt-1">
                {format(new Date(todayStatus.firstLoginTime), 'hh:mm a')}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-xs font-medium text-red-600">Last Check Out</p>
              <p className="text-lg font-bold text-red-700 mt-1">
                {todayStatus.lastLogoutTime ? format(new Date(todayStatus.lastLogoutTime), 'hh:mm a') : '--:--'}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-xs font-medium text-emerald-600">Total Hours</p>
              <p className="text-lg font-bold text-emerald-700 mt-1">
                {todayStatus.totalWorkedHours} hrs
              </p>
              <p className="text-xs text-emerald-500 mt-0.5">{todayStatus.sessionCount} session(s)</p>
            </div>
          </div>
        )}

        {/* Today's Sessions */}
        {todayStatus && todayStatus.sessions.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-content-muted uppercase mb-2">Sessions</p>
            <div className="space-y-2">
              {todayStatus.sessions.map((session, idx) => (
                <div key={session.id} className="flex items-center gap-4 bg-surface-bg rounded-lg px-4 py-2 text-sm">
                  <span className="text-content-muted font-medium w-6">#{idx + 1}</span>
                  <span className="text-emerald-600">{format(new Date(session.loginTime), 'hh:mm a')}</span>
                  <span className="text-content-muted">→</span>
                  <span className="text-red-600">{session.logoutTime ? format(new Date(session.logoutTime), 'hh:mm a') : 'In Progress'}</span>
                  <span className="ml-auto text-content-muted font-medium">
                    {session.totalHours ? `${session.totalHours} hrs` : '--'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!todayStatus && (
          <div className="mt-4 text-center py-8 text-content-muted">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>You haven't checked in yet today</p>
          </div>
        )}
      </div>

      {/* Monthly Report */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-content-primary flex items-center gap-2">
            <Calendar className="h-5 w-5 text-content-muted" />
            Monthly Report
          </h2>
          <div className="flex gap-2">
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="input-field w-32">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {format(new Date(2024, i), 'MMMM')}
                </option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="input-field w-24">
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        {monthlyData?.summary && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-surface-bg rounded-lg p-3 border border-surface-border">
              <p className="text-xs text-content-muted">Total Days Present</p>
              <p className="text-xl font-bold text-content-primary">{monthlyData.summary.totalDays}</p>
            </div>
            <div className="bg-surface-bg rounded-lg p-3 border border-surface-border">
              <p className="text-xs text-content-muted">Total Hours</p>
              <p className="text-xl font-bold text-content-primary">{monthlyData.summary.totalHours}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-bg border-b border-surface-border">
                <th className="table-header">Date</th>
                <th className="table-header">Check In</th>
                <th className="table-header">Check Out</th>
                <th className="table-header">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {monthlyData?.records.map((record) => (
                <tr key={record.id} className="hover:bg-surface-bg">
                  <td className="table-cell font-medium">{format(new Date(record.date), 'MMM dd, EEE')}</td>
                  <td className="table-cell">{format(new Date(record.loginTime), 'hh:mm a')}</td>
                  <td className="table-cell">{record.logoutTime ? format(new Date(record.logoutTime), 'hh:mm a') : 'In Progress'}</td>
                  <td className="table-cell">{record.totalHours ?? '--'}</td>
                </tr>
              ))}
              {(!monthlyData?.records || monthlyData.records.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-content-muted">
                    No attendance records for this month
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
