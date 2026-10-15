import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginClient } from "./LoginClient";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

async function LoginGate({ searchParams }: PageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !error) redirect("/doctor");

  const notice =
    error === "sin-acceso"
      ? "Tu cuenta no tiene acceso al panel del doctor."
      : undefined;

  return <LoginClient notice={notice} />;
}

export default function LoginPage(props: PageProps) {
  return (
    <Suspense fallback={null}>
      <LoginGate {...props} />
    </Suspense>
  );
}