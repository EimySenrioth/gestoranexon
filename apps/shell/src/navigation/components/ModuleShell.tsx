import React from "react";

interface ModuleShellProps {
  title?: string;
  children: React.ReactNode;
}

// ⏳ PENDIENTE: marco común de módulo (título, pestañas, botón de cerrar o regresar)
export function ModuleShell({ title, children }: ModuleShellProps) {
  return (
    <div className="w-full p-6">
      {title && <h1 className="text-2xl font-bold mb-4">{title}</h1>}
      {children}
    </div>
  );
}
