import { EInvoiceDocument, EInvoiceScenario, EInvoiceSettings, Invoice, InvoiceItem, Product, Tenant } from "@prisma/client";

type InvoiceWithRelations = Invoice & {
  items: Array<InvoiceItem & { product?: Product | null }>;
  customer: {
    name: string;
    title?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    taxNumber: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    district?: string | null;
    address?: string | null;
    country?: string | null;
    postalCode?: string | null;
    taxOffice?: string | null;
  } | null;
  supplier: { name: string; email: string | null; phone: string | null; city: string | null } | null;
  branch?: { name: string; city: string | null; district: string | null; address: string | null; phone: string | null } | null;
};

type HizliBilisimSendInput = {
  tenant: Tenant;
  settings: EInvoiceSettings;
  document: EInvoiceDocument;
  invoice: InvoiceWithRelations;
  xmlContent: string;
};

type LoginResult = {
  success: boolean;
  note: string;
  token?: string | null;
  rawResponse?: string | null;
  data?: Record<string, unknown> | null;
};

export type HizliBilisimSendResult = {
  success: boolean;
  note: string;
  externalId?: string | null;
  envelopeUuid?: string | null;
  rawResponse?: string | null;
  sourceUrn?: string | null;
  destinationUrn?: string | null;
};

export type HizliBilisimConnectionTestResult = {
  success: boolean;
  note: string;
  customerName?: string | null;
  vkn?: string | null;
  gb?: string | null;
  token?: string | null;
};

export type HizliBilisimCreditInfoResult = {
  success: boolean;
  note: string;
  totalCredit?: number | null;
  remainCredit?: number | null;
  rawResponse?: string | null;
};

export type HizliBilisimDashboardInfoResult = {
  success: boolean;
  note: string;
  creditTotal?: number | null;
  creditRemainder?: number | null;
  outboxCount?: number | null;
  archiveCount?: number | null;
  inboxCount?: number | null;
  despatchOutboxCount?: number | null;
  despatchInboxCount?: number | null;
  rawResponse?: string | null;
};

export type HizliBilisimDocument = {
  uuid?: string | null;
  envelopeUuid?: string | null;
  appType?: number | null;
  isArchive?: boolean | null;
  isRead?: boolean | null;
  isPrinted?: boolean | null;
  documentId?: string | null;
  documentTypeCode?: string | null;
  profileId?: string | null;
  documentCurrencyCode?: string | null;
  targetTitle?: string | null;
  targetIdentifier?: string | null;
  targetAlias?: string | null;
  sourceAlias?: string | null;
  taxTotal?: number | null;
  payableAmount?: number | null;
  localReferenceId?: string | null;
  status?: number | null;
  statusExp?: string | null;
  envelopeStatus?: number | null;
  envelopeExp?: string | null;
  message?: string | null;
  issueDate?: string | null;
  createdDate?: string | null;
  cancelDate?: string | null;
  branchCode?: number | null;
  vatSummary?: string | null;
  hasEmail?: boolean | null;
  prefixAndYear?: string | null;
  isInvoiced?: boolean | null;
  isPaid?: boolean | null;
  raw?: Record<string, unknown>;
};

export type HizliBilisimDocumentListResult = {
  success: boolean;
  note: string;
  documents: HizliBilisimDocument[];
  rawResponse?: string | null;
};

export type HizliBilisimDocumentFileResult = {
  success: boolean;
  note: string;
  documentFile?: string | null;
  rawResponse?: string | null;
};

type FlatRecord = Record<string, unknown>;

function onlyDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeServiceRoots(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Hızlı Bilişim servis adresi tanımlı değil.");
  }

  const normalized = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
  const withoutTrailingSlash = normalized.replace(/\/+$/, "");

  if (withoutTrailingSlash.includes("/HizliApi/RestApi")) {
    return {
      serviceUrl: withoutTrailingSlash.replace(/\/HizliApi\/RestApi.*$/i, "/Services/HizliService.svc"),
      restBase: withoutTrailingSlash.replace(/\/+$/, ""),
    };
  }

  if (withoutTrailingSlash.toLowerCase().includes("/services/hizliservice.svc")) {
    return {
      serviceUrl: withoutTrailingSlash,
      restBase: withoutTrailingSlash.replace(/\/Services\/HizliService\.svc$/i, "/HizliApi/RestApi"),
    };
  }

  const root = withoutTrailingSlash.replace(/\/+$/, "");
  return {
    serviceUrl: `${root}/Services/HizliService.svc`,
    restBase: `${root}/HizliApi/RestApi`,
  };
}

function parseResponse(rawResponse: string) {
  if (!rawResponse) return null;
  try {
    const parsed = JSON.parse(rawResponse) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    if (Array.isArray(parsed)) {
      const firstItem = parsed.find((item) => item && typeof item === "object" && !Array.isArray(item));
      return {
        data: firstItem && typeof firstItem === "object" ? (firstItem as Record<string, unknown>) : parsed[0] ?? null,
        items: parsed,
      };
    }
    return { data: parsed };
  } catch {
    return { rawText: rawResponse };
  }
}

function flattenRecord(input: unknown, prefix = "", target: FlatRecord = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return target;

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    target[nextKey] = value;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenRecord(value, nextKey, target);
    }
  }

  return target;
}

