"use client";

import React, { useState, useEffect } from "react";
import { SolicitudItem } from "../types/tabla.types";
import {
  obtenerProgresoSolicitante,
  ProgresoSolicitanteResponse,
  EvaluacionSlotDto,
} from "../services/expedientes.service";

interface InformacionSolicitudProgresoProps {
  solicitud: SolicitudItem;
  onVolver?: () => void;
  className?: string;
}

export function InformacionSolicitudProgreso({
  solicitud,
  onVolver,
  className = "",
}: InformacionSolicitudProgresoProps) {
  const [data, setData] = useState<ProgresoSolicitanteResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const expedienteId = solicitud.id || solicitud.ticketId || "";
    if (!expedienteId) {
      setLoading(false);
      return;
    }

    obtenerProgresoSolicitante(expedienteId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          // Si hay evaluaciones completadas, preseleccionar la última completada o la primera
          const lastCompletedIndex = res.evaluaciones.reduce(
            (last, cur, idx) => (cur.completado ? idx : last),
            0
          );
          setSelectedIndex(lastCompletedIndex);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error al cargar progreso del expediente:", err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [solicitud.id, solicitud.ticketId]);

  // Si no hay datos todavía o falla el endpoint, construir un fallback predeterminado
  const fallbackSlots: EvaluacionSlotDto[] = ["01", "02", "03", "04", "05"].map(
    (num) => ({
      numero: num,
      evaluadorRol: null,
      evaluadorNombre: null,
      completado: false,
      resultado: null,
      fechaEvaluacion: null,
      hitos: [
        {
          id: "principios",
          titulo: "Revisión de Principios Éticos",
          fecha: "—",
          estado: "Pendiente",
        },
        {
          id: "metodologia",
          titulo: "Evaluación Metodológica y de Riesgos",
          fecha: "—",
          estado: "Pendiente",
        },
        {
          id: "normativa",
          titulo: "Verificación Normativa y Legal",
          fecha: "—",
          estado: "Pendiente",
        },
        {
          id: "dictamen",
          titulo: "Dictamen de la Evaluación",
          fecha: "—",
          estado: "Pendiente",
        },
        {
          id: "firma",
          titulo: "Firma y Emisión del Evaluador",
          fecha: "—",
          estado: "Pendiente",
        },
        {
          id: "envio",
          titulo: "Envío del expediente solicitante",
          fecha: "—",
          estado: "Pendiente",
        },
      ],
    })
  );

  const evaluaciones = data?.evaluaciones?.length ? data.evaluaciones : fallbackSlots;
  const completadas = data?.evaluacionesCompletadas ?? 0;
  const total = data?.totalEvaluadores ?? 5;

  const currentEval = evaluaciones[selectedIndex] || evaluaciones[0];
  const hitosActuales = currentEval?.hitos || [];

  // Cálculo proporcional del círculo SVG (Radio r=14, Perímetro = 2 * PI * 14 ≈ 87.96)
  const radio = 14;
  const perimetro = 2 * Math.PI * radio;
  const porcentaje = total > 0 ? (completadas / total) : 0;
  // strokeDashoffset: si 0% -> perimetro (vacío). si 100% -> 0 (lleno).
  const dashOffset = perimetro - perimetro * porcentaje;

  return (
    <div
      className={`w-full ${className}`}
      style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
    >
      {/* Botón Volver a la tabla */}
      <button
        type="button"
        onClick={onVolver}
        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-black transition-colors cursor-pointer select-none"
      >
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
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>Volver a la tabla de solicitudes</span>
      </button>

      {/* Título Principal Centrado */}
      <h2 className="text-2xl md:text-3xl font-bold text-black text-center mb-8">
        Información de la solicitud
      </h2>

      {/* Grid de 2 Columnas: Panel de Estado a la Izquierda + Hitos a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Tarjeta de Resumen y Contador de Etapas */}
        <div className="lg:col-span-4 flex justify-center lg:justify-start">
          <div className="w-full max-w-[340px] rounded-2xl border-2 border-black/80 bg-white p-4 shadow-sm flex items-stretch">
            {/* Lado izquierdo: Iconos (Sobre con ? + Círculo de progreso azul) */}
            <div className="flex flex-col items-center justify-between pr-4 border-r-2 border-black/70 gap-6">
              {/* Icono del sobre con '?' */}
              <div className="flex-shrink-0">
                <svg
                  width="40"
                  height="40"
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

              {/* Icono circular con diseño original */}
              <div className="flex-shrink-0">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="18" cy="18" r="14" stroke="#CBD5E1" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    stroke="#38BDF8"
                    strokeWidth="3.5"
                    strokeDasharray="80"
                    strokeDashoffset="15"
                    strokeLinecap="round"
                  />
                  <path d="M12 18L16 22L24 14" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Lado derecho: Botones interactivos 01-05 + Solicitud ID + Ratio dinámico */}
            <div className="flex-1 flex flex-col justify-between pl-4">
              {/* Números de etapas interactivos (01 al 05) */}
              <div className="flex items-center justify-between text-xs md:text-sm font-mono tracking-wider">
                {evaluaciones.map((item, index) => {
                  const isSelected = selectedIndex === index;
                  const isCompletado = item.completado;

                  return (
                    <button
                      key={item.numero}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      title={
                        isCompletado
                          ? `Evaluación ${item.numero}: Completada`
                          : `Evaluación ${item.numero}: Pendiente`
                      }
                      className={`relative px-1 py-0.5 rounded transition-all cursor-pointer font-bold select-none ${
                        isSelected
                          ? "text-sky-600 bg-sky-50 shadow-xs scale-105"
                          : isCompletado
                          ? "text-gray-900 hover:text-sky-500 hover:bg-gray-100"
                          : "text-gray-300 hover:text-gray-400"
                      }`}
                    >
                      {item.numero}
                      {/* Pequeño punto indicador debajo si está completada */}
                      {isCompletado && !isSelected && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-sky-400 rounded-full" />
                      )}
                      {isSelected && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-sky-600 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="my-2 h-px bg-gray-200" />

              {/* Solicitud ID, barra de progreso dinámico y ratio (ej: 0/5, 1/5 ... 5/5) */}
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-xs md:text-sm font-medium text-black">
                    Solicitud ID
                  </span>
                  {/* Barra de progreso dinámica que se va llenando en azul celeste */}
                  <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden mt-1 border border-gray-300">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${porcentaje * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl md:text-3xl font-bold text-black tracking-tight">
                    {completadas}/{total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjetas de los 5 Hitos de Evaluación */}
        <div className="lg:col-span-8 flex flex-col gap-3.5 w-full">
          {loading ? (
            <div className="p-8 text-center text-sm font-medium text-gray-500">
              Cargando progreso de evaluación...
            </div>
          ) : (
            hitosActuales.map((hito, index) => {
              const isConforme = hito.estado === "Conforme" || hito.estado === "Aprobado";
              const isFirmado = hito.estado === "Firmado";
              const isPendiente = hito.estado === "Pendiente";
              const isObservado =
                hito.estado === "Aprobado con observaciones" ||
                hito.estado === "Cumple parcialmente" ||
                hito.estado === "Observado";
              const isNoAprobado =
                hito.estado === "No aprobado" || hito.estado === "No cumple";

              const isCompletadoPositivo = isConforme || isFirmado;

              return (
                <div
                  key={index}
                  className="w-full rounded-2xl border-2 border-black/80 bg-white p-2.5 md:p-3 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 hover:shadow-md transition-shadow"
                >
                  {/* 1. Descripción amigable de la etapa */}
                  <div className="flex-1 pl-2 text-sm md:text-base font-semibold text-black">
                    {hito.titulo}
                  </div>

                  {/* 2. Fecha de la evaluación con fondo gris claro - ancho fijo para alineación */}
                  <div className="flex-shrink-0 w-28 flex items-center justify-center bg-gray-200/90 border border-gray-300 rounded-xl py-1.5 text-xs md:text-sm font-medium text-black">
                    {hito.fecha}
                  </div>

                  {/* 3. Cápsula de Estado clara para el solicitante - ancho fijo de 190px y texto adaptativo */}
                  <div className="flex-shrink-0 w-48 flex items-center justify-center">
                    <span
                      className={`w-full text-center px-2 py-1.5 rounded-xl border-2 font-bold shadow-xs transition-all whitespace-nowrap truncate ${
                        hito.estado.length > 15 ? "text-[11px] leading-tight" : "text-xs md:text-sm"
                      } ${
                        isCompletadoPositivo
                          ? "bg-white text-black border-black/80"
                          : isObservado
                          ? "bg-amber-50 text-amber-900 border-amber-500"
                          : isNoAprobado
                          ? "bg-red-50 text-red-900 border-red-500"
                          : "bg-white text-gray-400 border-gray-300"
                      }`}
                      title={hito.estado}
                    >
                      {hito.estado}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
