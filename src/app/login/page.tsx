import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const s = await getSession();
  if (s.status === "active") redirect("/dashboard");
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
