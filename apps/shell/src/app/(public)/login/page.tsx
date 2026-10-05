import type { Metadata } from "next";
import { LoginView } from "@/features/auth/login";

export const metadata: Metadata = {
  title: "Iniciar sesión | Estancia Perú",
  description: "Acceso al sistema Estancia Perú",
};

export default function LoginPage() {
  return <LoginView />;
}