function readText(fields: FlatRecord, keys: string[]) {
  for (const key of keys) {
    const value = fields[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function readBoolean(fields: FlatRecord, keys: string[]) {
  for (const key of keys) {
    const value = fields[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "ok", "success", "successful", "başarılı", "basarili", "1"].includes(normalized)) return true;
      if (["false", "error", "failed", "başarısız", "basarisiz", "0"].includes(normalized)) return false;
    }
  }
  return null;
}

function readNumber(fields: FlatRecord, keys: string[]) {
  for (const key of keys) {
    const value = fields[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(",", "."));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function mapDocumentRecord(input: unknown): HizliBilisimDocument | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const raw = input as Record<string, unknown>;
  const fields = flattenRecord(raw);

  return {
    uuid: readText(fields, ["UUID", "Uuid", "uuid"]),
    envelopeUuid: readText(fields, ["EnvelopeUUID", "EnvelopeUuid", "envelopeUuid"]),
    appType: readNumber(fields, ["AppType", "appType"]),
    isArchive: readBoolean(fields, ["IsArchive", "isArchive"]),
    isRead: readBoolean(fields, ["IsRead", "isRead"]),
    isPrinted: readBoolean(fields, ["IsPrinted", "isPrinted"]),
    documentId: readText(fields, ["DocumentId", "documentId"]),
    documentTypeCode: readText(fields, ["DocumentTypeCode", "documentTypeCode"]),
    profileId: readText(fields, ["ProfileId", "profileId", "ProfileID"]),
    documentCurrencyCode: readText(fields, ["DocumentCurrencyCode", "documentCurrencyCode"]),
    targetTitle: readText(fields, ["TargetTitle", "targetTitle"]),
    targetIdentifier: readText(fields, ["TargetIdentifier", "targetIdentifier"]),
    targetAlias: readText(fields, ["TargetAlias", "targetAlias"]),
    sourceAlias: readText(fields, ["SourceAlias", "sourceAlias"]),
    taxTotal: readNumber(fields, ["TaxTotal", "taxTotal"]),
    payableAmount: readNumber(fields, ["PayableAmount", "payableAmount"]),
    localReferenceId: readText(fields, ["LocalReferenceId", "localReferenceId"]),
    status: readNumber(fields, ["Status", "status"]),
    statusExp: readText(fields, ["StatusExp", "statusExp"]),
    envelopeStatus: readNumber(fields, ["EnvelopeStatus", "envelopeStatus"]),
    envelopeExp: readText(fields, ["EnvelopeExp", "envelopeExp"]),
    message: readText(fields, ["Messsage", "Message", "message"]),
    issueDate: readText(fields, ["IssueDate", "issueDate"]),
    createdDate: readText(fields, ["CreatedDate", "createdDate"]),
    cancelDate: readText(fields, ["CancelDate", "cancelDate"]),
    branchCode: readNumber(fields, ["SubeKodu", "branchCode", "subeKodu"]),
    vatSummary: readText(fields, ["KdvStr", "kdvStr"]),
    hasEmail: readBoolean(fields, ["HasEMail", "hasEmail", "HasEmail"]),
    prefixAndYear: readText(fields, ["PrefixAndYear", "prefixAndYear"]),
    isInvoiced: readBoolean(fields, ["IsInvoiced", "isInvoiced"]),
    isPaid: readBoolean(fields, ["IsPaid", "isPaid"]),
    raw,
  };
}

function interpretResponse(response: Response, rawResponse: string, parsed: Record<string, unknown> | null) {
  const fields = flattenRecord(parsed);
  const success = readBoolean(fields, ["IsSucceeded", "isSucceeded", "success", "ok", "data.IsSucceeded", "result.IsSucceeded"]) ?? response.ok;
  const message = readText(fields, ["Message", "message", "note", "description", "error.message", "data.Message", "result.Message", "rawText"]);
  const externalId = readText(fields, ["DocumentId", "documentId", "InvoiceId", "id", "data.DocumentId"]);
  const envelopeUuid = readText(fields, ["EnvelopeUUID", "envelopeUuid", "UUID", "uuid", "DocumentUUID", "data.EnvelopeUUID"]);

  return {
    success,
    note: message ?? (success ? "İşlem başarılı." : `İşlem başarısız oldu (HTTP ${response.status}).`),
    externalId,
    envelopeUuid,
    rawResponse,
    parsed,
  };
}

function buildTokenVariants(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  const variants: string[] = [];
  if (!raw) return variants;
  variants.push(raw);
  if (raw.includes("#")) {
    for (const part of raw.split("#")) {
      const candidate = part.trim();
      if (candidate && !variants.includes(candidate)) {
        variants.push(candidate);
      }
    }
  }
  return variants;
}

function getRequiredToken(login?: LoginResult | null) {
  const token = buildTokenVariants(login?.token)[0];
  if (!token) {
    throw new Error("Hızlı Bilişim işlemi için önce login token alınmalıdır.");
  }
  return token;
}

async function callRestGet(
  settings: EInvoiceSettings,
  method: string,
  query: Record<string, string | number | boolean | null | undefined>,
  login?: LoginResult | null,
) {
  const { restBase } = normalizeServiceRoots(settings.serviceEndpoint ?? "");
  const url = new URL(`${restBase}/${method}`);

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      Authorization: `Bearer ${getRequiredToken(login)}`,
    },
  });

  const rawResponse = await response.text();
  return interpretResponse(response, rawResponse, parseResponse(rawResponse));
}

async function callRestPost(
  settings: EInvoiceSettings,
  method: string,
  body: Record<string, unknown>,
  login?: LoginResult | null,
  includeAuthHeaders = true,
) {
  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue;
    formData.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }

  const { restBase } = normalizeServiceRoots(settings.serviceEndpoint ?? "");
  const targetUrl = `${restBase}/${method}`;

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      ...(includeAuthHeaders ? { Authorization: `Bearer ${getRequiredToken(login)}` } : {}),
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: formData.toString(),
  });

  const rawResponse = await response.text();
  return interpretResponse(response, rawResponse, parseResponse(rawResponse));
}

