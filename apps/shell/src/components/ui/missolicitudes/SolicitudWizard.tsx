"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  WizardStepId,
  DatosGeneralesFormData,
  ExpedienteFormData,
  SolicitudCompletaData,
} from "./types";
import { WizardStepper } from "./WizardStepper";
import { DatosGeneralesForm } from "./DatosGeneralesForm";
import { ExpedienteForm } from "./ExpedienteForm";
import { RevisarSolicitud } from "./RevisarSolicitud";
import { WizardActionButtons } from "./WizardActionButtons";

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
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStepId>("datos-generales");

  // Estado del paso 1: Datos Generales
  const [formData, setFormData] = useState<DatosGeneralesFormData>({
    titulo: "",
    investigadores: [],
    unidadAcademica: "NA",
    fechaPresentacion: new Date().toISOString().split("T")[0],
    financiamiento: "",
    financiamientoDetalle: "",
  });

  // Estado del paso 2: Expediente
  const [expedienteData, setExpedienteData] = useState<ExpedienteFormData>({
    naturalezaProyecto: "",
    participantes: [],
    modalidad: "",
    planProyecto: "",
    codigo: "",
    expedienteUid: "EXP-2026-001",
  });

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/inicio");
    }
  };

  const handleContinue = () => {
    if (currentStep === "datos-generales") {
      setCurrentStep("expediente");
    } else if (currentStep === "expediente") {
      setCurrentStep("revisar");
    } else if (currentStep === "revisar") {
      setCurrentStep("envio");
      onSubmitSuccess?.({
        datosGenerales: formData,
        expediente: expedienteData,
      });
    } else if (currentStep === "envio") {
      router.push("/inicio");
    }
  };

  const getContinueLabel = () => {
    if (currentStep === "revisar") return "Enviar Solicitud";
    if (currentStep === "envio") return "Finalizar";
    return "Continuar";
  };

  return (
    <div className={`w-full max-w-4xl mx-auto flex flex-col items-center ${className}`}>
      {/* Tarjeta Blanca Redondeada de la Maqueta */}
      <div className="w-full bg-white rounded-3xl border-2 border-black/80 shadow-2xl p-5 md:p-8 transition-all">
        {/* 1. Barra Stepper superior */}
        <WizardStepper currentStep={currentStep} onStepChange={setCurrentStep} />

        {/* 2. Cuerpo dinámico según el paso activo */}
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
            <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-3xl font-bold mb-4">
              ✓
            </div>
            <h2
              className="text-2xl md:text-3xl font-bold text-black mb-2"
              style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
            >
              ¡Solicitud Registrada con Éxito!
            </h2>
            <p className="text-gray-600 max-w-md text-sm md:text-base">
              Su solicitud de evaluación ética ha sido enviada al Comité de Ética para la Investigación (UNTELS).
            </p>
          </div>
        )}
      </div>

      {/* 3. Botonera exterior Cancelar / Continuar */}
      <WizardActionButtons
        onCancel={handleCancel}
        onContinue={handleContinue}
        continueText={getContinueLabel()}
      />
    </div>
  );
}
