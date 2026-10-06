import React from "react";
import type { Metadata } from "next";
import { Header, Footer, Sidebar2 } from "@/componentforlayout";

export const metadata: Metadata = {
  title: "Evaluación de Proyectos — Datos Generales | UNTELS",
  description: "Microfrontend Angular de evaluación ética de proyectos",
};

export default function EvaluacionPage() {
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

        <main className="layout-content w-full !items-stretch !justify-start p-1 md:p-2">
          <div className="w-full h-full flex flex-col items-stretch">
            {/* Contenedor Microfrontend Angular (puerto 4202 o MFE montado) */}
            <iframe
              src="http://localhost:4202"
              title="Microfrontend de Evaluación Angular"
              className="w-full h-full border-none bg-transparent"
              style={{ minHeight: "calc(100vh - 140px)", width: "100%", display: "block" }}
            />
          </div>
        </main>
      </div>

      {/* 3. Footer institucional */}
      <Footer text="Todos los derechos reservados" className="banda banda-bottom" />
    </div>
  );
}
