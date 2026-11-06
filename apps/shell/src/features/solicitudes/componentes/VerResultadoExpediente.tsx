"use client";

import React, { useState, useEffect } from "react";
import { SolicitudItem } from "../types/tabla.types";
import { obtenerExpediente } from "../services/expedientes.service";
import { API_BASE_URL } from "@/services/api.client";
import { loadStoredSession } from "@/navigation/session/session.store";

export interface VerResultadoExpedienteProps {
  solicitud: SolicitudItem;
  onVolver?: () => void;
  className?: string;
}

interface DocumentoVisual {
  id: string;
  nombre: string;
  version: string;
  archivoNombre: string;
  documentoIdReal?: string;
  isAudio?: boolean;
}

const MAPA_TIPOS_DOCUMENTO: Record<string, string> = {
  participantes: "Participantes",
  naturaleza_proyecto: "Naturaleza del Proyecto",
  naturaleza_del_proyecto: "Naturaleza del Proyecto",
  naturaleza: "Naturaleza del Proyecto",
  financiamiento: "Financiamiento",
  modalidad: "Modalidad",
  plan_proyecto: "Plan de Proyecto",
  plan_de_proyecto: "Plan de Proyecto",
  plan: "Plan de Proyecto",
  anexo_evaluacion: "Anexo",
  evaluacion_anexo: "Anexo",
  audio_asunto: "Audio",
  audio: "Audio",
};

