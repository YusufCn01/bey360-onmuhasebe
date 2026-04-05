import Image from "next/image";
import { normalizeTemplateContent, type ColumnAlign, type TemplateKind } from "@/lib/document-template-presets";

type ColumnKey = "code" | "name" | "quantity" | "unitPrice" | "lineTotal";

export type RenderDocumentLine = {
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type RenderDocumentPayload = {
  kind: TemplateKind;
  title: string;
  documentNo: string;
  issueDate: string;
  dueDate?: string | null;
  currencyCode: string;
  company: {
    name: string;
    taxNumber?: string | null;
    address?: string | null;
    city?: string | null;
    district?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
    secondaryLogoUrl?: string | null;
    signatureImageUrl?: string | null;
    stampImageUrl?: string | null;
    signatureName?: string | null;
    signatureTitle?: string | null;
  };
  recipient: {
    name: string;
    taxNumber?: string | null;
    address?: string | null;
    city?: string | null;
    district?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  lines: RenderDocumentLine[];
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  note?: string | null;
};

function money(value: number, currencyCode: string) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currencyCode === "TL" ? "TRY" : currencyCode,
  }).format(value);
}

function blockClass(style: "boxed" | "plain" | "highlight", accent: string) {
  if (style === "highlight") return { className: "border-transparent text-white", style: { backgroundColor: accent } };
  if (style === "plain") return { className: "border-slate-200 bg-slate-50 text-slate-900", style: undefined };
  return { className: "border-slate-200 bg-white text-slate-900", style: undefined };
}

