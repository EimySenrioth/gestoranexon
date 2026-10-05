import React from "react";
import Link from "next/link";

// ⏳ PENDIENTE: vista de acceso restringido / no autorizado (403)
export function ForbiddenView() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <h2 className="text-xl font-bold mb-2">Acceso restringido</h2>
      <p className="text-sm text-gray-500 mb-4">No tienes permisos para visualizar este módulo.</p>
      <Link href="/inicio" className="text-blue-500 hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}
