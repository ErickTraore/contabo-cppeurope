const PRESSE_BASE_URL = process.env.PRESSE_BASE_URL || "http://host.docker.internal:7016";

async function fetchPresseFormat(messageId) {
  const mid = parseInt(messageId, 10);
  if (!mid) return null;
  try {
    const url = `${PRESSE_BASE_URL}/api/presse-generale/messages/${mid}/format`;
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const j = await r.json();
    return j.format != null ? String(j.format).trim().toLowerCase() : null;
  } catch (e) {
    console.error("fetchPresseFormat:", e.message);
    return null;
  }
}

/** Format non résolu : ne pas deviner (fail closed). */
function isUnknownFormat(fmt) {
  return fmt == null || fmt === "";
}

function allowsImageForFormat(fmt) {
  if (isUnknownFormat(fmt)) return false;
  if (fmt === "article" || fmt === "article-text" || fmt === "text") return false;
  if (fmt === "article-video") return false;
  return true;
}

function allowsVideoForFormat(fmt) {
  if (isUnknownFormat(fmt)) return false;
  if (fmt === "article" || fmt === "article-text" || fmt === "text") return false;
  if (fmt === "article-photo") return false;
  return true;
}

module.exports = {
  fetchPresseFormat,
  allowsImageForFormat,
  allowsVideoForFormat,
  isUnknownFormat,
};
