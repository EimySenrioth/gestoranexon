"use client";

import React, { useState } from "react";
import { DatosGeneralesFormData, ExpedienteFormData } from "./types";

interface RevisarSolicitudProps {
  datosGenerales: DatosGeneralesFormData;
  expediente: ExpedienteFormData;
  className?: string;
}

interface ReviewRow {
  label: string;
  value: string;
  category: "proyecto" | "expediente";
}

export function RevisarSolicitud({
  datosGenerales,
  expediente,
  className = "",
}: RevisarSolicitudProps) {
  const [selectedKey, setSelectedKey] = useState<string>("titulo");

  const fields: { key: string; label: string; value: string }[] = [
    {
      key: "titulo",
      label: "Título del Proyecto",
      value: datosGenerales.titulo || "Sin especificar",
    },
    {
      key: "investigadores",
      label: "Investigador(es) Responsable(s)",
      value:
        datosGenerales.investigadores.filter((i) => i.trim().length > 0).length > 0
          ? datosGenerales.investigadores.filter((i) => i.trim().length > 0).join(", ")
          : "Sin especificar",
    },
    {
      key: "unidad",
      label: "Unidad Académica / Facultad",
      value: datosGenerales.unidadAcademica || "NA",
    },
    {
      key: "fecha",
      label: "Fecha de Presentación",
      value: datosGenerales.fechaPresentacion || "Sin especificar",
    },
    {
      key: "financiamiento",
      label: "Financiamiento",
      value:
        datosGenerales.financiamiento === "Externo" && datosGenerales.financiamientoDetalle
          ? `Externo (${datosGenerales.financiamientoDetalle})`
          : datosGenerales.financiamiento || "Sin especificar",
    },
    {
      key: "naturaleza",
      label: "Naturaleza del Proyecto",
      value: expediente.naturalezaProyecto || "Sin especificar",
    },
    {
      key: "participantes",
      label: "Participantes",
      value:
        expediente.participantes.length > 0
          ? expediente.participantes.join(", ")
          : "Sin participantes",
    },
    {
      key: "modalidad",
      label: "Modalidad",
      value: expediente.modalidad || "Sin especificar",
    },
    {
      key: "plan",
      label: "Plan de Proyecto",
      value: expediente.planProyecto || "Sin especificar",
    },
    {
      key: "codigo",
      label: "Escribe el codigo",
      value: expediente.codigo || expediente.expedienteUid || "Sin código",
    },
  ];

  return (
    <div className={`w-full ${className}`}>
      {/* Título de sección */}
      <h2
        className="text-2xl md:text-3xl font-bold text-black mt-5 mb-4"
        style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
      >
        Revisa tu solicitud y expediente
      </h2>

      {/* Contenedor con la lista de campos */}
      <div className="w-full">
        <div className="lista px-0">

          {fields.map((item) => {
            const isSelected = selectedKey === item.key;
            return (
              <div
                key={item.key}
                onClick={() => setSelectedKey(item.key)}
                className="campo cursor-pointer transition-all hover:border-white/40"
              >
                {/* Texto a la izquierda */}
                <span className="campo__label">{item.label}</span>

                {/* Polígono / Tecla con extremos en punta (clip-path hexagonal) */}
                <span className={`tecla ${isSelected ? "tecla--activa" : ""}`}>
                  <span title={item.value}>{item.value}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
