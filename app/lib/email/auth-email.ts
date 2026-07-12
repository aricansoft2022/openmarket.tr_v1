import type { AuthEmailTemplate, PreferredLanguage } from "../db/schema";

export type RenderedAuthEmail = {
  subject: string;
  text: string;
};

const copy: Record<
  PreferredLanguage,
  Record<AuthEmailTemplate, { subject: string; intro: string; action: string; expiry: string }>
> = {
  tr: {
    "auth.verify-email": {
      subject: "OpenMarket.tr e-posta adresinizi doğrulayın",
      intro:
        "OpenMarket.tr hesabınızın e-posta adresini doğrulamak için aşağıdaki bağlantıyı kullanın.",
      action: "E-postayı doğrula",
      expiry: "Bu bağlantı 1 saat geçerlidir ve yalnızca bir kez kullanılabilir.",
    },
    "auth.reset-password": {
      subject: "OpenMarket.tr şifrenizi sıfırlayın",
      intro: "OpenMarket.tr hesabınız için şifre sıfırlama isteği alındı.",
      action: "Yeni şifre belirle",
      expiry: "Bu bağlantı 1 saat geçerlidir ve yalnızca bir kez kullanılabilir.",
    },
  },
  en: {
    "auth.verify-email": {
      subject: "Verify your OpenMarket.tr email address",
      intro: "Use the link below to verify the email address for your OpenMarket.tr account.",
      action: "Verify email",
      expiry: "This link is valid for 1 hour and can only be used once.",
    },
    "auth.reset-password": {
      subject: "Reset your OpenMarket.tr password",
      intro: "A password reset was requested for your OpenMarket.tr account.",
      action: "Set a new password",
      expiry: "This link is valid for 1 hour and can only be used once.",
    },
  },
};

export function renderAuthEmail(
  template: AuthEmailTemplate,
  locale: PreferredLanguage,
  actionUrl: string,
): RenderedAuthEmail {
  const url = new URL(actionUrl);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("Authentication email links must use HTTPS outside localhost.");
  }

  const message = copy[locale][template];
  return {
    subject: message.subject,
    text: `${message.intro}\n\n${message.action}: ${url.toString()}\n\n${message.expiry}\n\nOpenMarket.tr`,
  };
}
