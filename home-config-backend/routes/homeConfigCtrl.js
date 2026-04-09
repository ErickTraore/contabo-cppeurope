const { HomePageConfig } = require('../models');
const defaults = require('./defaultHomeConfig');

function toPublicJson(row) {
  const j = row.toJSON ? row.toJSON() : row;
  return {
    heroText: j.heroText,
    categories: [
      { label: j.cat1Label, imageUrl: j.cat1ImageUrl },
      { label: j.cat2Label, imageUrl: j.cat2ImageUrl },
      { label: j.cat3Label, imageUrl: j.cat3ImageUrl },
    ],
    updatedAt: j.updatedAt,
  };
}

async function ensureRow() {
  const row = await HomePageConfig.findByPk(1);
  if (row) return row;
  return HomePageConfig.create(defaults);
}

exports.getHomeConfig = async (req, res) => {
  try {
    const row = await ensureRow();
    res.status(200).json(toPublicJson(row));
  } catch (e) {
    console.error('[home-config] GET', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.putHomeConfig = async (req, res) => {
  try {
    const b = req.body || {};
    const heroText = typeof b.heroText === 'string' ? b.heroText.trim() : '';
    const cats = b.categories;
    if (!heroText) {
      return res.status(400).json({ error: 'heroText requis' });
    }
    if (!Array.isArray(cats) || cats.length !== 3) {
      return res.status(400).json({ error: 'categories doit être un tableau de 3 éléments' });
    }
    const normalized = cats.map((c, i) => {
      const label = typeof c.label === 'string' ? c.label.trim() : '';
      const imageUrl = typeof c.imageUrl === 'string' ? c.imageUrl.trim() : '';
      if (!label || !imageUrl) {
        throw new Error(`Catégorie ${i + 1}: label et imageUrl requis`);
      }
      return { label, imageUrl };
    });

    await ensureRow();
    await HomePageConfig.update(
      {
        heroText,
        cat1Label: normalized[0].label,
        cat1ImageUrl: normalized[0].imageUrl,
        cat2Label: normalized[1].label,
        cat2ImageUrl: normalized[1].imageUrl,
        cat3Label: normalized[2].label,
        cat3ImageUrl: normalized[2].imageUrl,
      },
      { where: { id: 1 } }
    );
    const row = await HomePageConfig.findByPk(1);
    res.status(200).json(toPublicJson(row));
  } catch (e) {
    if (e.message && e.message.includes('Catégorie')) {
      return res.status(400).json({ error: e.message });
    }
    console.error('[home-config] PUT', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
