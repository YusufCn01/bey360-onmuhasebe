import { InvoiceListPage } from "@/components/invoices/invoice-list-page";

export default async function PurchaseInvoicesPage() {
  return (
    <InvoiceListPage
      direction="PURCHASE"
      title="Alışlar"
      subtitle="Bu ekran yalnızca alış faturalarını gösterir. Yeni alış faturası ayrı sayfadan açılır."
      currentPath="/panel/alislar"
    />
  );
}
