import { Customer, CustomerType } from "@prisma/client";
import * as XLSX from "xlsx";
import type { CustomerPayload } from "@/lib/customer-utils";
import { toExcelCustomerType } from "@/lib/customer-utils";

export type CustomerExcelFormat = "logo" | "hizli-bilisim";

export const logoCustomerExcelHeaders = [
  "Kodu",
  "Tipi (1: Bireysel / 2: Kurumsal)",
  "Ünvanı",
  "Adı",
  "Soyadı",
  "Adres",
  "Ülke",
  "İl",
  "İlçe",
  "Posta Kodu",
  "Vergi Dairesi",
  "Vergi No",
  "Telefon",
  "Mail Adresi",
  "Web Adresi",
  "Yetkili İsim Soyisim",
  "Yetkili E-Posta",
  "Fax",
  "Kategori",
  "Döviz Cinsi",
  "Bakiye",
  "Ülke Telefon Alan Kodu",
  "Açılış Bakiyesi Tarihi",
] as const;

export const hizliBilisimCustomerExcelHeaders = [
  "MUSTERI_KODU",
  "VERGI_DAIRESI",
  "ULKE_ADI",
  "IL_ADI",
  "ILCE_ADI",
  "VERGI_NO_TC_NO",
  "FIRMA_ADI",
  "ADI",
  "SOYADI",
  "MAHALLE_SEMT",
  "CADDE_SOKAK",
  "POSTAKODU",
  "TELEFON",
  "FAX",
  "EMAIL",
  "WEB_SITE",
  "DURUM",
  "BINA_ADI",
  "KAPI_NO",
] as const;

type LogoCustomerExcelRow = Record<(typeof logoCustomerExcelHeaders)[number], string | number>;
type HizliCustomerExcelRow = Record<(typeof hizliBilisimCustomerExcelHeaders)[number], string | number>;

function normalizeCell(value: unknown) {
  if (value == null) return "";
  return String(value).trim();
}

function getRowValue(row: Record<string, string | number>, key: string) {
  if (key in row) {
    return normalizeCell(row[key]);
  }

  const foundKey = Object.keys(row).find((rowKey) => rowKey.trim().toUpperCase() === key.trim().toUpperCase());
  return foundKey ? normalizeCell(row[foundKey]) : "";
}

export function normalizeCustomerExcelFormat(value: string | null | undefined): CustomerExcelFormat {
  return value === "hizli-bilisim" ? "hizli-bilisim" : "logo";
}

function buildLogoSampleRow(): LogoCustomerExcelRow {
  return {
    "Kodu": "CR0003",
    "Tipi (1: Bireysel / 2: Kurumsal)": 2,
    "Ünvanı": "Örnek Ticaret Ltd. Şti.",
    "Adı": "",
    "Soyadı": "",
    "Adres": "Örnek Mah. Demo Cad. No:10",
    "Ülke": "Türkiye",
    "İl": "İstanbul",
    "İlçe": "Şişli",
    "Posta Kodu": "34394",
    "Vergi Dairesi": "Şişli",
    "Vergi No": "1234567890",
    "Telefon": "2125551010",
    "Mail Adresi": "info@ornek.com",
    "Web Adresi": "https://ornek.com",
    "Yetkili İsim Soyisim": "Ayşe Yılmaz",
    "Yetkili E-Posta": "ayse@ornek.com",
    "Fax": "2125551011",
    "Kategori": "Bayi",
    "Döviz Cinsi": "TRY",
    "Bakiye": 0,
    "Ülke Telefon Alan Kodu": "+90",
    "Açılış Bakiyesi Tarihi": "2026-01-01",
  };
}

function buildHizliSampleRow(): HizliCustomerExcelRow {
  return {
    "MUSTERI_KODU": "HZL0001",
    "VERGI_DAIRESI": "Şişli",
    "ULKE_ADI": "Türkiye",
    "IL_ADI": "İstanbul",
    "ILCE_ADI": "Şişli",
    "VERGI_NO_TC_NO": "1234567890",
    "FIRMA_ADI": "Örnek Ticaret Ltd. Şti.",
    "ADI": "",
    "SOYADI": "",
    "MAHALLE_SEMT": "Merkez Mah.",
    "CADDE_SOKAK": "Demo Cad. No:10",
    "POSTAKODU": "34394",
    "TELEFON": "2125551010",
    "FAX": "2125551011",
    "EMAIL": "info@ornek.com",
    "WEB_SITE": "https://ornek.com",
    "DURUM": "Aktif",
    "BINA_ADI": "",
    "KAPI_NO": "",
  };
}

