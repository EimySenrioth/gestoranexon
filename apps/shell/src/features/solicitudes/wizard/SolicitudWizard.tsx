"use client";

import React from "react";
import { SolicitudCompletaData } from "../types/wizard.types";
import { WizardStepper } from "./WizardStepper";
import { DatosGeneralesForm } from "./DatosGeneralesForm";
import { ExpedienteForm } from "./ExpedienteForm";
import { RevisarSolicitud } from "./RevisarSolicitud";
import { WizardActionButtons } from "./WizardActionButtons";
import { useSolicitudWizard } from "../hooks/useSolicitudWizard";

interface SolicitudWizardProps {
  onCancel?: () => void;
  onSubmitSuccess?: (data: SolicitudCompletaData) => void;
  className?: string;
}

export function SolicitudWizard({
  onCancel,
  onSubmitSuccess,
  className = "",
}: SolicitudWizardProps) {
  const {
    currentStep,
    setCurrentStep,
    isSubmitting,
    submitError,
    expedienteCreado,
    formData,
    setFormData,
    expedienteData,
    setExpedienteData,
    handleCancel,
    handleContinue,
    getContinueLabel,
  } = useSolicitudWizard({ onCancel, onSubmitSuccess });

  return (
    <div className={`w-full max-w-4xl mx-auto flex flex-col items-center ${className}`}>
      {/* Tarjeta Blanca Redondeada */}
      <div className="w-full bg-white rounded-3xl border-2 border-black/80 shadow-2xl p-5 md:p-8 transition-all">
        {/* 1. Barra Stepper superior */}
        <WizardStepper currentStep={currentStep} onStepChange={setCurrentStep} />

        {/* 2. Alerta de error si falla la persistencia */}
        {submitError && (
          <div className="w-full my-4 p-4 bg-red-50 border border-red-300 rounded-xl text-red-700 text-sm">
            <span className="font-bold">Error al registrar: </span>
            {submitError}
          </div>
        )}

        {/* 3. Cuerpo dinámico según el paso activo */}
        {currentStep === "datos-generales" && (
          <DatosGeneralesForm
            initialData={formData}
            onChange={(updated) => setFormData(updated)}
          />
        )}

        {currentStep === "expediente" && (
          <ExpedienteForm
            initialData={expedienteData}
            onChange={(updated) => setExpedienteData(updated)}
          />
        )}

        {currentStep === "revisar" && (
          <RevisarSolicitud
            datosGenerales={formData}
            expediente={expedienteData}
          />
        )}

        {currentStep === "envio" && (
          <div className="w-full mt-8 py-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-3xl font-bold mb-4 shadow-lg">
              ✓
            </div>
            <h2
              className="text-2xl md:text-3xl font-bold text-black mb-2"
              style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
            >
              ¡Expediente Guardado en la Base de Datos!
            </h2>
            <p className="text-gray-600 max-w-md text-sm md:text-base mb-6">
              Su solicitud de evaluación ética ha sido almacenada de forma local y enviada al Comité de Ética para la Investigación (UNTELS).
            </p>

            {/* Ficha con Códigos Oficiales Generados en PostgreSQL */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 w-full max-w-md text-left space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Trámite ID:</span>
                <span className="font-mono font-bold text-black">
                  {expedienteCreado?.codigo || "TCK-2026-0001"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Expediente Oficial:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {expedienteCreado?.codigoExpediente || "EXP-2026-0001"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Estado BD:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                  REGISTRADO (PostgreSQL)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Botonera exterior Cancelar / Continuar */}
      <WizardActionButtons
        onCancel={handleCancel}
        onContinue={handleContinue}
        continueText={getContinueLabel()}
        isSubmitting={isSubmitting}
        isContinueDisabled={isSubmitting}
      />
    </div>
  );
}
