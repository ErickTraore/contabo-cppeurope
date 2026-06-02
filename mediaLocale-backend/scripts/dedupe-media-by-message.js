'use strict';

const path = require('path');
const envFile = process.env.ENV_FILE || '.env.production';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const { Op } = require('sequelize');
const { Media, sequelize } = require('../models');

function toMillis(d) {
  if (!d) return 0;
  const n = new Date(d).getTime();
  return Number.isFinite(n) ? n : 0;
}

function parseArgs(argv) {
  return {
    apply: argv.includes('--apply'),
    limit: (() => {
      const idx = argv.findIndex((a) => a === '--limit');
      if (idx === -1) return null;
      const raw = argv[idx + 1];
      const n = parseInt(raw, 10);
      return Number.isInteger(n) && n > 0 ? n : null;
    })(),
  };
}

async function run() {
  const { apply, limit } = parseArgs(process.argv.slice(2));

  console.log('Mode:', apply ? 'APPLY (deletions enabled)' : 'DRY-RUN (no deletion)');
  if (limit) {
    console.log('Limit groupes message/type:', limit);
  }

  await sequelize.authenticate();

  const rows = await Media.findAll({
    attributes: ['id', 'messageId', 'type', 'filename', 'createdAt', 'updatedAt'],
    where: {
      messageId: { [Op.not]: null },
      type: { [Op.in]: ['image', 'video'] },
    },
    order: [
      ['messageId', 'ASC'],
      ['type', 'ASC'],
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });

  const groups = new Map();
  for (const row of rows) {
    const key = `${row.messageId}:${row.type}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const toDelete = [];
  let inspected = 0;
  let duplicateGroups = 0;

  for (const [key, items] of groups.entries()) {
    if (limit && inspected >= limit) break;
    inspected += 1;

    if (items.length <= 1) continue;
    duplicateGroups += 1;

    items.sort((a, b) => {
      const dt = toMillis(b.createdAt) - toMillis(a.createdAt);
      if (dt !== 0) return dt;
      return b.id - a.id;
    });

    const keep = items[0];
    const drop = items.slice(1);

    console.log(`Groupe ${key} -> keep #${keep.id} (${keep.filename}), drop: ${drop.map((x) => `#${x.id}`).join(', ')}`);
    for (const d of drop) toDelete.push(d.id);
  }

  console.log('');
  console.log('Resume:');
  console.log('- Groupes inspectes:', inspected);
  console.log('- Groupes avec doublons:', duplicateGroups);
  console.log('- Lignes candidates suppression:', toDelete.length);

  if (!apply) {
    console.log('DRY-RUN termine. Relancer avec --apply pour supprimer.');
    await sequelize.close();
    process.exit(0);
  }

  if (toDelete.length === 0) {
    console.log('Aucune suppression necessaire.');
    await sequelize.close();
    process.exit(0);
  }

  const deleted = await Media.destroy({ where: { id: { [Op.in]: toDelete } } });
  console.log('Suppression effectuee:', deleted, 'ligne(s).');

  await sequelize.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('Echec dedupe mediaLocale:', err);
  try {
    await sequelize.close();
  } catch (_) {}
  process.exit(1);
});
