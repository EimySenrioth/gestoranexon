"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SidebarItem, SidebarItemData } from "./SidebarItem";
import { GripDots } from "./Sidebar";
import { useSession } from "@/navigation/session/useSession";

export interface Sidebar2Props {
  items?: SidebarItemData[];
  defaultCollapsed?: boolean;
  activeId?: string;
  onItemSelect?: (id: string) => void;
}

/**
 * Sidebar2 — Menú lateral para el entorno de Evaluación de Proyectos.
 * Utiliza exactamente el mismo diseño visual, dock colapsable y grip dots que el Sidebar original.
 */
export function Sidebar2({
  items,
  defaultCollapsed,
  activeId: controlledActiveId,
  onItemSelect,
}: Sidebar2Props) {
  const pathname = usePathname();
  const isNotHome2 = pathname !== "/homeview2";
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed ?? isNotHome2);
  const [internalActiveId, setInternalActiveId] = useState<string>("evaluacion-proyectos");
  const { logout } = useSession();

  useEffect(() => {
    if (pathname !== "/homeview2") {
      setIsCollapsed(true);
    }
  }, [pathname]);

  const currentActiveId = controlledActiveId ?? internalActiveId;

  // Única opción del Sidebar 2: Evaluación de Proyectos
  const defaultItems: SidebarItemData[] = [
    {
      id: "evaluacion-proyectos",
      label: "Evaluación de Proyectos",
      href: "/homeview2",
      icon: (
        // Icono de documento con firma / verificación ética
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
          <path d="M16 13l-4 4-2-2" />
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
    <aside className="layout-sidebar-container" aria-label="Menú de evaluación">
      {isCollapsed ? (
        /* MODO COLAPSADO: Dock píldora oscura */
        <div
          className="layout-sidebar-collapsed"
          onClick={toggleCollapsed}
          title="Haz clic para expandir el menú"
        >
          <GripDots variant="light" />

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

            {/* Separador y botón de Log Out en dock */}
            <div className="layout-sidebar-dock-divider" />
            <button
              type="button"
              className="layout-sidebar-dock-btn layout-sidebar-dock-logout"
              onClick={logout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>

          <GripDots variant="light" />
        </div>
      ) : (
        /* MODO EXPANDIDO: Panel blanco con iconos y texto */
        <div className="layout-sidebar-expanded">
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

              <GripDots variant="black" />

              <span className="layout-sidebar-toggle-spacer" aria-hidden="true" />
            </button>
          </div>

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

          {/* Sección de cierre de sesión en modo expandido */}
          <div className="layout-sidebar-account-section">
            <button
              type="button"
              className="layout-sidebar-logout-action"
              onClick={logout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <span className="layout-sidebar-logout-icon" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              <span className="layout-sidebar-logout-text">Cerrar sesión</span>
            </button>
          </div>

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
