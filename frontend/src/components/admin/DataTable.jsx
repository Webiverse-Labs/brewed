import { cn } from "../../lib/cn.js";

// DaisyUI table from md up; below md each row renders as a card via `renderCard`.
// `renderRow` returns the <td>s for one row.
function DataTable({ columns, rows, renderRow, renderCard, onRowClick, selectedId, emptyText = "Nothing to show." }) {
  //clickable rows work from the keyboard too: Tab to the row, Enter or Space opens it
  //(keys pressed on a button inside the row are left to that button)
  const rowKeyDown = (row) => (e) => {
    if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault(); //Space would otherwise scroll the page
    onRowClick(row);
  };

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
                onKeyDown={onRowClick && rowKeyDown(row)}
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  "border-base-300",
                  onRowClick &&
                    "cursor-pointer hover:bg-base-200/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
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
