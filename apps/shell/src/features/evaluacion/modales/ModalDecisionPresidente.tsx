"use client";

import React from "react";
import { BannerModal } from "@/components/ui";
import { IconDecisionPresidente } from "./IconDecisionPresidente";
import { SolicitudFirmaItem } from "../types/evaluacion.types";

export interface ModalDecisionPresidenteProps {
  isOpen: boolean;
  item?: SolicitudFirmaItem | null;
  onClose: () => void;
  onConfirm: (item?: SolicitudFirmaItem) => void;
  onRechazar?: (item?: SolicitudFirmaItem) => void;
  titulo?: string;
  notaTexto?: string;
}

/**
 * ModalDecisionPresidente — Modal visual exclusivo para el Presidente del CEI.
 * Reutiliza el componente base BannerModal manteniendo coherencia estética,
 * modularidad y máxima mantenibilidad.
 * 
 * Contiene únicamente las acciones de 'Rechazar' y 'Confirmar Aprobación'
 * (el botón 'Regresar' no se utiliza en este modal; el cierre general se
 * realiza mediante el botón de la 'X' superior o al rechazar/aprobar).
 */
export function ModalDecisionPresidente({
  isOpen,
  item,
  onClose,
  onConfirm,
  onRechazar,
  titulo = "Aprobación y Dictamen de Presidencia",
  notaTexto = "La aprobación formal de Presidencia ratifica el consenso favorable del pleno del CEI y emite la resolución ética definitiva.",
}: ModalDecisionPresidenteProps) {
  const handleAprobar = () => {
    onConfirm(item || undefined);
  };

  const handleRechazar = () => {
    if (onRechazar) {
      onRechazar(item || undefined);
    }
    onClose();
  };

  return (
    <BannerModal
      isOpen={isOpen}
      onClose={onClose}
      watermarkText="PRESIDENCIA · CEI"
      headerIcon={<IconDecisionPresidente size={46} />}
      title={titulo}
      footerActions={
        <>
          <button
            type="button"
            className="banner-modal-pill-btn banner-modal-pill-btn--danger"
            onClick={handleRechazar}
          >
            Rechazar
          </button>
          <button
            type="button"
            className="banner-modal-pill-btn banner-modal-pill-btn--primary"
            onClick={handleAprobar}
          >
            Confirmar Aprobación
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5 py-1">
        {item && (
          <div className="p-3 bg-white/80 rounded-xl border border-gray-200 flex flex-col gap-1 text-xs">
            <div className="flex items-center justify-between text-gray-700">
              <span className="font-semibold text-gray-900">Expediente:</span>
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-900 font-bold">
                {item.id}
              </span>
            </div>
            {item.titulo && (
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="text-[11px] text-gray-500 font-medium">Título del proyecto:</span>
                <p className="text-gray-900 font-semibold line-clamp-2">{item.titulo}</p>
              </div>
            )}
            <div className="flex items-center justify-between text-gray-500 text-[11px] mt-1 pt-1 border-t border-gray-100">
              <span>Etapa actual: <strong>{item.etapaActual}</strong></span>
              <span>Fecha solicitud: <strong>{item.fechaSolicitud || "-"}</strong></span>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-700 leading-relaxed">
          Como <strong>Presidente del CEI</strong>, está a punto de dictaminar formalmente
          la <strong>aprobación ética</strong> de este trámite. Esta decisión ratifica los
          votos favorables emitidos por los evaluadores del comité.
        </p>

        <div className="banner-modal-note-layout mt-1">
          <span className="banner-modal-note-badge">RESOLUCIÓN</span>
          <p className="banner-modal-note-text">{notaTexto}</p>
        </div>
      </div>
    </BannerModal>
  );
}
