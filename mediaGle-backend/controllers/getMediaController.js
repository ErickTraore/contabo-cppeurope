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
    if (isTextOnlyFormat(fmt)) {
      return res.status(200).json([]);
    }
    // Ne pas exposer de lignes orphelines si le format n'a pas pu être vérifié.
    if (isUnknownFormat(fmt)) {
      return res.status(200).json([]);
    }

    const mid = parseInt(messageId, 10);
    const mediaFiles = await Media.findAll({ where: { messageId: mid } });

    if (mediaFiles.length === 0) {
      return res.status(404).json({ error: "Aucun média trouvé pour ce message." });
    }

    const filtered = [];
    for (const media of mediaFiles) {
      const t = (media.type || "").toLowerCase();
      if (t.includes("image") && !allowsImageForFormat(fmt)) continue;
      if (t.includes("video") && !allowsVideoForFormat(fmt)) continue;
      filtered.push(media);
    }

    if (filtered.length === 0) {
      return res.status(404).json({ error: "Aucun média trouvé pour ce message." });
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