export function VerResultadoExpediente({
  solicitud,
  onVolver,
  className = "",
}: VerResultadoExpedienteProps) {
  const [detalles, setDetalles] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [menuActivoId, setMenuActivoId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const cargarDetalle = async () => {
      setIsLoading(true);
      try {
        const idTarget = solicitud.ticketId || solicitud.codigoExpediente || solicitud.id;
        const data = await obtenerExpediente(idTarget);
        if (isMounted && data) {
          setDetalles(data);
        }
      } catch (err) {
        console.warn("[VerResultadoExpediente] Aviso al cargar detalle:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    cargarDetalle();
    return () => {
      isMounted = false;
    };
  }, [solicitud]);

  // Formateo de fecha de solicitud
  let fechaSolicitudLegible = solicitud.fecha || "9/26/2026";
  if (solicitud.fecha && !isNaN(Date.parse(solicitud.fecha))) {
    const d = new Date(solicitud.fecha);
    fechaSolicitudLegible = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }

  // Extracción de metadatos reales del endpoint
  const ticket = detalles?.ticket;
  const codigoExpediente = detalles?.codigo || solicitud.codigoExpediente || solicitud.id;
  const tituloProyecto = isLoading
    ? "Cargando..."
    : (ticket?.titulo || detalles?.titulo || "Sin título registrado");

  const fechaAsignacion = ticket?.creadoEn || ticket?.fechaPresentacion
    ? new Date(ticket.creadoEn || ticket.fechaPresentacion).toLocaleDateString("es-PE")
    : (isLoading ? "Cargando..." : "12/09/2026");

  // Resolución del nombre del Investigador:
  // 1. Array de investigadores ingresado en el wizard
  let nombreInvestigador = "";
  if (Array.isArray(ticket?.investigadores) && ticket.investigadores.length > 0) {
    const validos = ticket.investigadores.filter(
      (inv: any) => typeof inv === "string" && inv.trim().length > 0
    );
    if (validos.length > 0) {
      nombreInvestigador = validos.join(", ");
    }
  }

  // 2. Si no hay en array, fallback al solicitante autenticado
  if (!nombreInvestigador && ticket?.solicitante) {
    const full = `${ticket.solicitante.nombre || ""} ${ticket.solicitante.apellido || ""}`.trim();
    if (full) nombreInvestigador = full;
  }

  if (!nombreInvestigador && detalles?.solicitante) {
    const full = `${detalles.solicitante.nombre || ""} ${detalles.solicitante.apellido || ""}`.trim();
    if (full) nombreInvestigador = full;
  }

  const investigador = isLoading
    ? "Cargando..."
    : (nombreInvestigador || "No registrado");

  const unidadAcademica = isLoading
    ? "Cargando..."
    : (ticket?.unidadAcademica && ticket.unidadAcademica !== "NA"
        ? ticket.unidadAcademica
        : (ticket?.facultad || "No especificada"));

  // Formateo de Tipo de Investigación (si es 'Otro', incluye el texto que se escribió)
  let textoTipoInvestigacion = "No especificado";
  if (ticket?.tipoInvestigacion) {
    if (
      ticket.tipoInvestigacion.toLowerCase() === "otro" &&
      ticket.tipoInvestigacionOtro?.trim()
    ) {
      textoTipoInvestigacion = `Otro (${ticket.tipoInvestigacionOtro.trim()})`;
    } else {
      textoTipoInvestigacion = ticket.tipoInvestigacion;
    }
  } else if (ticket?.tipoInvestigacionOtro?.trim()) {
    textoTipoInvestigacion = `Otro (${ticket.tipoInvestigacionOtro.trim()})`;
  }

  const tipoInvestigacion = isLoading ? "Cargando..." : textoTipoInvestigacion;

  // Formateo de Financiamiento (si es 'Externo', incluye el detalle que se escribió)
  let textoFinanciamiento = "No especificado";
  if (ticket?.financiamiento) {
    if (
      ticket.financiamiento.toLowerCase() === "externo" &&
      ticket.financiamientoDetalle?.trim()
    ) {
      textoFinanciamiento = `Externo (${ticket.financiamientoDetalle.trim()})`;
    } else if (ticket.financiamientoDetalle?.trim()) {
      textoFinanciamiento = `${ticket.financiamiento} (${ticket.financiamientoDetalle.trim()})`;
    } else {
      textoFinanciamiento = ticket.financiamiento;
    }
  } else if (ticket?.financiamientoDetalle?.trim()) {
    textoFinanciamiento = `Externo (${ticket.financiamientoDetalle.trim()})`;
  }

  const financiamiento = isLoading ? "Cargando..." : textoFinanciamiento;

  const fechaEvaluacion = ticket?.fechaRecepcionEvaluacion
    ? new Date(ticket.fechaRecepcionEvaluacion).toLocaleDateString("es-PE")
    : (isLoading ? "Cargando..." : "NA");

  // Vinculación dinámica 1:1 con documentos reales devueltos por el endpoint
  const rawDocs: any[] =
    (Array.isArray(detalles?.documentos) && detalles.documentos.length > 0)
      ? detalles.documentos
      : (Array.isArray(detalles?.ticket?.documentos) && detalles.ticket.documentos.length > 0)
        ? detalles.ticket.documentos
        : (Array.isArray(ticket?.documentos) && ticket.documentos.length > 0)
          ? ticket.documentos
          : [];

  // Funciones de formateo dinámico de documentos
  const formatearNombreDoc = (doc: any): string => {
    const tipo = (doc.tipoDocumental || doc.tipo || "").toLowerCase().trim();

    // 1. "Anexo" queda reservado exclusivamente para el PDF/documento de evaluación
    if (tipo === "anexo_evaluacion" || tipo === "evaluacion_anexo") {
      return "Anexo";
    }

    // 2. Documentos base del trámite con nombre formal fijo
    if (MAPA_TIPOS_DOCUMENTO[tipo] && !tipo.includes("anexo")) {
      return MAPA_TIPOS_DOCUMENTO[tipo];
    }

    // 3. Audio de asunto
    if (tipo.includes("audio")) {
      return "Audio";
    }

    // 4. Los anexos adjuntos y demás archivos se nombran por su nombre real sin extensión
    if (doc.nombreOriginal && typeof doc.nombreOriginal === "string") {
      const sinExt = doc.nombreOriginal.replace(/\.[^/.]+$/, "").replace(/_/g, " ").trim();
      if (sinExt.length > 0) return sinExt;
    }

    if (doc.nombre && typeof doc.nombre === "string") {
      const sinExt = doc.nombre.replace(/\.[^/.]+$/, "").replace(/_/g, " ").trim();
      if (sinExt.length > 0) return sinExt;
    }

    // 5. Fallback por tipo documental
    if (tipo) {
      if (tipo.includes("anexo")) {
        return "Anexo";
      }
      return tipo
        .replace(/_/g, " ")
        .toLowerCase()
        .split(" ")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }

    return "Documento";
  };

  const formatearVersionDoc = (doc: any): string => {
    if (doc.version !== undefined && doc.version !== null && String(doc.version).trim() !== "") {
      const vStr = String(doc.version).trim();
      return vStr.toUpperCase().startsWith("V") ? vStr : `V.${vStr}`;
    }
    return "V.1";
  };

  const listaDocumentos: DocumentoVisual[] = rawDocs.map((doc: any, index: number) => {
    const nombre = formatearNombreDoc(doc);
    const tipo = (doc.tipoDocumental || doc.tipo || "").toLowerCase();
    const isAudio = doc.mimeType?.startsWith("audio/") || tipo.includes("audio");

    return {
      id: doc.id || `doc-${index}`,
      nombre,
      version: formatearVersionDoc(doc),
      archivoNombre: doc.nombreOriginal || doc.nombre || doc.nombreArchivo || `${nombre}.pdf`,
      documentoIdReal: doc.ticketDocumentoId || doc.id,
      isAudio,
    };
  });

  const handleSeleccionarDoc = (doc: DocumentoVisual) => {
    setMenuActivoId(menuActivoId === doc.id ? null : doc.id);
  };

  const [accionDocId, setAccionDocId] = useState<string | null>(null);

  const handleVerDoc = async (doc: DocumentoVisual, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuActivoId(null);

    if (!doc.documentoIdReal) {
      alert(`El documento "${doc.nombre}" no cuenta con un archivo digital adjunto en este expediente.`);
      return;
    }

    setAccionDocId(doc.id);
    try {
      const session = typeof window !== "undefined" ? loadStoredSession() : null;
      const token = session?.token;

      const res = await fetch(
        `${API_BASE_URL}/api/v1/documents/${encodeURIComponent(doc.documentoIdReal)}/view`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "X-Requested-With": "EstanciaPeru",
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        if (res.status === 404) {
          alert(`El archivo físico de "${doc.nombre}" no se encuentra en el servidor de almacenamiento.`);
          return;
        }
        if (res.status === 401) {
          alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
          return;
        }
        throw new Error(`Error ${res.status}`);
      }

      const blob = await res.blob();
      const fileUrl = URL.createObjectURL(
        new Blob([blob], { type: res.headers.get("content-type") || "application/pdf" })
      );
      window.open(fileUrl, "_blank");
    } catch (error) {
      console.error("[VerResultadoExpediente] Error al abrir documento:", error);
      alert(`No se pudo visualizar el documento "${doc.nombre}".`);
    } finally {
      setAccionDocId(null);
    }
  };

  const handleDescargarDoc = async (doc: DocumentoVisual, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuActivoId(null);

    if (!doc.documentoIdReal) {
      alert(`El documento "${doc.nombre}" no cuenta con un archivo digital adjunto en este expediente.`);
      return;
    }

    setAccionDocId(doc.id);
    try {
      const session = typeof window !== "undefined" ? loadStoredSession() : null;
      const token = session?.token;

      const res = await fetch(
        `${API_BASE_URL}/api/v1/documents/${encodeURIComponent(doc.documentoIdReal)}/download`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "X-Requested-With": "EstanciaPeru",
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        if (res.status === 404) {
          alert(`El archivo físico de "${doc.nombre}" no se encuentra en el servidor de almacenamiento.`);
          return;
        }
        throw new Error(`Error ${res.status}`);
      }

      const blob = await res.blob();
      const fileUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = doc.archivoNombre || `${doc.nombre}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error("[VerResultadoExpediente] Error al descargar documento:", error);
      alert(`No se pudo descargar el documento "${doc.nombre}".`);
    } finally {
      setAccionDocId(null);
    }
  };

  return (
    <div
      className={`w-full max-w-6xl mx-auto p-4 md:p-8 ${className}`}
      style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* ========================================================================= */}
        {/* COLUMNA IZQUIERDA: Tarjeta Gris de Fecha y Ficha del Proyecto            */}
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
              <span className="font-bold">{fechaSolicitudLegible}</span>
            </div>

            {/* Línea divisoria horizontal interna */}
            <div className="w-full h-[1.5px] bg-black/70 my-2" />

            {/* Botón Píldora: Última actualización */}
            <button
              type="button"
              className="mt-2 px-6 py-1 rounded-full border border-black/80 bg-white hover:bg-gray-50 text-xs md:text-sm font-semibold text-black transition-colors cursor-pointer shadow-xs select-none"
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
        {/* COLUMNA DERECHA: Píldoras de Estado y Documentos del Expediente          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col w-full">
          {/* Píldoras Superiores de Estado */}
          <div className="flex flex-col gap-2.5 items-start pl-0 sm:pl-[44px] w-full mb-4">
            {/* Píldora 1: Expediente Cerrado con icono de sobre */}
            <div className="inline-flex items-center justify-between w-full max-w-[280px] px-3.5 py-1 rounded-full border border-black/80 bg-white shadow-xs">
              <span className="text-sm font-semibold text-black tracking-tight">
                Expediente Cerrado
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

            {/* Píldora 2: Cerrado */}
            <div className="inline-flex items-center justify-center w-full max-w-[280px] px-3.5 py-1 rounded-full border border-black/80 bg-white shadow-xs text-center">
              <span className="text-sm font-semibold text-black tracking-tight">
                Cerrado
              </span>
            </div>
          </div>

          {/* Título de sección: Carpeta + Documentos del expediente */}
          <div className="flex items-center gap-2.5 mb-3 mt-1">
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

          {/* Caja Contenedora de Documentos (Dinámica: se adapta a la cantidad de archivos) */}
          <div className="w-full rounded-3xl border-2 border-black/80 bg-white p-4 sm:p-5 shadow-sm mb-6 relative">
            {/* Overlay para cerrar el menú flotante al hacer clic afuera */}
            {menuActivoId && (
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuActivoId(null)}
              />
            )}

            {isLoading ? (
              <div className="flex flex-wrap gap-4 items-start animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex flex-col items-center w-[74px] sm:w-[84px]">
                    <div className="w-[66px] h-[66px] sm:w-[74px] sm:h-[74px] rounded-2xl bg-gray-200 border-2 border-gray-300" />
                    <div className="mt-2 w-14 h-3 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : listaDocumentos.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center w-full">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2 text-gray-400">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">Sin documentos adjuntos</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Este expediente no cuenta con archivos digitales registrados.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3.5 sm:gap-4.5 items-start justify-start">
                {listaDocumentos.map((doc) => {
                  const isSelected = menuActivoId === doc.id;
                  const isMenuOpen = menuActivoId === doc.id;

                  return (
                    <div key={doc.id} className="relative flex flex-col items-center w-[74px] sm:w-[84px]">
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

                        {/* Icono de documento o audio centrado */}
                        <div className="flex-1 flex items-center justify-center text-black/80">
                          {doc.isAudio ? (
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
                              <path d="M9 18V5l12-2v13" />
                              <circle cx="6" cy="18" r="3" />
                              <circle cx="18" cy="16" r="3" />
                            </svg>
                          ) : (
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
                          )}
                        </div>
                      </button>

                      {/* Nombre del documento debajo de la ranura */}
                      <span className="mt-1.5 text-[11px] sm:text-xs font-medium text-black text-center leading-tight max-w-[84px] line-clamp-2">
                        {doc.nombre}
                      </span>

                      {/* Menú Desplegable flotante con Descargar y Ver */}
                      {isMenuOpen && (
                        <div className="absolute top-[38px] left-1/2 -translate-x-1/2 z-30 bg-white border border-black/20 rounded-xl p-1 shadow-lg flex flex-col min-w-[110px]">
                          <button
                            type="button"
                            onClick={(e) => handleDescargarDoc(doc, e)}
                            disabled={accionDocId === doc.id}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold text-black hover:bg-gray-100 rounded-lg text-left cursor-pointer transition-colors flex items-center justify-between disabled:opacity-50"
                          >
                            <span>{accionDocId === doc.id ? "Descargando..." : "Descargar"}</span>
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
                            disabled={accionDocId === doc.id}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold text-black hover:bg-gray-100 rounded-lg text-left cursor-pointer transition-colors flex items-center justify-between disabled:opacity-50"
                          >
                            <span>{accionDocId === doc.id ? "Abriendo..." : "Ver"}</span>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

