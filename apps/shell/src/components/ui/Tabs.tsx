"use client";

import React from "react";

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs?: TabItem[];
  activeId?: string;
  onTabChange?: (id: string) => void;
  className?: string;
}

const DEFAULT_TABS: TabItem[] = [
  { id: "login", label: "Iniciar sesión" },
  { id: "register", label: "¿eres nuevo?" },
];

export function Tabs({
  tabs = DEFAULT_TABS,
  activeId = "login",
  onTabChange,
  className = "",
}: TabsProps) {
  // ⏳ PENDIENTE: navegación o alternancia entre flujo de inicio y registro
  const handleClick = (id: string) => {
    if (onTabChange) {
      onTabChange(id);
    }
  };

  return (
    <nav className={`ui-tabs ${className}`} role="tablist" aria-label="Opciones de acceso">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`ui-tab ${isActive ? "ui-tab--active" : ""}`}
            onClick={() => handleClick(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
