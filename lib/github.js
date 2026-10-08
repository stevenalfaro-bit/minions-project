import { createHmac, timingSafeEqual } from "node:crypto";

export function verifySignature(secret, raw, header) {
  if (!secret || !header) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Returns the announcement rows for a push payload, or null if the push
// should be ignored (not the default branch).
export function announcementsFromPush(payload) {
  const defaultRef = `refs/heads/${payload.repository?.default_branch}`;
  if (payload.ref !== defaultRef) return null;

  const repo = payload.repository?.full_name ?? "unknown";
  return (payload.commits ?? []).map((c) => ({
    repo,
    sha: c.id,
    author: c.author?.username ?? c.author?.name ?? "unknown",
    message: String(c.message ?? "").split("\n")[0],
    changes: {
      added: c.added ?? [],
      modified: c.modified ?? [],
      removed: c.removed ?? [],
    },
  }));
}

