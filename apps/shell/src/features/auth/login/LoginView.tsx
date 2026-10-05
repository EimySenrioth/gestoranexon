"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui";
import { AccountStep } from "./components/AccountStep";
import { CredentialsStep } from "./components/CredentialsStep";
import { LoginBackground } from "./LoginBackground";
import { DevShortcut } from "./DevShortcut";
import "./login.css";

export function LoginView() {
  const [step, setStep] = useState<"account" | "credentials">("account");

  return (
    <main className="login-layout">
      <LoginBackground />

      <div className="login-container">
        {step === "account" ? (
          <Dialog showClose={false}>
            <AccountStep onNext={() => setStep("credentials")} />
          </Dialog>
        ) : (
          <Dialog
            onClose={() => setStep("account")}
            closeLabel="Volver a la selección de cuenta"
          >
            <CredentialsStep />
          </Dialog>
        )}

        {/* Acceso a tokens en modo desarrollo */}
        <DevShortcut />
      </div>
    </main>
  );
}
