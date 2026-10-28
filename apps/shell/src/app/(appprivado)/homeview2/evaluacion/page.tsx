import React from "react";
import type { Metadata } from "next";
import { Header, Footer, Sidebar2 } from "@/componentforlayout";

export const metadata: Metadata = {
  title: "Evaluación de Proyectos — Datos Generales | UNTELS",
  description: "Microfrontend Angular de evaluación ética de proyectos",
};

interface EvaluacionPageProps {
  searchParams: Promise<{ token?: string; id?: string }>;
}

import { EvaluacionIframeContainer } from "@/features/evaluacion/componentes/EvaluacionIframeContainer";

export default async function EvaluacionPage({ searchParams }: EvaluacionPageProps) {
  const params = await searchParams;
  const token = params?.token || "";
  const id = params?.id || "";

  const queryParams = new URLSearchParams();
  if (token) queryParams.set("token", token);
  if (id) queryParams.set("expedienteId", id);

  const queryString = queryParams.toString();
  const iframeSrc = queryString
    ? `http://localhost:4202?${queryString}`
    : "http://localhost:4202";

  return (
    <div className="layout-shell mall">
      {/* 1. Header oficial con logo UNTELS */}
      <Header
        title="ANEXO N°9"
        subtitle="Comité de Ética para la Investigación · UNTELS"
        logoSrc="/images/untels-logo.png"
        className="banda"
      />

      {/* 2. Cuerpo: Sidebar2 de evaluación + Contenedor de evaluación */}
      <div className="layout-body escenario">
        <Sidebar2 defaultCollapsed={false} activeId="evaluacion-proyectos" />

        <main className="layout-content w-full !items-stretch !justify-start !p-0 !overflow-hidden">
          <div className="w-full h-full flex-1 flex flex-col items-stretch overflow-hidden">
            {/* Contenedor Microfrontend Angular con escucha de eventos de cancelación */}
            <EvaluacionIframeContainer iframeSrc={iframeSrc} />
          </div>
        </main>
      </div>

      {/* 3. Footer institucional */}
      <Footer text="Todos los derechos reservados" className="banda banda-bottom" />
    </div>
  );
}
