"use client";

import { useState } from "react";

const quickAccounts = [
  { label: "Firma sahibi", email: "owner@demo.local", password: "Demo1234!" },
  { label: "Muhasebe", email: "muhasebe@demo.local", password: "Demo1234!" },
  { label: "Kurucu", email: "kurucu@bey360.local", password: "Demo1234!" },
];

export function LoginForm() {
  const [email, setEmail] = useState("owner@demo.local");
  const [password, setPassword] = useState("Demo1234!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = (await response.json()) as {
        success: boolean;
        data?: { redirectTo?: string };
        error?: { message?: string };
      };

      if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? "Giriş sırasında bir hata oluştu.");
      }

      window.location.assign(body.data?.redirectTo || "/panel");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Giriş başarısız.");
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-3">
        {quickAccounts.map((account) => (
          <button
            key={account.label}
            type="button"
            onClick={() => {
              setEmail(account.email);
              setPassword(account.password);
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-[var(--brand)] hover:bg-white"
          >
            <span className="block text-xs uppercase tracking-[0.16em] text-slate-400">Demo</span>
            <span className="mt-1 block">{account.label}</span>
          </button>
        ))}
      </div>

      <Field label="E-posta" placeholder="ornek@firma.com" value={email} onChange={setEmail} />
      <Field label="Şifre" placeholder="••••••••••" type="password" value={password} onChange={setPassword} />

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-[var(--brand)] text-base font-black text-white transition hover:bg-[var(--brand-strong)] disabled:opacity-70"
      >
        {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand)]"
      />
    </label>
  );
}