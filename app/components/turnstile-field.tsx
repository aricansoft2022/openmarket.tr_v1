export function TurnstileField({
  siteKey,
  action,
  bypass,
}: {
  siteKey: string | null;
  action: string;
  bypass: boolean;
}) {
  if (bypass) {
    return (
      <p className="form-note" data-testid="turnstile-local-bypass">
        Yerel geliştirmede güvenlik doğrulaması açıkça atlanır.
      </p>
    );
  }

  if (!siteKey) {
    return (
      <div className="form-alert" role="alert">
        Güvenlik doğrulaması bu ortamda henüz yapılandırılmadı. Form geçici olarak kullanılamıyor.
      </div>
    );
  }

  return (
    <div className="turnstile-field">
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-action={action}
        data-theme="light"
      />
      <noscript>Bu form için JavaScript ve güvenlik doğrulaması gereklidir.</noscript>
    </div>
  );
}
