import React from "react";
import type { Metadata } from "next";
import { Header, Footer, Sidebar } from "@/componentforlayout";

import { SolicitudWizard } from "@/features/solicitudes";

export const metadata: Metadata = {
  title: "Solicitudes",
};

export default function SolicitudesPage() {
  return (
    <div className="layout-shell mall">
      {/* 1. Header con logo oficial UNTELS */}
      <Header
        title="ANEXO N°9"
        subtitle="Comité de Ética para la Investigación · UNTELS"
        logoSrc="/images/untels-logo.png"
        className="banda"
      />

      {/* 2. Cuerpo: Sidebar interactivo + Contenido central */}
      <div className="layout-body escenario">
        <Sidebar defaultCollapsed={true} />

        <main className="layout-content w-full items-center justify-start p-4 md:p-6">
          <SolicitudWizard />
        </main>

      </div>

      {/* 3. Footer institucional */}
      <Footer text="Todos los derechos reservados" className="banda banda-bottom" />
    </div>
  );
}

