import { InvoiceListPage } from "@/components/invoices/invoice-list-page";

export default async function SalesInvoiceListRoute() {
  return (
    <InvoiceListPage
      direction="SALES"
      title="Satış Faturaları"
      subtitle="Satış faturalarını ayrı ekranda yönetin, tahsilat tarafını net görün."
      currentPath="/panel/satis-faturalari"
    />
  );
}
