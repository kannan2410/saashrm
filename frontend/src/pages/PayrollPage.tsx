import { useEffect, useState } from 'react';
import api from '../services/api';
import { Payroll, Employee } from '../types';
import { useAuthStore } from '../stores/authStore';
import Modal from '../components/ui/Modal';
import {
  Download,
  TrendingDown,
  TrendingUp,
  Plus,
  Wallet,
  IndianRupee,
  FileText,
  Calendar,
  Building2,
  User,
  BadgeCheck,
  Briefcase,
} from 'lucide-react';
import { format } from 'date-fns';

const INR = (val: number | string) =>
  Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const monthName = (m: number) => format(new Date(2024, m - 1), 'MMMM');

// ── Salary Slip View (MNC style) ─────────────────────────────────────────────

function SalarySlip({ slip, companyName, onDownload }: { slip: Payroll; companyName?: string; onDownload: () => void }) {
  const gross = Number(slip.grossEarnings);
  const deductions = Number(slip.totalDeductions);
  const net = Number(slip.netSalary);

  return (
    <div className="space-y-0">
      {/* Company Header */}
      <div className="bg-primary-600 text-white rounded-t-xl px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{companyName || 'Company'}</h3>
              <p className="text-sm text-white/70">Payslip for {monthName(slip.month)} {slip.year}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50 uppercase tracking-wider">Payslip</p>
            <p className="text-sm font-mono text-white/80 mt-0.5">#{slip.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Employee Info Bar */}
      {slip.employee && (
        <div className="bg-surface-bg border-x border-surface-border px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-content-muted flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-content-muted uppercase tracking-wider">Employee Name</p>
                <p className="text-sm font-semibold text-content-primary truncate">{slip.employee.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-content-muted flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-content-muted uppercase tracking-wider">Employee Code</p>
                <p className="text-sm font-semibold text-content-primary">{slip.employee.employeeCode}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-content-muted flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-content-muted uppercase tracking-wider">Department</p>
                <p className="text-sm font-semibold text-content-primary truncate">{slip.employee.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-content-muted flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-content-muted uppercase tracking-wider">Pay Period</p>
                <p className="text-sm font-semibold text-content-primary">{monthName(slip.month)} {slip.year}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Earnings & Deductions Table */}
      <div className="border border-surface-border border-t-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-surface-border">
          {/* Earnings */}
          <div className="p-5">
            <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-700 mb-4 pb-2 border-b border-surface-border">
              <TrendingUp className="h-4 w-4" /> EARNINGS
            </h4>
            <div className="space-y-3">
              <SlipRow label="Basic Salary" value={INR(slip.basicSalary)} />
              <SlipRow label="House Rent Allowance (HRA)" value={INR(slip.hra)} />
              <SlipRow label="Other Allowances" value={INR(slip.allowances)} />
            </div>
            <div className="mt-4 pt-3 border-t-2 border-emerald-200 flex justify-between items-center">
              <span className="text-sm font-bold text-emerald-700">Gross Earnings</span>
              <span className="text-sm font-bold text-emerald-700">{INR(gross)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="p-5">
            <h4 className="flex items-center gap-2 text-sm font-bold text-red-700 mb-4 pb-2 border-b border-surface-border">
              <TrendingDown className="h-4 w-4" /> DEDUCTIONS
            </h4>
            <div className="space-y-3">
              <SlipRow label="Provident Fund (PF)" value={INR(slip.pf)} />
              <SlipRow label="Income Tax (TDS)" value={INR(slip.tax)} />
              <SlipRow label="Leave Deduction" value={INR(slip.leaveDeduction)} />
              <SlipRow label="Other Deductions" value={INR(slip.otherDeductions)} />
            </div>
            <div className="mt-4 pt-3 border-t-2 border-red-200 flex justify-between items-center">
              <span className="text-sm font-bold text-red-700">Total Deductions</span>
              <span className="text-sm font-bold text-red-700">{INR(deductions)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Salary Footer */}
      <div className="bg-surface-bg border border-t-0 border-surface-border rounded-b-xl px-6 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <IndianRupee className="h-6 w-6 text-primary-700" />
            </div>
            <div>
              <p className="text-xs text-content-muted uppercase tracking-wider font-medium">Net Pay</p>
              <p className="text-2xl sm:text-3xl font-bold text-content-primary">{INR(net)}</p>
            </div>
          </div>
          <button onClick={onDownload} className="btn-primary flex items-center gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
        <p className="text-[10px] text-content-muted text-center mt-4 pt-3 border-t border-surface-border">
          This is a system-generated payslip and does not require a signature.
        </p>
      </div>
    </div>
  );
}

function SlipRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-content-secondary">{label}</span>
      <span className="text-sm font-medium text-content-primary tabular-nums">{value}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const { user } = useAuthStore();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<Payroll | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [genSuccess, setGenSuccess] = useState('');
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR';

  const [genForm, setGenForm] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    allowances: 0,
    otherDeductions: 0,
  });

  const fetchPayrolls = () => {
    const endpoint = isAdmin ? '/payroll/all' : '/payroll/my';
    api.get(endpoint).then((res) => setPayrolls(res.data.data));
  };

  useEffect(() => {
    fetchPayrolls();
    if (isAdmin) {
      api.get('/employees').then((res) => setEmployees(res.data.data));
    }
  }, [isAdmin]);

  const viewSlip = async (id: string) => {
    const res = await api.get(`/payroll/${id}`);
    setSelectedSlip(res.data.data);
  };

  const downloadPdf = async (id: string) => {
    const res = await api.get(`/payroll/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-slip-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError('');
    setGenSuccess('');
    setGenerating(true);
    try {
      await api.post('/payroll/generate', {
        employeeId: genForm.employeeId,
        month: genForm.month,
        year: genForm.year,
        allowances: genForm.allowances || undefined,
        otherDeductions: genForm.otherDeductions || undefined,
      });
      setGenSuccess('Payroll generated successfully');
      fetchPayrolls();
      setTimeout(() => {
        setShowGenerate(false);
        setGenSuccess('');
        setGenForm({ employeeId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), allowances: 0, otherDeductions: 0 });
      }, 1500);
    } catch (err: unknown) {
      setGenError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  // Summary stats
  const latestPayroll = payrolls[0];
  const totalPaid = payrolls.reduce((sum, p) => sum + Number(p.netSalary), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Payroll</h1>
          <p className="text-sm text-content-muted mt-1">Salary slips and payroll management</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowGenerate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Generate Payroll
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-content-muted">Latest Net Pay</p>
              <p className="mt-1 text-2xl font-bold text-content-primary">
                {latestPayroll ? INR(latestPayroll.netSalary) : '--'}
              </p>
              {latestPayroll && (
                <p className="mt-1 text-xs text-content-muted">
                  {monthName(latestPayroll.month)} {latestPayroll.year}
                </p>
              )}
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-content-muted">Total Payslips</p>
              <p className="mt-1 text-2xl font-bold text-content-primary">{payrolls.length}</p>
              <p className="mt-1 text-xs text-content-muted">Records on file</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-content-muted">Total Disbursed</p>
              <p className="mt-1 text-2xl font-bold text-content-primary">{INR(totalPaid)}</p>
              <p className="mt-1 text-xs text-content-muted">All time</p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 flex-shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-semibold text-content-primary">Payroll History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-bg border-b border-surface-border">
                {isAdmin && <th className="table-header">Employee</th>}
                <th className="table-header">Pay Period</th>
                <th className="table-header text-right">Gross Earnings</th>
                <th className="table-header text-right">Deductions</th>
                <th className="table-header text-right">Net Salary</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {payrolls.map((p) => (
                <tr key={p.id} className="hover:bg-surface-bg/50 transition-colors">
                  {isAdmin && (
                    <td className="table-cell">
                      <p className="font-medium text-content-primary">{p.employee?.fullName}</p>
                      <p className="text-xs text-content-muted">{p.employee?.employeeCode} · {p.employee?.department}</p>
                    </td>
                  )}
                  <td className="table-cell">
                    <p className="font-medium text-content-primary">{monthName(p.month)} {p.year}</p>
                  </td>
                  <td className="table-cell text-right">
                    <span className="text-emerald-700 font-medium tabular-nums">{INR(p.grossEarnings)}</span>
                  </td>
                  <td className="table-cell text-right">
                    <span className="text-red-600 font-medium tabular-nums">{INR(p.totalDeductions)}</span>
                  </td>
                  <td className="table-cell text-right">
                    <span className="font-bold text-content-primary tabular-nums">{INR(p.netSalary)}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => viewSlip(p.id)}
                        className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        View Slip
                      </button>
                      <button
                        onClick={() => downloadPdf(p.id)}
                        className="p-1.5 text-content-muted hover:text-content-primary hover:bg-surface-bg rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {payrolls.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center">
                    <Wallet className="h-10 w-10 mx-auto text-content-muted opacity-40 mb-2" />
                    <p className="text-sm text-content-muted">No payroll records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Payroll Modal */}
      <Modal isOpen={showGenerate} onClose={() => { setShowGenerate(false); setGenError(''); setGenSuccess(''); }} title="Generate Payroll" size="md">
        <form onSubmit={handleGenerate} className="space-y-4">
          {genError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{genError}</div>
          )}
          {genSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{genSuccess}</div>
          )}

          <div>
            <label className="label">Employee *</label>
            <select
              value={genForm.employeeId}
              onChange={(e) => setGenForm({ ...genForm, employeeId: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeCode}) - {emp.department}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Month *</label>
              <select
                value={genForm.month}
                onChange={(e) => setGenForm({ ...genForm, month: parseInt(e.target.value) })}
                className="input-field"
                required
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {format(new Date(2024, i), 'MMMM')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Year *</label>
              <select
                value={genForm.year}
                onChange={(e) => setGenForm({ ...genForm, year: parseInt(e.target.value) })}
                className="input-field"
                required
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Custom Allowances</label>
              <input
                type="number"
                value={genForm.allowances}
                onChange={(e) => setGenForm({ ...genForm, allowances: parseFloat(e.target.value) || 0 })}
                className="input-field"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-content-muted mt-1">Leave 0 for auto (30% of CTC)</p>
            </div>
            <div>
              <label className="label">Other Deductions</label>
              <input
                type="number"
                value={genForm.otherDeductions}
                onChange={(e) => setGenForm({ ...genForm, otherDeductions: parseFloat(e.target.value) || 0 })}
                className="input-field"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
            <button type="button" onClick={() => setShowGenerate(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={generating} className="btn-primary">
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Salary Slip Modal */}
      <Modal isOpen={!!selectedSlip} onClose={() => setSelectedSlip(null)} title="" size="lg">
        {selectedSlip && (
          <SalarySlip
            slip={selectedSlip}
            companyName={user?.company?.name}
            onDownload={() => downloadPdf(selectedSlip.id)}
          />
        )}
      </Modal>
    </div>
  );
}
