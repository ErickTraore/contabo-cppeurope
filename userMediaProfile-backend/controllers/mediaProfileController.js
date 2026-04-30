// File:lespremices/media-backend/controllers/mediaProfileController.js

const { MediaProfile } = require('../models'); // Sequelize ou autre ORM

const CANONICAL_SLOTS = [0, 1, 2, 3];

function parseSlot(value) {
  const slot = Number(value);
  return Number.isInteger(slot) ? slot : null;
}

function tsValue(item) {
  const ts = Date.parse(item?.updatedAt || item?.createdAt || 0);
  return Number.isFinite(ts) ? ts : 0;
}

function idValue(item) {
  const n = Number(item?.id);
  return Number.isFinite(n) ? n : 0;
}

function normalizeMediaBySlot(rows) {
  const grouped = new Map(CANONICAL_SLOTS.map((slot) => [slot, []]));

  for (const row of Array.isArray(rows) ? rows : []) {
    const slot = parseSlot(row?.slot);
    if (!CANONICAL_SLOTS.includes(slot)) continue;
    grouped.get(slot).push(row);
  }

  const pickLatest = (items) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    return [...items].sort((a, b) => {
      const byTs = tsValue(b) - tsValue(a);
      if (byTs !== 0) return byTs;
      return idValue(b) - idValue(a);
    })[0];
  };

  return CANONICAL_SLOTS
    .map((slot) => pickLatest(grouped.get(slot)))
    .filter(Boolean);
}

// ✅ POST /api/mediaProfile/
exports.createMediaProfile = async (req, res) => {
  try {
    const payload = req.body || {};
    const slot = parseSlot(payload.slot);

    // Idempotence stricte par profileId+slot pour éviter les doublons historiques.
    if (payload.profileId && CANONICAL_SLOTS.includes(slot)) {
      const existing = await MediaProfile.findOne({
        where: { profileId: payload.profileId, slot },
        order: [['updatedAt', 'DESC'], ['id', 'DESC']],
      });

      if (existing) {
        await existing.update(payload);
        return res.status(200).json(existing);
      }
    }

    const newMedia = await MediaProfile.create(payload);
    res.status(201).json(newMedia);
  } catch (error) {
    res.status(500).json({ error: 'Erreur création média', details: error.message });
  }
};

// ✅ PUT /api/mediaProfile/:id/
exports.updateMediaProfile = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { url } = req.body;

  console.log('📥 Requête reçue pour updateMediaProfile :', id, url);

  try {
    const media = await MediaProfile.findByPk(id); // ✅ recherche par clé primaire
    if (!media) {
      console.log('❌ Média introuvable pour id :', id);
      return res.status(404).json({ error: 'Média introuvable' });
    }

    media.path = url;
    media.filename = url.split('/').pop();
    await media.save();

    console.log('✅ Média mis à jour :', {
      id: media.id,
      filename: media.filename,
      path: media.path,
    });

    res.json(media);
  } catch (err) {
    console.error('❌ Erreur updateMediaProfile :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


// ✅ DELETE /api/mediaProfile/:id/
exports.deleteMediaProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await MediaProfile.destroy({ where: { id } });
    if (deleted === 0) return res.status(404).json({ error: 'Média introuvable' });
    res.status(204).send(); // No Content
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression média', details: error.message });
  }
};

exports.getMediaByProfileId = async (req, res) => {
  const { profileId } = req.params;
  console.log('📥 Requête reçue pour getMediaByProfileId :', profileId);

  try {
    const mediaList = await MediaProfile.findAll({
      where: { profileId },
      order: [['updatedAt', 'DESC'], ['id', 'DESC']],
    });
    const normalized = normalizeMediaBySlot(mediaList);
    normalized.sort((a, b) => Number(a.slot) - Number(b.slot));

    console.log(`✅ ${mediaList.length} médias bruts trouvés pour profileId ${profileId}; ${normalized.length} après normalisation`);
    res.status(200).json(normalized);
  } catch (error) {
    console.error('❌ Erreur récupération médias :', error.message);
    res.status(500).json({ error: 'Erreur récupération médias', details: error.message });
  }
};



