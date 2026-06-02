'use strict';

/**
 * Verification anti-regression des garde-fous media pour presse generale.
 *
 * Requis:
 * - BASE_URL (defaut: http://localhost:8082)
 * - ACCESS_TOKEN (Bearer admin)
 *
 * Usage:
 *   ACCESS_TOKEN=... node scripts/security/verify_media_guardrails_generale.js
 */

const BASE_URL = (process.env.BASE_URL || 'http://localhost:8082').replace(/\/$/, '');
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || '';

if (!ACCESS_TOKEN) {
  console.error('ACCESS_TOKEN manquant.');
  process.exit(1);
}

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    ...extra,
  };
}

function toJsonSafe(response) {
  return response.text().then((txt) => {
    if (!txt) return null;
    try {
      return JSON.parse(txt);
    } catch {
      return { raw: txt };
    }
  });
}

async function createMessage(format) {
  const payload = {
    title: `GUARDRAIL-${format}-${Date.now()}`,
    content: `guardrail ${format}`,
    categ: 'presse',
    format,
  };

  const r = await fetch(`${BASE_URL}/api/presse-generale/messages/new/`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  const body = await toJsonSafe(r);
  const id = Number(body && (body.id || body.messageId || (body.message && body.message.id)));
  return { status: r.status, ok: r.ok, id: Number.isInteger(id) && id > 0 ? id : null, body };
}

function makePngBlob() {
  return new Blob(['a'], { type: 'image/png' });
}

function makeMp4Blob() {
  return new Blob(['a'], { type: 'video/mp4' });
}

async function uploadImage(messageId, format) {
  const fd = new FormData();
  fd.append('messageId', String(messageId));
  fd.append('format', format);
  fd.append('image', makePngBlob(), `img-${Date.now()}.png`);

  const r = await fetch(`${BASE_URL}/api/media/uploadImage/`, {
    method: 'POST',
    headers: authHeaders(),
    body: fd,
  });

  const body = await toJsonSafe(r);
  return { status: r.status, body };
}

async function uploadVideo(messageId, format) {
  const fd = new FormData();
  fd.append('messageId', String(messageId));
  fd.append('format', format);
  fd.append('video', makeMp4Blob(), `vid-${Date.now()}.mp4`);

  const r = await fetch(`${BASE_URL}/api/media/uploadVideo/`, {
    method: 'POST',
    headers: authHeaders(),
    body: fd,
  });

  const body = await toJsonSafe(r);
  return { status: r.status, body };
}

function validateCase(fmt, statuses) {
  const expected = {
    article: { image1: [403], image2: [403], video1: [403], video2: [403] },
    'article-photo': { image1: [201, 409], image2: [409], video1: [403], video2: [403] },
    'article-video': { image1: [403], image2: [403], video1: [201, 409], video2: [409] },
    'article-thumbnail-video': {
      image1: [201, 409],
      image2: [409],
      video1: [201, 409],
      video2: [409],
    },
  }[fmt];

  const mismatches = [];
  for (const key of Object.keys(expected)) {
    if (!expected[key].includes(statuses[key])) {
      mismatches.push(`${key}: expected one of [${expected[key].join(', ')}], got ${statuses[key]}`);
    }
  }
  return { ok: mismatches.length === 0, mismatches, expected };
}

async function run() {
  const formats = ['article', 'article-photo', 'article-video', 'article-thumbnail-video'];
  const results = [];
  let failures = 0;

  for (const fmt of formats) {
    const created = await createMessage(fmt);
    if (!created.ok || !created.id) {
      failures += 1;
      results.push({
        format: fmt,
        createStatus: created.status,
        error: 'create_failed',
        detail: created.body,
      });
      continue;
    }

    const image1 = await uploadImage(created.id, fmt);
    const image2 = await uploadImage(created.id, fmt);
    const video1 = await uploadVideo(created.id, fmt);
    const video2 = await uploadVideo(created.id, fmt);

    const statuses = {
      image1: image1.status,
      image2: image2.status,
      video1: video1.status,
      video2: video2.status,
    };

    const verdict = validateCase(fmt, statuses);
    if (!verdict.ok) failures += 1;

    results.push({
      format: fmt,
      messageId: created.id,
      createStatus: created.status,
      statuses,
      expected: verdict.expected,
      ok: verdict.ok,
      mismatches: verdict.mismatches,
    });
  }

  console.log(JSON.stringify({ baseUrl: BASE_URL, results }, null, 2));

  if (failures > 0) {
    console.error(`Guardrail verification FAILED (${failures} case(s)).`);
    process.exit(1);
  }

  console.log('Guardrail verification PASSED (all 4 formats).');
  process.exit(0);
}

run().catch((err) => {
  console.error('Guardrail verification error:', err);
  process.exit(1);
});
