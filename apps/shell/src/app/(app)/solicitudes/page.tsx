import type { Metadata } from "next";
import { ModuleShell } from "@/navigation";

export const metadata: Metadata = {
  title: "Solicitudes",
};

// ⏳ PENDIENTE: módulo de solicitudes (RF-001 / RF-012) - conexión a backend GET/POST /solicitudes
export default function SolicitudesPage() {
  return (
    <ModuleShell title="Mis Solicitudes">
      <div className="p-4 bg-white rounded shadow-sm text-gray-700">
        <p className="font-semibold text-lg mb-2">Gestión de Solicitudes</p>
        <p className="text-sm text-gray-500">
          ⏳ PENDIENTE: tabla de solicitudes, filtro de estados y formulario de nueva solicitud.
        </p>
      </div>
    </ModuleShell>
  );
}
