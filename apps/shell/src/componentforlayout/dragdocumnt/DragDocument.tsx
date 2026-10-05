"use client";

import React, { useRef, useState } from "react";

export interface DragDocumentProps {
  id?: string;
  value?: File | string | null;
  onChange?: (file: File | null, fileName: string) => void;
  placeholder?: string;
  accept?: string;
  disabled?: boolean;
  className?: string;
}

export function DragDocument({
  id,
  value,
  onChange,
  placeholder = "Seleccionar o arrastrar archivo...",
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg",
  disabled = false,
  className = "",
}: DragDocumentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>(
    typeof value === "string" ? value : value?.name || ""
  );

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setSelectedFileName(file.name);
      onChange?.(file, file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0] || null;
    if (file) {
      setSelectedFileName(file.name);
      onChange?.(file, file.name);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onChange?.(null, "");
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-11 px-4 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer select-none ${
        isDragging
          ? "border-black bg-gray-100 shadow-md scale-[1.005]"
          : "border-black/80 bg-white hover:border-black"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
    >
      {/* Input de archivo nativo oculto */}
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Contenido / Texto del archivo */}
      <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
        {selectedFileName ? (
          <div className="flex items-center gap-2 max-w-full">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-black text-white flex-shrink-0">
              DOC
            </span>
            <span
              className="text-sm font-semibold text-black truncate"
              title={selectedFileName}
            >
              {selectedFileName}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400 truncate">
            {placeholder}
          </span>
        )}
      </div>

      {/* Botón de limpiar o icono (+) para subir */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {selectedFileName ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-black font-bold text-lg p-1 transition-colors"
            title="Quitar documento"
          >
            ×
          </button>
        ) : null}

        {/* Icono circular (+) de subir documento */}
        <div
          className="text-black p-0.5 hover:opacity-75 transition-opacity"
          title="Examinar y subir documento"
        >
          <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" stroke="#000000" strokeWidth="2" fill="#FFFFFF" />
            <line x1="12" y1="7" x2="12" y2="17" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
            <line x1="7" y1="12" x2="17" y2="12" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
