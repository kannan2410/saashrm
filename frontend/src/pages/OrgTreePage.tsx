import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../services/api';
import { Users, User, Building2, ChevronRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface OrgNode {
  id: string;
  fullName: string;
  employeeCode: string;
  department: string;
  designation: string;
  managerId: string | null;
  user?: { role: string };
  children: OrgNode[];
}

function buildTree(employees: Omit<OrgNode, 'children'>[]): OrgNode[] {
  const map = new Map<string, OrgNode>();
  const roots: OrgNode[] = [];

  for (const emp of employees) {
    map.set(emp.id, { ...emp, children: [] });
  }

  for (const emp of employees) {
    const node = map.get(emp.id)!;
    if (emp.managerId && map.has(emp.managerId)) {
      map.get(emp.managerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
  HR: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  MANAGER: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
  TEAM_LEAD: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  EMPLOYEE: { bg: 'bg-surface-bg', text: 'text-content-secondary', border: 'border-surface-border' },
};

const avatarColors: Record<string, string> = {
  ADMIN: 'bg-red-600',
  HR: 'bg-purple-600',
  MANAGER: 'bg-emerald-600',
  TEAM_LEAD: 'bg-amber-600',
  EMPLOYEE: 'bg-gray-600',
};

function countDescendants(node: OrgNode): number {
  let count = node.children.length;
  for (const child of node.children) {
    count += countDescendants(child);
  }
  return count;
}

// ── Left-to-Right Tree Card ───────────────────────────────────────────────────

function LTRCard({ node, onToggle, expanded }: { node: OrgNode; onToggle?: () => void; expanded?: boolean }) {
  const role = node.user?.role || 'EMPLOYEE';
  const colors = roleColors[role] || roleColors.EMPLOYEE;
  const hasChildren = node.children.length > 0;
  const descendants = countDescendants(node);

  return (
    <div
      className={clsx(
        'relative bg-surface-card rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow w-[220px] flex-shrink-0',
        colors.border
      )}
    >
      <div className="px-4 py-3">
        {/* Top row: avatar + info */}
        <div className="flex items-center gap-2.5">
          <div className={clsx(
            'w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
            avatarColors[role] || avatarColors.EMPLOYEE
          )}>
            {node.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-content-primary truncate">{node.fullName}</p>
            <p className="text-xs text-content-muted truncate">{node.designation}</p>
          </div>
        </div>

        {/* Bottom row: dept, role badge, reports */}
        <div className="mt-2 pt-2 border-t border-surface-border flex items-center justify-between gap-1">
          <span className="text-[10px] text-content-muted uppercase font-medium truncate">{node.department}</span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {descendants > 0 && (
              <span className="text-[10px] text-content-muted flex items-center gap-0.5">
                <Users className="h-3 w-3" />{descendants}
              </span>
            )}
            <span className={clsx(
              'px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap',
              colors.bg, colors.text
            )}>
              {role.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Expand/collapse button on right edge */}
      {hasChildren && onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-surface-card border-2 border-surface-border rounded-full flex items-center justify-center hover:border-primary-500 hover:text-primary-600 transition-colors text-content-muted"
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

// ── Left-to-Right Tree Branch ─────────────────────────────────────────────────

function LTRChildren({ children }: { children: OrgNode[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const line = lineRef.current;
    if (!wrapper || !line) return;

    const updateLine = () => {
      const items = wrapper.querySelectorAll(':scope > .ltr-child');
      if (items.length < 2) { line.style.display = 'none'; return; }
      const first = items[0] as HTMLElement;
      const last = items[items.length - 1] as HTMLElement;
      const wrapperRect = wrapper.getBoundingClientRect();
      const firstMid = first.getBoundingClientRect().top + first.getBoundingClientRect().height / 2 - wrapperRect.top;
      const lastMid = last.getBoundingClientRect().top + last.getBoundingClientRect().height / 2 - wrapperRect.top;
      line.style.top = `${firstMid}px`;
      line.style.height = `${lastMid - firstMid}px`;
      line.style.display = '';
    };

    updateLine();
    const observer = new ResizeObserver(updateLine);
    observer.observe(wrapper);
    return () => observer.disconnect();
  });

  return (
    <div className="relative flex-shrink-0" ref={wrapperRef}>
      <div ref={lineRef} className="absolute left-0 w-px bg-connector" />
      <div className="flex flex-col gap-3">
        {children.map((child) => (
          <div key={child.id} className="ltr-child">
            <LTRBranch node={child} />
          </div>
        ))}
      </div>
    </div>
  );
}

function LTRBranch({ node, isRoot = false }: { node: OrgNode; isRoot?: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex items-center">
      {/* Horizontal line from parent to this card */}
      {!isRoot && (
        <div className="h-px w-8 bg-connector flex-shrink-0" />
      )}

      {/* Card */}
      <LTRCard
        node={node}
        onToggle={hasChildren ? () => setExpanded(!expanded) : undefined}
        expanded={expanded}
      />

      {/* Children to the right */}
      {hasChildren && expanded && (
        <div className="flex items-center flex-shrink-0">
          {/* Horizontal line from card to children connector */}
          <div className="h-px w-8 bg-connector flex-shrink-0" />

          {node.children.length === 1 ? (
            <LTRBranch node={node.children[0]} />
          ) : (
            <LTRChildren children={node.children} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Scroll container with drag-to-pan ─────────────────────────────────────────

function ScrollableChart({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeftRef = useRef(0);
  const scrollTopRef = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    scrollLeftRef.current = el.scrollLeft;
    scrollTopRef.current = el.scrollTop;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const el = containerRef.current;
    if (!el) return;
    e.preventDefault();
    el.scrollLeft = scrollLeftRef.current - (e.clientX - startX.current);
    el.scrollTop = scrollTopRef.current - (e.clientY - startY.current);
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    const el = containerRef.current;
    if (el) {
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="org-chart-scroll"
      style={{ cursor: 'grab', maxHeight: 'calc(100vh - 300px)' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div className="w-max p-6">
        {children}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OrgTreePage() {
  const [employees, setEmployees] = useState<Omit<OrgNode, 'children'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/employees/org-tree')
      .then((res) => setEmployees(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tree = buildTree(employees);
  const totalCount = employees.length;
  const departments = [...new Set(employees.map((e) => e.department))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content-primary">Organization Tree</h1>
        <p className="text-sm text-content-muted mt-1">View company hierarchy and reporting structure</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-2.5 bg-surface-bg rounded-lg">
            <User className="h-5 w-5 text-content-secondary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-content-primary">{totalCount}</p>
            <p className="text-xs text-content-muted">Total Employees</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-2.5 bg-surface-bg rounded-lg">
            <Building2 className="h-5 w-5 text-content-secondary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-content-primary">{departments.length}</p>
            <p className="text-xs text-content-muted">Departments</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-2.5 bg-surface-bg rounded-lg">
            <Users className="h-5 w-5 text-content-secondary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-content-primary">{tree.length}</p>
            <p className="text-xs text-content-muted">Top-level Positions</p>
          </div>
        </div>
      </div>

      {/* Org Chart */}
      <div className="card !p-0">
        <div className="px-5 pt-5 pb-3 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-content-primary">Organization Chart</h2>
          <p className="text-xs text-content-muted mt-0.5">Drag to pan, scroll to navigate</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-content-muted">Loading...</div>
        ) : tree.length === 0 ? (
          <div className="py-12 text-center text-content-muted">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No employees found</p>
          </div>
        ) : (
          <ScrollableChart>
            <div className="flex flex-col gap-6">
              {tree.map((node) => (
                <LTRBranch key={node.id} node={node} isRoot />
              ))}
            </div>
          </ScrollableChart>
        )}
      </div>
    </div>
  );
}
