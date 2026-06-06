"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  createBlockFromCatalog,
  getTemplatePresets,
  normalizeTemplateContent,
  templateBlockCatalog,
  templateKindMeta,
  type ColumnAlign,
  type ColumnKey,
  type TemplateBlock,
  type TemplateBlockStyle,
  type TemplateBlockType,
  type TemplateContent,
  type TemplateKind,
} from "@/lib/document-template-presets";

type TemplateRecord = {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  content: TemplateContent;
};

type BrandDefaults = {
  logoUrl?: string | null;
  secondaryLogoUrl?: string | null;
  signatureImageUrl?: string | null;
  stampImageUrl?: string | null;
  signatureName?: string | null;
  signatureTitle?: string | null;
};

const alignOptions: ColumnAlign[] = ["left", "center", "right"];

function toneClass(style: TemplateBlockStyle) {
  if (style === "highlight") return "border-transparent text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]";
  if (style === "plain") return "border-slate-200 bg-slate-50";
  return "border-slate-200 bg-white";
}

function previewBlockClass(block: TemplateBlock) {
  if (!block.enabled) return "opacity-45";
  if (block.style === "highlight") return "border-transparent text-white";
  if (block.style === "plain") return "border-slate-200 bg-slate-50 text-slate-800";
  return "border-slate-200 bg-white text-slate-900";
}

function alignClass(align: ColumnAlign) {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

function sampleRows(kind: TemplateKind) {
  if (kind === "QUOTE") {
    return [
      { code: "TK-001", name: "Kurulum Hizmeti", quantity: 1, unitPrice: 12500 },
      { code: "TK-002", name: "Yıllık Destek", quantity: 1, unitPrice: 6400 },
    ];
  }

  return [
    { code: "UR-001", name: "Ofis Masası", quantity: 4, unitPrice: 3850 },
    { code: "UR-014", name: "Ergonomik Koltuk", quantity: 4, unitPrice: 2950 },
  ];
}

function money(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);
}

