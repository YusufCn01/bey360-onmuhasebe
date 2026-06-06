function baseMailLayout({
  title,
  body,
  actionLabel,
  actionUrl,
}: {
  title: string;
  body: string;
  actionLabel: string;
  actionUrl: string;
}) {
  const html = `
    <div style="font-family:Arial,sans-serif;padding:24px;color:#0f172a">
      <h2 style="margin:0 0 12px 0;">${title}</h2>
      <p style="margin:0 0 16px 0;line-height:1.7;">${body}</p>
      <p style="margin:0 0 20px 0;">
        <a href="${actionUrl}" style="display:inline-block;padding:12px 18px;background:#0f766e;color:#fff;text-decoration:none;border-radius:999px;font-weight:700;">
          ${actionLabel}
        </a>
      </p>
      <p style="margin:0;color:#475569;font-size:14px;">Bağlantı açılmazsa bu adresi tarayıcıya yapıştırabilirsin:</p>
      <p style="margin:8px 0 0 0;color:#0f766e;font-size:14px;word-break:break-all;">${actionUrl}</p>
    </div>
  `;

  return html;
}

export function buildVerificationEmail({
  fullName,
  verificationUrl,
}: {
  fullName: string;
  verificationUrl: string;
}) {
  const subject = "Bey360 hesabını doğrula";
  const text = `Merhaba ${fullName}, hesabını doğrulamak için bu bağlantıyı aç: ${verificationUrl}`;
  const html = baseMailLayout({
    title: "Bey360 hesabını doğrula",
    body: `Merhaba ${fullName}, hesabını kullanmaya devam etmek için e-posta adresini doğrulaman gerekiyor.`,
    actionLabel: "E-postamı doğrula",
    actionUrl: verificationUrl,
  });

  return { subject, text, html };
}

export function buildPasswordResetEmail({
  fullName,
  resetUrl,
}: {
  fullName: string;
  resetUrl: string;
}) {
  const subject = "Bey360 şifre sıfırlama";
  const text = `Merhaba ${fullName}, şifreni yenilemek için bu bağlantıyı aç: ${resetUrl}`;
  const html = baseMailLayout({
    title: "Şifreni yenile",
    body: `Merhaba ${fullName}, hesabın için yeni bir şifre belirlemek istersen aşağıdaki bağlantıyı kullanabilirsin. Bu bağlantı güvenlik için sınırlı süreyle aktif kalır.`,
    actionLabel: "Şifreyi yenile",
    actionUrl: resetUrl,
  });

  return { subject, text, html };
}
