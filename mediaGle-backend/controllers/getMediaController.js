const { Media } = require("../models");
const {
  fetchPresseFormat,
  allowsImageForFormat,
  allowsVideoForFormat,
  isUnknownFormat,
} = require("../utils/presseFormatGate");

function isTextOnlyFormat(fmt) {
  return fmt === "article" || fmt === "article-text" || fmt === "text";
}

const getMedia = async (req, res) => {
  try {
    const { messageId } = req.params;
    const fmt = await fetchPresseFormat(messageId);

    const mid = parseInt(messageId, 10);
    const mediaFiles = await Media.findAll({ where: { messageId: mid } });

    if (isTextOnlyFormat(fmt)) {
      return res.status(200).json([]);
    }

    // Compat legacy : si le format est introuvable (schéma presse sans colonne format),
    // on renvoie les médias réellement liés au message au lieu de les masquer.
    if (mediaFiles.length === 0) {
      return res.status(200).json([]);
    }

    const filtered = isUnknownFormat(fmt)
      ? mediaFiles
      : mediaFiles.filter((media) => {
          const t = (media.type || "").toLowerCase();
          if (t.includes("image") && !allowsImageForFormat(fmt)) return false;
          if (t.includes("video") && !allowsVideoForFormat(fmt)) return false;
          return true;
        });

    if (filtered.length === 0) {
      return res.status(200).json([]);
    }

    const mediaWithUrls = filtered.map((media) => {
      let path = "";
      if (media.type === "image") {
        path = `/api/uploads/images/${media.filename}`;
      } else if (media.type === "video") {
        path = `/api/uploads/videos/${media.filename}`;
      }
      return {
        id: media.id,
        messageId: media.messageId,
        filename: media.filename,
        path: path,
        type: media.type,
        createdAt: media.createdAt,
        updatedAt: media.updatedAt,
      };
    });

    res.status(200).json(mediaWithUrls);
  } catch (error) {
    console.error("Erreur getMedia:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await Media.findOne({ where: { id } });

    if (!media) {
      return res.status(404).json({ error: "Média introuvable" });
    }

    const fs = require("fs");
    try {
      if (fs.existsSync(media.path)) {
        fs.unlinkSync(media.path);
      }
    } catch (err) {
      console.error("Erreur suppression fichier:", err);
    }

    await media.destroy();
    res.status(200).json({ message: "Média supprimé avec succès" });
  } catch (error) {
    console.error("Erreur deleteMedia:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

module.exports = { getMedia, deleteMedia };
