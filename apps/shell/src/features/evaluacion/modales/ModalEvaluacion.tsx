"use client";

import React, { useState, useEffect } from "react";
import { BannerModal, PageIndicator } from "@/components/ui";
import { IconDocumentoA } from "./IconDocumentoA";
import { SolicitudFirmaItem } from "../types/evaluacion.types";

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
 * Incorpora un carrusel con Page Indicator (dots) para NOTA 1 y NOTA 2,
 * y 2 botones fijos estilo Hoyoverse (Previo / Continuar-Iniciar).
 */
export function ModalEvaluacion({
  isOpen,
  item,
  onClose,
  onConfirm,
  titulo = "Antes de iniciar la evaluación",
  notaTexto = "Como Vocal del CEI evalúas aspectos éticos y normativos, no la calidad ni el diseño metodológico del proyecto.",
}: ModalEvaluacionProps) {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // Reiniciar a la primera nota cada vez que el modal se abre
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  const slides = [
    {
      badge: "NOTA 1",
      texto: notaTexto,
    },
    {
      badge: "NOTA 2",
      texto:
        "La revisión será de mi autoría y se realizará sin recurrir al uso de inteligencia artificial generativa ni herramientas asistidas por IA.",
    },
  ];

  const activeSlide = slides[currentSlide];

  const handleSiguiente = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(1);
  };

  const handlePrevio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(0);
  };

  const handleIniciar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onConfirm(item || undefined);
  };

  return (
    <BannerModal
      isOpen={isOpen}
      onClose={onClose}
      watermarkText="EVALUACIÓN · CEI"
      headerIcon={<IconDocumentoA size={46} />}
      title={titulo}
      footerLeft={
        <PageIndicator
          total={slides.length}
          current={currentSlide}
          onChange={(index) => setCurrentSlide(index)}
        />
      }
      footerActions={
        <>
          {/* Botón 1: Previo (deshabilitado en NOTA 1, activo en NOTA 2) */}
          <button
            type="button"
            id="btn-evaluar-modal-previo"
            className="banner-modal-pill-btn banner-modal-pill-btn--secondary"
            disabled={currentSlide === 0}
            onClick={currentSlide === 1 ? handlePrevio : undefined}
          >
            Previo
          </button>

          {/* Botón 2: Continuar (en NOTA 1) / Iniciar (en NOTA 2) */}
          {currentSlide === 0 ? (
            <button
              type="button"
              id="btn-evaluar-modal-continuar"
              className="banner-modal-pill-btn banner-modal-pill-btn--primary"
              onClick={handleSiguiente}
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              id="btn-evaluar-modal-iniciar"
              className="banner-modal-pill-btn banner-modal-pill-btn--primary"
              onClick={handleIniciar}
            >
              Iniciar
            </button>
          )}
        </>
      }
    >
      <div
        key={currentSlide}
        className="banner-modal-note-layout banner-modal-carousel-slide"
      >
        <span className="banner-modal-note-badge">{activeSlide.badge}</span>
        <p className="banner-modal-note-text">{activeSlide.texto}</p>
      </div>
    </BannerModal>
  );
}
