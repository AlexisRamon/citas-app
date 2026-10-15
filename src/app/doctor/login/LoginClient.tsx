"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, LogIn } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

type LoginClientProps = {
  notice?: string;
};

export function LoginClient({ notice }: LoginClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(undefined);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("Credenciales incorrectas");
      setLoading(false);
      return;
    }

    router.push("/doctor");
    router.refresh();
    setLoading(false);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-ds-6 py-ds-8">
      <div className="flex w-full max-w-[400px] flex-col gap-ds-6">
        <div className="flex flex-col items-center gap-ds-3 text-center">
          <div
            aria-hidden="true"
            className="flex size-[48px] items-center justify-center rounded-md bg-surface-soft text-primary"
          >
            <CalendarCheck size={24} />
          </div>
          <div className="flex flex-col gap-ds-1">
            <h1 className="text-24 font-bold text-text">Panel del doctor</h1>
            <p className="text-14 text-text-muted">
              Inicia sesión para ver tus citas.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-ds-5 rounded-lg border border-border bg-surface p-ds-7"
        >
          {notice && !error ? (
            <Alert variant="danger" title={notice} />
          ) : null}
          {error ? <Alert variant="danger" title={error} /> : null}

          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            label="Correo electrónico"
            placeholder="doctor@consultorio.com"
            value={email}
            onChange={setEmail}
            required
          />
          <Input
            type="password"
            autoComplete="current-password"
            label="Contraseña"
            value={password}
            onChange={setPassword}
            required
          />

          <Button
            type="submit"
            variant={loading ? "disabled" : "primary"}
            icon={<LogIn size={20} aria-hidden="true" />}
            className="w-full"
          >
            {loading ? "Ingresando…" : "Iniciar sesión"}
          </Button>
        </form>
      </div>
    </main>
  );
}