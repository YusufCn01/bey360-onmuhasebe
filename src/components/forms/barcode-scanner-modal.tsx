"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type BarcodeLikeProduct = {
  id: string;
  code: string;
  name: string;
  barcode?: string | null;
};

type DetectorCtor = {
  new (options?: { formats?: string[] }): {
    detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
  };
  getSupportedFormats?: () => Promise<string[]>;
};

function normalizeCode(value: string) {
  return value.trim();
}

export function BarcodeScannerModal({
  open,
  onClose,
  products,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  products: BarcodeLikeProduct[];
  onDetected: (code: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Kamera başlatılıyor...");
  const [supportsDetector, setSupportsDetector] = useState(false);

  const detectorClass = useMemo(() => {
    if (typeof window === "undefined") return null;
    return (window as Window & { BarcodeDetector?: DetectorCtor }).BarcodeDetector ?? null;
  }, []);

  const knownBarcodes = useMemo(() => {
    return products
      .filter((product) => product.barcode || product.code)
      .map((product) => ({
        id: product.id,
        label: `${product.code} · ${product.name}`,
        code: product.barcode || product.code,
      }));
  }, [products]);

  function stopStream() {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!open) return;
      setError(null);
      setStatus("Kamera başlatılıyor...");

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("Tarayıcı kamera erişimini desteklemiyor.");
        return;
      }

      try {
        if (detectorClass) {
          setSupportsDetector(true);
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }

        if (!detectorClass) {
          setStatus("Kamera açık. Otomatik barkod algılama desteklenmiyor; manuel giriş veya fotoğraf kullanın.");
          return;
        }

        const detector = new detectorClass({
          formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code", "upc_a", "upc_e"],
        });

        setStatus("Barkod bekleniyor...");
        scanIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;

          try {
            const results = await detector.detect(videoRef.current);
            const code = normalizeCode(results[0]?.rawValue ?? "");
            if (!code) return;
            stopStream();
            onDetected(code);
          } catch {
            // ignore transient camera decode errors
          }
        }, 500);
      } catch (startError) {
        setError(startError instanceof Error ? startError.message : "Kamera başlatılamadı.");
        setStatus("Kamera açılamadı.");
      }
    }

    start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [detectorClass, onDetected, open]);

  async function handleImageCapture(file: File | null) {
    if (!file) return;
    setError(null);

    if (!detectorClass) {
      setError("Bu tarayıcı fotoğraftan barkod çözümlemeyi desteklemiyor.");
      return;
    }

    try {
      const detector = new detectorClass({
        formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code", "upc_a", "upc_e"],
      });
      const imageBitmap = await createImageBitmap(file);
      const results = await detector.detect(imageBitmap);
      const code = normalizeCode(results[0]?.rawValue ?? "");
      if (!code) {
        setError("Fotoğrafta barkod bulunamadı.");
        return;
      }
      stopStream();
      onDetected(code);
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Görselden barkod okunamadı.");
    }
  }

  function submitManualCode() {
    const code = normalizeCode(manualCode);
    if (!code) {
      setError("Önce barkod veya ürün kodu girin.");
      return;
    }
    stopStream();
    onDetected(code);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4">
      <div className="w-full max-w-2xl rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Barkod Okuma</p>
            <h3 className="mt-1 text-xl font-extrabold text-slate-900">Kamera ile ürün ekle</h3>
            <p className="mt-1 text-sm text-slate-500">Webcam veya telefon kamerasıyla barkodu okutabilir, istersen manuel kod da girebilirsin.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Kapat
          </button>
        </div>

        <div className="grid gap-5 px-6 py-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-slate-950">
              <video ref={videoRef} className="h-[280px] w-full object-cover" muted playsInline />
            </div>
            <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{status}</div>
            <div className="flex flex-wrap gap-2">
              <label className="rounded-[10px] border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Fiş / Barkod Fotoğrafı
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => handleImageCapture(event.target.files?.[0] ?? null)} />
              </label>
              <button type="button" onClick={submitManualCode} className="rounded-[10px] bg-[var(--brand)] px-4 py-2 text-sm font-extrabold text-white">
                Manuel Kodu Ekle
              </button>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Barkod / ürün kodu</span>
              <input
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                placeholder="8680000000000 veya URN-001"
                className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
              />
            </label>
            {error ? <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Tarayıcı Desteği</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{supportsDetector ? "Otomatik barkod algılama aktif." : "Otomatik algılama sınırlı olabilir, manuel giriş açık."}</p>
            </div>
            <div className="rounded-[16px] border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Kayıtlı Barkodlar</p>
                <p className="mt-1 text-sm text-slate-500">İstersen listeden de ürün seçebilirsin.</p>
              </div>
              <div className="max-h-[280px] overflow-y-auto p-2">
                {knownBarcodes.length ? (
                  knownBarcodes.map((item) => (
                    <button
                      key={`${item.id}-${item.code}`}
                      type="button"
                      onClick={() => {
                        stopStream();
                        onDetected(item.code || "");
                      }}
                      className="mb-2 w-full rounded-[12px] border border-slate-200 bg-white px-3 py-3 text-left hover:bg-slate-50"
                    >
                      <p className="text-sm font-bold text-slate-900">{item.label}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">{item.code}</p>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-4 text-sm text-slate-500">Henüz barkodlu ürün yok.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
