export const VERSION =
  process.env.NEXT_PUBLIC_COMMIT_REF ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.COMMIT_REF ||
  process.env.GIT_COMMIT ||
  "";

export function shortVersion(len = 7) {
  return VERSION ? VERSION.slice(0, len) : "";
}