function alignClass(align: ColumnAlign) {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

export function DocumentTemplateRenderer({ kind, contentJson, payload }: { kind: TemplateKind; contentJson: string; payload: RenderDocumentPayload }) {
  const content = normalizeTemplateContent(contentJson, kind);
  const primaryLogo = content.logoUrl || payload.company.logoUrl;
  const secondaryLogo = content.secondaryLogoUrl || payload.company.secondaryLogoUrl;

  return (
    <div id="document-preview-root" className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="flex items-center gap-4">
            {primaryLogo ? <Image src={primaryLogo} alt="Şablon logosu" width={96} height={56} unoptimized className="h-14 w-auto rounded-[12px] border border-slate-200 bg-white p-2" /> : null}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{payload.title}</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{content.coverTitle}</h1>
              <p className="mt-1 text-sm text-slate-500">{content.coverSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {secondaryLogo ? <Image src={secondaryLogo} alt="İkinci logo" width={96} height={56} unoptimized className="h-14 w-auto rounded-[12px] border border-slate-200 bg-white p-2" /> : null}
            <div className="rounded-[16px] px-5 py-4 text-white" style={{ backgroundColor: content.accent }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">Belge No</p>
              <p className="mt-1 text-lg font-extrabold">{payload.documentNo}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {content.blocks.map((block) => {
            const presentation = blockClass(block.style, content.accent);
            return (
              <section key={block.id} className={`rounded-[16px] border p-4 ${presentation.className} ${block.enabled ? "" : "hidden"}`} style={presentation.style}>
                <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${block.style === "highlight" ? "text-white/70" : "text-slate-400"}`}>{block.title}</p>
                <p className={`mt-1 text-sm ${block.style === "highlight" ? "text-white/90" : "text-slate-600"}`}>{block.body}</p>

                {block.type === "company" ? (
                  <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                    <div>
                      <p className="font-extrabold">{payload.company.name}</p>
                      <p>VKN: {payload.company.taxNumber ?? "-"}</p>
                      <p>{payload.company.address ?? "-"}</p>
                    </div>
                    <div>
                      <p>{[payload.company.district, payload.company.city].filter(Boolean).join(" / ") || "-"}</p>
                      <p>{payload.company.phone ?? "-"}</p>
                      <p>{payload.company.email ?? "-"}</p>
                    </div>
                  </div>
                ) : null}

                {block.type === "recipient" ? (
                  <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                    <div>
                      <p className="font-extrabold">{payload.recipient.name}</p>
                      <p>VKN: {payload.recipient.taxNumber ?? "-"}</p>
                      <p>{payload.recipient.address ?? "-"}</p>
                    </div>
                    <div>
                      <p>{[payload.recipient.district, payload.recipient.city].filter(Boolean).join(" / ") || "-"}</p>
                      <p>{payload.recipient.phone ?? "-"}</p>
                      <p>{payload.recipient.email ?? "-"}</p>
                    </div>
                  </div>
                ) : null}

                {block.type === "document" ? (
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                    <div className="rounded-[12px] bg-slate-50 px-3 py-3 text-slate-700"><span className="text-slate-500">Tarih</span><p className="mt-1 font-extrabold">{payload.issueDate}</p></div>
                    <div className="rounded-[12px] bg-slate-50 px-3 py-3 text-slate-700"><span className="text-slate-500">Vade</span><p className="mt-1 font-extrabold">{payload.dueDate ?? "-"}</p></div>
                    <div className="rounded-[12px] bg-slate-50 px-3 py-3 text-slate-700"><span className="text-slate-500">Para Birimi</span><p className="mt-1 font-extrabold">{payload.currencyCode}</p></div>
                    <div className="rounded-[12px] bg-slate-50 px-3 py-3 text-slate-700"><span className="text-slate-500">Belge Tipi</span><p className="mt-1 font-extrabold">{payload.title}</p></div>
                  </div>
                ) : null}

                {block.type === "items" ? (
                  <div className="mt-4 overflow-hidden rounded-[14px] border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          {content.itemColumns.map((column: ColumnKey) => (
                            <th key={column} style={{ width: `${content.columnSettings[column].width}%` }} className={`px-3 py-2 ${alignClass(content.columnSettings[column].align)}`}>
                              {content.columnSettings[column].label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {payload.lines.map((line) => (
                          <tr key={`${line.code}-${line.name}`} className="border-t border-slate-100">
                            {content.itemColumns.map((column: ColumnKey) => {
                              const value = column === "code" ? line.code : column === "name" ? line.name : column === "quantity" ? line.quantity : column === "unitPrice" ? money(line.unitPrice, payload.currencyCode) : money(line.lineTotal, payload.currencyCode);
                              return <td key={`${line.code}-${column}`} style={{ width: `${content.columnSettings[column].width}%` }} className={`px-3 py-2 ${alignClass(content.columnSettings[column].align)} ${column === "name" ? "font-semibold" : ""}`}>{value}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {block.type === "totals" ? (
                  <div className="mt-4 ml-auto max-w-sm space-y-2 rounded-[14px] bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Ara toplam</span><strong>{money(payload.subtotal, payload.currencyCode)}</strong></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">KDV</span><strong>{money(payload.vatTotal, payload.currencyCode)}</strong></div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base"><span className="font-semibold text-slate-700">Genel toplam</span><strong>{money(payload.grandTotal, payload.currencyCode)}</strong></div>
                  </div>
                ) : null}

                {block.type === "notes" && payload.note ? <div className="mt-4 rounded-[12px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{payload.note}</div> : null}

                {block.type === "signature" ? (
                  <div className="mt-4 space-y-4 text-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-[12px] border border-dashed border-slate-300 px-4 py-6">
                        <p className="font-bold text-slate-700">{content.signatureSettings.leftLabel}</p>
                        {payload.company.signatureImageUrl ? <Image src={payload.company.signatureImageUrl} alt="İmza" width={120} height={60} unoptimized className="mt-3 h-14 w-auto object-contain" /> : null}
                        {payload.company.signatureName ? <p className="mt-3 font-semibold text-slate-900">{payload.company.signatureName}</p> : null}
                        {payload.company.signatureTitle ? <p className="text-xs text-slate-500">{payload.company.signatureTitle}</p> : null}
                      </div>
                      <div className="rounded-[12px] border border-dashed border-slate-300 px-4 py-6">
                        <p className="font-bold text-slate-700">{content.signatureSettings.rightLabel}</p>
                        {payload.company.stampImageUrl ? (
                          <Image src={payload.company.stampImageUrl} alt="Kaşe / mühür" width={110} height={110} unoptimized className="mt-3 h-20 w-auto object-contain opacity-90" />
                        ) : null}
                        <p className={`${payload.company.stampImageUrl ? "mt-4" : "mt-16"} text-xs text-slate-400`}>Kaşe / mühür alanı</p>
                      </div>
                    </div>
                    {content.signatureSettings.note ? <p className="text-xs text-slate-500">{content.signatureSettings.note}</p> : null}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        {content.footerText ? <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs font-medium text-slate-500">{content.footerText}</div> : null}
      </div>
    </div>
  );
}
