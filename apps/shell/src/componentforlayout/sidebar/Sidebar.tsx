"use client";

import React, { useState } from "react";
import { SidebarItem, SidebarItemData } from "./SidebarItem";

export interface SidebarProps {
  items?: SidebarItemData[];
  defaultCollapsed?: boolean;
  activeId?: string;
  onItemSelect?: (id: string) => void;
}

/**
 * Componente reutilizable de los puntos del grip
 * variant="light" (para el dock oscuro) | variant="black" (para el panel expandido blanco)
 */
export function GripDots({ variant = "light" }: { variant?: "light" | "black" }) {
  return (
    <div
      className={`layout-sidebar-grip ${variant === "black" ? "black" : ""}`}
      aria-hidden="true"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={`grip-${variant}-${i}`} className="layout-sidebar-grip-dot" />
      ))}
    </div>
  );
}

export function Sidebar({
  items,
  defaultCollapsed = false,
  activeId: controlledActiveId,
  onItemSelect,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [internalActiveId, setInternalActiveId] = useState<string>("nueva-solicitud");

  const currentActiveId = controlledActiveId ?? internalActiveId;

  // Iconos dedicados de acuerdo al texto que van en ambas fases
  const defaultItems: SidebarItemData[] = [
    {
      id: "nueva-solicitud",
      label: "Nueva Solicitud",
      href: "/inicio",
      icon: (
        // Icono dedicado a 'Nueva Solicitud': Documento con signo '+'
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      id: "mis-solicitudes",
      label: "Mis Solicitudes",
      href: "/solicitudes",
      badge: "!", // Icono de '!' rojo ubicado en 'Mis Solicitudes'
      icon: (
        // Icono dedicado a 'Mis Solicitudes': Portapapeles con listado / gestión
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
          <path d="M9 8h2" />
        </svg>
      ),
    },
    {
      id: "notificaciones",
      label: "Notificaciones",
      href: "#notificaciones",
      icon: (
        // Icono dedicado a 'Notificaciones': Campana con indicador
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          <circle cx="18" cy="4" r="2" fill="currentColor" />
        </svg>
      ),
    },
  ];

  const menuItems = items || defaultItems;

  const handleSelect = (id: string) => {
    setInternalActiveId(id);
    onItemSelect?.(id);
  };

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <aside className="layout-sidebar-container" aria-label="Menú de navegación">
      {isCollapsed ? (
        /* ====================================================
           FASE 2 (MODO COLAPSADO): Dock píldora oscura
           ==================================================== */
        <div
          className="layout-sidebar-collapsed"
          onClick={toggleCollapsed}
          title="Haz clic para expandir el menú"
        >
          {/* Grip superior de puntos */}
          <GripDots variant="light" />

          {/* Lista vertical de iconos dedicados */}
          <div
            className="layout-sidebar-dock-list"
            onClick={(e) => e.stopPropagation()}
          >
            {menuItems.map((item) => (
              <SidebarItem
                key={item.id}
                item={{
                  ...item,
                  isActive: item.id === currentActiveId,
                }}
                isCollapsed={true}
                onClick={() => handleSelect(item.id)}
              />
            ))}
          </div>

          {/* Grip inferior de puntos */}
          <GripDots variant="light" />
        </div>
      ) : (
        /* ====================================================
           FASE 1 (MODO EXPANDIDO): Panel blanco con iconos y texto
           ==================================================== */
        <div className="layout-sidebar-expanded">
          {/* Barra superior: Flecha y puntos alineados al eje central */}
          <div className="layout-sidebar-header">
            <button
              type="button"
              className="layout-sidebar-toggle-group"
              onClick={toggleCollapsed}
              title="Reducir a barra de iconos"
              aria-label="Reducir a barra de iconos"
            >
              <span className="layout-sidebar-toggle-arrows" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="11 17 6 12 11 7" />
                  <polyline points="18 17 13 12 18 7" />
                </svg>
              </span>

              {/* Puntos del grip centrados en el eje 50% */}
              <GripDots variant="black" />

              {/* Contrapeso simétrico para que los puntos queden 100% alineados verticalmente con los de abajo */}
              <span className="layout-sidebar-toggle-spacer" aria-hidden="true" />
            </button>
          </div>

          {/* Lista de enlaces con sus iconos dedicados en color negro y badges */}
          <ul className="layout-sidebar-menu">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.id}
                item={{
                  ...item,
                  isActive: item.id === currentActiveId,
                }}
                isCollapsed={false}
                onClick={() => handleSelect(item.id)}
              />
            ))}
          </ul>

          {/* Grip inferior de puntos alineado exactamente al mismo eje vertical de los de arriba */}
          <div
            className="layout-sidebar-footer"
            onClick={toggleCollapsed}
            role="button"
            tabIndex={0}
            title="Reducir a barra de iconos"
            aria-label="Reducir a barra de iconos"
          >
            <GripDots variant="black" />
          </div>
        </div>
      )}
    </aside>
  );
}
