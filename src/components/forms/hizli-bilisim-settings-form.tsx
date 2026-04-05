"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SAMPLE_TEST_SECRET_KEY = "e22f0bbe47740722984122552c552b3d284d";
const SAMPLE_TEST_API_KEY = "e22f0bbe1774";

type HizliFormState = {
  serviceSecretKey: string;
  serviceApiKey: string;
  serviceUsername: string;
  servicePassword: string;
  serviceCompanyCode: string;
  serviceEndpoint: string;
  serviceCreditCount: string;
  hasEncryptedCredentials: boolean;
};

export function HizliBilisimSettingsForm({ initial }: { initial: HizliFormState }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endpoint = form.serviceEndpoint.trim().toLowerCase();
  const isTestEndpoint = endpoint.includes("econnecttest");
  const isLiveEndpoint = endpoint.includes("econnect.hizliteknoloji.com.tr") && !isTestEndpoint;
  const usesSampleTestKeys = form.serviceSecretKey.trim() === SAMPLE_TEST_SECRET_KEY || form.serviceApiKey.trim() === SAMPLE_TEST_API_KEY;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/panel/settings/hizli-bilisim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "Hızlı Bilişim ayarları kaydedilemedi.");
      setBusy(false);
      return;
    }

    setMessage("Hızlı Bilişim ayarları kaydedildi. Girilen kullanıcı bilgileri şifrelenerek saklandı.");
    setForm((current) => ({
      ...current,
      serviceUsername: "",
      servicePassword: "",
      hasEncryptedCredentials: true,
    }));
    router.refresh();
    setBusy(false);
  }

  function setTestEndpoint() {
    setForm((current) => ({
      ...current,
      serviceEndpoint: "https://econnecttest.hizliteknoloji.com.tr/Services/HizliService.svc",
    }));
  }

  function setLiveEndpoint() {
    setForm((current) => ({
      ...current,
      serviceEndpoint: "https://econnect.hizliteknoloji.com.tr/Services/HizliService.svc",
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
      <div className="md:col-span-2 flex flex-wrap items-center gap-2 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
        <span
          className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.14em] ${
            isLiveEndpoint
              ? "bg-emerald-50 text-emerald-700"
              : isTestEndpoint
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          {isLiveEndpoint ? "Canlı Ortam" : isTestEndpoint ? "Test Ortamı" : "Ortam Belirsiz"}
        </span>
        <p className="text-sm font-semibold text-slate-600">
          {isLiveEndpoint
            ? "Canlı servise bağlanıyorsunuz. Portalden üretilen gerçek WS kullanıcı adı ve şifresi kullanılmalı."
            : isTestEndpoint
              ? "Test servisi seçili. Gerçek mükellefler bu ortamda görünmeyebilir; canlı sorgu için Gerçek Endpoint kullanın."
              : "Servis adresini kontrol edin. Test ve canlı ortam ayrımını endpoint belirler."}
        </p>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-600">Secret Key</span>
        <input value={form.serviceSecretKey} onChange={(e) => setForm((c) => ({ ...c, serviceSecretKey: e.target.value }))} />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-600">API Key</span>
        <input value={form.serviceApiKey} onChange={(e) => setForm((c) => ({ ...c, serviceApiKey: e.target.value }))} />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-600">Şifrelenecek kullanıcı adı</span>
        <input
          value={form.serviceUsername}
          onChange={(e) => setForm((c) => ({ ...c, serviceUsername: e.target.value }))}
          placeholder={form.hasEncryptedCredentials ? "Yeni kullanıcı adı girmezsen mevcut şifreli kayıt korunur" : "hizlitest"}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-600">Şifrelenecek parola</span>
        <input
          type="password"
          value={form.servicePassword}
          onChange={(e) => setForm((c) => ({ ...c, servicePassword: e.target.value }))}
          placeholder={form.hasEncryptedCredentials ? "Yeni parola girmezsen mevcut şifreli kayıt korunur" : "Test.1234"}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-600">Firma kodu / ERP kodu</span>
        <input value={form.serviceCompanyCode} onChange={(e) => setForm((c) => ({ ...c, serviceCompanyCode: e.target.value }))} />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-600">Servis adresi</span>
        <input
          value={form.serviceEndpoint}
          onChange={(e) => setForm((c) => ({ ...c, serviceEndpoint: e.target.value }))}
          placeholder="https://econnecttest.hizliteknoloji.com.tr/Services/HizliService.svc"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-600">Kontör sayısı</span>
        <input
          type="number"
          min="0"
          value={form.serviceCreditCount}
          onChange={(e) => setForm((c) => ({ ...c, serviceCreditCount: e.target.value }))}
          placeholder="1250"
        />
      </label>

      <div className="md:col-span-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={setTestEndpoint} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100">
          Test Endpoint
        </button>
        <button type="button" onClick={setLiveEndpoint} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100">
          Gerçek Endpoint
        </button>
        {form.hasEncryptedCredentials ? <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Şifreli kimlik bilgisi kayıtlı</span> : null}
      </div>

      {isTestEndpoint ? (
        <div className="md:col-span-2 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-sm font-black text-amber-800">Test endpoint aktif</p>
          <p className="mt-1 text-sm text-amber-700">
            Bu ortamda canlı e-Fatura mükellefleri bulunamayabilir. Canlı geçişte `Gerçek Endpoint` seçip portalden alınan gerçek WS kullanıcı adı ve şifresiyle yeniden kaydetmeniz gerekir.
          </p>
        </div>
      ) : null}

      {isLiveEndpoint ? (
        <div className="md:col-span-2 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="text-sm font-black text-emerald-800">Canlı endpoint aktif</p>
          <p className="mt-1 text-sm text-emerald-700">
            Buraya şifrelenmiş değer değil, portalden üretilen düz WS kullanıcı adı ve düz WS şifresi girilmelidir. Sistem kaydederken bunları `UtilEncrypt` ile şifreler.
          </p>
        </div>
      ) : null}

      {isLiveEndpoint && usesSampleTestKeys ? (
        <div className="md:col-span-2 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-4">
          <p className="text-sm font-black text-rose-800">Test key ile canlıya çıkılamaz</p>
          <p className="mt-1 text-sm text-rose-700">
            Mailde paylaşılan örnek `SecretKey` ve `ApiKey` test içindir. Canlı endpoint seçiliyken bu değerlerle `Hatalı secret key` veya yetki hatası alırsınız.
          </p>
        </div>
      ) : null}

      <div className="md:col-span-2 flex items-center justify-between gap-3">
        <div>
          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
        </div>
        <button disabled={busy} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
          {busy ? "Kaydediliyor..." : "Hızlı Bilişim Ayarlarını Kaydet"}
        </button>
      </div>
    </form>
  );
}
