import { cn } from "../../lib/cn.js";

// DaisyUI table from md up; below md each row renders as a card via `renderCard`.
// `renderRow` returns the <td>s for one row.
function DataTable({ columns, rows, renderRow, renderCard, onRowClick, selectedId, emptyText = "Nothing to show." }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-box border border-base-300 bg-surface px-5 py-12 text-center text-sm text-secondary">
        {emptyText}
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-box border border-base-300 bg-surface md:block">
        <table className="table">
          <thead>
            <tr className="border-base-300 text-xs text-secondary">
              {columns.map((col) => (
                <th key={col} className="font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick && (() => onRowClick(row))}
                className={cn(
                  "border-base-300",
                  onRowClick && "cursor-pointer hover:bg-base-200/50",
                  selectedId === row.id && "bg-base-200/70",
                )}
              >
                {renderRow(row)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-box border border-base-300 bg-surface p-4">
            {renderCard(row)}
          </li>
        ))}
      </ul>
    </>
  );
}

export default DataTable;
