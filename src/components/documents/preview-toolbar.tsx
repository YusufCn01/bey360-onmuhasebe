"use client";

import Link from "next/link";

const text = {
  back: "Listeye D\u00f6n",
  downloadHtml: "HTML \u0130ndir",
  shareEmail: "E-posta Payla\u015f",
  printPdf: "PDF / Yazd\u0131r",
  emailBody: "Belge ba\u011flant\u0131s\u0131",
  emailHelp: "Bu ba\u011flant\u0131y\u0131 taray\u0131c\u0131da a\u00e7arak belge \u00f6nizlemesini g\u00f6r\u00fcnt\u00fcleyebilirsiniz.",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replaceAll("\u0131", "i")
    .replaceAll("\u011f", "g")
    .replaceAll("\u00fc", "u")
    .replaceAll("\u015f", "s")
    .replaceAll("\u00f6", "o")
    .replaceAll("\u00e7", "c")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function downloadHtmlFile(documentTitle: string) {
  const html = document.documentElement.outerHTML;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${slugify(documentTitle) || "belge"}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function shareViaEmail(documentTitle: string) {
  const body = [`${text.emailBody}: ${window.location.href}`, "", text.emailHelp].join("\n");
  window.location.href = `mailto:?subject=${encodeURIComponent(documentTitle)}&body=${encodeURIComponent(body)}`;
}

export function PreviewToolbar({ backHref, documentTitle }: { backHref: string; documentTitle: string }) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={backHref} className="rounded-[10px] border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            {text.back}
          </Link>
          <button
            type="button"
            onClick={() => downloadHtmlFile(documentTitle)}
            className="rounded-[10px] border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            {text.downloadHtml}
          </button>
          <button
            type="button"
            onClick={() => shareViaEmail(documentTitle)}
            className="rounded-[10px] border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            {text.shareEmail}
          </button>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-[10px] bg-[var(--brand)] px-4 py-2 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]"
        >
          {text.printPdf}
        </button>
      </div>
    </div>
  );
}
