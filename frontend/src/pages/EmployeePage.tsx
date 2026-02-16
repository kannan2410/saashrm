import { useEffect, useState } from 'react';
import api from '../services/api';
import { Employee, EmploymentType, Role } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import DataTable from '../components/ui/DataTable';
import { Plus, Filter } from 'lucide-react';

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    employeeCode: '', fullName: '', email: '', password: '', department: '',
    designation: '', dateOfJoining: '', employmentType: 'FULL_TIME' as EmploymentType,
    salary: 0, workLocation: '', role: 'EMPLOYEE' as Role, managerId: null as string | null,
  });

  const fetchEmployees = async () => {
    const params = selectedDept ? `?department=${selectedDept}` : '';
    const res = await api.get(`/employees${params}`);
    setEmployees(res.data.data);
  };

  const fetchAllEmployees = async () => {
    const res = await api.get('/employees?limit=500');
    setAllEmployees(res.data.data);
  };

  useEffect(() => {
    fetchEmployees();
    fetchAllEmployees();
    api.get('/employees/departments').then((res) => setDepartments(res.data.data));
  }, [selectedDept]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      const { employeeCode, email, password, role, ...updateData } = form;
      await api.patch(`/employees/${editingEmployee.id}`, updateData);
    } else {
      await api.post('/employees', form);
    }
    setIsModalOpen(false);
    setEditingEmployee(null);
    fetchEmployees();
    fetchAllEmployees();
  };

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setForm({
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      email: emp.email,
      password: '',
      department: emp.department,
      designation: emp.designation,
      dateOfJoining: emp.dateOfJoining.split('T')[0],
      employmentType: emp.employmentType,
      salary: Number(emp.salary),
      workLocation: emp.workLocation,
      role: emp.user?.role || 'EMPLOYEE',
      managerId: emp.managerId,
    });
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingEmployee(null);
    setForm({
      employeeCode: '', fullName: '', email: '', password: '', department: '',
      designation: '', dateOfJoining: '', employmentType: 'FULL_TIME',
      salary: 0, workLocation: '', role: 'EMPLOYEE', managerId: null,
    });
    setIsModalOpen(true);
  };

  const columns = [
    { key: 'employeeCode', header: 'Code' },
    { key: 'fullName', header: 'Name', render: (e: Employee) => (
      <div>
        <p className="font-medium text-content-primary">{e.fullName}</p>
        <p className="text-xs text-content-muted">{e.email}</p>
      </div>
    )},
    { key: 'department', header: 'Department' },
    { key: 'designation', header: 'Designation' },
    { key: 'manager', header: 'Manager', render: (e: Employee) => (
      <span className="text-sm text-content-secondary">{e.manager?.fullName || '—'}</span>
    )},
    { key: 'employmentType', header: 'Type', render: (e: Employee) => <StatusBadge status={e.employmentType} /> },
    { key: 'status', header: 'Status', render: (e: Employee) => <StatusBadge status={e.status} /> },
    { key: 'actions', header: 'Actions', render: (e: Employee) => (
      <button onClick={() => openEdit(e)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
        Edit
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Employees</h1>
          <p className="text-sm text-content-muted mt-1">Manage your organization's employees</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-content-muted" />
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="input-field w-48"
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={employees} emptyMessage="No employees found" />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEmployee(null); }}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Employee Code</label>
              <input
                className="input-field"
                value={form.employeeCode}
                onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                disabled={!!editingEmployee}
                required
              />
            </div>
            <div>
              <label className="label">Full Name</label>
              <input
                className="input-field"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={!!editingEmployee}
                required
              />
            </div>
            {!editingEmployee && (
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input-field"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            )}
            <div>
              <label className="label">Department</label>
              <input
                className="input-field"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Designation</label>
              <input
                className="input-field"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Date of Joining</label>
              <input
                type="date"
                className="input-field"
                value={form.dateOfJoining}
                onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Employment Type</label>
              <select
                className="input-field"
                value={form.employmentType}
                onChange={(e) => setForm({ ...form, employmentType: e.target.value as typeof form.employmentType })}
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
            <div>
              <label className="label">Salary</label>
              <input
                type="number"
                className="input-field"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="label">Work Location</label>
              <input
                className="input-field"
                value={form.workLocation}
                onChange={(e) => setForm({ ...form, workLocation: e.target.value })}
                required
              />
            </div>
            {!editingEmployee && (
              <div>
                <label className="label">Role</label>
                <select
                  className="input-field"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="TEAM_LEAD">Team Lead</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HR">HR</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            )}
            <div>
              <label className="label">Reporting Manager</label>
              <select
                className="input-field"
                value={form.managerId || ''}
                onChange={(e) => setForm({ ...form, managerId: e.target.value || null })}
              >
                <option value="">No Manager (Top-level)</option>
                {allEmployees
                  .filter((emp) => editingEmployee ? emp.id !== editingEmployee.id : true)
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} — {emp.designation} ({emp.department})
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              {editingEmployee ? 'Update' : 'Create'} Employee
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
