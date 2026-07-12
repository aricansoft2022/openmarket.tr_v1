import { and, desc, eq, sql } from "drizzle-orm";

import { createAuth, type AuthEnvironment } from "../auth/create-auth.server";
import type { Database } from "../db/client.server";
import { withDatabase } from "../db/client.server";
import {
  businessIdentityReviews,
  buyerProfiles,
  companyEmails,
  user,
  userPreferences,
  type BusinessIdentityReviewMethod,
  type BusinessIdentityReviewStatus,
  type BuyerProfileStatus,
  type CompanyEmailStatus,
  type IntendedUse,
} from "../db/schema";
import {
  selectWorkspaceIntent,
  submitBusinessIdentity,
  type BusinessDomainClassification,
  type BusinessIdentitySubmissionResult,
} from "./transitions.server";

export type OnboardingEnvironment = AuthEnvironment;

export type OnboardingReview = {
  id: string;
  status: BusinessIdentityReviewStatus;
  method: BusinessIdentityReviewMethod;
  companyName: string;
  submittedDomain: string;
  applicantNote: string | null;
  reviewNote: string | null;
  rejectionReason: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  companyEmail: string | null;
  companyEmailStatus: CompanyEmailStatus | null;
};

export type OnboardingState = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
  };
  intendedUse: IntendedUse;
  buyerStatus: BuyerProfileStatus | null;
  latestReview: OnboardingReview | null;
  canSubmitIdentity: boolean;
  canResubmitIdentity: boolean;
};

export class OnboardingActionError extends Error {
  constructor(
    public readonly code:
      | "UNAUTHENTICATED"
      | "PENDING_REVIEW_EXISTS"
      | "IDENTITY_ALREADY_VERIFIED",
    message: string,
  ) {
    super(message);
    this.name = "OnboardingActionError";
  }
}

function requestId(request: Request): string | undefined {
  return request.headers.get("cf-ray") ?? request.headers.get("x-request-id") ?? undefined;
}

async function currentSession(database: Database, env: OnboardingEnvironment, request: Request) {
  const auth = createAuth(database, env);
  return auth.api.getSession({ headers: request.headers });
}

async function stateForUser(
  database: Database,
  input: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
  },
): Promise<OnboardingState> {
  const [preferences] = await database
    .select({ intendedUse: userPreferences.intendedUse })
    .from(userPreferences)
    .where(eq(userPreferences.userId, input.id))
    .limit(1);

  const [buyer] = await database
    .select({ status: buyerProfiles.status })
    .from(buyerProfiles)
    .where(eq(buyerProfiles.userId, input.id))
    .limit(1);

  const [review] = await database
    .select({
      id: businessIdentityReviews.id,
      status: businessIdentityReviews.status,
      method: businessIdentityReviews.method,
      companyName: businessIdentityReviews.companyName,
      submittedDomain: businessIdentityReviews.submittedDomain,
      applicantNote: businessIdentityReviews.applicantNote,
      reviewNote: businessIdentityReviews.reviewNote,
      rejectionReason: businessIdentityReviews.rejectionReason,
      submittedAt: businessIdentityReviews.submittedAt,
      reviewedAt: businessIdentityReviews.reviewedAt,
      companyEmailId: businessIdentityReviews.companyEmailId,
    })
    .from(businessIdentityReviews)
    .where(eq(businessIdentityReviews.userId, input.id))
    .orderBy(desc(businessIdentityReviews.createdAt), desc(businessIdentityReviews.id))
    .limit(1);

  let linkedCompanyEmail: { email: string; status: CompanyEmailStatus } | null = null;
  if (review?.companyEmailId) {
    const [email] = await database
      .select({ email: companyEmails.email, status: companyEmails.status })
      .from(companyEmails)
      .where(eq(companyEmails.id, review.companyEmailId))
      .limit(1);
    linkedCompanyEmail = email ?? null;
  }

  const latestReview: OnboardingReview | null = review
    ? {
        id: review.id,
        status: review.status,
        method: review.method,
        companyName: review.companyName,
        submittedDomain: review.submittedDomain,
        applicantNote: review.applicantNote,
        reviewNote: review.reviewNote,
        rejectionReason: review.rejectionReason,
        submittedAt: review.submittedAt,
        reviewedAt: review.reviewedAt,
        companyEmail: linkedCompanyEmail?.email ?? null,
        companyEmailStatus: linkedCompanyEmail?.status ?? null,
      }
    : null;

  return {
    user: input,
    intendedUse: preferences?.intendedUse ?? "both",
    buyerStatus: buyer?.status ?? null,
    latestReview,
    canSubmitIdentity: input.emailVerified && !latestReview,
    canResubmitIdentity: input.emailVerified && latestReview?.status === "rejected",
  };
}

export async function loadOnboardingState(
  env: OnboardingEnvironment,
  request: Request,
): Promise<OnboardingState | null> {
  return withDatabase(env, async (database) => {
    const session = await currentSession(database, env, request);
    if (!session) return null;

    return stateForUser(database, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
    });
  });
}

export async function chooseWorkspace(
  env: OnboardingEnvironment,
  request: Request,
  intendedUse: IntendedUse,
): Promise<IntendedUse> {
  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const session = await currentSession(scoped, env, request);
      if (!session) {
        throw new OnboardingActionError("UNAUTHENTICATED", "Authentication is required.");
      }

      return selectWorkspaceIntent(scoped, {
        userId: session.user.id,
        requested: intendedUse,
        requestId: requestId(request),
      });
    }),
  );
}

export async function submitOnboardingIdentity(
  env: OnboardingEnvironment,
  request: Request,
  input: {
    companyName: string;
    companyEmail: string;
    applicantNote?: string;
  },
): Promise<BusinessIdentitySubmissionResult> {
  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const session = await currentSession(scoped, env, request);
      if (!session) {
        throw new OnboardingActionError("UNAUTHENTICATED", "Authentication is required.");
      }

      await scoped.execute(sql`select ${user.id} from ${user} where ${user.id} = ${session.user.id} for update`);

      const [openReview] = await scoped
        .select({ id: businessIdentityReviews.id })
        .from(businessIdentityReviews)
        .where(
          and(
            eq(businessIdentityReviews.userId, session.user.id),
            eq(businessIdentityReviews.status, "pending"),
          ),
        )
        .limit(1);
      if (openReview) {
        throw new OnboardingActionError(
          "PENDING_REVIEW_EXISTS",
          "A pending business identity review already exists.",
        );
      }

      const [verifiedReview] = await scoped
        .select({ id: businessIdentityReviews.id })
        .from(businessIdentityReviews)
        .where(
          and(
            eq(businessIdentityReviews.userId, session.user.id),
            eq(businessIdentityReviews.status, "verified"),
          ),
        )
        .limit(1);
      if (verifiedReview) {
        throw new OnboardingActionError(
          "IDENTITY_ALREADY_VERIFIED",
          "Business identity is already verified.",
        );
      }

      return submitBusinessIdentity(scoped, {
        userId: session.user.id,
        companyName: input.companyName,
        companyEmail: input.companyEmail,
        applicantNote: input.applicantNote,
        requestId: requestId(request),
      });
    }),
  );
}

export function onboardingResultQuery(result: {
  reviewStatus: "pending" | "verified" | "rejected";
  classification: BusinessDomainClassification;
}): string {
  const query = new URLSearchParams({
    submitted: "1",
    result: result.reviewStatus,
    classification: result.classification,
  });
  return query.toString();
}
