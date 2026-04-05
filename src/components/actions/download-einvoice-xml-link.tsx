export function DownloadEInvoiceXmlLink({ documentId }: { documentId: string }) {
  return (
    <a
      href={`/api/panel/einvoice-documents/${documentId}/ubl`}
      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-100"
      target="_blank"
      rel="noreferrer"
    >
      UBL / XML
    </a>
  );
}
