import type { Metadata } from "next";
import { ModuleShell } from "@/navigation";

export const metadata: Metadata = {
  title: "Inicio",
};

// ⏳ PENDIENTE: vista home del solicitante con accesos rápidos y estado general
export default function InicioPage() {
  return (
    <ModuleShell title="Inicio">
      <div className="p-4 bg-white rounded shadow-sm text-gray-700">
        <p className="font-semibold text-lg mb-2">Bienvenido al portal del solicitante</p>
        <p className="text-sm text-gray-500">
          ⏳ PENDIENTE: integración con resumen de trámites y expedientes desde el backend.
        </p>
      </div>
    </ModuleShell>
  );
}
