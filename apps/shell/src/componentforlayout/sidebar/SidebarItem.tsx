"use client";

import React from "react";
import Link from "next/link";

export interface SidebarItemData {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number | boolean;
  isActive?: boolean;
}

interface SidebarItemProps {
  item: SidebarItemData;
  isCollapsed: boolean;
  onClick?: () => void;
}

export function SidebarItem({ item, isCollapsed, onClick }: SidebarItemProps) {
  const isNavigable = !!item.href && item.href !== "#" && !item.href.startsWith("#");

  if (isCollapsed) {
    if (isNavigable) {
      return (
        <Link
          href={item.href!}
          className={`layout-sidebar-dock-btn ${item.isActive ? "active" : ""}`}
          onClick={onClick}
          title={item.label}
          aria-label={item.label}
        >
          {item.icon}
          {item.badge && (
            <span className="layout-sidebar-dock-badge">
              {typeof item.badge === "boolean" ? "!" : item.badge}
            </span>
          )}
        </Link>
      );
    }

    return (
      <button
        type="button"
        className={`layout-sidebar-dock-btn ${item.isActive ? "active" : ""}`}
        onClick={onClick}
        title={item.label}
        aria-label={item.label}
      >
        {item.icon}
        {item.badge && (
          <span className="layout-sidebar-dock-badge">
            {typeof item.badge === "boolean" ? "!" : item.badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <li className="layout-sidebar-item">
      {isNavigable ? (
        <Link
          href={item.href!}
          className={`layout-sidebar-link ${item.isActive ? "active" : ""}`}
          onClick={onClick}
        >
          <div className="layout-sidebar-link-content">
            {item.icon && (
              <span className="layout-sidebar-link-icon" aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
          </div>
          {item.badge && (
            <span className="layout-sidebar-link-badge">
              {typeof item.badge === "boolean" ? "!" : item.badge}
            </span>
          )}
        </Link>
      ) : (
        <div
          className={`layout-sidebar-link ${item.isActive ? "active" : ""}`}
          onClick={onClick}
          role="button"
          tabIndex={0}
        >
          <div className="layout-sidebar-link-content">
            {item.icon && (
              <span className="layout-sidebar-link-icon" aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
          </div>
          {item.badge && (
            <span className="layout-sidebar-link-badge">
              {typeof item.badge === "boolean" ? "!" : item.badge}
            </span>
          )}
        </div>
      )}
    </li>
  );
}
