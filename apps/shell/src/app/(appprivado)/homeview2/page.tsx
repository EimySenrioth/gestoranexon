import React from "react";
import type { Metadata } from "next";
import { Header, Footer, Sidebar2 } from "@/componentforlayout";
import { HomeView2 } from "@/components/ui";

export const metadata: Metadata = {
  title: "Evaluación de Proyectos | ANEXO N°9",
  description: "Tabla de solicitudes a firmar para evaluación ética - UNTELS",
};

export default function HomeView2Page() {
  return (
    <div className="layout-shell mall">
      {/* 1. Header oficial con logo UNTELS */}
      <Header
        title="ANEXO N°9"
        subtitle="Comité de Ética para la Investigación · UNTELS"
        logoSrc="/images/untels-logo.png"
        className="banda"
      />

      {/* 2. Cuerpo: Nuevo Sidebar2 de evaluación + Contenido central con tabla Azure */}
      <div className="layout-body escenario">
        <Sidebar2 defaultCollapsed={false} activeId="evaluacion-proyectos" />

        <main className="layout-content w-full items-center justify-start p-4 md:p-8">
          <HomeView2 />
        </main>
      </div>

      {/* 3. Footer institucional */}
      <Footer text="Todos los derechos reservados" className="banda banda-bottom" />
    </div>
  );
}
