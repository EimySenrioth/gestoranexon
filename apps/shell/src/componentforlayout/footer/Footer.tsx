import React from "react";

export interface FooterProps {
  text?: string;
  className?: string;
}

export function Footer({ text = "Todos los derechos reservados", className = "" }: FooterProps) {
  return (
    <footer className={`layout-footer ${className}`}>
      <p className="layout-footer-text">
        <span className="layout-footer-copy-icon">©</span>
        <span>{text}</span>
      </p>
    </footer>
  );
}
