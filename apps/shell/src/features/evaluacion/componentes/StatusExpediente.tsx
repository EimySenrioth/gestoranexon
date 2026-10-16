"use client";

import React, { useState } from "react";

export interface DocumentoItem {
  id: string;
  nombre: string;
  version: string;
  archivoNombre: string;
}

export interface StatusExpedienteProps {
  codigoExpediente?: string;
  fechaSolicitud?: string;
  tituloProyecto?: string;
  fechaAsignacion?: string;
  investigador?: string;
  unidadAcademica?: string;
  tipoInvestigacion?: string;
  financiamiento?: string;
  fechaEvaluacion?: string;
  estadoExpediente?: string;
  className?: string;
}

const DOCUMENTOS_DEFAULT: DocumentoItem[] = [
  { id: "participantes", nombre: "Participantes", version: "V.1", archivoNombre: "Participantes_v1.pdf" },
  { id: "naturaleza", nombre: "Naturaleza del Proyecto", version: "V.1", archivoNombre: "Naturaleza_del_Proyecto_v1.pdf" },
  { id: "financiamiento", nombre: "Financiamiento", version: "V.1", archivoNombre: "Financiamiento_v1.pdf" },
  { id: "plan", nombre: "Plan de Proyecto", version: "V.1", archivoNombre: "Plan_de_Proyecto_v1.pdf" },
  { id: "anexo", nombre: "Anexo", version: "V.1", archivoNombre: "Anexo_v1.pdf" },
];

