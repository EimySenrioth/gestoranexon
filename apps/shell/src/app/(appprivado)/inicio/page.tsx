import React from "react";
import type { Metadata } from "next";
import { Header, Footer, Sidebar } from "@/componentforlayout";
import { CreateRequestButton } from "@/components/ui";

export const metadata: Metadata = {
  title: "Inicio | Anexo N°9",
  description: "Portal del Comité de Ética para la Investigación - UNTELS",
};

export default function InicioPage() {
  return (
    <div className="layout-shell mall">
      {/* 1. Header con logo oficial UNTELS */}
      <Header
        title="ANEXO N°9"
        subtitle="Comité de Ética para la Investigación · UNTELS"
        logoSrc="/images/untels-logo.png"
        className="banda"
      />

      {/* 2. Cuerpo: Sidebar interactivo (expandido o dock) + Contenido central */}
      <div className="layout-body escenario">
        <Sidebar defaultCollapsed={false} />

        <main className="layout-content">
          <div className="empty-state-card">
            {/* Ilustración de sobre con signo de interrogación fiel al mockup */}
            <div className="empty-state-illustration" aria-hidden="true">
              <svg
                width="160"
                height="160"
                viewBox="0 0 160 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Solapa trasera del sobre */}
                <path
                  d="M32 64L80 32L128 64V122H32V64Z"
                  fill="#E5BA5A"
                  stroke="#121212"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />

                {/* Hoja de papel blanca saliendo del sobre */}
                <rect
                  x="46"
                  y="26"
                  width="68"
                  height="68"
                  rx="6"
                  fill="#FFFFFF"
                  stroke="#121212"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />

                {/* Signo de interrogación en el papel */}
                <path
                  d="M74.5 48.5C74.5 45.4 77 43 80 43C83 43 85.5 45.4 85.5 48.5C85.5 51.5 83.5 53 81.5 54.5C80 55.6 79 57 79 59.5V60.5"
                  stroke="#121212"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                <circle cx="79.5" cy="67.5" r="2.5" fill="#121212" />

                {/* Cuerpo principal del sobre (frente) */}
                <path
                  d="M28 66L80 102L132 66V124C132 127 129 130 126 130H34C31 130 28 127 28 124V66Z"
                  fill="#F4CF74"
                  stroke="#121212"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />

                {/* Líneas laterales del sobre */}
                <path
                  d="M28 128L68 93"
                  stroke="#121212"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M132 128L92 93"
                  stroke="#121212"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Botón / ranura horizontal decorativa inferior del sobre */}
                <rect
                  x="110"
                  y="114"
                  width="14"
                  height="7"
                  rx="3.5"
                  fill="#FFFFFF"
                  stroke="#121212"
                  strokeWidth="3.5"
                />
              </svg>
            </div>

            {/* Botón de acción 'Crear Solicitud' */}
            <CreateRequestButton href="/solicitudes" />
          </div>
        </main>
      </div>

      {/* 3. Footer institucional */}
      <Footer text="Todos los derechos reservados" className="banda banda-bottom" />
    </div>
  );
}
