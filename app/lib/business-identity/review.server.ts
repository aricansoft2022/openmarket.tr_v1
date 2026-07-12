import { and, asc, desc, eq, ne } from "drizzle-orm";

import {
  assertNotSelfReview,
  requireStaffPermission,
  StaffAuthorizationError,
} from "../authorization/platform-staff.server";
import type { BusinessIdentityReviewerRole } from "../authorization/platform-staff";
import { createAuth, type AuthEnvironment } from "../auth/create-auth.server";
import type { Database } from "../db/client.server";
import { withDatabase } from "../db/client.server";
import {
  businessIdentityEvidence,
  businessIdentityReviews,
  companyEmails,
  user,
  type BusinessIdentityEvidenceStatus,
  type BusinessIdentityReviewMethod,
} from "../db/schema";
import { safeDownloadFilename } from "./evidence";
import {
  BusinessIdentityTransitionError,
  decideBusinessIdentityReview,
} from "./transitions.server";

export type StaffReviewEnvironment = AuthEnvironment & Pick<Env, "PRIVATE_DOCUMENTS">;

export type StaffReviewQueueItem = {
  id: string;
  companyName: string;
  method: BusinessIdentityReviewMethod;
  submittedDomain: string;
  submittedAt: Date | null;
  applicantName: string;
  applicantEmail: string;
  companyEmail: string | null;
};

export type StaffReviewEvidence = {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string | null;
  status: BusinessIdentityEvidenceStatus;
  storedAt: Date | null;
};

export type StaffReviewDetail = StaffReviewQueueItem & {
  applicantId: string;
  applicantNote: string | null;
  reviewNote: string | null;
  evidence: StaffReviewEvidence[];
};

export type StaffReviewSession<T> = {
  actor: { id: string; name: string; email: string };
  effectiveRole: BusinessIdentityReviewerRole;
  value: T;
};

function requestId(request: Request): string | undefined {
  return request.headers.get("cf-ray") ?? request.headers.get("x-request-id") ?? undefined;
}

async function currentSession(database: Database, env: StaffReviewEnvironment, request: Request) {
  const auth = createAuth(database, env);
  return auth.api.getSession({ headers: request.headers });
}

async function authorizedSession(
  database: Database,
  env: StaffReviewEnvironment,
  request: Request,
  permission:
    | "business_identity.review.list"
    | "business_identity.review.read"
    | "business_identity.review.decide"
    | "business_identity.evidence.read",
) {
  const session = await currentSession(database, env, request);
  if (!session) {
    throw new StaffAuthorizationError("UNAUTHENTICATED", "Authentication is required.");
  }
  const effectiveRole = await requireStaffPermission(database, session.user.id, permission);
  return { session, effectiveRole };
}

export async function loadBusinessIdentityReviewQueue(
  env: StaffReviewEnvironment,
  request: Request,
): Promise<StaffReviewSession<StaffReviewQueueItem[]>> {
  return withDatabase(env, async (database) => {
    const { session, effectiveRole } = await authorizedSession(
      database,
      env,
      request,
      "business_identity.review.list",
    );

    const reviews = await database
      .select({
        id: businessIdentityReviews.id,
        companyName: businessIdentityReviews.companyName,
        method: businessIdentityReviews.method,
        submittedDomain: businessIdentityReviews.submittedDomain,
        submittedAt: businessIdentityReviews.submittedAt,
        applicantName: user.name,
        applicantEmail: user.email,
        companyEmail: companyEmails.email,
      })
      .from(businessIdentityReviews)
      .innerJoin(user, eq(user.id, businessIdentityReviews.userId))
      .leftJoin(companyEmails, eq(companyEmails.id, businessIdentityReviews.companyEmailId))
      .where(
        and(
          eq(businessIdentityReviews.status, "pending"),
          ne(businessIdentityReviews.userId, session.user.id),
        ),
      )
      .orderBy(asc(businessIdentityReviews.submittedAt), asc(businessIdentityReviews.id));

    return {
      actor: { id: session.user.id, name: session.user.name, email: session.user.email },
      effectiveRole,
      value: reviews,
    };
  });
}

