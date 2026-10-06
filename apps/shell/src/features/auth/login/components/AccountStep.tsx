"use client";

import React, { useState } from "react";
import { Tabs, AccountCard, PillButton } from "@/components/ui";

interface AccountStepProps {
  onNext: () => void;
}

export function AccountStep({ onNext }: AccountStepProps) {
  const [activeTab, setActiveTab] = useState("login");
  const [selectedRole, setSelectedRole] = useState<"solicitante" | "evaluacion">("solicitante");
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pasa al segundo paso de ingreso de credenciales
    onNext();
  };

  const handleSelectRole = (role: "solicitante" | "evaluacion") => {
    setSelectedRole(role);
    setShowRoleSelector(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full relative">
      {/* Selector de pestañas: Iniciar sesión / ¿eres nuevo? */}
      <Tabs
        activeId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
      />

      {/* Tarjeta de cuenta: Muestra el perfil actual y permite alternar a 'Evaluación de Proyectos' */}
      <div className="relative w-full">
        <AccountCard
          title={selectedRole === "evaluacion" ? "Comité Evaluador" : "Usuario"}
          subtitle={selectedRole === "evaluacion" ? "Evaluación de Proyectos" : "Rol: Solicitante"}
          onClick={() => setShowRoleSelector((prev) => !prev)}
        />

        {/* Desplegable de roles */}
        {showRoleSelector && (
          <div
            className="absolute top-full left-0 mt-1.5 w-full bg-white border border-gray-300 rounded-xl shadow-lg z-50 overflow-hidden text-sm"
            style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
          >
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
              Seleccionar perfil de acceso
            </div>
            <button
              type="button"
              className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-gray-100 transition-colors ${
                selectedRole === "solicitante" ? "bg-gray-50 font-semibold text-black" : "text-gray-700"
              }`}
              onClick={() => handleSelectRole("solicitante")}
            >
              <div className="flex flex-col">
                <span>Usuario</span>
                <span className="text-xs text-gray-500">Solicitante general</span>
              </div>
              {selectedRole === "solicitante" && (
                <span className="text-blue-600 font-bold">✓</span>
              )}
            </button>
            <button
              type="button"
              className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-blue-50 transition-colors border-t border-gray-100 ${
                selectedRole === "evaluacion" ? "bg-blue-50 font-semibold text-blue-900" : "text-gray-700"
              }`}
              onClick={() => handleSelectRole("evaluacion")}
            >
              <div className="flex flex-col">
                <span className="font-semibold text-blue-900">Evaluación de Proyectos</span>
                <span className="text-xs text-gray-500">Miembro del Comité de Ética</span>
              </div>
              {selectedRole === "evaluacion" && (
                <span className="text-blue-600 font-bold">✓</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Botón principal tipo píldora -> lleva a la pantalla de credenciales */}
      <PillButton type="submit">
        Iniciar sesion
      </PillButton>
    </form>
  );
}
