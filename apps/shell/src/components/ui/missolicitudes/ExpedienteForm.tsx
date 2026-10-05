"use client";

import React, { useState } from "react";
import { ExpedienteFormData } from "./types";
import { DragDocument } from "@/componentforlayout";

interface ExpedienteFormProps {
  initialData?: Partial<ExpedienteFormData>;
  onChange?: (data: ExpedienteFormData) => void;
  className?: string;
}

export function ExpedienteForm({
  initialData,
  onChange,
  className = "",
}: ExpedienteFormProps) {
  const [formData, setFormData] = useState<ExpedienteFormData>({
    naturalezaProyecto: initialData?.naturalezaProyecto || "",
    participantes: initialData?.participantes || [],
    modalidad: initialData?.modalidad || "",
    planProyecto: initialData?.planProyecto || "",
    codigo: initialData?.codigo || "",
    expedienteUid: initialData?.expedienteUid || "EXP-2026-001",
  });

  const updateField = <K extends keyof ExpedienteFormData>(
    field: K,
    value: ExpedienteFormData[K]
  ) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange?.(updated);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Encabezado: Título a la izquierda + Expediente UID a la derecha */}
      <div className="flex items-center justify-between mt-5 mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold text-black"
          style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
        >
          Crear expediente
        </h2>
        <div className="flex items-center gap-2">
          <span
            className="text-sm md:text-base font-semibold text-gray-700"
            style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
          >
            Expediente UID
          </span>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-mono font-bold text-black border border-gray-300">
            {formData.expedienteUid}
          </span>
        </div>
      </div>

      {/* Formulario en estructura de 2 columnas / cuadrícula */}
      <div className="flex flex-col gap-3.5">
        {/* 1. Naturaleza del Proyecto (Drag & Drop / Carga de Documento) */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 md:gap-6">
          <label
            htmlFor="naturaleza-proyecto"
            className="md:col-span-5 text-base md:text-lg font-medium text-black"
            style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
          >
            Naturaleza del Proyecto
          </label>
          <div className="md:col-span-7">
            <DragDocument
              id="naturaleza-proyecto"
              value={formData.naturalezaProyecto}
              onChange={(_, fileName) => updateField("naturalezaProyecto", fileName)}
              placeholder="Ej. Investigación Básica / Aplicada / Desarrollo Tecnológico"
            />
          </div>
        </div>

        {/* 2. Participantes (Drag & Drop / Carga de Documento) */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 md:gap-6">
          <label
            htmlFor="participantes"
            className="md:col-span-5 text-base md:text-lg font-medium text-black"
            style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
          >
            Participantes
          </label>
          <div className="md:col-span-7">
            <DragDocument
              id="participantes"
              value={formData.participantes?.[0] || ""}
              onChange={(_, fileName) =>
                updateField("participantes", fileName ? [fileName] : [])
              }
              placeholder="Nombre del participante o colaborador"
            />
          </div>
        </div>

        {/* 3. Modalidad (Drag & Drop / Carga de Documento) */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 md:gap-6">
          <label
            htmlFor="modalidad"
            className="md:col-span-5 text-base md:text-lg font-medium text-black"
            style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
          >
            Modalidad
          </label>
          <div className="md:col-span-7">
            <DragDocument
              id="modalidad"
              value={formData.modalidad}
              onChange={(_, fileName) => updateField("modalidad", fileName)}
              placeholder="Ej. Docente / Tesis de Grado / Proyecto Semillero"
            />
          </div>
        </div>

        {/* 4. Plan de Proyecto (Drag & Drop / Carga de Documento) */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 md:gap-6">
          <label
            htmlFor="plan-proyecto"
            className="md:col-span-5 text-base md:text-lg font-medium text-black"
            style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
          >
            Plan de Proyecto
          </label>
          <div className="md:col-span-7">
            <DragDocument
              id="plan-proyecto"
              value={formData.planProyecto}
              onChange={(_, fileName) => updateField("planProyecto", fileName)}
              placeholder="Plan de Proyecto...."
            />
          </div>
        </div>

        {/* 5. Escribe el codigo (Input de texto de código) */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 md:gap-6">
          <label
            htmlFor="codigo-proyecto"
            className="md:col-span-5 text-base md:text-lg font-medium text-black"
            style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
          >
            Escribe el codigo
          </label>
          <div className="md:col-span-7">
            <input
              id="codigo-proyecto"
              type="text"
              value={formData.codigo}
              onChange={(e) => updateField("codigo", e.target.value)}
              placeholder="Ingrese el código del expediente (ej. EXP-092)"
              className="w-full h-11 px-4 rounded-2xl border-2 border-black/80 bg-white text-black outline-none transition-all focus:border-black focus:ring-1 focus:ring-black text-sm md:text-base"
              style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