async function callRestJson(
  settings: EInvoiceSettings,
  method: string,
  body: unknown,
  login?: LoginResult | null,
) {
  const { restBase } = normalizeServiceRoots(settings.serviceEndpoint ?? "");
  const targetUrl = `${restBase}/${method}`;

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      Authorization: `Bearer ${getRequiredToken(login)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const rawResponse = await response.text();
  return interpretResponse(response, rawResponse, parseResponse(rawResponse));
}

function resolveControlAppType(scenario: EInvoiceScenario) {
  return scenario === "E_ARCHIVE" ? 3 : 1;
}

function resolveSendAppType(scenario: EInvoiceScenario) {
  return scenario === "E_ARCHIVE" ? 3 : 2;
}

function resolveDestinationIdentifier(document: EInvoiceDocument, invoice: InvoiceWithRelations) {
  if (document.scenario === "E_ARCHIVE") {
    return "11111111111";
  }
  return onlyDigits(invoice.customer?.taxNumber);
}

function normalizeDocumentId(value: string) {
  const normalized = String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const digits = normalized.replace(/\D/g, "");
  if (digits) {
    return `BYG${new Date().getFullYear()}${digits.padStart(9, "0").slice(-9)}`;
  }
  return `BYG${new Date().getFullYear()}${String(Date.now()).slice(-9)}`;
}

function buildInvoiceModel({
  settings,
  document,
  invoice,
  documentUuid,
}: {
  settings: EInvoiceSettings;
  document: EInvoiceDocument;
  invoice: InvoiceWithRelations;
  documentUuid: string;
}) {
  const normalizedDocumentId = normalizeDocumentId(invoice.invoiceNo);
  const supplierTaxNumber = onlyDigits(settings.senderTaxNumber) || "1111111111";
  const customerIdentifier = onlyDigits(invoice.customer?.taxNumber) || "11111111111";
  const profileId =
    document.scenario === "E_ARCHIVE"
      ? "EARSIVFATURA"
      : document.scenario === "E_INVOICE_COMMERCIAL"
        ? "TICARIFATURA"
        : "TEMELFATURA";
  const supplierAddress = invoice.branch?.address || "";
  const supplierDistrict = invoice.branch?.district || "";
  const supplierCity = invoice.branch?.city || "";
  const senderTaxOffice = "Vergi Dairesi";
  const currency = invoice.currencyCode || "TRY";
  const note = invoice.note || "Bey360 örnek e-Belge gönderimi";

  const lineItems = invoice.items.map((item, index) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const lineNet = Number((quantity * unitPrice).toFixed(2));
    const taxPercent = Number(item.vatRate);
    const taxAmount = Number((lineNet * taxPercent / 100).toFixed(2));
    return {
      ID: index + 1,
      Item_Name: item.description,
      Quantity_Amount: quantity,
      Quantity_Unit_User: "C62",
      Quantity_UnitCode: "C62",
      Price_Amount: Number(unitPrice.toFixed(2)),
      LineExtensionAmount: lineNet,
      TaxAmount: taxAmount,
      TaxPercent: taxPercent,
      lineTaxes: [
        {
          Tax_Name: "KDV",
          Tax_Code: "0015",
          Tax_Perc: taxPercent,
          Tax_Base: lineNet,
          Tax_Amnt: taxAmount,
          Tax_Exem: "",
          Tax_Exem_Code: "",
        },
      ],
    };
  });

  const lineExtensionAmount = Number(lineItems.reduce((sum, item) => sum + item.LineExtensionAmount, 0).toFixed(2));
  const taxTotal = Number(lineItems.reduce((sum, item) => sum + item.TaxAmount, 0).toFixed(2));
  const payableAmount = Number(Number(invoice.grandTotal).toFixed(2));

  const customerParty = {
    IdentificationID: customerIdentifier,
    PartyName: invoice.customer?.title || invoice.customer?.name || "Muhtelif Müşteriler",
    StreetName: invoice.customer?.address || "-",
    CitySubdivisionName: invoice.customer?.district || invoice.customer?.city || "-",
    CityName: invoice.customer?.city || "-",
    CountryName: invoice.customer?.country || "Türkiye",
    TaxSchemeName: invoice.customer?.taxOffice || "-",
    Telephone: invoice.customer?.phone || "",
    Telefax: "",
    ElectronicMail: invoice.customer?.email || "",
    ...(customerIdentifier.length === 11 || invoice.customer?.firstName || invoice.customer?.lastName
      ? {
          Person_FirstName: invoice.customer?.firstName || invoice.customer?.name?.split(" ")[0] || "Muhtelif",
          Person_FamilyName:
            invoice.customer?.lastName ||
            invoice.customer?.name?.split(" ").slice(1).join(" ") ||
            "Müşteriler",
        }
      : {}),
  };

  const supplierParty = {
    IdentificationID: supplierTaxNumber,
    PartyName: settings.senderTitle || invoice.branch?.name || "Bey360",
    StreetName: supplierAddress || "-",
    CitySubdivisionName: supplierDistrict || "-",
    CityName: supplierCity || "-",
    CountryName: "Türkiye",
    TaxSchemeName: senderTaxOffice,
    Telephone: invoice.branch?.phone || "",
    Telefax: "",
    ElectronicMail: "",
    WebsiteURI: "",
  };

  return {
    invoiceheader: {
      ProfileID: profileId,
      InvoiceTypeCode: "SATIS",
      Invoice_ID: normalizedDocumentId,
      UUID: documentUuid,
      IssueDate: invoice.issueDate.toISOString().slice(0, 10),
      IssueTime: "00:00:00",
      DocumentCurrencyCode: currency,
      TaxCurrencyCode: currency,
      LineExtensionAmount: lineExtensionAmount,
      TaxExclusiveAmount: lineExtensionAmount,
      TaxInclusiveAmount: payableAmount,
      TaxAmount: taxTotal,
      PayableAmount: payableAmount,
      IsInternetSale: false,
      Invoice_Note: note,
      Note: note,
      Notes: [{ Note: note }],
      XSLT_Adi: "general",
    },
    supplier: {
      supplierParty: supplierParty,
    },
    customer: {
      ...customerParty,
      customerParty: customerParty,
    },
    invoiceLines: lineItems,
  };
}

function buildSendDocumentPayload({
  settings,
  document,
  invoice,
  xmlContent,
  destinationIdentifier,
  destinationUrn,
  documentUuid,
}: {
  settings: EInvoiceSettings;
  document: EInvoiceDocument;
  invoice: InvoiceWithRelations;
  xmlContent: string;
  destinationIdentifier: string;
  destinationUrn: string;
  documentUuid: string;
}) {
  const normalizedDocumentId = normalizeDocumentId(invoice.invoiceNo);
  const invoiceModel = buildInvoiceModel({
    settings,
    document,
    invoice,
    documentUuid,
  });

  return {
    AppType: resolveSendAppType(document.scenario),
    SourceUrn: settings.gibAlias ?? "",
    DestinationIdentifier: destinationIdentifier,
    DestinationUrn: destinationUrn,
    XmlContent: xmlContent,
    DocumentUUID: documentUuid,
    DocumentId: normalizedDocumentId,
    DocumentDate: invoice.issueDate.toISOString().slice(0, 10),
    LocalId: invoice.id,
    UpdateDocument: false,
    IsDraft: false,
    IsDraftSend: false,
    InvoiceModel: invoiceModel,
    inputDocument: [invoiceModel],
  };
}

export async function encryptHizliCredentials({
  secretKey,
  username,
  password,
  endpoint,
}: {
  secretKey: string;
  username: string;
  password: string;
  endpoint: string;
}) {
  const { restBase } = normalizeServiceRoots(endpoint);
  const response = await fetch(`${restBase}/UtilEncrypt`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: new URLSearchParams({
      secretKey,
      username,
      password,
    }).toString(),
  });

  const rawResponse = await response.text();
  const parsed = parseResponse(rawResponse);
  const fields = flattenRecord(parsed);
  const encryptedUsername = readText(fields, ["username", "Username", "data.username"]);
  const encryptedPassword = readText(fields, ["password", "Password", "data.password"]);

  if (!response.ok || !encryptedUsername || !encryptedPassword) {
    const message = readText(fields, ["Message", "message", "error.message"]) ?? "UtilEncrypt işlemi başarısız oldu.";
    throw new Error(message);
  }

  return {
    username: encryptedUsername,
    password: encryptedPassword,
  };
}

export async function loginToHizliBilisim(settings: EInvoiceSettings): Promise<LoginResult> {
  const username = settings.serviceUsername?.trim();
  const password = settings.servicePassword?.trim();
  const apiKey = settings.serviceApiKey?.trim();

  if (!username || !password || !apiKey) {
    throw new Error("Hızlı Bilişim Login için API Key ve şifrelenmiş kullanıcı bilgileri zorunludur.");
  }

  const { restBase } = normalizeServiceRoots(settings.serviceEndpoint ?? "");
  const loginUrl = `${restBase}/Login`;
  const loginPayload = { apiKey, username, password };

  const attempts: Array<() => Promise<{ response: Response; rawResponse: string; parsed: Record<string, unknown> | null }>> = [
    async () => {
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginPayload),
      });
      const rawResponse = await response.text();
      return { response, rawResponse, parsed: parseResponse(rawResponse) };
    },
    async () => {
      const url = new URL(loginUrl);
      Object.entries(loginPayload).forEach(([key, value]) => url.searchParams.set(key, value));
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json, text/plain;q=0.9, */*;q=0.8" },
      });
      const rawResponse = await response.text();
      return { response, rawResponse, parsed: parseResponse(rawResponse) };
    },
    async () => {
      const url = new URL(loginUrl);
      Object.entries(loginPayload).forEach(([key, value]) => url.searchParams.set(key, value));
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { Accept: "application/json, text/plain;q=0.9, */*;q=0.8" },
      });
      const rawResponse = await response.text();
      return { response, rawResponse, parsed: parseResponse(rawResponse) };
    },
  ];

  let lastResult: ReturnType<typeof interpretResponse> | null = null;
  for (const attempt of attempts) {
    const { response, rawResponse, parsed } = await attempt();
    const result = interpretResponse(response, rawResponse, parsed);
    const fields = flattenRecord(parsed);
    const token = readText(fields, ["Token", "token", "accessToken", "jwt", "data.Token", "data.token"]);
    if (result.success && token) {
      return {
        success: true,
        note: result.note,
        token,
        rawResponse: result.rawResponse,
        data: parsed,
      };
    }
    lastResult = result;
  }

  return {
    success: false,
    note: lastResult?.note ?? "Login başarısız oldu.",
    token: null,
    rawResponse: lastResult?.rawResponse ?? null,
    data: lastResult?.parsed ?? null,
  };
}

export async function getGibUserList(
  settings: EInvoiceSettings,
  identifier: string,
  type: "GB" | "PK" = "PK",
  appType = 1,
  login?: LoginResult | null,
) {
  const result = await callRestGet(
    settings,
    "GetGibUserList",
    {
      AppType: appType,
      Type: type,
      Identifier: identifier,
    },
    login,
  );

  const root = result.parsed as { gibUserLists?: Array<{ Identifier?: string; Alias?: string; Title?: string; Type?: string }> } | null;

  return {
    ...result,
    users: root?.gibUserLists ?? [],
  };
}

export async function getCustomerCreditCount(
  settings: EInvoiceSettings,
  identifier: string,
  login?: LoginResult | null,
): Promise<HizliBilisimCreditInfoResult> {
  const result = await callRestGet(
    settings,
    "GetCustomerCreditCount",
    {
      vkn_tckn: identifier,
    },
    login,
  );

  const fields = flattenRecord(result.parsed);
  return {
    success: result.success,
    note: result.note,
    totalCredit: readNumber(fields, ["totalCredit", "data.totalCredit", "TotalCredit"]),
    remainCredit: readNumber(fields, ["remainCredit", "data.remainCredit", "RemainCredit"]),
    rawResponse: result.rawResponse,
  };
}

export async function getDashboardInfo(
  settings: EInvoiceSettings,
  identifier: string,
  login?: LoginResult | null,
): Promise<HizliBilisimDashboardInfoResult> {
  const result = await callRestGet(
    settings,
    "GetDashboardInfo",
    {
      Identifier: identifier,
    },
    login,
  );

  const fields = flattenRecord(result.parsed);
  return {
    success: result.success,
    note: result.note,
    creditTotal: readNumber(fields, ["creditTotal", "data.creditTotal"]),
    creditRemainder: readNumber(fields, ["creditRemainder", "data.creditRemainder"]),
    outboxCount: readNumber(fields, ["outboxCount", "data.outboxCount"]),
    archiveCount: readNumber(fields, ["archiveCount", "data.archiveCount"]),
    inboxCount: readNumber(fields, ["inboxCount", "data.inboxCount"]),
    despatchOutboxCount: readNumber(fields, ["despatchOutboxCount", "data.despatchOutboxCount"]),
    despatchInboxCount: readNumber(fields, ["despatchInboxCount", "data.despatchInboxCount"]),
    rawResponse: result.rawResponse,
  };
}

export async function getDocumentList(
  settings: EInvoiceSettings,
  options: {
    appType: number;
    startDate: Date;
    endDate: Date;
    dateType?: string;
    isNew?: boolean;
    isExport?: boolean;
    isDraft?: boolean;
    takenFromEntegrator?: string;
  },
  login?: LoginResult | null,
): Promise<HizliBilisimDocumentListResult> {
  const result = await callRestGet(
    settings,
    "GetDocumentList",
    {
      AppType: options.appType,
      DateType: options.dateType ?? "CreateDate",
      StartDate: options.startDate.toISOString(),
      EndDate: options.endDate.toISOString(),
      IsNew: options.isNew ?? false,
      IsExport: options.isExport ?? false,
      IsDraft: options.isDraft ?? false,
      TakenFromEntegrator: options.takenFromEntegrator ?? "false",
    },
    login,
  );

  const root = result.parsed as Record<string, unknown> | null;
  const documentSource = Array.isArray(root?.documents)
    ? root.documents
    : root?.data && typeof root.data === "object" && !Array.isArray(root.data) && Array.isArray((root.data as Record<string, unknown>).documents)
      ? ((root.data as Record<string, unknown>).documents as unknown[])
      : [];

  return {
    success: result.success,
    note: result.note,
    documents: documentSource.map((item) => mapDocumentRecord(item)).filter((item): item is HizliBilisimDocument => Boolean(item)),
    rawResponse: result.rawResponse,
  };
}

export async function getDocumentFile(
  settings: EInvoiceSettings,
  options: {
    appType: number;
    uuid: string;
    type: "XML" | "PDF" | "HTML";
    isDraft?: boolean;
  },
  login?: LoginResult | null,
): Promise<HizliBilisimDocumentFileResult> {
  const result = await callRestGet(
    settings,
    "GetDocumentFile",
    {
      AppType: options.appType,
      Uuid: options.uuid,
      Tur: options.type,
      IsDraft: options.isDraft ?? false,
    },
    login,
  );

  const fields = flattenRecord(result.parsed);
  return {
    success: result.success,
    note: result.note,
    documentFile: readText(fields, ["DocumentFile", "documentFile", "data.DocumentFile"]),
    rawResponse: result.rawResponse,
  };
}

export async function controlDocumentXml(settings: EInvoiceSettings, appType: number, documentXml: string, login?: LoginResult | null) {
  return callRestPost(
    settings,
    "ControlDocumentXML",
    {
      AppType: appType,
      DocumentXml: documentXml,
    },
    login,
  );
}

export async function sendInvoiceToHizliBilisim(input: HizliBilisimSendInput): Promise<HizliBilisimSendResult> {
  const settings = input.settings;
  const senderUrn = settings.gibAlias?.trim();

  if (!senderUrn) {
    throw new Error("Gönderici GB / URN alanı e-Fatura ayarlarında tanımlımalıdır.");
  }

  const login = await loginToHizliBilisim(settings);
  if (!login.success) {
    return { success: false, note: `Login başarısız: ${login.note}`, rawResponse: login.rawResponse };
  }

  const destinationIdentifier = resolveDestinationIdentifier(input.document, input.invoice);
  const isEInvoice = input.document.scenario !== "E_ARCHIVE";

  if (isEInvoice && !destinationIdentifier) {
    throw new Error("e-Fatura gönderimi için müşteri vergi numarası zorunludur.");
  }

  const controlResult = await controlDocumentXml(settings, resolveControlAppType(input.document.scenario), input.xmlContent, login);
  if (!controlResult.success) {
    return {
      success: false,
      note: `XML kontrolü başarısız: ${controlResult.note}`,
      rawResponse: controlResult.rawResponse,
    };
  }

  let destinationUrn = "";
  if (isEInvoice && destinationIdentifier) {
    const aliasResult = await getGibUserList(settings, destinationIdentifier, "PK", 1, login);
    if (aliasResult.success && aliasResult.users.length > 0) {
      destinationUrn = aliasResult.users[0]?.Alias ?? "";
    } else if (isEInvoice) {
      return {
        success: false,
        note: `Alıcı için PK alias bulunamadı: ${aliasResult.note}`,
        rawResponse: aliasResult.rawResponse,
      };
    }
  }

  const documentUuid = input.document.envelopeUuid ?? crypto.randomUUID();
  const payload = buildSendDocumentPayload({
    settings,
    document: input.document,
    invoice: input.invoice,
    xmlContent: input.xmlContent,
    destinationIdentifier,
    destinationUrn,
    documentUuid,
  });

  let sendResult = await callRestPost(settings, "SendDocument", payload, login);
  if (!sendResult.success && sendResult.note.toLocaleLowerCase("tr-TR").includes("inputdocument")) {
    sendResult = await callRestJson(
      settings,
      "SendInvoiceModel",
      [
        {
          AppType: payload.AppType,
          SourceUrn: payload.SourceUrn,
          DestinationIdentifier: payload.DestinationIdentifier,
          DestinationUrn: payload.DestinationUrn,
          LocalId: payload.LocalId,
          UpdateDocument: payload.UpdateDocument,
          IsDraft: payload.IsDraft,
          IsDraftSend: payload.IsDraftSend,
          IsPreview: false,
          InvoiceModel: payload.InvoiceModel,
        },
      ],
      login,
    );
  }

  return {
    success: sendResult.success,
    note: sendResult.note,
    externalId: sendResult.externalId ?? input.invoice.invoiceNo,
    envelopeUuid: sendResult.envelopeUuid ?? documentUuid,
    rawResponse: sendResult.rawResponse,
    sourceUrn: senderUrn,
    destinationUrn: destinationUrn || null,
  };
}

export async function testHizliBilisimConnection(settings: EInvoiceSettings): Promise<HizliBilisimConnectionTestResult> {
  const result = await loginToHizliBilisim(settings);
  if (!result.success) {
    return { success: false, note: result.note };
  }

  const fields = flattenRecord(result.data);
  const customerName = readText(fields, ["MusteriAdi", "data.MusteriAdi"]);
  const vkn = readText(fields, ["VknTckn", "data.VknTckn"]);
  const gb = readText(fields, ["eFaturaGb", "data.eFaturaGb"]);
  const tokenInfo = result.token ? " · Bearer token alındı" : "";

  return {
    success: true,
    note: `Login başarılı${customerName ? ` · ${customerName}` : ""}${vkn ? ` · VKN/TCKN: ${vkn}` : ""}${gb ? ` · GB: ${gb}` : ""}${tokenInfo}`,
    customerName,
    vkn,
    gb,
    token: result.token ?? null,
  };
}
