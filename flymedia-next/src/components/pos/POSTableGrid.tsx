import React from 'react';

interface POSTableGridProps {
  tables: any[];
  selectedTable: any;
  handleTableSelection: (table: any) => void;
  getDummyTableBill: (table: any) => string | null;
  setActiveModal: (modal: any) => void;
}

export function POSTableGrid({
  tables,
  selectedTable,
  handleTableSelection,
  getDummyTableBill,
  setActiveModal,
}: POSTableGridProps) {
  return (
    <div className="xl:col-span-5 rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-4 flex flex-col h-[385px] justify-between shadow-xl">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-sm font-bold text-white">Active Tables Overview</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Click table shape to select it for active order</p>
        </div>
        <button
          onClick={() => setActiveModal('table')}
          className="rounded-lg border border-[#1e293b] bg-slate-900 px-3 py-1.5 text-xs font-semibold text-[#f59e0b] hover:bg-slate-800 transition"
        >
          Floor list
        </button>
      </div>

      {/* Table Map grid */}
      <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-[300px] pr-1 py-1.5">
        {tables.map((table) => {
          const isSelected = selectedTable?.id === table.id;

          // Color codes
          let borderStyle = 'border-slate-800 bg-[#0f1524] text-slate-400 hover:border-slate-600';
          let ringGlow = '';

          if (isSelected) {
            borderStyle = 'border-[#f59e0b] bg-[#f59e0b]/10 text-white shadow-lg shadow-[#f59e0b]/5';
            ringGlow = 'ring-2 ring-[#f59e0b]';
          } else if (table.status === 'occupied') {
            borderStyle = 'border-emerald-500/60 bg-emerald-950/10 text-emerald-400 hover:border-emerald-500';
          } else if (table.status === 'reserved') {
            borderStyle = 'border-[#ea580c]/60 bg-[#ea580c]/10 text-[#ea580c] hover:border-[#ea580c]';
          } else if (table.status === 'cleaning') {
            borderStyle = 'border-purple-500/60 bg-purple-950/10 text-purple-400 hover:border-purple-500';
          }

          const isRound = table.seating_capacity <= 2;

          return (
            <button
              key={table.id}
              onClick={() => handleTableSelection(table)}
              className={`relative flex flex-col items-center justify-center p-2.5 transition duration-150 active:scale-95 border-2 ${borderStyle} ${ringGlow} ${
                isRound ? 'rounded-full w-[68px] h-[68px] mx-auto' : 'rounded-2xl w-[70px] h-[64px]'
              }`}
            >
              {/* Seats indicators */}
              <div className="absolute inset-0 pointer-events-none">
                {table.seating_capacity >= 2 && (
                  <>
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  </>
                )}
                {table.seating_capacity >= 4 && (
                  <>
                    <span className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                    <span className="absolute right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  </>
                )}
              </div>

              <span className="text-xs font-black tracking-tight">{table.table_number}</span>
              {getDummyTableBill(table) ? (
                <span className="text-[8px] font-bold mt-0.5 opacity-90">${getDummyTableBill(table)}</span>
              ) : (
                <span className="text-[7.5px] uppercase font-semibold mt-0.5 tracking-wider opacity-75">{table.status}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
