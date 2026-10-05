import React from "react";
import { AppMenu } from "@/navigation";

// ⏳ PENDIENTE: guard de sesión con backend / validación en proxy.ts
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppMenu />
      <main className="flex-1">{children}</main>
    </div>
  );
}
