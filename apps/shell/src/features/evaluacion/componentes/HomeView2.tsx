"use client";

import React from "react";
import { AzureTable } from "./AzureTable";

interface HomeView2Props {
  className?: string;
  isPresidente?: boolean;
}

/**
 * HomeView2 — Vista principal del entorno de Evaluación de Proyectos.
 * Integra la tabla de solicitudes a firmar con formato Azure Portal.
 */
export function HomeView2({ className = "", isPresidente }: HomeView2Props) {
  return (
    <section className={`w-full py-4 md:py-8 px-4 flex flex-col items-center ${className}`}>
      <AzureTable isPresidente={isPresidente} />
    </section>
  );
}
