"use client";

import React, { useState } from "react";
import { Tabs, PillButton } from "@/components/ui";
import { AccountCard } from "./AccountCard";

interface AccountStepProps {
  onNext: () => void;
  onSwitchToRegister?: () => void;
}

export function AccountStep({ onNext, onSwitchToRegister }: AccountStepProps) {
  const [activeTab, setActiveTab] = useState("login");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pasa al segundo paso de ingreso de credenciales
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full relative">
      {/* Selector de pestañas: Iniciar sesión / ¿eres nuevo? */}
      <Tabs
        activeId={activeTab}
        onTabChange={(tabId) => {
          if (tabId === "register" && onSwitchToRegister) {
            onSwitchToRegister();
          } else {
            setActiveTab(tabId);
          }
        }}
      />

      {/* Tarjeta de cuenta */}
      <div className="relative w-full">
        <AccountCard title="Usuario" />
      </div>

      {/* Botón principal tipo píldora -> lleva a la pantalla de credenciales */}
      <PillButton type="submit">
        Iniciar sesion
      </PillButton>
    </form>
  );
}
