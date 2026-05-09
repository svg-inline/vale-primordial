let index = null;

const normalize = (value = '') => value
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const contains = (record, query) => normalize(record.search).includes(query);

const buildIndex = (data) => {
  const items = data.items.map((item) => ({
    type: 'item',
    id: item.id,
    search: [
      item.name,
      item.droppedBy,
      item.duskText,
      item.dropTable,
      ...(item.dusks || []),
      ...(item.modes || []),
    ].join(' '),
  }));

  const bosses = data.bosses.map((boss) => ({
    type: 'boss',
    id: boss.id,
    search: [
      boss.name,
      boss.chapterName,
      boss.quantityOption,
      ...(boss.aliases || []),
      ...(boss.dusks || []),
    ].join(' '),
  }));

  const dusks = data.dusks.map((dusk) => ({
    type: 'dusk',
    id: dusk.id,
    search: [dusk.id, dusk.name, dusk.label, dusk.level, `capitulo ${dusk.chapter}`].join(' '),
  }));

  index = { items, bosses, dusks };
};

self.addEventListener('message', (event) => {
  const { type, data, query } = event.data || {};

  if (type === 'init') {
    buildIndex(data);
    self.postMessage({ type: 'ready' });
    return;
  }

  if (type !== 'search' || !index) {
    return;
  }

  const cleanQuery = normalize(query || '').trim();

  if (!cleanQuery) {
    self.postMessage({ type: 'results', query, results: { item: [], boss: [], dusk: [] } });
    return;
  }

  const results = {
    item: index.items.filter((record) => contains(record, cleanQuery)).map((record) => record.id),
    boss: index.bosses.filter((record) => contains(record, cleanQuery)).map((record) => record.id),
    dusk: index.dusks.filter((record) => contains(record, cleanQuery)).map((record) => record.id),
  };

  self.postMessage({ type: 'results', query, results });
});
