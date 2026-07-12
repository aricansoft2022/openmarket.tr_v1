import { and, eq } from "drizzle-orm";

import type { Database } from "../db/client.server";
import {
  auditLogs,
  businessIdentityReviews,
  buyerProfiles,
  companyEmails,
  emailDomainPolicies,
  user,
  userPreferences,
  type BusinessIdentityReviewMethod,
  type IntendedUse,
} from "../db/schema";

export type BusinessDomainClassification =
  | "company_candidate"
  | "company_exception"
  | "public_email"
  | "blocked";

export type BusinessIdentitySubmissionResult = {
  reviewId: string;
  reviewStatus: "pending" | "verified" | "rejected";
  companyEmailStatus: "pending" | "verified" | "rejected";
  buyerStatus: "not_requested" | "browser" | "active";
  classification: BusinessDomainClassification;
};

export class BusinessIdentityTransitionError extends Error {
  constructor(
    public readonly code:
      | "ACCOUNT_NOT_FOUND"
      | "ACCOUNT_NOT_VERIFIED"
      | "PREFERENCES_NOT_FOUND"
      | "INVALID_EMAIL"
      | "REVIEW_NOT_FOUND"
      | "INVALID_REVIEW_TRANSITION"
      | "BUYER_NOT_ACTIVE",
    message: string,
  ) {
    super(message);
    this.name = "BusinessIdentityTransitionError";
  }
}

function normalizedEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function emailDomain(value: string): string {
  const email = normalizedEmail(value);
  const separator = email.lastIndexOf("@");
  if (separator <= 0 || separator === email.length - 1 || email.includes(" ")) {
    throw new BusinessIdentityTransitionError("INVALID_EMAIL", "A valid email is required.");
  }
  return email.slice(separator + 1);
}

export function mergeIntendedUse(current: IntendedUse, requested: IntendedUse): IntendedUse {
  if (current === requested || current === "both" || requested === "both") return current === "both" ? current : requested;
  return "both";
}

export function buyerIntent(value: IntendedUse): boolean {
  return value === "buyer" || value === "both";
}

export async function classifyBusinessDomain(
  database: Database,
  domain: string,
): Promise<BusinessDomainClassification> {
  const [policy] = await database
    .select({ kind: emailDomainPolicies.kind })
    .from(emailDomainPolicies)
    .where(eq(emailDomainPolicies.domain, domain))
    .limit(1);

  return policy?.kind ?? "company_candidate";
}

async function writeAudit(
  database: Database,
  input: {
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    oldValue?: unknown;
    newValue?: unknown;
    reason: string;
    requestId?: string;
  },
) {
  await database.insert(auditLogs).values({
    actorId: input.actorId,
    effectiveRole: "authenticated",
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    oldValue: input.oldValue,
    newValue: input.newValue,
    reason: input.reason,
    requestId: input.requestId,
  });
}

async function upsertBuyerProfile(
  database: Database,
  input: {
    userId: string;
    intendedUse: IntendedUse;
    reviewId?: string;
    activate: boolean;
    now: Date;
  },
): Promise<"not_requested" | "browser" | "active"> {
  if (!buyerIntent(input.intendedUse)) return "not_requested";

  const status = input.activate ? "active" : "browser";
  await database
    .insert(buyerProfiles)
    .values({
      userId: input.userId,
      status,
      businessIdentityReviewId: input.activate ? input.reviewId : null,
      activatedAt: input.activate ? input.now : null,
      updatedAt: input.now,
    })
    .onConflictDoUpdate({
      target: buyerProfiles.userId,
      set: input.activate
        ? {
            status: "active",
            businessIdentityReviewId: input.reviewId,
            activatedAt: input.now,
            suspendedAt: null,
            suspensionReason: null,
            updatedAt: input.now,
          }
        : {
            updatedAt: input.now,
          },
    });

  const [profile] = await database
    .select({ status: buyerProfiles.status })
    .from(buyerProfiles)
    .where(eq(buyerProfiles.userId, input.userId))
    .limit(1);

  return profile?.status === "active" ? "active" : "browser";
}