export function createCustomerTemplateWorkbook(format: CustomerExcelFormat = "logo") {
  const workbook = XLSX.utils.book_new();

  if (format === "hizli-bilisim") {
    const worksheet = XLSX.utils.json_to_sheet([buildHizliSampleRow()], { header: [...hizliBilisimCustomerExcelHeaders] });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cariler");
  } else {
    const worksheet = XLSX.utils.json_to_sheet([buildLogoSampleRow()], { header: [...logoCustomerExcelHeaders] });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Musteriler");
  }

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

function mapLogoRow(row: Record<string, string | number>): CustomerPayload {
  return {
    code: getRowValue(row, "Kodu"),
    type: getRowValue(row, "Tipi (1: Bireysel / 2: Kurumsal)"),
    title: getRowValue(row, "Ünvanı"),
    firstName: getRowValue(row, "Adı"),
    lastName: getRowValue(row, "Soyadı"),
    address: getRowValue(row, "Adres"),
    country: getRowValue(row, "Ülke"),
    city: getRowValue(row, "İl"),
    district: getRowValue(row, "İlçe"),
    postalCode: getRowValue(row, "Posta Kodu"),
    taxOffice: getRowValue(row, "Vergi Dairesi"),
    taxNumber: getRowValue(row, "Vergi No"),
    phone: getRowValue(row, "Telefon"),
    email: getRowValue(row, "Mail Adresi") || getRowValue(row, "mail adresi"),
    website: getRowValue(row, "Web Adresi"),
    authorizedName: getRowValue(row, "Yetkili İsim Soyisim"),
    authorizedEmail: getRowValue(row, "Yetkili E-Posta"),
    fax: getRowValue(row, "Fax"),
    category: getRowValue(row, "Kategori"),
    currencyCode: getRowValue(row, "Döviz Cinsi"),
    balance: getRowValue(row, "Bakiye"),
    phoneCountryCode: getRowValue(row, "Ülke Telefon Alan Kodu"),
    openingBalanceDate: getRowValue(row, "Açılış Bakiyesi Tarihi"),
  };
}

function mapHizliRow(row: Record<string, string | number>): CustomerPayload {
  const firstName = getRowValue(row, "ADI");
  const lastName = getRowValue(row, "SOYADI");
  const neighborhood = getRowValue(row, "MAHALLE_SEMT");
  const street = getRowValue(row, "CADDE_SOKAK");
  const building = getRowValue(row, "BINA_ADI");
  const doorNo = getRowValue(row, "KAPI_NO");
  const address = [neighborhood, street, building, doorNo].filter(Boolean).join(" ").trim();
  const hasIndividualName = Boolean(firstName || lastName);

  return {
    code: getRowValue(row, "MUSTERI_KODU"),
    type: hasIndividualName ? "1" : "2",
    title: getRowValue(row, "FIRMA_ADI"),
    firstName,
    lastName,
    address,
    country: getRowValue(row, "ULKE_ADI"),
    city: getRowValue(row, "IL_ADI"),
    district: getRowValue(row, "ILCE_ADI"),
    postalCode: getRowValue(row, "POSTAKODU"),
    taxOffice: getRowValue(row, "VERGI_DAIRESI"),
    taxNumber: getRowValue(row, "VERGI_NO_TC_NO"),
    phone: getRowValue(row, "TELEFON"),
    email: getRowValue(row, "EMAIL"),
    website: getRowValue(row, "WEB_SITE"),
    fax: getRowValue(row, "FAX"),
  };
}

export function parseCustomerWorkbook(buffer: ArrayBuffer, format: CustomerExcelFormat = "logo") {
  const workbook = XLSX.read(Buffer.from(buffer), { type: "buffer" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(worksheet, { defval: "" });

  return rows.map((row) => (format === "hizli-bilisim" ? mapHizliRow(row) : mapLogoRow(row)));
}

function customerToLogoRow(customer: Customer): LogoCustomerExcelRow {
  return {
    "Kodu": customer.code,
    "Tipi (1: Bireysel / 2: Kurumsal)": toExcelCustomerType(customer.type),
    "Ünvanı": customer.type === CustomerType.CORPORATE ? customer.title ?? customer.name : "",
    "Adı": customer.firstName ?? "",
    "Soyadı": customer.lastName ?? "",
    "Adres": customer.address ?? "",
    "Ülke": customer.country ?? "",
    "İl": customer.city ?? "",
    "İlçe": customer.district ?? "",
    "Posta Kodu": customer.postalCode ?? "",
    "Vergi Dairesi": customer.taxOffice ?? "",
    "Vergi No": customer.taxNumber ?? "",
    "Telefon": customer.phone ?? "",
    "Mail Adresi": customer.email ?? "",
    "Web Adresi": customer.website ?? "",
    "Yetkili İsim Soyisim": customer.authorizedName ?? "",
    "Yetkili E-Posta": customer.authorizedEmail ?? "",
    "Fax": customer.fax ?? "",
    "Kategori": customer.category ?? "",
    "Döviz Cinsi": customer.currencyCode ?? "TRY",
    "Bakiye": customer.openingBalance ?? 0,
    "Ülke Telefon Alan Kodu": customer.phoneCountryCode ?? "",
    "Açılış Bakiyesi Tarihi": customer.openingBalanceDate ? customer.openingBalanceDate.toISOString().slice(0, 10) : "",
  };
}

function customerToHizliRow(customer: Customer): HizliCustomerExcelRow {
  return {
    "MUSTERI_KODU": customer.code,
    "VERGI_DAIRESI": customer.taxOffice ?? "",
    "ULKE_ADI": customer.country ?? "",
    "IL_ADI": customer.city ?? "",
    "ILCE_ADI": customer.district ?? "",
    "VERGI_NO_TC_NO": customer.taxNumber ?? "",
    "FIRMA_ADI": customer.type === CustomerType.CORPORATE ? customer.title ?? customer.name : customer.name,
    "ADI": customer.firstName ?? "",
    "SOYADI": customer.lastName ?? "",
    "MAHALLE_SEMT": "",
    "CADDE_SOKAK": customer.address ?? "",
    "POSTAKODU": customer.postalCode ?? "",
    "TELEFON": customer.phone ?? "",
    "FAX": customer.fax ?? "",
    "EMAIL": customer.email ?? "",
    "WEB_SITE": customer.website ?? "",
    "DURUM": "Aktif",
    "BINA_ADI": "",
    "KAPI_NO": "",
  };
}

export function createCustomerExportWorkbook(customers: Customer[], format: CustomerExcelFormat = "logo") {
  const workbook = XLSX.utils.book_new();

  if (format === "hizli-bilisim") {
    const rows = customers.map(customerToHizliRow);
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...hizliBilisimCustomerExcelHeaders] });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cariler");
  } else {
    const rows = customers.map(customerToLogoRow);
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...logoCustomerExcelHeaders] });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Musteriler");
  }

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
