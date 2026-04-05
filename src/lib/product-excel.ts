import { Product } from "@prisma/client";
import * as XLSX from "xlsx";

export type ProductExcelPayload = {
  code: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  description: string;
  salePrice: string;
  salePrice2: string;
  salePrice3: string;
  salePrice4: string;
  purchasePrice: string;
  stockQty: string;
  vatRate: string;
  imageUrl: string;
};

export type ProductPriceUpdatePayload = {
  code: string;
  barcode: string;
  name: string;
  salePrice: string;
  salePrice2: string;
  salePrice3: string;
  salePrice4: string;
  purchasePrice: string;
};

export const productExcelHeaders = [
  "Kodu",
  "Barkod",
  "Ürün / Hizmet Adı",
  "Kategori",
  "Marka",
  "Birim",
  "Açıklama",
  "Satış Fiyatı 1",
  "Satış Fiyatı 2",
  "Satış Fiyatı 3",
  "Satış Fiyatı 4",
  "Alış Fiyatı",
  "Stok Miktarı",
  "KDV Oranı",
  "Görsel URL",
] as const;

export const productPriceHeaders = [
  "Kodu",
  "Barkod",
  "Ürün / Hizmet Adı",
  "Satış Fiyatı 1",
  "Satış Fiyatı 2",
  "Satış Fiyatı 3",
  "Satış Fiyatı 4",
  "Alış Fiyatı",
] as const;

type ProductExcelRow = Record<(typeof productExcelHeaders)[number], string | number>;
type ProductPriceRow = Record<(typeof productPriceHeaders)[number], string | number>;

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

function productToExcelRow(product: Product): ProductExcelRow {
  return {
    "Kodu": product.code,
    "Barkod": product.barcode ?? "",
    "Ürün / Hizmet Adı": product.name,
    "Kategori": product.category ?? "",
    "Marka": product.brand ?? "",
    "Birim": product.unit,
    "Açıklama": product.description ?? "",
    "Satış Fiyatı 1": product.salePrice,
    "Satış Fiyatı 2": product.salePrice2,
    "Satış Fiyatı 3": product.salePrice3,
    "Satış Fiyatı 4": product.salePrice4,
    "Alış Fiyatı": product.purchasePrice,
    "Stok Miktarı": product.stockQty,
    "KDV Oranı": product.vatRate,
    "Görsel URL": product.imageUrl ?? "",
  };
}

function productToPriceRow(product: Product): ProductPriceRow {
  return {
    "Kodu": product.code,
    "Barkod": product.barcode ?? "",
    "Ürün / Hizmet Adı": product.name,
    "Satış Fiyatı 1": product.salePrice,
    "Satış Fiyatı 2": product.salePrice2,
    "Satış Fiyatı 3": product.salePrice3,
    "Satış Fiyatı 4": product.salePrice4,
    "Alış Fiyatı": product.purchasePrice,
  };
}

function buildSampleProductRow(): ProductExcelRow {
  return {
    "Kodu": "URN-0001",
    "Barkod": "8680000000000",
    "Ürün / Hizmet Adı": "Örnek Ürün",
    "Kategori": "İçecek",
    "Marka": "Bey360",
    "Birim": "Adet",
    "Açıklama": "Örnek ürün açıklaması",
    "Satış Fiyatı 1": 125,
    "Satış Fiyatı 2": 115,
    "Satış Fiyatı 3": 110,
    "Satış Fiyatı 4": 105,
    "Alış Fiyatı": 90,
    "Stok Miktarı": 25,
    "KDV Oranı": 20,
    "Görsel URL": "",
  };
}

function buildSamplePriceRow(): ProductPriceRow {
  return {
    "Kodu": "URN-0001",
    "Barkod": "8680000000000",
    "Ürün / Hizmet Adı": "Örnek Ürün",
    "Satış Fiyatı 1": 125,
    "Satış Fiyatı 2": 115,
    "Satış Fiyatı 3": 110,
    "Satış Fiyatı 4": 105,
    "Alış Fiyatı": 90,
  };
}

export function createProductTemplateWorkbook() {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet([buildSampleProductRow()], { header: [...productExcelHeaders] });
  XLSX.utils.book_append_sheet(workbook, worksheet, "Urunler");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function createProductExportWorkbook(products: Product[]) {
  const workbook = XLSX.utils.book_new();
  const rows = products.map(productToExcelRow);
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...productExcelHeaders] });
  XLSX.utils.book_append_sheet(workbook, worksheet, "Urunler");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function createProductPriceTemplateWorkbook(products: Product[] = []) {
  const workbook = XLSX.utils.book_new();
  const rows = products.length ? products.map(productToPriceRow) : [buildSamplePriceRow()];
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...productPriceHeaders] });
  XLSX.utils.book_append_sheet(workbook, worksheet, "TopluFiyat");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function parseProductWorkbook(buffer: ArrayBuffer): ProductExcelPayload[] {
  const workbook = XLSX.read(Buffer.from(buffer), { type: "buffer" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(worksheet, { defval: "" });

  return rows.map((row) => ({
    code: getRowValue(row, "Kodu"),
    barcode: getRowValue(row, "Barkod"),
    name: getRowValue(row, "Ürün / Hizmet Adı"),
    category: getRowValue(row, "Kategori"),
    brand: getRowValue(row, "Marka"),
    unit: getRowValue(row, "Birim"),
    description: getRowValue(row, "Açıklama"),
    salePrice: getRowValue(row, "Satış Fiyatı 1"),
    salePrice2: getRowValue(row, "Satış Fiyatı 2"),
    salePrice3: getRowValue(row, "Satış Fiyatı 3"),
    salePrice4: getRowValue(row, "Satış Fiyatı 4"),
    purchasePrice: getRowValue(row, "Alış Fiyatı"),
    stockQty: getRowValue(row, "Stok Miktarı"),
    vatRate: getRowValue(row, "KDV Oranı"),
    imageUrl: getRowValue(row, "Görsel URL"),
  }));
}

export function parseProductPriceWorkbook(buffer: ArrayBuffer): ProductPriceUpdatePayload[] {
  const workbook = XLSX.read(Buffer.from(buffer), { type: "buffer" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(worksheet, { defval: "" });

  return rows.map((row) => ({
    code: getRowValue(row, "Kodu"),
    barcode: getRowValue(row, "Barkod"),
    name: getRowValue(row, "Ürün / Hizmet Adı"),
    salePrice: getRowValue(row, "Satış Fiyatı 1"),
    salePrice2: getRowValue(row, "Satış Fiyatı 2"),
    salePrice3: getRowValue(row, "Satış Fiyatı 3"),
    salePrice4: getRowValue(row, "Satış Fiyatı 4"),
    purchasePrice: getRowValue(row, "Alış Fiyatı"),
  }));
}
