"use client";

import React from "react";

interface AzureTableHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function AzureTableHeader({ searchTerm, onSearchChange }: AzureTableHeaderProps) {
  return (
    <div className="azure-header-container">
      {/* Título con sobre temático */}
      <div className="azure-header-title-box">
        <div className="azure-header-icon" aria-hidden="true">
          <svg
            width="44"
            height="44"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Solapa trasera del sobre */}
            <path
              d="M32 64L80 32L128 64V122H32V64Z"
              fill="#E5BA5A"
              stroke="#121212"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Hoja blanca */}
            <rect
              x="46"
              y="26"
              width="68"
              height="68"
              rx="6"
              fill="#FFFFFF"
              stroke="#121212"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Signo de interrogación */}
            <path
              d="M74.5 48.5C74.5 45.4 77 43 80 43C83 43 85.5 45.4 85.5 48.5C85.5 51.5 83.5 53 81.5 54.5C80 55.6 79 57 79 59.5V60.5"
              stroke="#121212"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <circle cx="79.5" cy="67.5" r="2.5" fill="#121212" />
            {/* Cuerpo del sobre */}
            <path
              d="M28 66L80 102L132 66V124C132 127 129 130 126 130H34C31 130 28 127 28 124V66Z"
              fill="#F4CF74"
              stroke="#121212"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path d="M28 128L68 93" stroke="#121212" strokeWidth="4" strokeLinecap="round" />
            <path d="M132 128L92 93" stroke="#121212" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="azure-header-title">Tabla de solicitudes a firmar</h1>
      </div>

      {/* Buscador de expedientes */}
      <div className="azure-search-box">
        <input
          type="text"
          className="azure-search-input"
          placeholder="Buscador de expedientes"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Buscador de expedientes"
        />
        <button type="button" className="azure-search-btn" title="Buscar">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>
    </div>
  );
}
