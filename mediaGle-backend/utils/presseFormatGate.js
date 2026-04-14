const http = require("http");
const https = require("https");

const PRESSE_BASE_URL =
  process.env.PRESSE_BASE_URL || "http://host.docker.internal:7012";

/** GET JSON court (format message) — évite fetch() qui peut rester bloqué sans réponse sur certains réseaux Docker. */
function httpGetJson(urlStr, timeoutMs = 4000) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (val) => {
      if (done) return;
      done = true;
      resolve(val);
    };
    let u;
    try {
      u = new URL(urlStr);
    } catch {
      return finish(null);
    }
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.get(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === "https:" ? 443 : 80),
        path: `${u.pathname}${u.search}`,
        timeout: timeoutMs,
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => {
          raw += c;
        });
        res.on("end", () => {
          if (res.statusCode !== 200) return finish(null);
          try {
            const j = JSON.parse(raw);
            finish(j.format != null ? String(j.format).trim().toLowerCase() : null);
          } catch {
            finish(null);
          }
        });
      }
    );
    req.on("timeout", () => {
      req.destroy();
      finish(null);
    });
    req.on("error", () => finish(null));
  });
}

async function fetchPresseFormat(messageId) {
  const mid = parseInt(messageId, 10);
  if (!mid) return null;
  try {
    const url = `${PRESSE_BASE_URL}/api/presse-generale/messages/${mid}/format`;
    const fmt = await httpGetJson(url, 4000);
    return fmt;
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
