import { env } from "cloudflare:workers";
import { data, Form, redirect, useNavigation } from "react-router";

import { OnboardingShell } from "~/components/onboarding-shell";
import {
  chooseWorkspace,
  loadOnboardingState,
  OnboardingActionError,
} from "~/lib/business-identity/onboarding.server";
import {
  hasOnboardingErrors,
  validateWorkspaceSelection,
  type WorkspaceFormErrors,
} from "~/lib/business-identity/onboarding";

import type { Route } from "./+types/onboarding.workspaces";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Çalışma alanı seçimi — OpenMarket.tr" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const state = await loadOnboardingState(env, request);
  if (!state) throw redirect("/auth/login");
  if (!state.user.emailVerified) throw redirect("/auth/verify-email");
  return state;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const { intendedUse, errors } = validateWorkspaceSelection(formData);

  if (!intendedUse || hasOnboardingErrors(errors)) {
    return data({ errors, selected: intendedUse }, { status: 400 });
  }

  try {
    await chooseWorkspace(env, request, intendedUse);
    return redirect("/onboarding/business-identity");
  } catch (error) {
    if (error instanceof OnboardingActionError && error.code === "UNAUTHENTICATED") {
      throw redirect("/auth/login");
    }
    const responseErrors: WorkspaceFormErrors = {
      form: "Çalışma alanı tercihi kaydedilemedi. Lütfen yeniden deneyin.",
    };
    return data({ errors: responseErrors, selected: intendedUse }, { status: 503 });
  }
}

const options = [
  {
    value: "buyer",
    title: "Alıcı",
    copy: "İş kimliği doğrulandıktan sonra RFQ oluşturabilir ve ticari iletişim başlatabilirsiniz.",
  },
  {
    value: "supplier",
    title: "Tedarikçi",
    copy: "Şirket profilinizi ve ürün taslaklarını hazırlayabilirsiniz; yayınlama için ayrıca tedarikçi aktivasyonu gerekir.",
  },
  {
    value: "both",
    title: "Her ikisi",
    copy: "Aynı hesapta alıcı ve tedarikçi çalışma alanlarını koruyun. Her çalışma alanı kendi aktivasyon koşullarına tabidir.",
  },
] as const;

export default function WorkspaceSelection({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const selected = actionData?.selected ?? loaderData.intendedUse;

  return (
    <OnboardingShell
      current="A08"
      title="Hangi çalışma alanlarını kullanacaksınız?"
      description="Bu seçim başlangıç yönünü belirler. Ticari yetki vermez ve mevcut bir çalışma alanını sessizce kaldırmaz."
    >
      <Form method="post" noValidate>
        {actionData?.errors.form ? (
          <div className="form-alert" role="alert">
            {actionData.errors.form}
          </div>
        ) : null}
        <div className="workspace-grid">
          {options.map((option) => (
            <label className="workspace-choice" key={option.value}>
              <input
                type="radio"
                name="intendedUse"
                value={option.value}
                defaultChecked={selected === option.value}
              />
              <div>
                <p className="eyebrow">Workspace</p>
                <h2>{option.title}</h2>
              </div>
              <p>{option.copy}</p>
            </label>
          ))}
        </div>
        {actionData?.errors.intendedUse ? (
          <p className="field-error" role="alert">
            {actionData.errors.intendedUse}
          </p>
        ) : null}
        <div className="continue-bar">
          <p>
            Buyer + Supplier seçimi veritabanında <strong>Both</strong> olarak korunur; sonraki
            adımlar çalışma alanına göre ayrılır.
          </p>
          <button className="button button--primary" type="submit" disabled={submitting}>
            {submitting ? "Kaydediliyor…" : "İş kimliği adımına devam et"}
          </button>
        </div>
      </Form>
    </OnboardingShell>
  );
}
