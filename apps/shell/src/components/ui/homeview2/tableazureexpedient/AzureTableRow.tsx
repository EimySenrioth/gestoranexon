"use client";

import React from "react";
import { SolicitudFirmaItem } from "./types";

interface AzureTableRowProps {
  item: SolicitudFirmaItem;
  onEvaluar?: (item: SolicitudFirmaItem) => void;
  onEtapaClick?: (item: SolicitudFirmaItem) => void;
}

export function AzureTableRow({ item, onEvaluar, onEtapaClick }: AzureTableRowProps) {
  const isEvaluado = item.etapaActual === "Evaluado";

  return (
    <div className="azure-table-row">
      {/* 1. ID */}
      <div className="azure-col-id">
        <span className="md:hidden font-semibold text-gray-500 mr-2">ID:</span>
        {item.id}
      </div>

      {/* 2. Fecha Solicitud */}
      <div className="azure-col-date">
        <span className="md:hidden font-semibold text-gray-500 mr-2">Fecha Solicitud:</span>
        {item.fechaSolicitud}
      </div>

      {/* 3. Fecha de Evaluación */}
      <div className="azure-col-date">
        <span className="md:hidden font-semibold text-gray-500 mr-2">Fecha Evaluación:</span>
        {item.fechaEvaluacion}
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
              <span className="text-gray-900 font-medium group-hover:underline">Evaluado</span>
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

      {/* 5. Evaluar (Botón con documento y pluma / Firmado el ...) */}
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
    </div>
  );
}
