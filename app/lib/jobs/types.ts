export type BackgroundJob =
  | {
      type: "search.reindex-product";
      productId: string;
    }
  | {
      type: "notification.dispatch";
      notificationId: string;
    }
  | {
      type: "document.expiry-scan";
      requestedAt: string;
    }
  | {
      type: "media.cleanup";
      objectKey: string;
    };