export function DocumentTemplateBuilder({
  kind,
  templates: initialTemplates,
  brandDefaults,
}: {
  kind: TemplateKind;
  templates: Array<{ id: string; name: string; slug: string; isDefault: boolean; contentJson: string }>;
  brandDefaults: BrandDefaults;
}) {
  const [templates, setTemplates] = useState<TemplateRecord[]>(
    initialTemplates.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      isDefault: item.isDefault,
      content: normalizeTemplateContent(item.contentJson, kind),
    })),
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplates[0]?.id ?? "");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    initialTemplates[0] ? normalizeTemplateContent(initialTemplates[0].contentJson, kind).blocks[0]?.id ?? null : null,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"easy" | "advanced">("easy");
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) ?? templates[0] ?? null,
    [selectedTemplateId, templates],
  );
  const selectedBlock =
    selectedTemplate?.content.blocks.find((block) => block.id === selectedBlockId) ?? selectedTemplate?.content.blocks[0] ?? null;
  const presets = getTemplatePresets(kind);
  const rows = sampleRows(kind);
  const subtotal = rows.reduce((sum, row) => sum + row.quantity * row.unitPrice, 0);
  const vatTotal = subtotal * 0.2;
  const grandTotal = subtotal + vatTotal;
  const effectivePrimaryLogo = selectedTemplate?.content.logoUrl || brandDefaults.logoUrl || "";
  const effectiveSecondaryLogo = selectedTemplate?.content.secondaryLogoUrl || brandDefaults.secondaryLogoUrl || "";

  function updateTemplate(updater: (current: TemplateRecord) => TemplateRecord) {
    setTemplates((current) => current.map((item) => (item.id === selectedTemplateId ? updater(item) : item)));
  }

  function updateBlock(blockId: string, patch: Partial<TemplateBlock>) {
    updateTemplate((current) => ({
      ...current,
      content: {
        ...current.content,
        blocks: current.content.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)),
      },
    }));
  }

  function updateColumnSetting(column: ColumnKey, patch: Partial<TemplateContent["columnSettings"][ColumnKey]>) {
    updateTemplate((current) => ({
      ...current,
      content: {
        ...current.content,
        columnSettings: {
          ...current.content.columnSettings,
          [column]: {
            ...current.content.columnSettings[column],
            ...patch,
          },
        },
      },
    }));
  }

  function moveBlock(fromId: string, toId: string) {
    if (!selectedTemplate || fromId === toId) return;
    const blocks = [...selectedTemplate.content.blocks];
    const fromIndex = blocks.findIndex((block) => block.id === fromId);
    const toIndex = blocks.findIndex((block) => block.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, moved);
    updateTemplate((current) => ({ ...current, content: { ...current.content, blocks } }));
  }

  function moveColumn(from: ColumnKey, to: ColumnKey) {
    if (!selectedTemplate || from === to) return;
    const columns = [...selectedTemplate.content.itemColumns];
    const fromIndex = columns.indexOf(from);
    const toIndex = columns.indexOf(to);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = columns.splice(fromIndex, 1);
    columns.splice(toIndex, 0, moved);
    updateTemplate((current) => ({ ...current, content: { ...current.content, itemColumns: columns } }));
  }

  function addBlock(type: TemplateBlockType) {
    if (!selectedTemplate) return;
    const block = createBlockFromCatalog(type, selectedTemplate.content.blocks);
    updateTemplate((current) => ({
      ...current,
      content: { ...current.content, blocks: [...current.content.blocks, block] },
    }));
    setSelectedBlockId(block.id);
  }

  function removeBlock(blockId: string) {
    if (!selectedTemplate || selectedTemplate.content.blocks.length === 1) return;
    const nextBlocks = selectedTemplate.content.blocks.filter((block) => block.id !== blockId);
    updateTemplate((current) => ({ ...current, content: { ...current.content, blocks: nextBlocks } }));
    setSelectedBlockId(nextBlocks[0]?.id ?? null);
  }

  function applyPreset(slug: string) {
    const preset = presets.find((item) => item.slug === slug);
    if (!preset) return;
    updateTemplate((current) => ({
      ...current,
      name: preset.name,
      slug: preset.slug,
      content: normalizeTemplateContent(preset.content, kind),
    }));
    setSelectedBlockId(preset.content.blocks[0]?.id ?? null);
  }

  function updateImageField(field: "logoUrl" | "secondaryLogoUrl", file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      updateTemplate((current) => ({ ...current, content: { ...current.content, [field]: result } }));
    };
    reader.readAsDataURL(file);
  }

  async function saveTemplate(makeDefault = false) {
    if (!selectedTemplate) return;
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/panel/document-templates/${selectedTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedTemplate.name,
          isDefault: makeDefault ? true : selectedTemplate.isDefault,
          contentJson: JSON.stringify(selectedTemplate.content),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? "Şablon kaydedilemedi.");
      }

      setTemplates((current) =>
        current.map((item) => ({
          ...item,
          isDefault: makeDefault ? item.id === selectedTemplate.id : item.isDefault,
        })),
      );
      setMessage(makeDefault ? "Şablon kaydedildi ve varsayılan yapıldı." : "Şablon kaydedildi.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Şablon kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  if (!selectedTemplate) {
    return <p className="text-sm text-slate-500">Şablon bulunamadı.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[var(--line)] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Şablon Düzeni</p>
          <h3 className="mt-1 text-xl font-extrabold text-slate-900">{templateKindMeta[kind].title}</h3>
          <p className="mt-1 text-sm text-slate-500">Önce temel alanları düzenle, gerekirse gelişmiş moda geç.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditorMode("easy")}
            className={`rounded-[10px] px-4 py-2 text-sm font-bold ${editorMode === "easy" ? "bg-[var(--brand)] text-white" : "border border-[var(--line)] bg-[var(--panel-soft)] text-slate-600"}`}
          >
            Kolay Mod
          </button>
          <button
            type="button"
            onClick={() => setEditorMode("advanced")}
            className={`rounded-[10px] px-4 py-2 text-sm font-bold ${editorMode === "advanced" ? "bg-slate-900 text-white" : "border border-[var(--line)] bg-[var(--panel-soft)] text-slate-600"}`}
          >
            Gelişmiş Mod
          </button>
          <button type="button" onClick={() => saveTemplate(false)} disabled={busy} className="rounded-[10px] bg-[var(--brand)] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)] disabled:opacity-60">
            {busy ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${editorMode === "easy" ? "xl:grid-cols-[0.95fr_1.15fr]" : "xl:grid-cols-[0.85fr_1.2fr_0.95fr]"}`}>
        <section className="rounded-[14px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Hazır Şablonlar</p>
          <h3 className="mt-1 text-xl font-extrabold text-slate-900">{templateKindMeta[kind].title}</h3>
          <div className="mt-4 space-y-3">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  setSelectedTemplateId(template.id);
                  setSelectedBlockId(template.content.blocks[0]?.id ?? null);
                }}
                className={`w-full rounded-[12px] border px-4 py-4 text-left ${
                  template.id === selectedTemplateId ? "border-[var(--brand)] bg-rose-50" : "border-[var(--line)] bg-[var(--panel-soft)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-extrabold text-slate-900">{template.name}</span>
                  {template.isDefault ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Varsayılan</span> : null}
                </div>
                <p className="mt-2 text-xs text-slate-500">{template.content.coverSubtitle}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              {presets.slice(0, 3).map((preset, index) => (
                <button
                  key={`quick-${preset.slug}`}
                  type="button"
                  onClick={() => applyPreset(preset.slug)}
                  className={`rounded-[14px] border p-4 text-left transition ${
                    index === 0
                      ? "border-slate-200 bg-white hover:bg-slate-50"
                      : index === 1
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] hover:bg-[var(--brand-ghost)]"
                        : "border-amber-200 bg-amber-50 hover:bg-amber-100/70"
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {index === 0 ? "Sade Kurulum" : index === 1 ? "Kurumsal Görünüm" : "Resmi Görünüm"}
                  </p>
                  <p className="mt-2 text-base font-extrabold text-slate-900">{preset.name}</p>
                  <p className="mt-2 text-sm text-slate-500">{preset.description}</p>
                </button>
              ))}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Örnek Kütüphanesi</p>
            {presets.map((preset) => (
              <div key={preset.slug} className="rounded-[12px] border border-[var(--line)] bg-slate-50 p-4">
                <p className="font-bold text-slate-900">{preset.name}</p>
                <p className="mt-1 text-xs text-slate-500">{preset.description}</p>
                <button type="button" onClick={() => applyPreset(preset.slug)} className="mt-3 rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">
                  Bu örneği yükle
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[14px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{editorMode === "easy" ? "Hızlı Düzenleme" : "Sürükle Bırak Alanı"}</p>
              <h3 className="mt-1 text-xl font-extrabold text-slate-900">{selectedTemplate.name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {editorMode === "easy"
                  ? "En çok kullanılan alanları buradan düzenleyebilirsin. Gelişmiş düzenleme için sağ üstten gelişmiş moda geç."
                  : "Blokları tutup sürükleyerek sırala. Sağ taraftan metin ve stil düzenle."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => saveTemplate(true)} disabled={busy} className="rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                Varsayılan Yap
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-[14px] border border-dashed border-[var(--line)] bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Kapak başlığı</span>
              <input value={selectedTemplate.content.coverTitle} onChange={(event) => updateTemplate((current) => ({ ...current, content: { ...current.content, coverTitle: event.target.value } }))} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Kapak alt başlığı</span>
              <input value={selectedTemplate.content.coverSubtitle} onChange={(event) => updateTemplate((current) => ({ ...current, content: { ...current.content, coverSubtitle: event.target.value } }))} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Vurgu rengi</span>
              <input value={selectedTemplate.content.accent} onChange={(event) => updateTemplate((current) => ({ ...current, content: { ...current.content, accent: event.target.value } }))} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Ana logo</span>
              <input type="file" accept="image/*" onChange={(event) => updateImageField("logoUrl", event.target.files?.[0] ?? null)} />
              {effectivePrimaryLogo ? <Image src={effectivePrimaryLogo} alt="Şablon logosu" width={96} height={48} unoptimized className="mt-2 h-12 w-auto rounded-md border border-slate-200 bg-white p-2" /> : null}
              <p className="text-xs text-slate-500">Boş bırakırsanız firma ayarlarındaki logo kullanılır.</p>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">İkinci logo</span>
              <input type="file" accept="image/*" onChange={(event) => updateImageField("secondaryLogoUrl", event.target.files?.[0] ?? null)} />
              {effectiveSecondaryLogo ? <Image src={effectiveSecondaryLogo} alt="İkinci logo" width={96} height={48} unoptimized className="mt-2 h-12 w-auto rounded-md border border-slate-200 bg-white p-2" /> : null}
              <p className="text-xs text-slate-500">Partner, şube veya sertifika logosu için kullanabilirsiniz.</p>
            </label>
            <label className="space-y-2 md:col-span-2 xl:col-span-1">
              <span className="text-sm font-semibold text-slate-600">Alt bilgi</span>
              <textarea value={selectedTemplate.content.footerText ?? ""} onChange={(event) => updateTemplate((current) => ({ ...current, content: { ...current.content, footerText: event.target.value } }))} rows={3} />
            </label>
          </div>

          <div className={`mt-5 space-y-3 ${editorMode === "easy" ? "hidden" : ""}`}>
            {selectedTemplate.content.blocks.map((block) => (
              <button
                key={block.id}
                type="button"
                draggable
                onDragStart={() => setDraggedBlockId(block.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggedBlockId) moveBlock(draggedBlockId, block.id);
                  setDraggedBlockId(null);
                }}
                onClick={() => setSelectedBlockId(block.id)}
                className={`block w-full rounded-[14px] border p-4 text-left transition ${selectedBlock?.id === block.id ? "border-[var(--brand)] bg-rose-50" : toneClass(block.style)}`}
                style={block.style === "highlight" ? { backgroundColor: selectedTemplate.content.accent } : undefined}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${block.style === "highlight" ? "text-white/70" : "text-slate-400"}`}>{block.type}</p>
                    <p className={`mt-1 text-base font-extrabold ${block.style === "highlight" ? "text-white" : "text-slate-900"}`}>{block.title}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${block.enabled ? (block.style === "highlight" ? "bg-white/15 text-white" : "bg-emerald-100 text-emerald-700") : "bg-slate-200 text-slate-500"}`}>
                    {block.enabled ? "Açık" : "Kapalı"}
                  </span>
                </div>
                <p className={`mt-3 text-sm ${block.style === "highlight" ? "text-white/85" : "text-slate-600"}`}>{block.body}</p>
              </button>
            ))}
          </div>
        </section>
        {editorMode === "advanced" ? (
        <section className="rounded-[14px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Düzenleme Paneli</p>
          <h3 className="mt-1 text-xl font-extrabold text-slate-900">{selectedBlock?.title ?? "Blok seçin"}</h3>
          {selectedBlock ? (
            <div className="mt-4 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-600">Blok başlığı</span>
                <input value={selectedBlock.title} onChange={(event) => updateBlock(selectedBlock.id, { title: event.target.value })} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-600">Açıklama / içerik</span>
                <textarea value={selectedBlock.body} onChange={(event) => updateBlock(selectedBlock.id, { body: event.target.value })} rows={5} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-600">Stil</span>
                <select value={selectedBlock.style} onChange={(event) => updateBlock(selectedBlock.id, { style: event.target.value as TemplateBlockStyle })}>
                  <option value="boxed">Kutulu</option>
                  <option value="plain">Düz</option>
                  <option value="highlight">Vurgu</option>
                </select>
              </label>
              <label className="flex items-center gap-3 rounded-[12px] border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={selectedBlock.enabled} onChange={(event) => updateBlock(selectedBlock.id, { enabled: event.target.checked })} />
                Bu bloğu göster
              </label>
              <button type="button" onClick={() => removeBlock(selectedBlock.id)} className="w-full rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 hover:bg-rose-100">
                Bloğu kaldır
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Düzenlemek için orta alandan bir blok seçin.</p>
          )}

          <div className="mt-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Blok Ekle</p>
            <div className="mt-3 grid gap-2">
              {templateBlockCatalog.map((block) => (
                <button key={block.type} type="button" onClick={() => addBlock(block.type)} className="rounded-[10px] border border-[var(--line)] bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {block.title}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Kolon Düzeni</p>
            <p className="mt-1 text-sm text-slate-500">Sıra, başlık, genişlik ve hizayı birlikte düzenleyin.</p>
            <div className="mt-3 space-y-3">
              {selectedTemplate.content.itemColumns.map((column) => (
                <div key={column} draggable onDragStart={() => setDraggedColumn(column)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (draggedColumn) moveColumn(draggedColumn, column); setDraggedColumn(null); }} className="rounded-[12px] border border-[var(--line)] bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-slate-700">{column}</span>
                    <span className="text-xs text-slate-400">sürükle</span>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Başlık</span>
                      <input value={selectedTemplate.content.columnSettings[column].label} onChange={(event) => updateColumnSetting(column, { label: event.target.value })} />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Genişlik %</span>
                      <input type="number" min={8} max={60} value={selectedTemplate.content.columnSettings[column].width} onChange={(event) => updateColumnSetting(column, { width: Number(event.target.value || 0) })} />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Hiza</span>
                      <select value={selectedTemplate.content.columnSettings[column].align} onChange={(event) => updateColumnSetting(column, { align: event.target.value as ColumnAlign })}>
                        {alignOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
                      </select>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-[12px] border border-[var(--line)] bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">İmza Alanı</p>
            <div className="mt-3 grid gap-3">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-500">Sol başlık</span>
                <input value={selectedTemplate.content.signatureSettings.leftLabel} onChange={(event) => updateTemplate((current) => ({ ...current, content: { ...current.content, signatureSettings: { ...current.content.signatureSettings, leftLabel: event.target.value } } }))} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-500">Sağ başlık</span>
                <input value={selectedTemplate.content.signatureSettings.rightLabel} onChange={(event) => updateTemplate((current) => ({ ...current, content: { ...current.content, signatureSettings: { ...current.content.signatureSettings, rightLabel: event.target.value } } }))} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-500">İmza notu</span>
                <textarea rows={3} value={selectedTemplate.content.signatureSettings.note} onChange={(event) => updateTemplate((current) => ({ ...current, content: { ...current.content, signatureSettings: { ...current.content.signatureSettings, note: event.target.value } } }))} />
              </label>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
            {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          </div>
        </section>
        ) : null}
      </div>

      <section className="rounded-[14px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Canlı Belge Önizleme</p>
            <h3 className="mt-1 text-xl font-extrabold text-slate-900">{selectedTemplate.content.coverTitle}</h3>
            <p className="mt-1 text-sm text-slate-500">Değişiklikler bu alana anında yansır.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">
            {templateKindMeta[kind].shortLabel}
          </span>
        </div>

        <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-100 p-6">
          <div className="mx-auto max-w-4xl rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <div className="flex items-center gap-4">
                {effectivePrimaryLogo ? <Image src={effectivePrimaryLogo} alt="Şablon logosu" width={96} height={56} unoptimized className="h-14 w-auto rounded-[12px] border border-slate-200 bg-white p-2" /> : null}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{templateKindMeta[kind].shortLabel}</p>
                  <h4 className="mt-1 text-2xl font-extrabold text-slate-900">{selectedTemplate.content.coverTitle}</h4>
                  <p className="mt-1 text-sm text-slate-500">{selectedTemplate.content.coverSubtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {effectiveSecondaryLogo ? <Image src={effectiveSecondaryLogo} alt="İkinci logo" width={96} height={56} unoptimized className="h-14 w-auto rounded-[12px] border border-slate-200 bg-white p-2" /> : null}
                <div className="rounded-[16px] px-5 py-4 text-white" style={{ backgroundColor: selectedTemplate.content.accent }}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">Belge No</p>
                  <p className="mt-1 text-lg font-extrabold">{kind === "QUOTE" ? "TKL-00017" : kind === "DISPATCH" ? "IRS-00008" : "SAT-00042"}</p>
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {selectedTemplate.content.blocks.map((block) => (
                <div key={`preview-${block.id}`} className={`rounded-[16px] border p-4 ${previewBlockClass(block)}`} style={block.style === "highlight" ? { backgroundColor: selectedTemplate.content.accent } : undefined}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${block.style === "highlight" ? "text-white/70" : "text-slate-400"}`}>{block.title}</p>
                      <p className={`mt-1 text-sm ${block.style === "highlight" ? "text-white/90" : "text-slate-600"}`}>{block.body}</p>
                    </div>
                    {!block.enabled ? <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Gizli</span> : null}
                  </div>

                  {block.type === "company" ? (
                    <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                      <div>
                        <p className="font-extrabold">Bey360 Teknoloji A.Ş.</p>
                        <p>VKN: 1234567890</p>
                        <p>İstanbul / Şişli</p>
                      </div>
                      <div>
                        <p>0212 000 00 00</p>
                        <p>finans@bey360.com</p>
                        <p>www.bey360.com</p>
                      </div>
                    </div>
                  ) : null}

                  {block.type === "recipient" ? (
                    <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                      <div>
                        <p className="font-extrabold">Beyoğlu Teknoloji</p>
                        <p>VKN: 1681136628</p>
                      </div>
                      <div>
                        <p>İstanbul / Beyoğlu</p>
                        <p>destek@beyoglu.com</p>
                      </div>
                    </div>
                  ) : null}

                  {block.type === "document" ? (
                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                      <div className="rounded-[12px] bg-slate-50 px-3 py-3 text-slate-700"><span className="text-slate-500">Tarih</span><p className="mt-1 font-extrabold">04.04.2026</p></div>
                      <div className="rounded-[12px] bg-slate-50 px-3 py-3 text-slate-700"><span className="text-slate-500">Vade</span><p className="mt-1 font-extrabold">04.05.2026</p></div>
                      <div className="rounded-[12px] bg-slate-50 px-3 py-3 text-slate-700"><span className="text-slate-500">Para Birimi</span><p className="mt-1 font-extrabold">TRY</p></div>
                      <div className="rounded-[12px] bg-slate-50 px-3 py-3 text-slate-700"><span className="text-slate-500">Belge Tipi</span><p className="mt-1 font-extrabold">{templateKindMeta[kind].shortLabel}</p></div>
                    </div>
                  ) : null}

                  {block.type === "items" ? (
                    <div className="mt-4 overflow-hidden rounded-[14px] border border-slate-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            {selectedTemplate.content.itemColumns.map((column) => (
                              <th key={column} style={{ width: `${selectedTemplate.content.columnSettings[column].width}%` }} className={`px-3 py-2 ${alignClass(selectedTemplate.content.columnSettings[column].align)}`}>
                                {selectedTemplate.content.columnSettings[column].label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr key={row.code} className="border-t border-slate-100">
                              {selectedTemplate.content.itemColumns.map((column) => {
                                const rawValue = column === "code" ? row.code : column === "name" ? row.name : column === "quantity" ? row.quantity : column === "unitPrice" ? money(row.unitPrice) : money(row.quantity * row.unitPrice);
                                return (
                                  <td key={`${row.code}-${column}`} style={{ width: `${selectedTemplate.content.columnSettings[column].width}%` }} className={`px-3 py-2 ${alignClass(selectedTemplate.content.columnSettings[column].align)} ${column === "name" ? "font-semibold" : ""}`}>
                                    {rawValue}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  {block.type === "totals" ? (
                    <div className="mt-4 ml-auto max-w-sm space-y-2 rounded-[14px] bg-slate-50 p-4 text-sm">
                      <div className="flex items-center justify-between"><span className="text-slate-500">Ara toplam</span><strong>{money(subtotal)}</strong></div>
                      <div className="flex items-center justify-between"><span className="text-slate-500">KDV</span><strong>{money(vatTotal)}</strong></div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base"><span className="font-semibold text-slate-700">Genel toplam</span><strong>{money(grandTotal)}</strong></div>
                    </div>
                  ) : null}

                  {block.type === "notes" ? (
                    <div className="mt-4 rounded-[12px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Teslim öncesi müşteri ile telefon teyidi alındı. Paketleme ve sevk notları bu alanda gösterilir.
                    </div>
                  ) : null}

                  {block.type === "signature" ? (
                    <div className="mt-4 space-y-4 text-sm">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[12px] border border-dashed border-slate-300 px-4 py-6">
                          <p className="font-bold text-slate-700">{selectedTemplate.content.signatureSettings.leftLabel}</p>
                          {brandDefaults.signatureImageUrl ? <Image src={brandDefaults.signatureImageUrl} alt="İmza" width={120} height={60} unoptimized className="mt-3 h-14 w-auto object-contain" /> : null}
                          {brandDefaults.signatureName ? <p className="mt-3 font-semibold text-slate-900">{brandDefaults.signatureName}</p> : null}
                          {brandDefaults.signatureTitle ? <p className="text-xs text-slate-500">{brandDefaults.signatureTitle}</p> : null}
                        </div>
                        <div className="rounded-[12px] border border-dashed border-slate-300 px-4 py-6">
                          <p className="font-bold text-slate-700">{selectedTemplate.content.signatureSettings.rightLabel}</p>
                          {brandDefaults.stampImageUrl ? <Image src={brandDefaults.stampImageUrl} alt="Kaşe / mühür" width={110} height={110} unoptimized className="mt-3 h-20 w-auto object-contain opacity-90" /> : null}
                          <p className={`${brandDefaults.stampImageUrl ? "mt-4" : "mt-16"} text-xs text-slate-400`}>Müşteri imza / kaşe alanı</p>
                        </div>
                      </div>
                      {selectedTemplate.content.signatureSettings.note ? <p className="text-xs text-slate-500">{selectedTemplate.content.signatureSettings.note}</p> : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            {selectedTemplate.content.footerText ? <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs font-medium text-slate-500">{selectedTemplate.content.footerText}</div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