export async function selectWorkspaceIntent(
  database: Database,
  input: {
    userId: string;
    requested: IntendedUse;
    requestId?: string;
    now?: Date;
  },
): Promise<IntendedUse> {
  const now = input.now ?? new Date();
  const [preferences] = await database
    .select({ intendedUse: userPreferences.intendedUse })
    .from(userPreferences)
    .where(eq(userPreferences.userId, input.userId))
    .limit(1);

  if (!preferences) {
    throw new BusinessIdentityTransitionError(
      "PREFERENCES_NOT_FOUND",
      "Registration preferences are required before workspace selection.",
    );
  }

  const intendedUse = mergeIntendedUse(preferences.intendedUse, input.requested);
  await database
    .update(userPreferences)
    .set({ intendedUse, updatedAt: now })
    .where(eq(userPreferences.userId, input.userId));

  await upsertBuyerProfile(database, {
    userId: input.userId,
    intendedUse,
    activate: false,
    now,
  });

  if (intendedUse !== preferences.intendedUse) {
    await writeAudit(database, {
      actorId: input.userId,
      action: "workspace.intent.expanded",
      resourceType: "user_preferences",
      resourceId: input.userId,
      oldValue: { intendedUse: preferences.intendedUse },
      newValue: { intendedUse },
      reason: "User selected an additional workspace",
      requestId: input.requestId,
    });
  }

  return intendedUse;
}

export async function submitBusinessIdentity(
  database: Database,
  input: {
    userId: string;
    companyName: string;
    companyEmail: string;
    applicantNote?: string;
    requestId?: string;
    now?: Date;
  },
): Promise<BusinessIdentitySubmissionResult> {
  const now = input.now ?? new Date();
  const email = normalizedEmail(input.companyEmail);
  const domain = emailDomain(email);

  const [account] = await database
    .select({ email: user.email, emailVerified: user.emailVerified })
    .from(user)
    .where(eq(user.id, input.userId))
    .limit(1);
  if (!account) {
    throw new BusinessIdentityTransitionError("ACCOUNT_NOT_FOUND", "Account not found.");
  }
  if (!account.emailVerified) {
    throw new BusinessIdentityTransitionError(
      "ACCOUNT_NOT_VERIFIED",
      "Account verification is required before business identity submission.",
    );
  }

  const [preferences] = await database
    .select({ intendedUse: userPreferences.intendedUse })
    .from(userPreferences)
    .where(eq(userPreferences.userId, input.userId))
    .limit(1);
  if (!preferences) {
    throw new BusinessIdentityTransitionError(
      "PREFERENCES_NOT_FOUND",
      "Registration preferences are required before business identity submission.",
    );
  }

  const classification = await classifyBusinessDomain(database, domain);
  const sameVerifiedAccountEmail = normalizedEmail(account.email) === email;

  let companyEmailStatus: "pending" | "verified" | "rejected" = "pending";
  let reviewStatus: "pending" | "verified" | "rejected" = "pending";
  let method: BusinessIdentityReviewMethod = "company_email";
  let rejectionReason: string | null = null;
  let reviewNote: string | null = null;

  if (classification === "blocked") {
    companyEmailStatus = "rejected";
    reviewStatus = "rejected";
    rejectionReason = "The submitted email domain is blocked by platform policy.";
  } else if (classification === "public_email") {
    method = "manual_exception";
    reviewNote = "Public email domains require an approved manual business-identity exception.";
  } else if (sameVerifiedAccountEmail) {
    companyEmailStatus = "verified";
    reviewStatus = "verified";
    reviewNote =
      classification === "company_exception"
        ? "Verified account email accepted through an approved company-domain exception."
        : "Verified account email uses a company-domain candidate.";
  }

  const [companyEmail] = await database
    .insert(companyEmails)
    .values({
      userId: input.userId,
      email,
      domain,
      status: companyEmailStatus,
      verifiedAt: companyEmailStatus === "verified" ? now : null,
      rejectedAt: companyEmailStatus === "rejected" ? now : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [companyEmails.userId, companyEmails.email],
      set: {
        domain,
        status: companyEmailStatus,
        verifiedAt: companyEmailStatus === "verified" ? now : null,
        rejectedAt: companyEmailStatus === "rejected" ? now : null,
        updatedAt: now,
      },
    })
    .returning({ id: companyEmails.id });

  const [review] = await database
    .insert(businessIdentityReviews)
    .values({
      userId: input.userId,
      companyEmailId: companyEmail!.id,
      method,
      status: reviewStatus,
      companyName: input.companyName.trim(),
      submittedDomain: domain,
      applicantNote: input.applicantNote?.trim() || null,
      reviewNote,
      rejectionReason,
      submittedAt: now,
      reviewedAt: reviewStatus === "pending" ? null : now,
      updatedAt: now,
    })
    .returning({ id: businessIdentityReviews.id });

  const buyerStatus = await upsertBuyerProfile(database, {
    userId: input.userId,
    intendedUse: preferences.intendedUse,
    reviewId: review!.id,
    activate: reviewStatus === "verified",
    now,
  });

  await writeAudit(database, {
    actorId: input.userId,
    action: "business_identity.submitted",
    resourceType: "business_identity_review",
    resourceId: review!.id,
    newValue: {
      method,
      status: reviewStatus,
      classification,
      companyEmailStatus,
      buyerStatus,
    },
    reason: "User submitted business identity",
    requestId: input.requestId,
  });

  return {
    reviewId: review!.id,
    reviewStatus,
    companyEmailStatus,
    buyerStatus,
    classification,
  };
}

