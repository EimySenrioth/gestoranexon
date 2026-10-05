import { redirect } from "next/navigation";

export default function RootPage() {
  // ⏳ PENDIENTE: con sesión activa redirigir a /inicio; sin sesión redirigir a /login
  redirect("/login");
}
