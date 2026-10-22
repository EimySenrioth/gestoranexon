"use client";

import React from "react";

interface TablePaginacionProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
  disabled?: boolean;
}

export function TablePaginacion({
  page,
  totalPages,
  total,
  onPageChange,
  disabled = false,
}: TablePaginacionProps) {
  if (totalPages <= 1 && total === 0) {
    return null;
  }

  const handleAnterior = () => {
    if (page > 1 && !disabled) {
      onPageChange(page - 1);
    }
  };

  const handleSiguiente = () => {
    if (page < totalPages && !disabled) {
      onPageChange(page + 1);
    }
  };

  return (
    <div
      className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2 border-t border-black/10 text-black text-sm"
      style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
    >
      <div className="text-xs md:text-sm text-neutral-600 font-medium">
        Mostrando página <span className="font-bold text-black">{page}</span> de{" "}
        <span className="font-bold text-black">{totalPages || 1}</span>
        {total > 0 && (
          <span className="ml-1 text-neutral-500">
            ({total} {total === 1 ? "solicitud" : "solicitudes"} en total)
          </span>
        )}
      </div>

      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={handleAnterior}
          disabled={page <= 1 || disabled}
          aria-label="Página anterior"
          className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-black/80 bg-white text-black text-xs md:text-sm font-semibold transition-all hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black cursor-pointer shadow-xs active:scale-95"
        >
          ← Anterior
        </button>

        <span className="px-3 py-1 text-xs md:text-sm font-bold bg-neutral-100 rounded-full border border-black/20">
          {page} / {totalPages || 1}
        </span>

        <button
          type="button"
          onClick={handleSiguiente}
          disabled={page >= totalPages || disabled}
          aria-label="Página siguiente"
          className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-black/80 bg-white text-black text-xs md:text-sm font-semibold transition-all hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black cursor-pointer shadow-xs active:scale-95"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
