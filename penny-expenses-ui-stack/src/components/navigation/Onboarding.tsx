import { useState } from "react";

import { useProfile } from "@/hooks/useProfile";

export function Onboarding() {
  const { saveProfile } = useProfile();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <span className="animate-pop mb-6 grid size-14 place-items-center rounded-3xl bg-butter text-2xl">
        💸
      </span>
      <h1 className="font-display text-4xl leading-tight font-semibold">
        Tu año en gastos, sin aburrirte.
      </h1>
      <p className="mt-3 text-muted-foreground">
        Usa tu correo de Google como identificador. Solo verás los gastos asociados a él.
      </p>

      <form
        className="surface mt-8 grid gap-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const clean = email.trim().toLowerCase();
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return setError("Ingresa un correo válido.");
          saveProfile({ email: clean, name: name.trim() || clean.split("@")[0]! });
        }}
      >
        <label className="grid gap-2">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Tu nombre
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rownok"
            className="rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Correo
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@example.com"
            className="rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        {error ? (
          <p className="rounded-2xl bg-rose/50 px-4 py-2.5 text-sm text-rose-ink">{error}</p>
        ) : null}
        <button
          type="submit"
          className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
