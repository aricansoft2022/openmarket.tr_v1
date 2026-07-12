import { createRequestHandler } from "react-router";

import type { BackgroundJob } from "../app/lib/jobs/types";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

async function handleBackgroundJob(job: BackgroundJob): Promise<void> {
  switch (job.type) {
    case "search.reindex-product":
      console.info("search.reindex-product", { productId: job.productId });
      return;
    case "notification.dispatch":
      console.info("notification.dispatch", { notificationId: job.notificationId });
      return;
    case "document.expiry-scan":
      console.info("document.expiry-scan", { requestedAt: job.requestedAt });
      return;
    case "media.cleanup":
      console.info("media.cleanup", { objectKey: job.objectKey });
      return;
  }
}

export default {
  async fetch(request) {
    return requestHandler(request);
  },

  async queue(batch) {
    for (const message of batch.messages) {
      try {
        await handleBackgroundJob(message.body);
        message.ack();
      } catch (error) {
        console.error("Background job failed", {
          job: message.body.type,
          error,
        });
        message.retry();
      }
    }
  },
} satisfies ExportedHandler<Env, BackgroundJob>;
