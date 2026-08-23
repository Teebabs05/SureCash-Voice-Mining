"use client";

import { startRegistration, startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { apiFetch } from "@/lib/api-client";

export function biometricSupported() {
  return typeof window !== "undefined" && browserSupportsWebAuthn();
}

export async function registerBiometric() {
  const optionsJSON = await apiFetch<PublicKeyCredentialCreationOptionsJSON>("/api/security/biometric/register-options");
  const attResp = await startRegistration({ optionsJSON });
  await apiFetch("/api/security/biometric/register-verify", { method: "POST", body: JSON.stringify(attResp) });
}

export async function loginWithBiometric() {
  const optionsJSON = await apiFetch<PublicKeyCredentialRequestOptionsJSON>("/api/auth/biometric/login-options");
  const authResp = await startAuthentication({ optionsJSON });
  return apiFetch<{ user: { role: string } }>("/api/auth/biometric/login-verify", {
    method: "POST",
    body: JSON.stringify(authResp),
  });
}
