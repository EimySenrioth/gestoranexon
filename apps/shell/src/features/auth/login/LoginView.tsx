"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui";
import { AccountStep } from "./components/AccountStep";
import { CredentialsStep } from "./components/CredentialsStep";
import { RegisterStep } from "./components/RegisterStep";
import { LoginBackground } from "./LoginBackground";
import "./login.css";

export function LoginView() {
  const [step, setStep] = useState<"account" | "credentials" | "register">(
    "account"
  );

  return (
    <main className="login-layout">
      <LoginBackground />

      <div className="login-container">
        {step === "account" ? (
          <Dialog showClose={false}>
            <AccountStep
              onNext={() => setStep("credentials")}
              onSwitchToRegister={() => setStep("register")}
            />
          </Dialog>
        ) : step === "register" ? (
          <Dialog showClose={false}>
            <RegisterStep onSwitchToLogin={() => setStep("account")} />
          </Dialog>
        ) : (
          <Dialog
            onClose={() => setStep("account")}
            closeLabel="Volver a la selección de cuenta"
          >
            <CredentialsStep />
          </Dialog>
        )}
      </div>
    </main>
  );
}
