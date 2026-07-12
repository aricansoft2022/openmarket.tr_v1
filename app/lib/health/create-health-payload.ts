export type HealthPayload = {
  status: "ok";
  service: "openmarket-tr";
  environment: string;
  commitSha: string;
  checkedAt: string;
};

export function createHealthPayload(
  environment: string,
  commitSha: string,
  checkedAt: Date = new Date(),
): HealthPayload {
  return {
    status: "ok",
    service: "openmarket-tr",
    environment,
    commitSha,
    checkedAt: checkedAt.toISOString(),
  };
}
