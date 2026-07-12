import { env } from "cloudflare:workers";
import { data, Form, redirect, useNavigation } from "react-router";

import { FieldError } from "~/components/auth-shell";
import { OnboardingShell } from "~/components/onboarding-shell";
import {
  hasOnboardingErrors,
  type IdentityFormErrors,
  validateBusinessIdentity,
} from "~/lib/business-identity/onboarding";
import {
  loadOnboardingState,
  onboardingResultQuery,
  OnboardingActionError,
  submitOnboardingIdentity,
} from "~/lib/business-identity/onboarding.server";
import { BusinessIdentityTransitionError } from "~/lib/business-identity/transitions.server";

import type { Route } from "./+types/onboarding.business-identity";

export function meta({}: Route.MetaArgs) {
  return [{ title: "İş kimliği doğrulama — OpenMarket.tr" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const state = await loadOnboardingState(env, request);
  if (!state) throw redirect("/auth/login");
  if (!state.user.emailVerified) throw redirect("/auth/verify-email");
  if (state.latestReview?.status === "pending" || state.latestReview?.status === "verified") {
    throw redirect("/onboarding/business-identity/status");
  }
  return state;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const { values, errors } = validateBusinessIdentity(formData);

  if (hasOnboardingErrors(errors)) {
    return data({ errors, values }, { status: 400 });
  }

  try {
    const result = await submitOnboardingIdentity(env, request, values);
    return redirect(
      `/onboarding/business-identity/status?${onboardingResultQuery(result)}`,
    );
  } catch (error) {
    if (error instanceof OnboardingActionError) {
      if (error.code === "UNAUTHENTICATED") throw redirect("/auth/login");
      if (error.code === "PENDING_REVIEW_EXISTS" || error.code === "IDENTITY_ALREADY_VERIFIED") {
        throw redirect("/onboarding/business-identity/status");
      }
    }
    if (
      error instanceof BusinessIdentityTransitionError &&
      error.code === "ACCOUNT_NOT_VERIFIED"
    ) {
      throw redirect("/auth/verify-email");
    }

    const responseErrors: IdentityFormErrors = {
      form: "İş kimliği başvurusu kaydedilemedi. Lütfen bilgileri kontrol edip yeniden deneyin.",
    };
    return data({ errors: responseErrors, values }, { status: 503 });
  }
}

export default function BusinessIdentitySetup({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const previous = loaderData.latestReview;
  const values = actionData?.values ?? {
    companyName: previous?.companyName ?? "",
    companyEmail: previous?.companyEmail ?? loaderData.user.email,
    applicantNote: previous?.applicantNote ?? "",
  };
  const errors = actionData?.errors;

  return (
    <OnboardingShell
      current="A09"
      title="İş kimliğinizi doğrulayın."
      description="Hesap e-postası size ait olduğunu kanıtlar; ticari kimlik için şirket alan adı veya onaylı manuel istisna gerekir."
    >
      <div className="identity-grid">
        <Form method="post" className="auth-form" noValidate>
          {previous?.status === "rejected" ? (
            <div className="form-alert" role="status">
              Önceki başvuru reddedildi. Nedeni gözden geçirip güncel bilgilerle yeniden
              gönderebilirsiniz.
            </div>
          ) : null}
          {errors?.form ? (
            <div className="form-alert" role="alert">
              {errors.form}
            </div>
          ) : null}

          <div className="field-group">
            <label htmlFor="companyName">Şirket adı</label>
            <input
              id="companyName"
              name="companyName"
              autoComplete="organization"
              defaultValue={values.companyName}
              maxLength={160}
              aria-invalid={Boolean(errors?.companyName)}
              aria-describedby={errors?.companyName ? "company-name-error" : undefined}
              required
            />
            <FieldError id="company-name-error" message={errors?.companyName} />
          </div>

          <div className="field-group">
            <label htmlFor="companyEmail">Şirket e-postası</label>
            <input
              id="companyEmail"
              name="companyEmail"
              type="email"
              autoComplete="email"
              defaultValue={values.companyEmail}
              maxLength={320}
              aria-invalid={Boolean(errors?.companyEmail)}
              aria-describedby={errors?.companyEmail ? "company-email-error" : undefined}
              required
            />
            <FieldError id="company-email-error" message={errors?.companyEmail} />
          </div>

          <div className="field-group">
            <label htmlFor="applicantNote">Açıklama</label>
            <textarea
              id="applicantNote"
              name="applicantNote"
              rows={6}
              maxLength={1200}
              defaultValue={values.applicantNote}
              aria-invalid={Boolean(errors?.applicantNote)}
              aria-describedby={errors?.applicantNote ? "applicant-note-error" : undefined}
              placeholder="Şirketiniz, alan adınız veya manuel inceleme ihtiyacınız hakkında kısa bilgi verin."
            />
            <FieldError id="applicant-note-error" message={errors?.applicantNote} />
          </div>

          <div className="continue-bar">
            <p>
              Gönderim sonrası sonuç otomatik doğrulanabilir, manuel incelemeye alınabilir veya
              alan adı politikasına göre reddedilebilir.
            </p>
            <button className="button button--primary" type="submit" disabled={submitting}>
              {submitting ? "Başvuru gönderiliyor…" : "İş kimliği başvurusunu gönder"}
            </button>
          </div>
        </Form>

        <aside className="identity-sidebar">
          <section className="domain-explanation">
            <p className="eyebrow">Alan adı politikası</p>
            <h2>Sonuç nasıl belirlenir?</h2>
            <ul>
              <li>Doğrulanmış hesap e-postanız aynı şirket alan adındaysa otomatik doğrulama mümkün olabilir.</li>
              <li>Gmail gibi public e-posta sağlayıcıları yalnız hesabı doğrular; başvuru manuel incelemeye gider.</li>
              <li>Farklı bir şirket e-postası kendi doğrulama akışı tamamlanana kadar beklemede kalır.</li>
              <li>Engellenmiş alan adları ticari kimlik için kabul edilmez.</li>
            </ul>
          </section>

          <section className="disabled-upload" aria-disabled="true">
            <p className="eyebrow">Manuel istisna belgesi</p>
            <h2>Belge yükleme bu dilimde kapalı.</h2>
            <p>
              Private R2 yetkilendirmesi eklenmeden dosya kabul edilmeyecek. Public e-posta
              başvurunuz açıklamayla kaydedilir ve belge yükleme açıldığında güvenli biçimde
              tamamlanır.
            </p>
            <button className="button" type="button" disabled>
              Belge yükleme yakında
            </button>
          </section>
        </aside>
      </div>
    </OnboardingShell>
  );
}
