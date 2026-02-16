import { useEffect, useState } from 'react';
import api from '../services/api';
import { CalendarMonthData, CalendarDay, Holiday, HolidayType } from '../types';
import { useAuthStore } from '../stores/authStore';
import Modal from '../components/ui/Modal';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Clock,
  CalendarDays,
} from 'lucide-react';
import { format } from 'date-fns';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  absent: 'bg-red-100 text-red-800 border-red-200 cursor-pointer hover:bg-red-200',
  leave_approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  leave_pending: 'bg-amber-100 text-amber-800 border-amber-200',
  holiday: 'bg-purple-100 text-purple-800 border-purple-200',
  weekend: 'bg-gray-100 text-gray-400 border-gray-200',
  future: 'bg-gray-50 text-gray-300 border-gray-100',
};

const LEGEND = [
  { label: 'Present', color: 'bg-emerald-100 border-emerald-200' },
  { label: 'Absent', color: 'bg-red-100 border-red-200' },
  { label: 'Leave (Approved)', color: 'bg-emerald-100 border-emerald-200' },
  { label: 'Leave (Pending)', color: 'bg-amber-100 border-amber-200' },
  { label: 'Holiday', color: 'bg-purple-100 border-purple-200' },
  { label: 'Weekend', color: 'bg-gray-100 border-gray-200' },
];

