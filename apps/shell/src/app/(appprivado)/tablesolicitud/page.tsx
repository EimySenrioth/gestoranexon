import React from "react";
import type { Metadata } from "next";
import { Header, Footer, Sidebar } from "@/componentforlayout";
import { TableSolicitud } from "@/components/ui/tablesolicitud";

export const metadata: Metadata = {
  title: "Tabla de Solicitudes | ANEXO N°9",
  description: "Monitoreo de estado y progreso de solicitudes de evaluación ética - UNTELS",
};

export default function TableSolicitudPage() {
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
        <Sidebar defaultCollapsed={true} activeId="mis-solicitudes" />

        <main className="layout-content w-full items-center justify-start p-4 md:p-8">
          <TableSolicitud />
        </main>
      </div>

      {/* 3. Footer institucional */}
      <Footer text="Todos los derechos reservados" className="banda banda-bottom" />
    </div>
  );
}
