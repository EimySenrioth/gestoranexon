import React from "react";
import type { Metadata } from "next";
import { Header, Footer, Sidebar2 } from "@/componentforlayout";
import { StatusExpediente } from "@/components/ui/homeview2";

export const metadata: Metadata = {
  title: "Estado del Expediente | UNTELS",
  description: "Detalle del expediente y documentos para evaluadoras",
};

export default function StatusExpedientePage() {
  return (
    <div className="layout-shell mall">
      {/* 1. Header oficial con logo UNTELS */}
      <Header
        title="ANEXO N°9"
        subtitle="Comité de Ética para la Investigación · UNTELS"
        logoSrc="/images/untels-logo.png"
        className="banda"
      />

      {/* 2. Cuerpo: Sidebar2 de evaluación + Vista de estado del expediente */}
      <div className="layout-body escenario">
        <Sidebar2 defaultCollapsed={false} activeId="evaluacion-proyectos" />

        <main className="layout-content w-full items-start justify-start p-4 md:p-6 overflow-y-auto">
          <StatusExpediente />
        </main>
      </div>

      {/* 3. Footer institucional */}
      <Footer text="Todos los derechos reservados" className="banda banda-bottom" />
    </div>
  );
}
