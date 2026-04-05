import { InvoiceListPage } from "@/components/invoices/invoice-list-page";

export default async function PurchaseInvoiceListRoute() {
  return (
    <InvoiceListPage
      direction="PURCHASE"
      title="Alış Faturaları"
      subtitle="Alış faturalarını ayrı ekranda yönetin, ödeme yükünü net görün."
      currentPath="/panel/alis-faturalari"
    />
  );
}
