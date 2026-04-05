import { InvoiceListPage } from "@/components/invoices/invoice-list-page";

export default async function SalesInvoicesPage() {
  return (
    <InvoiceListPage
      direction="SALES"
      title="Satışlar"
      subtitle="Bu ekran yalnızca satış faturalarını gösterir. Yeni satış faturası ayrı sayfadan açılır."
      currentPath="/panel/satislar"
    />
  );
}
