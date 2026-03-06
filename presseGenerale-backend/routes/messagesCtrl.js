// File : user-backend/routes/messagesCtrl.js

const fetch = (...args) => import('node-fetch').then(({
    default: fetch
}) => fetch(...args));
const MEDIA_BACKEND_URL = process.env.MEDIA_BACKEND_URL || 'http://localhost:7004/api/media/getMedia';
const MEDIA_PRESSE_GLE_URL = process.env.MEDIA_PRESSE_GLE_URL || MEDIA_BACKEND_URL;

const models = require('../models');
const jwtUtils = require('../utils/jwt.utils');

const TITLE_LIMIT = 2;
const CONTENT_LIMIT = 4;

// Routes
console.log('Voici la page messagesCtrl.js');

module.exports = {
    createMessage: function (req, res) {
        console.log('Received request body:', req.body);
        console.log('Received headers:', req.headers);

        const headerAuth = req.headers['authorization'];
        const userId = jwtUtils.getUserId(headerAuth);
        console.log('Extracted userId:', userId);

        const {
            content,
            title,
            tittle,
            image,
            video,
            categ,
            siteKey
        } = req.body;

        // Accepter "title" ou "tittle" (typo dans le frontend)
        const messageTitle = title || tittle;

        console.log('Extracted content:', content);
        console.log('Extracted title:', messageTitle);
        console.log('Extracted image:', image);
        console.log('Extracted video:', video);
        console.log('Extracted content.length:', content.length);
        console.log('Extracted title.length:', messageTitle ? messageTitle.length : 0);

        if (!messageTitle || messageTitle === '' || content === '') {
            console.log('Error: missing parameters');
            return res.status(400).json({
                'error': 'missing parameters'
            });
        }

        if (messageTitle.length <= TITLE_LIMIT || content.length <= CONTENT_LIMIT) {
            console.log('Error: parameters do not meet length requirements');
            return res.status(400).json({
                'error': 'missing parameters LIMIT'
            });
        }

        models.Message.create({
            title: messageTitle,
            content: content,
            userId: userId || null,
            categ: categ || 'presse',
            likes: 0,
            image: image || null,
            video: video || null,
            siteKey: siteKey || null
        })
        .then(function (newMessage) {
            return res.status(201).json({ id: newMessage.id });
        })
        .catch(function (err) {
            console.log('Error creating message:', err);
            return res.status(500).json({ 'error': 'cannot post message' });
        });
    },

    listMessages: async function (req, res) {
        try {
            const fields = req.query.fields || '*';
            const limit = parseInt(req.query.limit);
            const offset = parseInt(req.query.offset);
            const order = req.query.order || 'createdAt:DESC';
            const categ = req.query.categ; // Filtre par catégorie
            const siteKey = req.query.siteKey;

            console.log('Fields:', fields);
            console.log('Limit:', isNaN(limit) ? 'default (20)' : limit);
            console.log('Offset:', isNaN(offset) ? 'default (0)' : offset);
            console.log('Order:', order);
            console.log('Categ filter:', categ);

            const whereClause = {};
            if (categ) {
                whereClause.categ = categ;
            }
            if (siteKey) {
                whereClause.siteKey = siteKey;
            }

            const messages = await models.Message.findAll({
                where: whereClause,
                order: [order.split(':')], // ex: ['title', 'ASC']
                attributes: (fields !== '*' && fields != null) ? fields.split(',') : undefined,
                limit: (!isNaN(limit)) ? limit : 20,
                offset: (!isNaN(offset)) ? offset : 0,
            });

            if (!messages || messages.length === 0) {
                return res.status(200).json([]); // ✅ Réponse valide, juste vide
            }

            // ✅ Récupérer les médias pour chaque message via `getMedia`
            const enrichedMessages = await Promise.all(
                messages.map(async (message) => {
                    const messagePlain = message.get({ plain: true });
                    const mediaBase = MEDIA_PRESSE_GLE_URL;

                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

                        const response = await fetch(`${mediaBase}/${message.id}`, {
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);

                        const mediaData = await response.json();

                        return {
                            ...messagePlain, // ✅ Convertir Sequelize object en JSON
                            media: mediaData || [] // ✅ Ajouter les médias au message
                        };
                    } catch (error) {
                        console.error(`❌ Erreur lors de la récupération des médias pour le message ${message.id}:`, error.message);
                        return {
                            ...messagePlain,
                            media: []
                        }; // ✅ Si erreur, renvoyer un message sans média
                    }
                })
            );

            console.log(`✅ listMessages: ${enrichedMessages.length} articles retournés`);
            res.status(200).json(enrichedMessages);
        } catch (err) {
            console.log('❌ Erreur dans listMessages:', err);
            res.status(500).json({
                error: "Server error"
            });
        }
    },

    updateMessage: async function (req, res) {
        const messageId = parseInt(req.params.id);
        const { title, content, attachment } = req.body;

        try {
            const message = await models.Message.findOne({ where: { id: messageId } });

            if (!message) {
                return res.status(404).json({ error: 'Message not found' });
            }

            // Admin déjà vérifié par isAdminMiddleware
            // PresseGle : title, content, attachment uniquement
            await message.update({
                title: title !== undefined ? title : message.title,
                content: content !== undefined ? content : message.content,
                attachment: attachment !== undefined ? attachment : message.attachment
            });

            res.status(200).json({ message: 'Message updated successfully', data: message });
        } catch (err) {
            console.error('Error updating message:', err);
            res.status(500).json({ error: 'Cannot update message' });
        }
    },

    deleteMessage: async function (req, res) {
        const messageId = parseInt(req.params.id);

        try {
            const message = await models.Message.findOne({ where: { id: messageId } });

            if (!message) {
                return res.status(404).json({ error: 'Message not found' });
            }

            // Admin déjà vérifié par isAdminMiddleware
            await message.destroy();

            res.status(200).json({ message: 'Message deleted successfully' });
        } catch (err) {
            console.error('Error deleting message:', err);
            res.status(500).json({ error: 'Cannot delete message' });
        }
    }
};