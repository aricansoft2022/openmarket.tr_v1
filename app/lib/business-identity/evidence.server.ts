import { and, desc, eq, inArray, ne } from "drizzle-orm";

import { createAuth, type AuthEnvironment } from "../auth/create-auth.server";
import type { Database } from "../db/client.server";
import { withDatabase } from "../db/client.server";
import {
  auditLogs,
  businessIdentityEvidence,
  businessIdentityReviews,
  type BusinessIdentityEvidenceStatus,
} from "../db/schema";
import {
  maximumEvidenceFilesPerReview,
  safeDownloadFilename,
  validateEvidenceFile,
} from "./evidence";

export type EvidenceEnvironment = AuthEnvironment & Pick<Env, "PRIVATE_DOCUMENTS">;

export type EvidenceMetadata = {
  id: string;
  reviewId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string | null;
  status: BusinessIdentityEvidenceStatus;
  storedAt: Date | null;
  createdAt: Date;
};

export class EvidenceActionError extends Error {
  constructor(
    public readonly code:
      | "UNAUTHENTICATED"
      | "REVIEW_NOT_ELIGIBLE"
      | "FILE_LIMIT_REACHED"
      | "EVIDENCE_NOT_FOUND"
      | "STORAGE_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "EvidenceActionError";
  }
}

function requestId(request: Request): string | undefined {
  return request.headers.get("cf-ray") ?? request.headers.get("x-request-id") ?? undefined;
}

async function currentSession(database: Database, env: EvidenceEnvironment, request: Request) {
  const auth = createAuth(database, env);
  return auth.api.getSession({ headers: request.headers });
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function latestManualReview(database: Database, userId: string) {
  const [review] = await database
    .select({
      id: businessIdentityReviews.id,
      status: businessIdentityReviews.status,
      method: businessIdentityReviews.method,
    })
    .from(businessIdentityReviews)
    .where(eq(businessIdentityReviews.userId, userId))
    .orderBy(desc(businessIdentityReviews.createdAt), desc(businessIdentityReviews.id))
    .limit(1);

  return review ?? null;
}

export async function uploadBusinessIdentityEvidence(
  env: EvidenceEnvironment,
  request: Request,
  file: File,
): Promise<EvidenceMetadata> {
  const validated = validateEvidenceFile(file);
  const bytes = await file.arrayBuffer();
  const sha256 = await sha256Hex(bytes);
  const evidenceId = crypto.randomUUID();

  const reservation = await withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const session = await currentSession(scoped, env, request);
      if (!session) {
        throw new EvidenceActionError("UNAUTHENTICATED", "Authentication is required.");
      }

      const review = await latestManualReview(scoped, session.user.id);
      if (!review || review.method !== "manual_exception" || review.status !== "pending") {
        throw new EvidenceActionError(
          "REVIEW_NOT_ELIGIBLE",
          "A pending manual-exception review is required before evidence upload.",
        );
      }

      const existing = await scoped
        .select({ id: businessIdentityEvidence.id })
        .from(businessIdentityEvidence)
        .where(
          and(
            eq(businessIdentityEvidence.reviewId, review.id),
            inArray(businessIdentityEvidence.status, ["uploading", "stored_private"]),
          ),
        );
      if (existing.length >= maximumEvidenceFilesPerReview) {
        throw new EvidenceActionError(
          "FILE_LIMIT_REACHED",
          "The review already has the maximum number of evidence files.",
        );
      }

      const objectKey = `business-identity/${session.user.id}/${review.id}/${evidenceId}`;
      const [row] = await scoped
        .insert(businessIdentityEvidence)
        .values({
          id: evidenceId,
          reviewId: review.id,
          uploadedBy: session.user.id,
          objectKey,
          originalFilename: validated.filename,
          mimeType: validated.mimeType,
          sizeBytes: validated.sizeBytes,
          status: "uploading",
        })
        .returning({
          id: businessIdentityEvidence.id,
          reviewId: businessIdentityEvidence.reviewId,
          objectKey: businessIdentityEvidence.objectKey,
          originalFilename: businessIdentityEvidence.originalFilename,
          mimeType: businessIdentityEvidence.mimeType,
          sizeBytes: businessIdentityEvidence.sizeBytes,
          createdAt: businessIdentityEvidence.createdAt,
        });

      return { ...row!, userId: session.user.id };
    }),
  );

  try {
    await env.PRIVATE_DOCUMENTS.put(reservation.objectKey, bytes, {
      httpMetadata: { contentType: reservation.mimeType },
      customMetadata: {
        evidenceId: reservation.id,
        reviewId: reservation.reviewId,
        sha256,
      },
    });
  } catch {
    await withDatabase(env, (database) =>
      database
        .update(businessIdentityEvidence)
        .set({
          status: "failed",
          failureReason: "Private object storage write failed.",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(businessIdentityEvidence.id, reservation.id),
            eq(businessIdentityEvidence.status, "uploading"),
          ),
        ),
    );
    throw new EvidenceActionError("STORAGE_FAILED", "Private evidence storage failed.");
  }

  try {
    return await withDatabase(env, (database) =>
      database.transaction(async (transaction) => {
        const scoped = transaction as unknown as Database;
        const now = new Date();
        const [stored] = await scoped
          .update(businessIdentityEvidence)
          .set({
            status: "stored_private",
            sha256,
            storedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(businessIdentityEvidence.id, reservation.id),
              eq(businessIdentityEvidence.status, "uploading"),
            ),
          )
          .returning({
            id: businessIdentityEvidence.id,
            reviewId: businessIdentityEvidence.reviewId,
            originalFilename: businessIdentityEvidence.originalFilename,
            mimeType: businessIdentityEvidence.mimeType,
            sizeBytes: businessIdentityEvidence.sizeBytes,
            sha256: businessIdentityEvidence.sha256,
            status: businessIdentityEvidence.status,
            storedAt: businessIdentityEvidence.storedAt,
            createdAt: businessIdentityEvidence.createdAt,
          });
        if (!stored) {
          throw new EvidenceActionError("STORAGE_FAILED", "Evidence reservation was not finalized.");
        }

        await scoped.insert(auditLogs).values({
          actorId: reservation.userId,
          effectiveRole: "authenticated",
          resourceType: "business_identity_evidence",
          resourceId: reservation.id,
          action: "business_identity.evidence.stored",
          newValue: {
            reviewId: reservation.reviewId,
            mimeType: reservation.mimeType,
            sizeBytes: reservation.sizeBytes,
            sha256,
            status: "stored_private",
          },
          reason: "Applicant stored private manual-exception evidence",
          requestId: requestId(request),
        });

        return stored;
      }),
    );
  } catch (error) {
    await env.PRIVATE_DOCUMENTS.delete(reservation.objectKey).catch(() => undefined);
    await withDatabase(env, (database) =>
      database
        .update(businessIdentityEvidence)
        .set({
          status: "failed",
          failureReason: "Metadata finalization failed after object storage write.",
          updatedAt: new Date(),
        })
        .where(eq(businessIdentityEvidence.id, reservation.id)),
    ).catch(() => undefined);
    throw error;
  }
}

