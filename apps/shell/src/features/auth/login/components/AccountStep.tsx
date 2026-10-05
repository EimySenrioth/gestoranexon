"use client";

import React, { useState } from "react";
import { Tabs, AccountCard, PillButton } from "@/components/ui";

interface AccountStepProps {
  onNext: () => void;
}

export function AccountStep({ onNext }: AccountStepProps) {
  const [activeTab, setActiveTab] = useState("login");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pasa al segundo paso de ingreso de credenciales
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full">
      {/* Selector de pestañas: Iniciar sesión / ¿eres nuevo? */}
      <Tabs
        activeId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
      />

      {/* Tarjeta de cuenta: Logo Google + Usuario + Rol + caret */}
      <AccountCard
        title="Usuario"
        subtitle="Rol"
        onClick={() => {
          // ⏳ PENDIENTE: abrir selector desplegable de perfiles/roles
        }}
      />

      {/* Botón principal tipo píldora -> lleva a la pantalla de credenciales */}
      <PillButton type="submit">
        Iniciar sesion
      </PillButton>
    </form>
  );
}
