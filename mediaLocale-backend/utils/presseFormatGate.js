function normalizeFormat(fmt) {
  if (!fmt) return "";
  return String(fmt).trim().toLowerCase();
}

function isUnknownFormat(fmt) {
  return normalizeFormat(fmt) === "";
}

function maxImagesForFormat(fmt) {
  const f = normalizeFormat(fmt);
  if (f === "article" || f === "article-text" || f === "text" || f === "article-video") return 0;
  if (f === "article-photo" || f === "article-thumbnail-video") return 1;
  return 0;
}

function maxVideosForFormat(fmt) {
  const f = normalizeFormat(fmt);
  if (f === "article" || f === "article-text" || f === "text" || f === "article-photo") return 0;
  if (f === "article-video" || f === "article-thumbnail-video") return 1;
  return 0;
}

function allowsImageForFormat(fmt) {
  return maxImagesForFormat(fmt) > 0;
}

function allowsVideoForFormat(fmt) {
  return maxVideosForFormat(fmt) > 0;
}

module.exports = {
  normalizeFormat,
  isUnknownFormat,
  maxImagesForFormat,
  maxVideosForFormat,
  allowsImageForFormat,
  allowsVideoForFormat,
};
