import "server-only";

export function getMailConfigurationState() {
  const hasResend = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  const hasSmtp = Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.EMAIL_FROM,
  );

  if (hasResend) {
    return {
      mode: "Resend",
      detail: "Doğrulama ve şifre yenileme e-postaları Resend üzerinden gönderilir.",
    };
  }

  if (hasSmtp) {
    return {
      mode: "SMTP",
      detail: "Doğrulama ve şifre yenileme e-postaları SMTP sunucun üzerinden gönderilir.",
    };
  }

  return {
    mode: "Önizleme",
    detail: "Mail servisi tanımlı değil. Bağlantılar test amaçlı ekranda gösterilir.",
  };
}
