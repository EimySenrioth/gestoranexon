"use client";

import React from "react";
import { WizardStepId } from "./types";
import {
  IconSobreProyecto,
  IconExpediente,
  IconRevisar,
  IconAvionEnvio,
} from "./WizardIcons";

interface WizardStepperProps {
  currentStep: WizardStepId;
  onStepChange?: (step: WizardStepId) => void;
  className?: string;
}

export function WizardStepper({
  currentStep,
  onStepChange,
  className = "",
}: WizardStepperProps) {
  return (
    <div
      className={`w-full rounded-2xl border-2 border-black/80 bg-white p-3 md:p-4 shadow-sm flex items-center justify-between gap-2 md:gap-4 select-none ${className}`}
    >
      {/* Paso 1: Datos Generales del Proyecto */}
      <div
        onClick={() => onStepChange?.("datos-generales")}
        className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
      >
        <div className="flex-shrink-0">
          <IconSobreProyecto size={46} />
        </div>
        <span
          className="text-xs md:text-sm font-semibold text-black max-w-[110px] leading-tight"
          style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
        >
          Datos Generales del Proyecto
        </span>
      </div>

      {/* Barra conectora 1 */}
      <div className="flex-1 min-w-[20px] max-w-[80px] h-2.5 bg-gray-300 rounded-full" />

      {/* Paso 2: Expediente */}
      <div
        onClick={() => onStepChange?.("expediente")}
        className="flex flex-col items-center cursor-pointer transition-transform hover:scale-[1.02]"
      >
        <div className="flex-shrink-0">
          <IconExpediente size={46} />
        </div>
        <span
          className="text-xs md:text-sm font-semibold text-black mt-1 text-center"
          style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
        >
          Expediente
        </span>
      </div>

      {/* Barra conectora 2 */}
      <div className="flex-1 min-w-[20px] max-w-[80px] h-2.5 bg-gray-300 rounded-full" />

      {/* Paso 3: Revisar */}
      <div
        onClick={() => onStepChange?.("revisar")}
        className="flex flex-col items-center cursor-pointer transition-transform hover:scale-[1.02]"
      >
        <div className="flex-shrink-0">
          <IconRevisar size={46} />
        </div>
        <span
          className="text-xs md:text-sm font-semibold text-black mt-1 text-center"
          style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
        >
          Revisar
        </span>
      </div>

      {/* Barra conectora 3 */}
      <div className="flex-1 min-w-[20px] max-w-[80px] h-2.5 bg-gray-300 rounded-full" />

      {/* Paso 4: Envío */}
      <div
        onClick={() => onStepChange?.("envio")}
        className="flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] flex-shrink-0"
      >
        <IconAvionEnvio size={50} />
      </div>
    </div>
  );
}
