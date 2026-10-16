"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  WizardStepId,
  DatosGeneralesFormData,
  ExpedienteFormData,
  SolicitudCompletaData,
} from "../types/wizard.types";
import {
  guardarExpediente,
  type ExpedienteResponse,
} from "../services/expedientes.service";

interface UseSolicitudWizardOptions {
  onCancel?: () => void;
  onSubmitSuccess?: (data: SolicitudCompletaData) => void;
}

export function useSolicitudWizard({
  onCancel,
  onSubmitSuccess,
}: UseSolicitudWizardOptions = {}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStepId>("datos-generales");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [expedienteCreado, setExpedienteCreado] =
    useState<ExpedienteResponse | null>(null);

  // Estado del paso 1: Datos Generales
  const [formData, setFormData] = useState<DatosGeneralesFormData>({
    titulo: "",
    investigadores: [],
    unidadAcademica: "NA",
    tipoInvestigacion: "",
    tipoInvestigacionOtro: "",
    financiamiento: "",
    financiamientoDetalle: "",
  });

  // Estado del paso 2: Expediente
  const [expedienteData, setExpedienteData] = useState<ExpedienteFormData>({
    naturalezaProyecto: "",
    participantes: [],
    modalidad: "",
    planProyecto: "",
    codigoSolicitante: "",
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

  const handleContinue = async () => {
    if (currentStep === "datos-generales") {
      setSubmitError(null);
      setCurrentStep("expediente");
    } else if (currentStep === "expediente") {
      setSubmitError(null);
      setCurrentStep("revisar");
    } else if (currentStep === "revisar") {
      try {
        setIsSubmitting(true);
        setSubmitError(null);

        // Envío directo a PostgreSQL a través de nuestro servicio dedicado
        const respuesta = await guardarExpediente({
          datosGenerales: formData,
          expediente: expedienteData,
        });

        setExpedienteCreado(respuesta);
        setCurrentStep("envio");

        onSubmitSuccess?.({
          datosGenerales: formData,
          expediente: {
            ...expedienteData,
            codigo: respuesta.codigo,
            expedienteUid: respuesta.codigoExpediente || respuesta.codigo,
          },
        });
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "No se pudo guardar el expediente en la base de datos PostgreSQL.";
        setSubmitError(errorMsg);
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === "envio") {
      router.push("/inicio");
    }
  };

  const getContinueLabel = () => {
    if (currentStep === "revisar") {
      return isSubmitting ? "Guardando en Base de Datos..." : "Enviar Solicitud";
    }
    if (currentStep === "envio") return "Finalizar";
    return "Continuar";
  };

  return {
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
  };
}