export async function decideBusinessIdentityReview(
  database: Database,
  input: {
    reviewId: string;
    reviewerId: string;
    decision: "verified" | "rejected";
    reviewNote: string;
    rejectionReason?: string;
    requestId?: string;
    now?: Date;
  },
): Promise<{ reviewStatus: "verified" | "rejected"; buyerStatus: "not_requested" | "browser" | "active" }> {
  const now = input.now ?? new Date();
  const [review] = await database
    .select({
      id: businessIdentityReviews.id,
      userId: businessIdentityReviews.userId,
      status: businessIdentityReviews.status,
      companyEmailId: businessIdentityReviews.companyEmailId,
    })
    .from(businessIdentityReviews)
    .where(eq(businessIdentityReviews.id, input.reviewId))
    .limit(1);
  if (!review) {
    throw new BusinessIdentityTransitionError("REVIEW_NOT_FOUND", "Business identity review not found.");
  }
  if (review.status !== "pending") {
    throw new BusinessIdentityTransitionError(
      "INVALID_REVIEW_TRANSITION",
      "Only pending reviews can be decided.",
    );
  }

  const [preferences] = await database
    .select({ intendedUse: userPreferences.intendedUse })
    .from(userPreferences)
    .where(eq(userPreferences.userId, review.userId))
    .limit(1);
  if (!preferences) {
    throw new BusinessIdentityTransitionError(
      "PREFERENCES_NOT_FOUND",
      "Registration preferences are required before review decisions.",
    );
  }

  const rejectionReason = input.decision === "rejected" ? input.rejectionReason?.trim() : undefined;
  if (input.decision === "rejected" && (!rejectionReason || rejectionReason.length < 3)) {
    throw new BusinessIdentityTransitionError(
      "INVALID_REVIEW_TRANSITION",
      "Rejected reviews require a reason.",
    );
  }

  await database
    .update(businessIdentityReviews)
    .set({
      status: input.decision,
      reviewNote: input.reviewNote.trim(),
      rejectionReason: input.decision === "rejected" ? rejectionReason : null,
      reviewedBy: input.reviewerId,
      reviewedAt: now,
      updatedAt: now,
    })
    .where(and(eq(businessIdentityReviews.id, review.id), eq(businessIdentityReviews.status, "pending")));

  if (review.companyEmailId) {
    await database
      .update(companyEmails)
      .set({
        status: input.decision === "verified" ? "verified" : "rejected",
        verifiedAt: input.decision === "verified" ? now : null,
        rejectedAt: input.decision === "rejected" ? now : null,
        updatedAt: now,
      })
      .where(eq(companyEmails.id, review.companyEmailId));
  }

  const buyerStatus = await upsertBuyerProfile(database, {
    userId: review.userId,
    intendedUse: preferences.intendedUse,
    reviewId: review.id,
    activate: input.decision === "verified",
    now,
  });

  await writeAudit(database, {
    actorId: input.reviewerId,
    action:
      input.decision === "verified"
        ? "business_identity.verified"
        : "business_identity.rejected",
    resourceType: "business_identity_review",
    resourceId: review.id,
    oldValue: { status: "pending" },
    newValue: { status: input.decision, buyerStatus },
    reason:
      input.decision === "verified"
        ? input.reviewNote.trim()
        : `${input.reviewNote.trim()}: ${rejectionReason}`,
    requestId: input.requestId,
  });

  return { reviewStatus: input.decision, buyerStatus };
}

export async function assertActiveBuyer(database: Database, userId: string): Promise<void> {
  const [profile] = await database
    .select({ status: buyerProfiles.status })
    .from(buyerProfiles)
    .where(eq(buyerProfiles.userId, userId))
    .limit(1);

  if (profile?.status !== "active") {
    throw new BusinessIdentityTransitionError(
      "BUYER_NOT_ACTIVE",
      "Commercial buyer actions require an active buyer workspace.",
    );
  }
}