export function StatusExpediente({
  codigoExpediente = "CEI-2026-0163",
  fechaSolicitud = "9/26/2026",
  tituloProyecto = "Nombre",
  fechaAsignacion = "12/09/2026",
  investigador = "Nombre",
  unidadAcademica = "Nombre",
  tipoInvestigacion = "Nombre",
  financiamiento = "Nombre",
  fechaEvaluacion = "NA",
  estadoExpediente = "Cerrado",
  className = "",
}: StatusExpedienteProps) {
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<DocumentoItem>(DOCUMENTOS_DEFAULT[3]); // Plan de Proyecto
  const [menuActivoId, setMenuActivoId] = useState<string | null>("plan");

  const handleSeleccionarDoc = (doc: DocumentoItem) => {
    setMenuActivoId(menuActivoId === doc.id ? null : doc.id);
  };

  const handleVerDoc = (doc: DocumentoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocumentoSeleccionado(doc);
    setMenuActivoId(null);
  };

  const handleDescargarDoc = (doc: DocumentoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuActivoId(null);
  };

  return (
    <div
      className={`w-full max-w-6xl mx-auto p-4 md:p-8 ${className}`}
      style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* ========================================================================= */}
        {/* COLUMNA IZQUIERDA: Metadatos y Ficha del Proyecto                         */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start w-full">
          {/* Código del expediente en la cabecera */}
          <div className="w-full text-right lg:text-right mb-2">
            <span className="text-xl md:text-2xl font-bold tracking-tight eval-text-outlined">
              {codigoExpediente}
            </span>
          </div>

          {/* Tarjeta Gris Superior con sobre e indicador de fecha */}
          <div className="w-full rounded-3xl border-2 border-black/80 bg-[#d8d8d8] p-6 shadow-sm flex flex-col items-center justify-center text-center">
            {/* Icono del sobre con '?' */}
            <div className="flex-shrink-0 mb-3">
              <svg
                width="68"
                height="68"
                viewBox="0 0 56 56"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="6" y="16" width="38" height="28" rx="5" fill="#EAB308" stroke="#000000" strokeWidth="2.5" />
                <rect x="12" y="8" width="26" height="20" rx="3" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
                <line x1="17" y1="14" x2="27" y2="14" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="17" y1="18" x2="31" y2="18" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M6 18L24 31C24.6 31.4 25.4 31.4 26 31L44 18" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="39" cy="18" r="9" fill="#000000" stroke="#FFFFFF" strokeWidth="2" />
                <text x="39" y="23" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900" fontFamily="sans-serif">?</text>
              </svg>
            </div>

            {/* Fecha Solicitud */}
            <div className="text-xl md:text-2xl font-medium text-black mb-3">
              Fecha Solicitud &nbsp;
              <span className="font-bold">{fechaSolicitud}</span>
            </div>

            {/* Línea divisoria horizontal interna */}
            <div className="w-full h-[1.5px] bg-black/70 my-2" />

            {/* Botón Píldora: Última actualización */}
            <button
              type="button"
              className="mt-2 px-6 py-1 rounded-full border border-black/80 bg-white hover:bg-gray-50 text-xs md:text-sm font-semibold text-black transition-colors cursor-pointer shadow-xs"
            >
              Última actualización
            </button>
          </div>

          {/* Ficha descriptiva de metadatos del proyecto con contorno negro y blanco */}
          <div className="w-full mt-6 space-y-3.5 text-base md:text-lg">
            <div className="eval-text-outlined">
              <span className="font-semibold">Título del Proyecto:</span>{" "}
              <span>{tituloProyecto}</span>
            </div>
            <div className="eval-text-outlined">
              <span className="font-semibold">Fecha de asignación:</span>{" "}
              <span>{fechaAsignacion}</span>
            </div>
            <div className="eval-text-outlined">
              <span className="font-semibold">Investigador:</span>{" "}
              <span>{investigador}</span>
            </div>

            {/* Separador Horizontal */}
            <div className="w-full h-[1.5px] bg-black/70 my-3" />

            <div className="eval-text-outlined">
              <span className="font-semibold">Unidad Académica / Facultad:</span>{" "}
              <span>{unidadAcademica}</span>
            </div>
            <div className="eval-text-outlined">
              <span className="font-semibold">Tipo de Investigación:</span>{" "}
              <span>{tipoInvestigacion}</span>
            </div>
            <div className="eval-text-outlined">
              <span className="font-semibold">Financiamiento:</span>{" "}
              <span>{financiamiento}</span>
            </div>
            <div className="eval-text-outlined">
              <span className="font-semibold">Fecha de evaluación:</span>{" "}
              <span>{fechaEvaluacion}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA DERECHA: Documentos del Expediente y Visor de PDF                  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col w-full">
          {/* Píldoras Superiores de Estado (Alineadas verticalmente con la 'D' del título) */}
          <div className="flex flex-col gap-2.5 items-start pl-[44px] w-full mb-4">
            {/* Píldora 1: Expediente Cerrado con icono de sobre */}
            <div className="inline-flex items-center justify-between w-full max-w-[280px] px-3.5 py-1 rounded-full border border-black/80 bg-white shadow-xs">
              <span className="text-sm font-semibold text-black tracking-tight">
                Expediente {estadoExpediente}
              </span>
              <div className="flex-shrink-0 ml-2">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="4" y="10" width="28" height="20" rx="4" fill="#EAB308" stroke="#000000" strokeWidth="2" />
                  <rect x="8" y="4" width="20" height="14" rx="2" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" />
                  <path d="M4 11L18 20L32 11" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="28" cy="11" r="6" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1.5" />
                  <path d="M26 11L27.5 12.5L30 10" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Píldora 2: Cerrado (mismo tamaño, polígono y borde del solicitante) */}
            <div className="inline-flex items-center justify-center w-full max-w-[280px] px-3.5 py-1 rounded-full border border-black/80 bg-white shadow-xs text-center">
              <span className="text-sm font-semibold text-black tracking-tight">
                {estadoExpediente}
              </span>
            </div>
          </div>

          {/* Título de sección: Carpeta + Documentos del expediente */}
          <div className="flex items-center gap-2.5 mb-3 mt-1">
            {/* Icono de Carpeta Estilizada */}
            <div className="flex-shrink-0">
              <svg width="34" height="34" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12C8 9.79086 9.79086 8 12 8H20L24 12H36C38.2091 12 40 13.7909 40 16V36C40 38.2091 38.2091 40 36 40H12C9.79086 40 8 38.2091 8 36V12Z" fill="#F59E0B" />
                <path d="M6 18C6 15.7909 7.79086 14 10 14H38C40.2091 14 42 15.7909 42 18V36C42 38.2091 40.2091 40 38 40H10C7.79086 40 6 38.2091 6 36V18Z" fill="#FBBF24" stroke="#000000" strokeWidth="2" />
                <rect x="14" y="10" width="8" height="4" rx="1" fill="#3B82F6" />
                <rect x="24" y="10" width="8" height="4" rx="1" fill="#10B981" />
              </svg>
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight eval-text-outlined--title">
              Documentos del expediente
            </h3>
          </div>

          {/* Caja Contenedora de Documentos (Grid Compacto Estilo Inventario) */}
          <div className="w-full rounded-3xl border-2 border-black/80 bg-white p-4 sm:p-5 shadow-sm mb-6">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 sm:gap-3.5 justify-items-center">
              {DOCUMENTOS_DEFAULT.map((doc) => {
                const isSelected = documentoSeleccionado.id === doc.id;
                const isMenuOpen = menuActivoId === doc.id;

                return (
                  <div key={doc.id} className="relative flex flex-col items-center">
                    {/* Ranura/Casilla compacta estilo inventario */}
                    <button
                      type="button"
                      onClick={() => handleSeleccionarDoc(doc)}
                      className={`w-[66px] h-[66px] sm:w-[74px] sm:h-[74px] aspect-square rounded-2xl border-2 ${
                        isSelected
                          ? "border-black bg-gray-100 ring-2 ring-black ring-offset-2 shadow-sm"
                          : "border-black/80 bg-white hover:bg-gray-50 hover:border-black"
                      } p-2 flex flex-col justify-between items-center transition-all cursor-pointer relative shadow-xs`}
                    >
                      {/* Badge superior derecho: V.1 */}
                      <div className="w-full flex justify-end">
                        <span className="text-[10px] sm:text-xs font-bold text-black tracking-wider leading-none">
                          {doc.version}
                        </span>
                      </div>

                      {/* Icono de documento centrado */}
                      <div className="flex-1 flex items-center justify-center text-black/80">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </div>
                    </button>

                    {/* Nombre del documento debajo de la ranura */}
                    <span className="mt-1.5 text-[11px] sm:text-xs font-medium text-black text-center leading-tight max-w-[80px] line-clamp-2">
                      {doc.nombre}
                    </span>

                    {/* Menú Desplegable con delineado en 0.2 (estilo DevShortcut: border-black/20) */}
                    {isMenuOpen && (
                      <div className="absolute top-[38px] left-1/2 -translate-x-1/2 z-30 bg-white border border-black/20 rounded-xl p-1 shadow-lg flex flex-col min-w-[110px]">
                        <button
                          type="button"
                          onClick={(e) => handleDescargarDoc(doc, e)}
                          className="w-full px-2.5 py-1.5 text-xs font-semibold text-black hover:bg-gray-100 rounded-lg text-left cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <span>Descargar</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                        <div className="w-full h-px bg-gray-200 my-0.5" />
                        <button
                          type="button"
                          onClick={(e) => handleVerDoc(doc, e)}
                          className="w-full px-2.5 py-1.5 text-xs font-semibold text-black hover:bg-gray-100 rounded-lg text-left cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <span>Ver</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN INFERIOR: Estructura del Visor de PDF (sin archivo de ejemplo)     */}
          {/* ========================================================================= */}
          <div className="w-full flex flex-col items-center">
            {/* Nombre del archivo con contorno negro y blanco */}
            <div className="w-full text-center mb-2">
              <span className="text-base md:text-xl font-bold eval-text-outlined">
                {documentoSeleccionado?.archivoNombre || "Plan_de_Proyecto_v1.pdf"}
              </span>
            </div>

            {/* Marco Estructural del Visor */}
            <div className="w-full rounded-3xl border-2 border-black/80 bg-white p-6 shadow-sm min-h-[220px] md:min-h-[250px] flex items-center justify-between relative overflow-hidden">
              {/* Espacio compensador a la izquierda */}
              <div className="w-8 hidden sm:block" />

              {/* Icono Central Oficial de PDF */}
              <div className="flex-1 flex justify-center items-center">
                <div className="flex flex-col items-center justify-center select-none">
                  <svg
                    width="110"
                    height="125"
                    viewBox="0 0 110 125"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-xs"
                  >
                    {/* Hoja principal roja */}
                    <path
                      d="M10 8C10 4.68629 12.6863 2 16 2H75L100 27V117C100 120.314 97.3137 123 94 123H16C12.6863 123 10 120.314 10 117V8Z"
                      fill="#E11D48"
                    />
                    {/* Pliegue superior derecho */}
                    <path
                      d="M75 2L100 27H79C76.7909 27 75 25.2091 75 23V2Z"
                      fill="#BE123C"
                    />
                    {/* Letras PDF en blanco */}
                    <text
                      x="53"
                      y="78"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="30"
                      fontWeight="900"
                      letterSpacing="1"
                      fontFamily="Arial, sans-serif"
                    >
                      PDF
                    </text>
                  </svg>
                </div>
              </div>

              {/* Barra lateral derecha de scroll simulada según maqueta */}
              <div className="w-7 flex flex-col items-center justify-between h-[180px] py-1 border border-black/40 rounded-full bg-gray-100 select-none flex-shrink-0">
                {/* Flecha superior ▲ */}
                <button
                  type="button"
                  aria-label="Subir en visor"
                  className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-black cursor-pointer text-xs"
                >
                  ▲
                </button>

                {/* Thumb / Barra de desplazamiento */}
                <div className="w-3.5 h-14 bg-gray-300 rounded-full border border-gray-400" />

                {/* Flecha inferior ▼ */}
                <button
                  type="button"
                  aria-label="Bajar en visor"
                  className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-black cursor-pointer text-xs"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
