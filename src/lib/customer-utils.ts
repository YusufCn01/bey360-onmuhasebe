import { CustomerType, Prisma } from "@prisma/client";

export type CustomerPayload = {
  code?: string;
  type?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  address?: string;
  country?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  taxOffice?: string;
  taxNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  authorizedName?: string;
  authorizedEmail?: string;
  fax?: string;
  category?: string;
  currencyCode?: string;
  balance?: string | number;
  openingBalance?: string | number;
  openingBalanceDate?: string;
  phoneCountryCode?: string;
  currentDebt?: string | number;
  currentCredit?: string | number;
  eInvoiceRegistered?: boolean;
  eInvoiceAlias?: string;
  eInvoiceCheckNote?: string;
};

function clean(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value) {
    return 0;
  }

  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeCustomerType(value: string | null | undefined) {
  if (value === "1" || value?.toUpperCase() === "INDIVIDUAL") {
    return CustomerType.INDIVIDUAL;
  }

  return CustomerType.CORPORATE;
}

export function buildCustomerDisplayName(payload: CustomerPayload, type: CustomerType) {
  const explicitName = clean(payload.name);
  if (explicitName) {
    return explicitName;
  }

  if (type === CustomerType.CORPORATE) {
    return clean(payload.title) ?? "";
  }

  return [clean(payload.firstName), clean(payload.lastName)].filter(Boolean).join(" ");
}

export function buildCustomerWriteData(payload: CustomerPayload): Prisma.CustomerUncheckedCreateInput {
  const type = normalizeCustomerType(payload.type);
  const displayName = buildCustomerDisplayName(payload, type);
  const openingBalance = parseNumber(payload.openingBalance ?? payload.balance);
  const explicitDebt = parseNumber(payload.currentDebt);
  const explicitCredit = parseNumber(payload.currentCredit);
  const currentDebt = explicitDebt || explicitCredit ? explicitDebt : openingBalance > 0 ? openingBalance : 0;
  const currentCredit = explicitDebt || explicitCredit ? explicitCredit : openingBalance < 0 ? Math.abs(openingBalance) : 0;
  const openingBalanceDate = clean(payload.openingBalanceDate);
  const parsedOpeningBalanceDate = openingBalanceDate ? new Date(openingBalanceDate) : null;

  return {
    tenantId: "",
    code: clean(payload.code) ?? "",
    type,
    name: displayName,
    title: clean(payload.title),
    firstName: clean(payload.firstName),
    lastName: clean(payload.lastName),
    address: clean(payload.address),
    country: clean(payload.country),
    city: clean(payload.city),
    district: clean(payload.district),
    postalCode: clean(payload.postalCode),
    taxOffice: clean(payload.taxOffice),
    taxNumber: clean(payload.taxNumber),
    phone: clean(payload.phone),
    email: clean(payload.email),
    website: clean(payload.website),
    authorizedName: clean(payload.authorizedName),
    authorizedEmail: clean(payload.authorizedEmail),
    fax: clean(payload.fax),
    category: clean(payload.category),
    currencyCode: clean(payload.currencyCode) ?? "TRY",
    openingBalance,
    phoneCountryCode: clean(payload.phoneCountryCode),
    openingBalanceDate: parsedOpeningBalanceDate && !Number.isNaN(parsedOpeningBalanceDate.getTime()) ? parsedOpeningBalanceDate : null,
    currentDebt,
    currentCredit,
    eInvoiceRegistered: payload.eInvoiceRegistered ?? null,
    eInvoiceAlias: clean(payload.eInvoiceAlias),
    eInvoiceCheckNote: clean(payload.eInvoiceCheckNote),
  };
}

export function toExcelCustomerType(type: CustomerType) {
  return type === CustomerType.INDIVIDUAL ? 1 : 2;
}
