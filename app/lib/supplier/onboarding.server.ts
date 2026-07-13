import type { AuthEnvironment } from "../auth/create-auth.server";
import { loadOnboardingState } from "../business-identity/onboarding.server";
import { membershipCanEditSupplierProfile } from "./profile";
import { loadSupplierCompanyState } from "./profile.server";
import { launchProductionCapabilities, launchSupplierTypes } from "./catalogue";
import { supplierApplicationContextOptions } from "./onboarding";

export type SupplierOnboardingRouteContext = {
  account: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
  };
  intendedUse: "buyer" | "supplier" | "both";
  hasSupplierIntent: boolean;
  businessIdentityVerified: boolean;
  verifiedCompanyName: string | null;
  company: Awaited<ReturnType<typeof loadSupplierCompanyState>>;
  canEditCompany: boolean;
  supplierTypes: typeof launchSupplierTypes;
  productionCapabilities: typeof launchProductionCapabilities;
  applicationContexts: typeof supplierApplicationContextOptions;
};

export async function loadSupplierOnboardingRouteContext(
  env: AuthEnvironment,
  request: Request,
): Promise<SupplierOnboardingRouteContext | null> {
  const [onboarding, company] = await Promise.all([
    loadOnboardingState(env, request),
    loadSupplierCompanyState(env, request),
  ]);
  if (!onboarding) return null;

  const hasSupplierIntent =
    onboarding.intendedUse === "supplier" || onboarding.intendedUse === "both";
  const businessIdentityVerified = onboarding.latestReview?.status === "verified";

  return {
    account: onboarding.user,
    intendedUse: onboarding.intendedUse,
    hasSupplierIntent,
    businessIdentityVerified,
    verifiedCompanyName: businessIdentityVerified ? onboarding.latestReview?.companyName ?? null : null,
    company,
    canEditCompany: company
      ? membershipCanEditSupplierProfile(company.membershipRole)
      : hasSupplierIntent && businessIdentityVerified,
    supplierTypes: launchSupplierTypes,
    productionCapabilities: launchProductionCapabilities,
    applicationContexts: supplierApplicationContextOptions,
  };
}
