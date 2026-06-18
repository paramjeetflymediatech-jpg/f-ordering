'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (perPage: number) => void;
  itemLabel?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemLabel = 'items',
}: PaginationProps) {
  if (totalPages <= 1 && totalItems <= itemsPerPage) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Build page numbers to show (max 5 visible)
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [1];

    if (currentPage > 3) pages.push('...');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push('...');

    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-400">
      {/* Left: Item count + per-page selector */}
      <div className="flex items-center gap-3">
        <span>
          Showing <span className="text-white">{startItem}–{endItem}</span> of{' '}
          <span className="text-white">{totalItems}</span> {itemLabel}
        </span>
        {onItemsPerPageChange && (
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white outline-none focus:border-orange-500 transition"
          >
            {[5, 10, 15, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          className="rounded-lg border border-slate-800 bg-slate-950 p-1.5 hover:bg-slate-900 transition disabled:opacity-30 disabled:cursor-not-allowed"
          title="First page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        {/* Previous */}
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-lg border border-slate-800 bg-slate-950 p-1.5 hover:bg-slate-900 transition disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`dots-${idx}`} className="px-1.5 text-slate-600">
              ···
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[28px] rounded-lg border px-2 py-1.5 text-center transition ${
                page === currentPage
                  ? 'border-orange-500/40 bg-orange-500/15 text-orange-400 font-black'
                  : 'border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg border border-slate-800 bg-slate-950 p-1.5 hover:bg-slate-900 transition disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last page */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          className="rounded-lg border border-slate-800 bg-slate-950 p-1.5 hover:bg-slate-900 transition disabled:opacity-30 disabled:cursor-not-allowed"
          title="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