export async function listBusinessIdentityEvidence(
  env: EvidenceEnvironment,
  request: Request,
): Promise<{ reviewId: string; reviewStatus: string; files: EvidenceMetadata[] } | null> {
  return withDatabase(env, async (database) => {
    const session = await currentSession(database, env, request);
    if (!session) return null;

    const review = await latestManualReview(database, session.user.id);
    if (!review || review.method !== "manual_exception") {
      return { reviewId: "", reviewStatus: "none", files: [] };
    }

    const files = await database
      .select({
        id: businessIdentityEvidence.id,
        reviewId: businessIdentityEvidence.reviewId,
        originalFilename: businessIdentityEvidence.originalFilename,
        mimeType: businessIdentityEvidence.mimeType,
        sizeBytes: businessIdentityEvidence.sizeBytes,
        sha256: businessIdentityEvidence.sha256,
        status: businessIdentityEvidence.status,
        storedAt: businessIdentityEvidence.storedAt,
        createdAt: businessIdentityEvidence.createdAt,
      })
      .from(businessIdentityEvidence)
      .where(
        and(
          eq(businessIdentityEvidence.reviewId, review.id),
          ne(businessIdentityEvidence.status, "removed"),
        ),
      )
      .orderBy(desc(businessIdentityEvidence.createdAt));

    return { reviewId: review.id, reviewStatus: review.status, files };
  });
}

export async function downloadBusinessIdentityEvidence(
  env: EvidenceEnvironment,
  request: Request,
  evidenceId: string,
): Promise<Response> {
  const authorized = await withDatabase(env, async (database) => {
    const session = await currentSession(database, env, request);
    if (!session) return null;

    const [row] = await database
      .select({
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
          eq(businessIdentityEvidence.id, evidenceId),
          eq(businessIdentityEvidence.status, "stored_private"),
          eq(businessIdentityReviews.userId, session.user.id),
        ),
      )
      .limit(1);

    return row ?? null;
  });

  if (!authorized) {
    return new Response("Not found", { status: 404 });
  }

  const object = await env.PRIVATE_DOCUMENTS.get(authorized.objectKey);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

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

export async function removeBusinessIdentityEvidence(
  env: EvidenceEnvironment,
  request: Request,
  evidenceId: string,
): Promise<void> {
  const removed = await withDatabase(env, (database) =>
    database.transaction(async (transaction) => {
      const scoped = transaction as unknown as Database;
      const session = await currentSession(scoped, env, request);
      if (!session) {
        throw new EvidenceActionError("UNAUTHENTICATED", "Authentication is required.");
      }

      const [row] = await scoped
        .select({
          objectKey: businessIdentityEvidence.objectKey,
          reviewId: businessIdentityEvidence.reviewId,
          status: businessIdentityEvidence.status,
          reviewStatus: businessIdentityReviews.status,
        })
        .from(businessIdentityEvidence)
        .innerJoin(
          businessIdentityReviews,
          eq(businessIdentityReviews.id, businessIdentityEvidence.reviewId),
        )
        .where(
          and(
            eq(businessIdentityEvidence.id, evidenceId),
            eq(businessIdentityReviews.userId, session.user.id),
            inArray(businessIdentityReviews.status, ["pending", "rejected"]),
            ne(businessIdentityEvidence.status, "removed"),
          ),
        )
        .limit(1);
      if (!row) {
        throw new EvidenceActionError("EVIDENCE_NOT_FOUND", "Evidence was not found.");
      }

      const now = new Date();
      await scoped
        .update(businessIdentityEvidence)
        .set({ status: "removed", removedAt: now, updatedAt: now })
        .where(eq(businessIdentityEvidence.id, evidenceId));

      await scoped.insert(auditLogs).values({
        actorId: session.user.id,
        effectiveRole: "authenticated",
        resourceType: "business_identity_evidence",
        resourceId: evidenceId,
        action: "business_identity.evidence.removed",
        oldValue: { status: row.status, reviewId: row.reviewId },
        newValue: { status: "removed" },
        reason: "Applicant removed private manual-exception evidence",
        requestId: requestId(request),
      });

      return { objectKey: row.objectKey };
    }),
  );

  await env.PRIVATE_DOCUMENTS.delete(removed.objectKey).catch(() => undefined);
}
