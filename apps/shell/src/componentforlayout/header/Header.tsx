import React from "react";
import Image from "next/image";

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  logoSrc?: string;
  hasNotifications?: boolean;
  onNotificationClick?: () => void;
  onAvatarClick?: () => void;
  className?: string;
}

export function Header({
  title = "ANEXO N°9",
  subtitle = "Comité de Ética para la Investigación · UNTELS",
  logoSrc = "/images/untels-logo.png",
  hasNotifications = false,
  onNotificationClick,
  onAvatarClick,
  className = "",
}: HeaderProps) {
  return (
    <header className={`layout-header ${className}`}>
      {/* Sección Izquierda: Logo y Títulos */}
      <div className="layout-header-left">
        <div className="layout-header-logo-container">
          <Image
            src={logoSrc}
            alt="Logo UNTELS"
            width={60}
            height={60}
            className="layout-header-logo"
            priority
          />
        </div>
        <div className="layout-header-titles">
          <h1 className="layout-header-title">{title}</h1>
          <p className="layout-header-subtitle">{subtitle}</p>
        </div>
      </div>

      {/* Sección Derecha: Campana de Notificación y Avatar */}
      <div className="layout-header-right">
        <button
          type="button"
          className="layout-header-bell-btn"
          aria-label="Notificaciones"
          onClick={onNotificationClick}
        >
          {/* Icono de Campana elegante */}
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {hasNotifications && <span className="layout-header-bell-badge" />}
        </button>

        {/* Avatar de Usuario */}
        <div
          className="layout-header-avatar-container"
          onClick={onAvatarClick}
          role="button"
          tabIndex={0}
          aria-label="Perfil de usuario"
        >
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="#757575"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>
    </header>
  );
}
