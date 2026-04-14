// File : media-backend/controllers/getMediaController.js

const express = require('express');
const router = express.Router();
const { Media } = require('../models'); 

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

        const mediaWithUrls = mediaFiles.map(media => {
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
