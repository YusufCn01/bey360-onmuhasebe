import { EInvoiceDocument, EInvoiceScenario, EInvoiceSettings, Invoice, InvoiceItem, Product, Tenant } from "@prisma/client";

type InvoiceWithRelations = Invoice & {
  items: Array<InvoiceItem & { product?: Product | null }>;
  customer: { name: string; taxNumber: string | null; city: string | null } | null;
  supplier: { name: string; city: string | null } | null;
  branch?: {
    name: string;
    city: string | null;
    district: string | null;
    address: string | null;
    phone: string | null;
  } | null;
};

function escapeXml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decimal(value: number, digits = 2) {
  return Number(value).toFixed(digits);
}

function onlyDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

function companyIdScheme(value: string | null | undefined) {
  const digits = onlyDigits(value);
  return digits.length === 11 ? "TCKN" : "VKN";
}

function resolveProfileId(scenario: EInvoiceScenario) {
  switch (scenario) {
    case "E_ARCHIVE":
      return "EARSIVFATURA";
    case "E_INVOICE_COMMERCIAL":
      return "TICARIFATURA";
    default:
      return "TEMELFATURA";
  }
}

function resolveInvoiceTypeCode(direction: Invoice["direction"]) {
  return direction === "SALES" ? "SATIS" : "IADE";
}

function unitCode(unit: string | null | undefined) {
  const value = (unit ?? "").trim().toLowerCase();
  if (["kg", "kilogram"].includes(value)) return "KGM";
  if (["gram", "g"].includes(value)) return "GRM";
  if (["lt", "l", "litre"].includes(value)) return "LTR";
  if (["metre", "m"].includes(value)) return "MTR";
  if (["kutu"].includes(value)) return "BX";
  return "NIU";
}

function buildAddress({
  city,
  district,
  address,
}: {
  city?: string | null;
  district?: string | null;
  address?: string | null;
}) {
  return `
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(address || district || city || "-")}</cbc:StreetName>
        <cbc:CitySubdivisionName>${escapeXml(district || city || "-")}</cbc:CitySubdivisionName>
        <cbc:CityName>${escapeXml(city || "-")}</cbc:CityName>
        <cac:Country>
          <cbc:Name>Türkiye</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>`;
}

function buildParty({
  title,
  taxNumber,
  city,
  district,
  address,
}: {
  title: string;
  taxNumber?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
}) {
  const normalizedTaxNumber = onlyDigits(taxNumber);
  const schemeId = companyIdScheme(normalizedTaxNumber);

  return `
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${escapeXml(schemeId)}">${escapeXml(normalizedTaxNumber)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(title)}</cbc:Name>
      </cac:PartyName>${buildAddress({ city, district, address })}
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>Vergi Dairesi</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>`;
}

export function buildPreliminaryUblXml({
  tenant,
  settings,
  document,
  invoice,
}: {
  tenant: Tenant;
  settings: EInvoiceSettings | null;
  document: EInvoiceDocument;
  invoice: InvoiceWithRelations;
}) {
  const supplierTitle = settings?.senderTitle ?? tenant.name;
  const supplierTaxNumber = settings?.senderTaxNumber ?? tenant.taxNumber ?? "";
  const receiver = invoice.customer
    ? {
        title: invoice.customer.name,
        taxNumber: invoice.customer.taxNumber ?? "",
        city: invoice.customer.city,
        district: null,
        address: null,
      }
    : {
        title: invoice.supplier?.name ?? "Genel Cari",
        taxNumber: "",
        city: invoice.supplier?.city ?? null,
        district: null,
        address: null,
      };

  const supplierCity = invoice.branch?.city ?? tenant.city;
  const supplierDistrict = invoice.branch?.district ?? tenant.district;
  const supplierAddress = invoice.branch?.address ?? tenant.address;
  const issueDate = invoice.issueDate.toISOString().slice(0, 10);
  const issueTime = invoice.issueDate.toISOString().slice(11, 19);
  const taxAmount = Number(invoice.vatTotal);
  const lineExtensionAmount = Number(invoice.subtotal);
  const taxInclusiveAmount = Number(invoice.grandTotal);
  const payableAmount = Number(invoice.grandTotal);
  const lineCount = invoice.items.length;
  const profileId = resolveProfileId(document.scenario);
  const invoiceTypeCode = resolveInvoiceTypeCode(invoice.direction);
  const documentUuid = document.envelopeUuid ?? document.externalId ?? invoice.id;
  const note = invoice.note ?? document.responseNote ?? "Bey360 tarafından üretilen ön UBL çıktısı";

  const lines = invoice.items
    .map((item, index) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const vatRate = Number(item.vatRate);
      const lineNet = quantity * unitPrice;
      const lineVat = lineNet * (vatRate / 100);

      return `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${unitCode(item.product?.unit)}">${escapeXml(decimal(quantity, 3))}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">${escapeXml(decimal(lineNet))}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="TRY">${escapeXml(decimal(lineVat))}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="TRY">${escapeXml(decimal(lineNet))}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="TRY">${escapeXml(decimal(lineVat))}</cbc:TaxAmount>
        <cbc:Percent>${escapeXml(decimal(vatRate, 2))}</cbc:Percent>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:Name>KDV</cbc:Name>
            <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${escapeXml(item.description)}</cbc:Name>
      <cac:SellersItemIdentification>
        <cbc:ID>${escapeXml(item.product?.code ?? item.productId ?? `SATIR-${index + 1}`)}</cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="TRY">${escapeXml(decimal(unitPrice))}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent />
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2.1</cbc:CustomizationID>
  <cbc:ProfileID>${escapeXml(profileId)}</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoice.invoiceNo)}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${escapeXml(documentUuid)}</cbc:UUID>
  <cbc:IssueDate>${escapeXml(issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${escapeXml(issueTime)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>${escapeXml(invoiceTypeCode)}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${lineCount}</cbc:LineCountNumeric>
  <cbc:Note>${escapeXml(note)}</cbc:Note>
  <cac:AccountingSupplierParty>${buildParty({
    title: supplierTitle,
    taxNumber: supplierTaxNumber,
    city: supplierCity,
    district: supplierDistrict,
    address: supplierAddress,
  })}
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>${buildParty({
    title: receiver.title,
    taxNumber: receiver.taxNumber,
    city: receiver.city,
    district: receiver.district,
    address: receiver.address,
  })}
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="TRY">${escapeXml(decimal(taxAmount))}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="TRY">${escapeXml(decimal(lineExtensionAmount))}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="TRY">${escapeXml(decimal(taxAmount))}</cbc:TaxAmount>
      <cbc:Percent>20.00</cbc:Percent>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>KDV</cbc:Name>
          <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="TRY">${escapeXml(decimal(lineExtensionAmount))}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="TRY">${escapeXml(decimal(lineExtensionAmount))}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="TRY">${escapeXml(decimal(taxInclusiveAmount))}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="TRY">0.00</cbc:AllowanceTotalAmount>
    <cbc:PayableAmount currencyID="TRY">${escapeXml(decimal(payableAmount))}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${lines}
</Invoice>`;
}
