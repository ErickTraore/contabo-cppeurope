// File : media-backend/controllers/getMediaController.js

const express = require('express');
const router = express.Router();
const { Media } = require('../models'); 
const {
    normalizeFormat,
    maxImagesForFormat,
    maxVideosForFormat,
} = require('../utils/presseFormatGate');

function parseFormatHint(req) {
    return normalizeFormat(
        (req.query && req.query.format) ||
        (req.headers && req.headers['x-article-format']) ||
        ''
    );
}

const getMedia = async (req, res) => {
    try {
        const { messageId } = req.params;
        const mid = parseInt(String(messageId), 10);
        if (!Number.isFinite(mid) || mid <= 0) {
            return res.status(400).json({ error: 'messageId invalide.' });
        }
        const mediaFiles = await Media.findAll({ where: { messageId: mid } });
        
        if (mediaFiles.length === 0) {
            return res.status(404).json({ error: "Aucun média trouvé pour ce message." });
        }

        const fmt = parseFormatHint(req);
        let finalList = mediaFiles;
        if (fmt) {
            const maxImages = maxImagesForFormat(fmt);
            const maxVideos = maxVideosForFormat(fmt);
            const sorted = mediaFiles
                .slice()
                .sort((a, b) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) || (b.id - a.id));

            const kept = [];
            let images = 0;
            let videos = 0;
            for (const media of sorted) {
                const t = String(media.type || '').toLowerCase();
                if (t.includes('image')) {
                    if (images >= maxImages) continue;
                    images += 1;
                } else if (t.includes('video')) {
                    if (videos >= maxVideos) continue;
                    videos += 1;
                }
                kept.push(media);
            }

            finalList = kept.sort(
                (a, b) => (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()) || (a.id - b.id)
            );
        }

        const mediaWithUrls = finalList.map(media => {
            let path = '';
            if (media.type === 'image') {
                path = `/api/uploads-locale/images/${media.filename}`;
            } else if (media.type === 'video') {
                path = `/api/uploads-locale/videos/${media.filename}`;
            }
            
            return {
                id: media.id,
                messageId: media.messageId,
                filename: media.filename,
                path: path,
                type: media.type,
                createdAt: media.createdAt,
                updatedAt: media.updatedAt
            };
        });

        res.status(200).json(mediaWithUrls);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des médias :", error);
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

        const fs = require('fs');
        const path = require('path');
        try {
            const abs = path.isAbsolute(media.path)
                ? media.path
                : path.join(__dirname, '..', media.path);
            if (fs.existsSync(abs)) {
                fs.unlinkSync(abs);
            }
        } catch (err) {
            console.error("Erreur suppression fichier:", err);
        }

        await media.destroy();
        res.status(200).json({ message: "Média supprimé avec succès" });
    } catch (error) {
        console.error("❌ Erreur lors de la suppression du média :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

module.exports = { getMedia, deleteMedia };