export default function CalendarPage() {
  const { user } = useAuthStore();
  const isHRAdmin = user?.role === 'HR' || user?.role === 'ADMIN';

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [calendarData, setCalendarData] = useState<CalendarMonthData | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // Leave request modal
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'CASUAL' as 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID',
    reason: '',
  });

  // Holiday modal
  const [isHolidayOpen, setIsHolidayOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: '',
    type: 'COMPANY' as HolidayType,
    description: '',
  });

  const fetchCalendar = () => {
    api.get(`/calendar/month?month=${month}&year=${year}`).then((r) => setCalendarData(r.data.data));
  };

  const fetchHolidays = () => {
    api.get(`/holidays?year=${year}`).then((r) => setHolidays(r.data.data));
  };

  useEffect(() => {
    fetchCalendar();
    fetchHolidays();
  }, [month, year]);

  const goToPrev = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const goToNext = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const goToToday = () => {
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
  };

  // Handle clicking an absent day
  const handleDayClick = (day: CalendarDay) => {
    if (day.status === 'absent') {
      setSelectedDate(day.date);
      setLeaveForm({ leaveType: 'CASUAL', reason: '' });
      setIsLeaveOpen(true);
    }
  };

  // Submit leave request
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/leaves/apply', {
      leaveType: leaveForm.leaveType,
      startDate: selectedDate,
      endDate: selectedDate,
      reason: leaveForm.reason,
    });
    setIsLeaveOpen(false);
    fetchCalendar();
  };

  // Holiday CRUD
  const openHolidayCreate = () => {
    setEditingHoliday(null);
    setHolidayForm({ name: '', date: '', type: 'COMPANY', description: '' });
    setIsHolidayOpen(true);
  };

  const openHolidayEdit = (h: Holiday) => {
    setEditingHoliday(h);
    setHolidayForm({
      name: h.name,
      date: h.date.split('T')[0],
      type: h.type,
      description: h.description || '',
    });
    setIsHolidayOpen(true);
  };

  const handleHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHoliday) {
      await api.put(`/holidays/${editingHoliday.id}`, holidayForm);
    } else {
      await api.post('/holidays', holidayForm);
    }
    setIsHolidayOpen(false);
    fetchHolidays();
    fetchCalendar();
  };

  const handleHolidayDelete = async (id: string) => {
    await api.delete(`/holidays/${id}`);
    fetchHolidays();
    fetchCalendar();
  };

  // Build the calendar grid
  const buildGrid = () => {
    if (!calendarData) return [];
    const firstDayOfWeek = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const blanks: (CalendarDay | null)[] = Array(firstDayOfWeek).fill(null);
    return [...blanks, ...calendarData.days];
  };

  const grid = buildGrid();
  const summary = calendarData?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Calendar</h1>
          <p className="text-sm text-content-muted mt-1">Attendance, holidays & leave overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={goToToday} className="btn-secondary text-sm">Today</button>
          <div className="flex items-center gap-1">
            <button onClick={goToPrev} className="p-2 rounded-lg hover:bg-surface-bg transition-colors">
              <ChevronLeft className="h-5 w-5 text-content-secondary" />
            </button>
            <span className="text-lg font-semibold text-content-primary min-w-[180px] text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={goToNext} className="p-2 rounded-lg hover:bg-surface-bg transition-colors">
              <ChevronRight className="h-5 w-5 text-content-secondary" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card text-center">
            <p className="text-xs font-medium text-content-muted uppercase">Present</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{summary.totalPresent}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs font-medium text-content-muted uppercase">Absent</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{summary.totalAbsent}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs font-medium text-content-muted uppercase">Leaves</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{summary.totalLeaves}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs font-medium text-content-muted uppercase">Holidays</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{summary.totalHolidays}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs font-medium text-content-muted uppercase">Weekends</p>
            <p className="text-3xl font-bold text-content-muted mt-1">{summary.totalWeekends}</p>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-surface-card rounded-xl shadow-card border border-surface-border p-5">
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-content-muted py-2">
              {d}
            </div>
          ))}

          {/* Day cells */}
          {grid.map((day, i) => {
            if (!day) {
              return <div key={`blank-${i}`} className="aspect-square" />;
            }

            const dateNum = parseInt(day.date.split('-')[2]);
            const isToday = day.date === format(now, 'yyyy-MM-dd');

            return (
              <div
                key={day.date}
                onClick={() => handleDayClick(day)}
                className={`aspect-square rounded-lg border p-1.5 flex flex-col transition-all ${STATUS_COLORS[day.status]} ${isToday ? 'ring-2 ring-primary-500 ring-offset-1' : ''}`}
              >
                <span className={`text-xs font-semibold ${isToday ? 'text-primary-700' : ''}`}>
                  {dateNum}
                </span>
                <div className="flex-1 flex flex-col justify-end">
                  {day.status === 'present' && day.attendance?.totalHours && (
                    <span className="text-[10px] flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {day.attendance.totalHours}h
                    </span>
                  )}
                  {day.status === 'holiday' && day.holiday && (
                    <span className="text-[10px] truncate">{day.holiday.name}</span>
                  )}
                  {(day.status === 'leave_approved' || day.status === 'leave_pending') && day.leave && (
                    <span className="text-[10px] truncate">
                      {day.leave.leaveType}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-surface-border">
          {LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded border ${item.color}`} />
              <span className="text-xs text-content-secondary">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Holiday Management Panel (HR/ADMIN only) */}
      {isHRAdmin && (
        <div className="bg-surface-card rounded-xl shadow-card border border-surface-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-content-primary">Holiday Management</h2>
            </div>
            <button onClick={openHolidayCreate} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" /> Add Holiday
            </button>
          </div>
          <div className="space-y-2">
            {holidays.length === 0 && (
              <p className="text-sm text-content-muted text-center py-4">No holidays added for {year}</p>
            )}
            {holidays.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-bg border border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-700">
                      {new Date(h.date).getUTCDate()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-content-primary">{h.name}</p>
                    <p className="text-xs text-content-muted">
                      {format(new Date(h.date), 'MMM dd, yyyy')} &middot;{' '}
                      <span className={`font-medium ${h.type === 'NATIONAL' ? 'text-red-600' : h.type === 'REGIONAL' ? 'text-emerald-600' : 'text-purple-600'}`}>
                        {h.type}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openHolidayEdit(h)}
                    className="p-1.5 rounded-lg hover:bg-surface-bg text-content-muted hover:text-content-secondary transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleHolidayDelete(h.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-content-muted hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      <Modal isOpen={isLeaveOpen} onClose={() => setIsLeaveOpen(false)} title="Request Leave">
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
          <div>
            <label className="label">Date</label>
            <input type="text" className="input-field" value={selectedDate} readOnly disabled />
          </div>
          <div>
            <label className="label">Leave Type</label>
            <select
              className="input-field"
              value={leaveForm.leaveType}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as typeof leaveForm.leaveType })}
            >
              <option value="CASUAL">Casual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="EARNED">Earned Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea
              className="input-field"
              rows={3}
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              required
              placeholder="Enter reason for leave"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsLeaveOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Submit Request</button>
          </div>
        </form>
      </Modal>

      {/* Holiday Form Modal */}
      <Modal isOpen={isHolidayOpen} onClose={() => setIsHolidayOpen(false)} title={editingHoliday ? 'Edit Holiday' : 'Add Holiday'}>
        <form onSubmit={handleHolidaySubmit} className="space-y-4">
          <div>
            <label className="label">Holiday Name</label>
            <input
              type="text"
              className="input-field"
              value={holidayForm.name}
              onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
              required
              placeholder="e.g. Independence Day"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input-field"
                value={holidayForm.date}
                onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input-field"
                value={holidayForm.type}
                onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value as HolidayType })}
              >
                <option value="COMPANY">Company</option>
                <option value="NATIONAL">National</option>
                <option value="REGIONAL">Regional</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input-field"
              rows={2}
              value={holidayForm.description}
              onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsHolidayOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editingHoliday ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
