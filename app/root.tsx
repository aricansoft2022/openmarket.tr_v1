import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./styles/global.css";
import "./styles/auth.css";
import "./styles/account-security.css";
import "./styles/onboarding.css";
import "./styles/staff-review.css";
import "./styles/supplier.css";
import "./styles/supplier.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap",
  },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Beklenmeyen bir hata oluştu";
  let message = "İstek tamamlanamadı. Lütfen yeniden deneyin.";
  let details: string | undefined;

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "Sayfa bulunamadı" : "İstek tamamlanamadı";
    message = error.statusText || message;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.stack;
  }

  return (
    <main className="system-page">
      <p className="eyebrow">OpenMarket.tr</p>
      <h1>{title}</h1>
      <p>{message}</p>
      {details ? <pre>{details}</pre> : null}
      <a className="button button--primary" href="/">
        Ana sayfaya dön
      </a>
    </main>
  );
}