export async function loadBusinessIdentityReviewDetail(
  env: StaffReviewEnvironment,
  request: Request,
  reviewId: string,
): Promise<StaffReviewSession<StaffReviewDetail>> {
  return withDatabase(env, async (database) => {
    const { session, effectiveRole } = await authorizedSession(
      database,
      env,
      request,
      "business_identity.review.read",
    );

    const [review] = await database
      .select({
        id: businessIdentityReviews.id,
        applicantId: businessIdentityReviews.userId,
        companyName: businessIdentityReviews.companyName,
        method: businessIdentityReviews.method,
        submittedDomain: businessIdentityReviews.submittedDomain,
        submittedAt: businessIdentityReviews.submittedAt,
        applicantName: user.name,
        applicantEmail: user.email,
        applicantNote: businessIdentityReviews.applicantNote,
        reviewNote: businessIdentityReviews.reviewNote,
        companyEmail: companyEmails.email,
      })
      .from(businessIdentityReviews)
      .innerJoin(user, eq(user.id, businessIdentityReviews.userId))
      .leftJoin(companyEmails, eq(companyEmails.id, businessIdentityReviews.companyEmailId))
      .where(
        and(
          eq(businessIdentityReviews.id, reviewId),
          eq(businessIdentityReviews.status, "pending"),
        ),
      )
      .limit(1);

    if (!review) {
      throw new BusinessIdentityTransitionError(
        "REVIEW_NOT_FOUND",
        "Pending business identity review not found.",
      );
    }
    assertNotSelfReview(session.user.id, review.applicantId);

    const evidence = await database
      .select({
        id: businessIdentityEvidence.id,
        originalFilename: businessIdentityEvidence.originalFilename,
        mimeType: businessIdentityEvidence.mimeType,
        sizeBytes: businessIdentityEvidence.sizeBytes,
        sha256: businessIdentityEvidence.sha256,
        status: businessIdentityEvidence.status,
        storedAt: businessIdentityEvidence.storedAt,
      })
      .from(businessIdentityEvidence)
      .where(
        and(
          eq(businessIdentityEvidence.reviewId, review.id),
          eq(businessIdentityEvidence.status, "stored_private"),
        ),
      )
      .orderBy(desc(businessIdentityEvidence.createdAt));

    return {
      actor: { id: session.user.id, name: session.user.name, email: session.user.email },
      effectiveRole,
      value: { ...review, evidence },
    };
  });
}

export async function decidePermissionedBusinessIdentityReview(
  env: StaffReviewEnvironment,
  request: Request,
  input: {
    reviewId: string;
    decision: "verified" | "rejected";
    reviewNote: string;
    rejectionReason?: string;
  },
) {
  return withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const { session, effectiveRole } = await authorizedSession(
        scoped,
        env,
        request,
        "business_identity.review.decide",
      );

      const [review] = await scoped
        .select({
          userId: businessIdentityReviews.userId,
          status: businessIdentityReviews.status,
        })
        .from(businessIdentityReviews)
        .where(eq(businessIdentityReviews.id, input.reviewId))
        .limit(1)
        .for("update");

      if (!review) {
        throw new BusinessIdentityTransitionError(
          "REVIEW_NOT_FOUND",
          "Business identity review not found.",
        );
      }
      assertNotSelfReview(session.user.id, review.userId);

      return decideBusinessIdentityReview(scoped, {
        reviewId: input.reviewId,
        reviewerId: session.user.id,
        effectiveRole,
        decision: input.decision,
        reviewNote: input.reviewNote,
        rejectionReason: input.rejectionReason,
        requestId: requestId(request),
      });
    }),
  );
}

export async function downloadStaffBusinessIdentityEvidence(
  env: StaffReviewEnvironment,
  request: Request,
  reviewId: string,
  evidenceId: string,
): Promise<Response> {
  const authorized = await withDatabase(env, async (database) => {
    const { session } = await authorizedSession(
      database,
      env,
      request,
      "business_identity.evidence.read",
    );

    const [row] = await database
      .select({
        applicantId: businessIdentityReviews.userId,
        objectKey: businessIdentityEvidence.objectKey,
        originalFilename: businessIdentityEvidence.originalFilename,
        mimeType: businessIdentityEvidence.mimeType,
      })
      .from(businessIdentityEvidence)
      .innerJoin(
        businessIdentityReviews,
        eq(businessIdentityReviews.id, businessIdentityEvidence.reviewId),
      )
      .where(
        and(
          eq(businessIdentityReviews.id, reviewId),
          eq(businessIdentityReviews.status, "pending"),
          eq(businessIdentityEvidence.id, evidenceId),
          eq(businessIdentityEvidence.status, "stored_private"),
        ),
      )
      .limit(1);

    if (!row) return null;
    assertNotSelfReview(session.user.id, row.applicantId);
    return row;
  });

  if (!authorized) return new Response("Not found", { status: 404 });

  const object = await env.PRIVATE_DOCUMENTS.get(authorized.objectKey);
  if (!object) return new Response("Not found", { status: 404 });

  const filename = safeDownloadFilename(authorized.originalFilename);
  return new Response(object.body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="evidence"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Type": authorized.mimeType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
