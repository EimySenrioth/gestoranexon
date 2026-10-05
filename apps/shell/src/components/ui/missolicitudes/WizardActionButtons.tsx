"use client";

import React from "react";

interface WizardActionButtonsProps {
  onCancel?: () => void;
  onContinue?: () => void;
  isContinueDisabled?: boolean;
  isSubmitting?: boolean;
  cancelText?: string;
  continueText?: string;
  className?: string;
}

export function WizardActionButtons({
  onCancel,
  onContinue,
  isContinueDisabled = false,
  isSubmitting = false,
  cancelText = "Cancelar",
  continueText = "Continuar",
  className = "",
}: WizardActionButtonsProps) {
  // Estilo fiel a la referencia: cápsula con doble borde (anillo interior blanco + borde exterior negro),
  // fondo gris claro suave (#E5E7EB), texto en negrita y sin efecto hover.
  const buttonStyle: React.CSSProperties = {
    fontFamily: "var(--ui-font-family-lagu, sans-serif)",
    backgroundColor: "#EDEDED",
    color: "#18181B",
    border: "2.5px solid #18181B",
    boxShadow: "inset 0 0 0 2px #FFFFFF",
  };

  return (
    <div className={`w-full flex items-center justify-end gap-4 mt-5 ${className}`}>
      {/* Botón Cancelar */}
      <button
        type="button"
        onClick={onCancel}
        className="min-w-[150px] px-8 py-2.5 rounded-full font-bold text-base cursor-pointer select-none"
        style={buttonStyle}
      >
        {cancelText}
      </button>

      {/* Botón Continuar */}
      <button
        type="button"
        onClick={onContinue}
        disabled={isContinueDisabled || isSubmitting}
        className={`min-w-[150px] px-8 py-2.5 rounded-full font-bold text-base cursor-pointer select-none ${
          isContinueDisabled || isSubmitting ? "opacity-50 cursor-not-allowed" : ""
        }`}
        style={buttonStyle}
      >
        {isSubmitting ? "Procesando..." : continueText}
      </button>
    </div>
  );
}
