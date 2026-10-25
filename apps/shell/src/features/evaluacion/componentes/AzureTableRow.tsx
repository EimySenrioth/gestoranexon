"use client";

import React from "react";
import { SolicitudFirmaItem } from "../types/evaluacion.types";

interface AzureTableRowProps {
  item: SolicitudFirmaItem;
  isPresidente?: boolean;
  onEvaluar?: (item: SolicitudFirmaItem) => void;
  onAprobar?: (item: SolicitudFirmaItem) => void;
  onEtapaClick?: (item: SolicitudFirmaItem) => void;
}

export function AzureTableRow({
  item,
  isPresidente = false,
  onEvaluar,
  onAprobar,
  onEtapaClick,
}: AzureTableRowProps) {
  const isEvaluado = item.etapaActual === "Evaluado" || item.etapaActual === "Dictaminado";
  const isObservado = item.etapaActual === "Observado";
  const isIniciado = item.etapaActual === "Iniciado";

  return (
    <div className="azure-table-row">
      {/* 1. ID */}
      <div className="azure-col-id">
        <span className="md:hidden font-semibold text-gray-500 mr-2">ID:</span>
        <span className="font-semibold">{item.id}</span>
      </div>

      {/* 2. Fecha Solicitud */}
      <div className="azure-col-date">
        <span className="md:hidden font-semibold text-gray-500 mr-2">Fecha Solicitud:</span>
        <span>{item.fechaSolicitud || "-"}</span>
      </div>

      {/* 3. Fecha de Evaluación (Solo se muestra cuando la evaluación terminó; caso contrario '-') */}
      <div className="azure-col-date">
        <span className="md:hidden font-semibold text-gray-500 mr-2">Fecha Evaluación:</span>
        <span className={item.fechaEvaluacion === "-" ? "text-gray-400 font-medium" : "text-gray-800"}>
          {item.fechaEvaluacion || "-"}
        </span>
      </div>

      {/* 4. Etapa Actual con Icono de Status Azure (Clicable hacia StatusExpediente) */}
      <div className="azure-col-status">
        <span className="md:hidden font-semibold text-gray-500 mr-2">Etapa:</span>
        <button
          type="button"
          onClick={() => onEtapaClick?.(item)}
          className="inline-flex items-center gap-1.5 hover:opacity-75 transition-opacity cursor-pointer group text-left p-0 border-0 bg-transparent"
          title={`Ver estado del expediente (${item.etapaActual})`}
        >
          {isEvaluado ? (
            <>
              <svg
                className="azure-status-icon-evaluado flex-shrink-0"
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-900 font-medium group-hover:underline">{item.etapaActual}</span>
            </>
          ) : isObservado ? (
            <>
              <svg
                className="text-amber-500 flex-shrink-0"
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-amber-700 font-medium group-hover:underline">Observado</span>
            </>
          ) : isIniciado ? (
            <>
              <svg
                className="text-blue-500 flex-shrink-0"
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M10 6v4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-blue-700 font-medium group-hover:underline">Iniciado</span>
            </>
          ) : (
            <>
              <svg
                className="azure-status-icon-proceso flex-shrink-0"
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-gray-900 font-medium group-hover:underline">En evaluación</span>
            </>
          )}
        </button>
      </div>

      {/* 5. Evaluar (Botón con documento y pluma / Firmado el ... preservado intacto) */}
      <div className="azure-col-action">
        <span className="md:hidden font-semibold text-gray-500 mr-2">Evaluar:</span>
        {item.evaluar.firmado ? (
          <span className="azure-text-firmado">
            Firmado el {item.evaluar.fechaFirma || item.fechaEvaluacion}
          </span>
        ) : (
          <button
            type="button"
            className="azure-action-evaluar-btn"
            onClick={() => onEvaluar?.(item)}
            title="Evaluar y firmar solicitud"
          >
            {/* Icono de hoja con pluma */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>Evaluar</span>
          </button>
        )}
      </div>

      {/* 6. Aprobar (Columna exclusiva para Presidente del CEI - al lado de Evaluar) */}
      {isPresidente && (
        <div className="azure-col-action">
          <span className="md:hidden font-semibold text-gray-500 mr-2">Aprobar:</span>
          {item.aprobar?.aprobado ? (
            <span className="azure-text-aprobado">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Aprobado</span>
            </span>
          ) : (
            <button
              type="button"
              className="azure-action-aprobar-btn"
              onClick={() => onAprobar?.(item)}
              title="Aprobar y dictaminar formalmente el expediente"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Aprobar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
