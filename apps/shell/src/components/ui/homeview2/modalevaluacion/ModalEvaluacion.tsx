"use client";

import React from "react";
import { BannerModal } from "@/components/ui/modals";
import { IconDocumentoA } from "./IconDocumentoA";
import { SolicitudFirmaItem } from "../tableazureexpedient/types";

export interface ModalEvaluacionProps {
  isOpen: boolean;
  item?: SolicitudFirmaItem | null;
  onClose: () => void;
  onConfirm: (item?: SolicitudFirmaItem) => void;
  titulo?: string;
  notaTexto?: string;
}

/**
 * ModalEvaluacion — Modal de confirmación y advertencia normativa
 * que se activa al hacer clic en el botón/ícono de "Evaluar".
 * Recrea fielmente el formato y contenido de las referencias visuales.
 */
export function ModalEvaluacion({
  isOpen,
  item,
  onClose,
  onConfirm,
  titulo = "Antes de iniciar la evaluación",
  notaTexto = "Como Vocal del CEI evalúas aspectos éticos y normativos, no la calidad ni el diseño metodológico del proyecto.",
}: ModalEvaluacionProps) {
  const handleContinuar = () => {
    onConfirm(item || undefined);
  };

  return (
    <BannerModal
      isOpen={isOpen}
      onClose={onClose}
      watermarkText="EVALUACIÓN · CEI"
      headerIcon={<IconDocumentoA size={46} />}
      title={titulo}
      footerActions={
        <>
          <button
            type="button"
            className="banner-modal-pill-btn banner-modal-pill-btn--secondary"
            onClick={onClose}
          >
            Regresar
          </button>
          <button
            type="button"
            className="banner-modal-pill-btn banner-modal-pill-btn--primary"
            onClick={handleContinuar}
          >
            Continuar
          </button>
        </>
      }
    >
      <div className="banner-modal-note-layout">
        <span className="banner-modal-note-badge">NOTA</span>
        <p className="banner-modal-note-text">{notaTexto}</p>
      </div>
    </BannerModal>
  );
}
