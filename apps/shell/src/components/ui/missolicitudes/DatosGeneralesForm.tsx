"use client";

import React, { useState } from "react";
import { DatosGeneralesFormData } from "./types";
import {
  IconAgregarInvestigador,
  IconChevronDown,
} from "./WizardIcons";

interface DatosGeneralesFormProps {
  initialData?: Partial<DatosGeneralesFormData>;
  onChange?: (data: DatosGeneralesFormData) => void;
  className?: string;
}

export function DatosGeneralesForm({
  initialData,
  onChange,
  className = "",
}: DatosGeneralesFormProps) {
  const [formData, setFormData] = useState<DatosGeneralesFormData>({
    titulo: initialData?.titulo || "",
    investigadores: initialData?.investigadores || [""],
    unidadAcademica: initialData?.unidadAcademica || "NA",
    fechaPresentacion: initialData?.fechaPresentacion || "",
    financiamiento: initialData?.financiamiento || "",
    financiamientoDetalle: initialData?.financiamientoDetalle || "",
  });

  const [currentInvestigadorInput, setCurrentInvestigadorInput] = useState("");

  const updateField = <K extends keyof DatosGeneralesFormData>(
    field: K,
    value: DatosGeneralesFormData[K]
  ) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange?.(updated);
  };

  const handleAddInvestigador = () => {
    if (!currentInvestigadorInput.trim()) return;
    const updatedList = [
      ...formData.investigadores.filter((inv) => inv.trim().length > 0),
      currentInvestigadorInput.trim(),
    ];
    updateField("investigadores", updatedList);
    setCurrentInvestigadorInput("");
  };

  const handleRemoveInvestigador = (index: number) => {
    const updatedList = formData.investigadores.filter((_, idx) => idx !== index);
    updateField("investigadores", updatedList);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Título de sección */}
      <h2
        className="text-2xl md:text-3xl font-bold text-black mt-5 mb-4"
        style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
      >
        Datos Generales del Proyecto
      </h2>

      {/* Formulario en estructura de 2 columnas / cuadrícula */}
      <div className="flex flex-col gap-3.5">

        {/* 1. Título del Proyecto */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 md:gap-6">
          <label
            htmlFor="titulo-proyecto"
            className="md:col-span-5 text-base md:text-lg font-medium text-black"
            style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
          >
            Título del Proyecto
          </label>
          <div className="md:col-span-7">
            <input
              id="titulo-proyecto"
              type="text"
              value={formData.titulo}
              onChange={(e) => updateField("titulo", e.target.value)}
              placeholder="Ingrese el título del proyecto"
              className="w-full h-12 px-4 rounded-2xl border-2 border-black/80 bg-white text-black outline-none transition-all focus:border-black focus:ring-1 focus:ring-black text-sm md:text-base"
              style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
            />
          </div>
        </div>

        {/* 2. Investigador(es) Responsable(s) */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-start md:items-center gap-2 md:gap-6">
          <label
            htmlFor="investigador-responsable"
            className="md:col-span-5 text-base md:text-lg font-medium text-black"
            style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
          >
            Investigador(es) Responsable(s)
          </label>
          <div className="md:col-span-7 flex flex-col gap-2">
            <div className="relative flex items-center">
              <input
                id="investigador-responsable"
                type="text"
                value={currentInvestigadorInput}
                onChange={(e) => setCurrentInvestigadorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddInvestigador();
                  }
                }}
                placeholder="Nombre del docente o investigador"
                className="w-full h-12 pl-4 pr-12 rounded-2xl border-2 border-black/80 bg-white text-black outline-none transition-all focus:border-black focus:ring-1 focus:ring-black text-sm md:text-base"
                style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
              />
              <button
                type="button"
                onClick={handleAddInvestigador}
                title="Añadir investigador"
                className="absolute right-3 p-1 text-black hover:opacity-75 transition-opacity cursor-pointer"
              >
                <IconAgregarInvestigador size={24} />
              </button>
            </div>

            {/* Chips de investigadores añadidos */}
            {formData.investigadores.filter((i) => i.trim().length > 0).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {formData.investigadores
                  .filter((i) => i.trim().length > 0)
                  .map((inv, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-black border border-gray-400"
                    >
                      {inv}
                      <button
                        type="button"
                        onClick={() => handleRemoveInvestigador(idx)}
                        className="text-gray-500 hover:text-black font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Unidad Académica / Facultad */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 md:gap-6">
          <label
            htmlFor="unidad-academica"
            className="md:col-span-5 text-base md:text-lg font-medium text-black"
            style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
          >
            Unidad Académica / Facultad
          </label>
          <div className="md:col-span-7 relative">
            <select
              id="unidad-academica"
              value={formData.unidadAcademica}
              onChange={(e) => updateField("unidadAcademica", e.target.value)}
              className="w-full h-12 pl-4 pr-10 rounded-2xl border-2 border-black/80 bg-white text-black outline-none appearance-none transition-all focus:border-black focus:ring-1 focus:ring-black text-sm md:text-base cursor-pointer"
              style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
            >
              <option value="NA">NA</option>
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              <IconChevronDown size={20} />
            </div>
          </div>
        </div>

        {/* 4. Fecha de Presentación */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 md:gap-6">
          <label
            htmlFor="fecha-presentacion"
            className="md:col-span-5 text-base md:text-lg font-medium text-black"
            style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
          >
            Fecha de Presentación
          </label>
          <div className="md:col-span-7 flex items-center">
            <input
              id="fecha-presentacion"
              type="date"
              value={formData.fechaPresentacion}
              onChange={(e) => updateField("fechaPresentacion", e.target.value)}
              className="w-full h-12 px-4 rounded-2xl border-2 border-black/80 bg-white text-black outline-none transition-all focus:border-black focus:ring-1 focus:ring-black text-sm md:text-base cursor-pointer"
              style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
            />
          </div>
        </div>

        {/* 5. Financiamiento */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-start md:items-center gap-2 md:gap-6">
          <label
            htmlFor="financiamiento"
            className="md:col-span-5 text-base md:text-lg font-medium text-black"
            style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
          >
            Financiamiento
          </label>
          <div className="md:col-span-7 flex flex-col gap-2">
            <div className="relative">
              <select
                id="financiamiento"
                value={formData.financiamiento}
                onChange={(e) => updateField("financiamiento", e.target.value)}
                className="w-full h-12 pl-4 pr-10 rounded-2xl border-2 border-black/80 bg-white text-black outline-none appearance-none transition-all focus:border-black focus:ring-1 focus:ring-black text-sm md:text-base cursor-pointer"
                style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
              >
                <option value="" disabled hidden>
                  Seleccione tipo de financiamiento...
                </option>
                <option value="Autofinanciado">Autofinanciado</option>

                <option value="UNTELS">UNTELS</option>
                <option value="Externo">Externo</option>
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                <IconChevronDown size={20} />
              </div>
            </div>

            {/* Campo de escritura condicional para Financiamiento Externo */}
            {formData.financiamiento === "Externo" && (
              <input
                type="text"
                value={formData.financiamientoDetalle || ""}
                onChange={(e) => updateField("financiamientoDetalle", e.target.value)}
                placeholder="Especificar fuente o entidad externa..."
                className="w-full h-12 px-4 rounded-2xl border-2 border-black/80 bg-white text-black outline-none transition-all focus:border-black focus:ring-1 focus:ring-black text-sm md:text-base"
                style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
