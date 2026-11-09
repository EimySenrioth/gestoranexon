import React from "react";
import type { Metadata } from "next";
import { Header, Footer, Sidebar3 } from "@/componentforlayout";
import { GestionUsuarios } from "@/features/gestion-usuarios";

export const metadata: Metadata = {
  title: "Gestión de Usuarios | Administrador",
  description: "Directorio de usuarios y administración de credenciales - UNTELS",
};

export default function HomeView3Page() {
  return (
    <div className="layout-shell mall">
      {/* 1. Header oficial con logo UNTELS */}
      <Header
        title="ADMINISTRACIÓN"
        subtitle="Comité de Ética para la Investigación · UNTELS"
        logoSrc="/images/untels-logo.png"
        className="banda"
      />

      {/* 2. Cuerpo: Sidebar3 de administración + Contenido central con la feature GestionUsuarios */}
      <div className="layout-body escenario">
        <Sidebar3 defaultCollapsed={false} activeId="gestion-usuarios" />

        <main className="layout-content w-full items-center justify-start p-4 md:p-8">
          <GestionUsuarios />
        </main>
      </div>

      {/* 3. Footer institucional */}
      <Footer text="Todos los derechos reservados" className="banda banda-bottom" />
    </div>
  );
}

