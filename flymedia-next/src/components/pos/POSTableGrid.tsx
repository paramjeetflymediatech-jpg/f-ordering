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
  const [selectedZone, setSelectedZone] = React.useState<'all' | 'main' | 'vip' | 'bar'>('all');

  const filteredTables = tables.filter((table) => {
    if (selectedZone === 'all') return true;
    if (selectedZone === 'main') return table.seating_capacity === 4;
    if (selectedZone === 'vip') return table.seating_capacity >= 6;
    if (selectedZone === 'bar') return table.seating_capacity <= 2;
    return true;
  });

  return (
    <div className="w-full rounded-2xl border border-slate-800/80 bg-[#0c101b]/60 backdrop-blur-md p-6 flex flex-col min-h-[480px] justify-between shadow-xl">
      <div className="flex justify-between items-center mb-2 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-white">Active Tables</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Select a table for ordering</p>
        </div>
        <button
          onClick={() => setActiveModal('table')}
          className="rounded-lg border border-slate-800 bg-[#090d16] px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition"
        >
          Floor map
        </button>
      </div>

      {/* Zone Tabs Selector */}
      <div className="flex gap-1 border-b border-slate-900 pb-2 mb-2 select-none overflow-x-auto shrink-0 scrollbar-none">
        {(['all', 'main', 'vip', 'bar'] as const).map((zone) => {
          let label = 'All';
          if (zone === 'main') label = 'Main Hall';
          if (zone === 'vip') label = 'VIP Lounge';
          if (zone === 'bar') label = 'Terrace/Bar';

          const isZoneSelected = selectedZone === zone;
          return (
            <button
              key={zone}
              type="button"
              onClick={() => setSelectedZone(zone)}
              className={`px-2 py-0.5 text-[9px] font-extrabold rounded border transition uppercase tracking-wider shrink-0 ${
                isZoneSelected
                  ? 'bg-amber-500/10 border-amber-500/25 text-[#f59e0b]'
                  : 'bg-slate-950/40 text-slate-500 border-slate-900/60 hover:text-slate-400'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Table Map grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-4 overflow-y-auto max-h-[360px] pr-1 py-1 flex-1">
        {filteredTables.map((table) => {
          const isSelected = selectedTable?.id === table.id;

          // Color codes
          let borderStyle = 'border-slate-800/80 bg-[#0f1524]/60 text-slate-400 hover:border-slate-700';
          let ringGlow = '';

          if (isSelected) {
            borderStyle = 'border-[#f59e0b] bg-[#f59e0b]/10 text-white shadow-lg shadow-[#f59e0b]/5';
            ringGlow = 'ring-2 ring-[#f59e0b]';
          } else if (table.status === 'occupied') {
            borderStyle = 'border-emerald-500/40 bg-emerald-950/15 text-emerald-400 hover:border-emerald-500';
          } else if (table.status === 'reserved') {
            borderStyle = 'border-[#ea580c]/40 bg-[#ea580c]/15 text-[#ea580c] hover:border-[#ea580c]';
          } else if (table.status === 'cleaning') {
            borderStyle = 'border-purple-500/40 bg-purple-950/15 text-purple-400 hover:border-purple-500';
          }

          const isRound = table.seating_capacity <= 2;

          return (
            <button
              key={table.id}
              onClick={() => handleTableSelection(table)}
              className={`relative flex flex-col items-center justify-center p-2 transition duration-150 active:scale-95 border ${borderStyle} ${ringGlow} ${
                isRound ? 'rounded-full w-[62px] h-[62px] mx-auto' : 'rounded-xl w-[64px] h-[58px]'
              }`}
            >
              {/* Seats indicators */}
              <div className="absolute inset-0 pointer-events-none">
                {table.seating_capacity >= 2 && (
                  <>
                    <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-slate-750"></span>
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-slate-750"></span>
                  </>
                )}
                {table.seating_capacity >= 4 && (
                  <>
                    <span className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-slate-750"></span>
                    <span className="absolute right-0.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-slate-750"></span>
                  </>
                )}
              </div>

              <span className="text-[10px] font-black tracking-tight">{table.table_number}</span>
              {getDummyTableBill(table) ? (
                <span className="text-[7.5px] font-extrabold mt-0.5 text-[#f59e0b]">${getDummyTableBill(table)}</span>
              ) : (
                <span className="text-[7px] uppercase font-bold mt-0.5 tracking-wider opacity-60">{table.status}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
