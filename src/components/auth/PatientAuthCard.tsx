"use client";

import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OTPInput } from "@/components/ui/OTPInput";
import { OTP_LENGTH, RESEND_SECONDS } from "@/lib/auth-config";
import { createClient } from "@/lib/supabase/client";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD_LENGTH = 8;

type Mode = "login" | "register" | "verify" | "forgot" | "reset";
type VerifyKind = "signup" | "recovery";

type PatientAuthCardProps = {
  onAuthenticated: () => void;
  title?: string;
  description?: string;
};

const LINK_CLASSES = "min-h-[44px] text-14 text-primary underline";

export function PatientAuthCard({
  onAuthenticated,
  title,
  description,
}: PatientAuthCardProps) {
  const supabase = createClient();
  const headingId = useId();

  const [mode, setMode] = useState<Mode>("login");
  const [verifyKind, setVerifyKind] = useState<VerifyKind>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft === 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  function go(next: Mode) {
    setMode(next);
    setError(undefined);
    setNotice(undefined);
    setCode("");
  }

  function goToVerify(kind: VerifyKind, target: string, message: string) {
    setEmail(target);
    setVerifyKind(kind);
    setMode("verify");
    setCode("");
    setError(undefined);
    setNotice(message);
    setSecondsLeft(RESEND_SECONDS);
  }

  function normalizedEmail() {
    return email.trim().toLowerCase();
  }

  async function handleLogin() {
    const target = normalizedEmail();

    if (!EMAIL_REGEX.test(target) || !password) {
      setError("Ingresa tu correo y tu contraseña.");
      return;
    }

    setBusy(true);
    setError(undefined);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: target,
      password,
    });

    if (!signInError) {
      setBusy(false);
      onAuthenticated();
      return;
    }

    // Cuenta creada pero correo sin verificar: reenviar el código.
    if (signInError.code === "email_not_confirmed") {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: target,
      });
      setBusy(false);

      if (resendError) {
        setError(
          "Tu correo aún no está verificado y no pudimos enviar el código. Inténtalo de nuevo.",
        );
        return;
      }

      goToVerify(
        "signup",
        target,
        "Tu correo aún no está verificado. Te enviamos un código.",
      );
      return;
    }

    setBusy(false);
    setError("Correo o contraseña incorrectos.");
  }

  async function handleRegister() {
    const target = normalizedEmail();
    const fullName = name.trim();

    if (fullName.length < 2) {
      setError("Ingresa tu nombre.");
      return;
    }
    if (!EMAIL_REGEX.test(target)) {
      setError("Ingresa un correo válido.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
      return;
    }

    setBusy(true);
    setError(undefined);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: target,
      password,
      options: { data: { full_name: fullName } },
    });

    setBusy(false);

    if (signUpError) {
      setError(
        signUpError.code === "weak_password"
          ? "Esa contraseña es muy débil. Usa más caracteres, letras y números."
          : "No pudimos crear tu cuenta. Inténtalo de nuevo.",
      );
      return;
    }

    if (data.session) {
      onAuthenticated();
      return;
    }

    goToVerify(
      "signup",
      target,
      `Enviamos ${OTP_LENGTH} dígitos a ${target}. Si ya tienes cuenta con este correo, inicia sesión.`,
    );
  }

  async function handleForgot() {
    const target = normalizedEmail();

    if (!EMAIL_REGEX.test(target)) {
      setError("Ingresa un correo válido.");
      return;
    }

    setBusy(true);
    setError(undefined);

    const { error: resetError } =
      await supabase.auth.resetPasswordForEmail(target);

    setBusy(false);

    if (resetError) {
      setError("No pudimos enviar el código. Inténtalo de nuevo.");
      return;
    }

    goToVerify(
      "recovery",
      target,
      `Si ese correo tiene cuenta, enviamos ${OTP_LENGTH} dígitos a ${target}.`,
    );
  }

  async function handleVerify() {
    if (code.length < OTP_LENGTH) {
      setError(`Ingresa los ${OTP_LENGTH} dígitos.`);
      return;
    }

    setBusy(true);
    setError(undefined);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: verifyKind,
    });

    setBusy(false);

    if (verifyError || !data.user) {
      setError("Código incorrecto o vencido. Inténtalo de nuevo.");
      return;
    }

    if (verifyKind === "recovery") {
      setPassword("");
      setMode("reset");
      setNotice("Código verificado. Elige tu nueva contraseña.");
      return;
    }

    onAuthenticated();
  }

  async function handleReset() {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
      return;
    }

    setBusy(true);
    setError(undefined);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setBusy(false);

    if (updateError) {
      setError(
        updateError.code === "weak_password"
          ? "Esa contraseña es muy débil. Usa más caracteres, letras y números."
          : "No pudimos guardar tu contraseña. Inténtalo de nuevo.",
      );
      return;
    }

    onAuthenticated();
  }

  async function handleResend() {
    if (busy || secondsLeft > 0) return;

    setBusy(true);
    setError(undefined);

    const { error: sendError } =
      verifyKind === "signup"
        ? await supabase.auth.resend({ type: "signup", email })
        : await supabase.auth.resetPasswordForEmail(email);

    setBusy(false);

    if (sendError) {
      setError("No pudimos reenviar el código. Inténtalo de nuevo.");
      return;
    }

    setCode("");
    setSecondsLeft(RESEND_SECONDS);
  }

  const submitters: Record<Mode, () => Promise<void>> = {
    login: handleLogin,
    register: handleRegister,
    verify: handleVerify,
    forgot: handleForgot,
    reset: handleReset,
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    submitters[mode]();
  }

  const heading: Record<Mode, { title: string; description: string }> = {
    login: {
      title: title ?? "Inicia sesión",
      description: description ?? "Entra con tu correo y contraseña.",
    },
    register: {
      title: "Crea tu cuenta",
      description:
        "Solo verificas tu correo una vez; después entras con tu contraseña.",
    },
    verify: {
      title: "Verifica tu correo",
      description: notice ?? `Ingresa el código de ${OTP_LENGTH} dígitos.`,
    },
    forgot: {
      title: "Recupera tu contraseña",
      description: "Te enviaremos un código a tu correo.",
    },
    reset: {
      title: "Nueva contraseña",
      description: notice ?? "Elige una contraseña nueva.",
    },
  };

  const submitLabel: Record<Mode, string> = {
    login: busy ? "Entrando…" : "Iniciar sesión",
    register: busy ? "Creando cuenta…" : "Crear cuenta",
    verify: busy ? "Verificando…" : "Verificar",
    forgot: busy ? "Enviando…" : "Enviar código",
    reset: busy ? "Guardando…" : "Guardar contraseña",
  };

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-ds-5 rounded-lg border border-border bg-surface p-ds-5"
    >
      <div className="flex flex-col gap-ds-2">
        <h2 id={headingId} className="text-20 font-bold text-text">
          {heading[mode].title}
        </h2>
        <p className="text-14 text-text-muted">{heading[mode].description}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-ds-4">
        {error && mode !== "verify" ? (
          <Alert variant="danger" title={error} />
        ) : null}

        {mode === "register" ? (
          <Input
            type="text"
            autoComplete="name"
            label="Nombre completo"
            placeholder="Tu nombre y apellido"
            value={name}
            onChange={setName}
          />
        ) : null}

        {mode === "login" || mode === "register" || mode === "forgot" ? (
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            label="Correo electrónico"
            placeholder="tu@correo.com"
            value={email}
            onChange={setEmail}
          />
        ) : null}

        {mode === "login" || mode === "register" || mode === "reset" ? (
          <Input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            label={mode === "reset" ? "Nueva contraseña" : "Contraseña"}
            hint={
              mode === "login"
                ? undefined
                : `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
            }
            value={password}
            onChange={setPassword}
          />
        ) : null}

        {mode === "verify" ? (
          <OTPInput
            length={OTP_LENGTH}
            value={code}
            onChange={(value) => {
              setCode(value);
              if (error) setError(undefined);
            }}
            error={error}
          />
        ) : null}

        <Button
          type="submit"
          variant={busy ? "disabled" : "primary"}
          className="w-full"
        >
          {submitLabel[mode]}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-ds-1">
        {mode === "login" ? (
          <>
            <button type="button" onClick={() => go("forgot")} className={LINK_CLASSES}>
              ¿Olvidaste tu contraseña?
            </button>
            <button type="button" onClick={() => go("register")} className={LINK_CLASSES}>
              ¿Primera vez? Crear cuenta
            </button>
          </>
        ) : null}

        {mode === "register" || mode === "forgot" ? (
          <button type="button" onClick={() => go("login")} className={LINK_CLASSES}>
            Ya tengo cuenta, iniciar sesión
          </button>
        ) : null}

        {mode === "verify" ? (
          <>
            {secondsLeft === 0 ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={busy}
                className={LINK_CLASSES}
              >
                Reenviar código
              </button>
            ) : (
              <p className="flex min-h-[44px] items-center text-14 text-text-muted">
                Reenviar código en {secondsLeft} s
              </p>
            )}
            <button type="button" onClick={() => go("login")} className={LINK_CLASSES}>
              Volver a iniciar sesión
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
