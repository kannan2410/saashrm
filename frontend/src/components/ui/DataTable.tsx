interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = 'id',
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  return (
    <div className="bg-surface-card rounded-xl shadow-card border border-surface-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-bg border-b border-surface-border">
              {columns.map((col) => (
                <th key={col.key} className="table-header">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-content-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={(item[keyField] as string) || idx} className="hover:bg-surface-bg transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={col.className || 'table-cell'}>
                      {col.render ? col.render(item) : (item[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
