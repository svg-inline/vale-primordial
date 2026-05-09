(() => {
  'use strict';

  const data = window.DUSK_INDEX;

  if (!data) {
    document.getElementById('app-main').innerHTML = '<section class="empty-state"><h2>Dados não encontrados</h2><p>Verifique se data/dusk-index.js existe.</p></section>';
    return;
  }

  const state = {
    view: location.hash.replace('#', '') || 'dashboard',
    query: '',
    chapter: 'all',
    dusk: 'all',
    boss: 'all',
    mode: 'all',
    dropTable: 'all',
    sort: 'name',
    searchResults: { item: [], boss: [], dusk: [] },
    workerReady: false,
  };

  const els = {
    main: document.getElementById('app-main'),
    search: document.getElementById('global-search'),
    tabs: [...document.querySelectorAll('[data-view]')],
    filters: [...document.querySelectorAll('[data-filter]')],
    reset: document.getElementById('reset-filters'),
    panel: document.getElementById('detail-panel'),
    detail: document.getElementById('detail-content'),
  };

  const normalize = (value = '') => value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const escapeHTML = (value = '') => value.toString().replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[char]));

  const unique = (items) => [...new Set(items.filter(Boolean))];
  const byId = (collection, id) => collection.find((item) => item.id === id);
  const itemById = (id) => byId(data.items, id);
  const bossById = (id) => byId(data.bosses, id);
  const duskById = (id) => byId(data.dusks, id);

  const imageAttempts = (src) => {
    if (!src) return [];
    const normalized = src.replaceAll('\\', '/');
    return unique([normalized, `../${normalized}`, `./${normalized}`]);
  };

  const imageHTML = (src, alt, className = 'thumb') => {
    const attempts = imageAttempts(src);
    if (!attempts.length) {
      return `<span class="image-fallback" aria-hidden="true">${escapeHTML((alt || '?').slice(0, 2).toUpperCase())}</span>`;
    }

    return `<img class="${className}" src="${escapeHTML(attempts[0])}" alt="${escapeHTML(alt)}" loading="lazy" data-image-attempts="${escapeHTML(attempts.join('|'))}" data-image-index="0">`;
  };

  const tagsHTML = (items, modifier = '') => {
    if (!items || !items.length) return '<span class="tag">Não informado</span>';
    return `<div class="tags">${items.map((item) => `<span class="tag ${modifier}">${escapeHTML(item)}</span>`).join('')}</div>`;
  };

  const getItemSearchText = (item) => normalize([
    item.name,
    item.droppedBy,
    item.duskText,
    item.dropTable,
    item.bossName,
    ...(item.dusks || []),
    ...(item.modes || []),
  ].join(' '));

  const getBossSearchText = (boss) => normalize([
    boss.name,
    boss.chapterName,
    boss.quantityOption,
    ...(boss.aliases || []),
    ...(boss.dusks || []),
  ].join(' '));

  const getDuskSearchText = (dusk) => normalize([
    dusk.id,
    dusk.name,
    dusk.label,
    dusk.level,
    `capitulo ${dusk.chapter}`,
  ].join(' '));

  const localSearch = (kind, id, searchText) => {
    if (!state.query) return true;
    const pool = state.searchResults[kind];
    if (state.workerReady && pool.length) return pool.includes(id);
    return searchText.includes(normalize(state.query));
  };

  const itemMatchesFilters = (item) => {
    if (!localSearch('item', item.id, getItemSearchText(item))) return false;
    if (state.dusk !== 'all' && !(item.dusks || []).includes(state.dusk)) return false;
    if (state.boss !== 'all' && item.bossId !== state.boss) return false;
    if (state.mode !== 'all' && !(item.modes || []).includes(state.mode)) return false;
    if (state.dropTable !== 'all' && item.dropTable !== state.dropTable) return false;

    if (state.chapter !== 'all') {
      return (item.dusks || []).some((duskId) => duskById(duskId)?.chapter === state.chapter);
    }

    return true;
  };

  const sortItems = (items) => [...items].sort((a, b) => {
    const sorters = {
      name: [a.name, b.name],
      dusk: [a.duskText, b.duskText],
      boss: [a.droppedBy, b.droppedBy],
      table: [a.dropTable, b.dropTable],
    };
    const [left, right] = sorters[state.sort] || sorters.name;
    return left.localeCompare(right, 'pt-BR', { sensitivity: 'base' });
  });

  const getFilteredItems = () => sortItems(data.items.filter(itemMatchesFilters));

  const getFilteredBosses = () => data.bosses.filter((boss) => {
    if (!localSearch('boss', boss.id, getBossSearchText(boss))) return false;
    if (state.chapter !== 'all' && boss.chapter !== state.chapter) return false;
    if (state.dusk !== 'all' && !(boss.dusks || []).includes(state.dusk)) return false;
    if (state.boss !== 'all' && boss.id !== state.boss) return false;
    return true;
  });

  const getFilteredDusks = () => data.dusks.filter((dusk) => {
    if (!localSearch('dusk', dusk.id, getDuskSearchText(dusk))) return false;
    if (state.chapter !== 'all' && dusk.chapter !== state.chapter) return false;
    if (state.dusk !== 'all' && dusk.id !== state.dusk) return false;
    return true;
  });

  const setHTML = (html) => {
    els.main.innerHTML = html;
    bindDynamicEvents();
    bindImageFallbacks(els.main);
  };

  const renderStats = () => `
    <section class="stats-grid" aria-label="Resumo">
      <article class="stat-card"><span class="stat-card__value">${data.dusks.length}</span><span class="stat-card__label">Dusks indexadas</span></article>
      <article class="stat-card"><span class="stat-card__value">${data.bosses.length}</span><span class="stat-card__label">Bosses</span></article>
      <article class="stat-card"><span class="stat-card__value">${data.items.length}</span><span class="stat-card__label">Drops / materiais</span></article>
      <article class="stat-card"><span class="stat-card__value">${getFilteredItems().length}</span><span class="stat-card__label">Resultados filtrados</span></article>
    </section>`;

  const renderDashboard = () => {
    const topBosses = [...data.bosses].sort((a, b) => b.dropsCount - a.dropsCount).slice(0, 6);
    return `
      ${renderStats()}
      <section class="panel">
        <div class="panel__header">
          <h2 class="panel__title">Dusks</h2>
          <span class="panel__meta">${data.dusks.length} níveis</span>
        </div>
        <div class="dusk-grid">${data.dusks.map(renderDuskCard).join('')}</div>
      </section>
      <section class="panel">
        <div class="panel__header">
          <h2 class="panel__title">Bosses com mais drops</h2>
          <span class="panel__meta">Top ${topBosses.length}</span>
        </div>
        <div class="card-grid">${topBosses.map(renderBossCard).join('')}</div>
      </section>`;
  };

  const renderDuskCard = (dusk) => {
    const items = (dusk.items || []).map(itemById).filter(Boolean);
    const bosses = (dusk.bosses || []).map(bossById).filter(Boolean);
    const preview = items.slice(0, 5).map((item) => item.name);

    return `
      <button class="card" type="button" data-detail-type="dusk" data-detail-id="${escapeHTML(dusk.id)}">
        <div class="tags">
          <span class="tag tag--primary">${escapeHTML(dusk.id)}</span>
          <span class="tag">Capítulo ${escapeHTML(dusk.chapter)}</span>
          <span class="tag tag--blue">Lv. ${escapeHTML(dusk.level)}</span>
        </div>
        <h3 class="card__title">${escapeHTML(dusk.name)}</h3>
        <p class="card__meta">${bosses.length} bosses · ${items.length} drops</p>
        ${tagsHTML(preview, 'tag--green')}
      </button>`;
  };

  const renderBossCard = (boss) => {
    const dropNames = (boss.drops || []).map(itemById).filter(Boolean).slice(0, 4).map((item) => item.name);
    return `
      <button class="card" type="button" data-detail-type="boss" data-detail-id="${escapeHTML(boss.id)}">
        <div class="card__row">
          <span class="card__media">${imageHTML(boss.image, boss.name, 'thumb')}</span>
          <div>
            <h3 class="card__title">${escapeHTML(boss.name)}</h3>
            <p class="card__meta">${escapeHTML(boss.chapterName)} · ${boss.dropsCount} drops</p>
          </div>
        </div>
        ${tagsHTML(boss.dusks, 'tag--primary')}
        ${dropNames.length ? tagsHTML(dropNames) : '<p class="card__text">Sem drop vinculado.</p>'}
      </button>`;
  };

  const renderItemCard = (item) => `
    <button class="card" type="button" data-detail-type="item" data-detail-id="${escapeHTML(item.id)}">
      <div class="card__row">
        <span class="card__media">${imageHTML(item.image, item.name, 'thumb')}</span>
        <div>
          <h3 class="card__title">${escapeHTML(item.name)}</h3>
          <p class="card__meta">${escapeHTML(item.droppedBy)}</p>
        </div>
      </div>
      ${tagsHTML(item.dusks, 'tag--primary')}
      ${tagsHTML(item.modes, 'tag--blue')}
      <p class="card__text">${escapeHTML(item.dropTable)}</p>
    </button>`;

  const renderDusks = () => {
    const dusks = getFilteredDusks();
    if (!dusks.length) return emptyHTML();
    return `
      ${renderStats()}
      <section class="panel">
        <div class="list-header">
          <h2 class="list-header__title">Dusks</h2>
          <span class="list-header__meta">${dusks.length} resultado(s)</span>
        </div>
        <div class="dusk-grid">${dusks.map(renderDuskCard).join('')}</div>
      </section>`;
  };

  const renderBosses = () => {
    const bosses = getFilteredBosses();
    if (!bosses.length) return emptyHTML();
    return `
      ${renderStats()}
      <section class="panel">
        <div class="list-header">
          <h2 class="list-header__title">Bosses</h2>
          <span class="list-header__meta">${bosses.length} resultado(s)</span>
        </div>
        <div class="card-grid">${bosses.map(renderBossCard).join('')}</div>
      </section>`;
  };

  const renderDrops = () => {
    const items = getFilteredItems();
    if (!items.length) return emptyHTML();
    return `
      ${renderStats()}
      <section class="table-card">
        <div class="panel__header" style="padding: 1rem 1rem 0;">
          <h2 class="panel__title">Drops indexados</h2>
          <span class="panel__meta">${items.length} resultado(s)</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Dropado de</th>
              <th>Dusk</th>
              <th>Modo</th>
              <th>Tabela</th>
            </tr>
          </thead>
          <tbody>${items.map(renderItemRow).join('')}</tbody>
        </table>
      </section>`;
  };

  const renderItemRow = (item) => `
    <tr>
      <td data-label="Item">
        <div class="item-cell">
          ${imageHTML(item.image, item.name, 'thumb')}
          <button class="link-button" type="button" data-detail-type="item" data-detail-id="${escapeHTML(item.id)}">${escapeHTML(item.name)}</button>
        </div>
      </td>
      <td data-label="Dropado de">${escapeHTML(item.droppedBy)}</td>
      <td data-label="Dusk">${tagsHTML(item.dusks, 'tag--primary')}</td>
      <td data-label="Modo">${tagsHTML(item.modes, 'tag--blue')}</td>
      <td data-label="Tabela">${escapeHTML(item.dropTable)}</td>
    </tr>`;

  const renderEquipment = () => `
    <section class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Equipamentos</h2>
        <span class="panel__meta">Base pronta para receitas</span>
      </div>
      <p class="card__text">A estrutura já permite ligar equipamentos aos drops por <strong>itemId</strong>. Use o arquivo <code>data/equipment.example.json</code> como modelo.</p>
      <pre class="code-box"><code>${escapeHTML(JSON.stringify({
        id: 'arma-exemplo',
        name: 'Arma Exemplo',
        type: 'weapon',
        level: 90,
        requiredItems: [
          { itemId: 'simbolo-do-crepusculo', quantity: 1 },
          { itemId: 'alma-pura-da-escuridao', quantity: 2 },
        ],
      }, null, 2))}</code></pre>
    </section>
    <section class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Drops disponíveis para receita</h2>
        <span class="panel__meta">${data.items.length} itemIds</span>
      </div>
      <div class="card-grid">${data.items.slice(0, 12).map(renderItemCard).join('')}</div>
    </section>`;

  const emptyHTML = () => document.getElementById('empty-template').innerHTML;

  const render = () => {
    updateTabs();

    const views = {
      dashboard: renderDashboard,
      dusks: renderDusks,
      bosses: renderBosses,
      drops: renderDrops,
      equipment: renderEquipment,
    };

    setHTML((views[state.view] || views.dashboard)());
  };

  const updateTabs = () => {
    els.tabs.forEach((tab) => {
      tab.classList.toggle('is-active', tab.dataset.view === state.view);
    });
  };

  const bindDynamicEvents = (root = els.main) => {
    root.querySelectorAll('[data-detail-type][data-detail-id]').forEach((button) => {
      button.addEventListener('click', () => openDetail(button.dataset.detailType, button.dataset.detailId));
    });
  };

  const bindImageFallbacks = (root = document) => {
    root.querySelectorAll('img[data-image-attempts]').forEach((img) => {
      img.addEventListener('error', () => {
        const attempts = img.dataset.imageAttempts.split('|');
        const index = Number(img.dataset.imageIndex || 0) + 1;
        if (attempts[index]) {
          img.dataset.imageIndex = String(index);
          img.src = attempts[index];
          return;
        }

        const fallback = document.createElement('span');
        fallback.className = 'image-fallback';
        fallback.setAttribute('aria-hidden', 'true');
        fallback.textContent = (img.alt || '?').slice(0, 2).toUpperCase();
        img.replaceWith(fallback);
      }, { once: false });
    });
  };

  const openDetail = (type, id) => {
    const renderers = {
      item: renderItemDetail,
      boss: renderBossDetail,
      dusk: renderDuskDetail,
    };

    els.detail.innerHTML = renderers[type]?.(id) || '';
    bindDynamicEvents(els.detail);
    bindImageFallbacks(els.detail);
    els.panel.classList.add('is-open');
    els.panel.setAttribute('aria-hidden', 'false');
  };

  const closeDetail = () => {
    els.panel.classList.remove('is-open');
    els.panel.setAttribute('aria-hidden', 'true');
  };

  const renderItemDetail = (id) => {
    const item = itemById(id);
    if (!item) return '';
    const boss = bossById(item.bossId);
    const dusks = (item.dusks || []).map(duskById).filter(Boolean);

    return `
      <article class="detail-hero">
        <div class="detail-hero__image">${imageHTML(item.image, item.name, 'thumb')}</div>
        <div>
          <h2 id="detail-title">${escapeHTML(item.name)}</h2>
          ${tagsHTML(item.dusks, 'tag--primary')}
        </div>
        <div class="detail-list">
          <div class="detail-list__item"><span class="detail-list__label">ID indexado</span><span>${escapeHTML(item.id)}</span></div>
          <div class="detail-list__item"><span class="detail-list__label">Dropado de</span><span>${escapeHTML(item.droppedBy)}</span></div>
          <div class="detail-list__item"><span class="detail-list__label">Boss vinculado</span><span>${boss ? `<button class="link-button" data-detail-type="boss" data-detail-id="${escapeHTML(boss.id)}">${escapeHTML(boss.name)}</button>` : 'Não vinculado'}</span></div>
          <div class="detail-list__item"><span class="detail-list__label">Dusk</span><span>${dusks.map((dusk) => `<button class="link-button" data-detail-type="dusk" data-detail-id="${escapeHTML(dusk.id)}">${escapeHTML(dusk.label)}</button>`).join(' · ') || 'Não informado'}</span></div>
          <div class="detail-list__item"><span class="detail-list__label">Modo</span><span>${escapeHTML((item.modes || []).join(' / '))}</span></div>
          <div class="detail-list__item"><span class="detail-list__label">Tabela</span><span>${escapeHTML(item.dropTable)}</span></div>
        </div>
      </article>`;
  };

  const renderBossDetail = (id) => {
    const boss = bossById(id);
    if (!boss) return '';
    const drops = (boss.drops || []).map(itemById).filter(Boolean);
    return `
      <article class="detail-hero">
        <div class="detail-hero__image">${imageHTML(boss.image, boss.name, 'thumb')}</div>
        <div>
          <h2 id="detail-title">${escapeHTML(boss.name)}</h2>
          <p class="card__meta">${escapeHTML(boss.chapterName)} · ${escapeHTML(boss.quantityOption || 'Sem quantidade')}</p>
          ${tagsHTML(boss.dusks, 'tag--primary')}
        </div>
        <div class="detail-list">
          <div class="detail-list__item"><span class="detail-list__label">ID indexado</span><span>${escapeHTML(boss.id)}</span></div>
          <div class="detail-list__item"><span class="detail-list__label">Aliases detectados</span><span>${escapeHTML((boss.aliases || []).join(', ') || 'Nenhum')}</span></div>
          <div class="detail-list__item"><span class="detail-list__label">Drops</span><span>${drops.length}</span></div>
        </div>
        <div class="card-grid">${drops.map(renderItemCard).join('') || '<p class="card__text">Sem drops vinculados.</p>'}</div>
      </article>`;
  };

  const renderDuskDetail = (id) => {
    const dusk = duskById(id);
    if (!dusk) return '';
    const bosses = (dusk.bosses || []).map(bossById).filter(Boolean);
    const items = (dusk.items || []).map(itemById).filter(Boolean);
    return `
      <article class="detail-hero">
        <div>
          <h2 id="detail-title">${escapeHTML(dusk.label)}</h2>
          <p class="card__meta">Capítulo ${escapeHTML(dusk.chapter)} · Lv. ${escapeHTML(dusk.level)}</p>
        </div>
        <div class="detail-list">
          <div class="detail-list__item"><span class="detail-list__label">Bosses</span><span>${bosses.length}</span></div>
          <div class="detail-list__item"><span class="detail-list__label">Drops</span><span>${items.length}</span></div>
        </div>
        <h3>Bosses</h3>
        <div class="card-grid">${bosses.map(renderBossCard).join('') || '<p class="card__text">Sem bosses vinculados.</p>'}</div>
        <h3>Drops</h3>
        <div class="card-grid">${items.map(renderItemCard).join('') || '<p class="card__text">Sem drops vinculados.</p>'}</div>
      </article>`;
  };

  const fillSelect = (id, options, defaultLabel) => {
    const select = document.getElementById(id);
    select.innerHTML = [`<option value="all">${defaultLabel}</option>`, ...options].join('');
  };

  const setupFilters = () => {
    fillSelect('filter-chapter', data.chapters.map((chapter) => `<option value="${escapeHTML(chapter.id.replace('chapter-', ''))}">${escapeHTML(chapter.name)}</option>`), 'Todos');
    fillSelect('filter-dusk', data.dusks.map((dusk) => `<option value="${escapeHTML(dusk.id)}">${escapeHTML(dusk.label)}</option>`), 'Todas');
    fillSelect('filter-boss', data.bosses.map((boss) => `<option value="${escapeHTML(boss.id)}">${escapeHTML(boss.name)}</option>`), 'Todos');
    fillSelect('filter-table', unique(data.items.map((item) => item.dropTable)).map((table) => `<option value="${escapeHTML(table)}">${escapeHTML(table)}</option>`), 'Todas');
  };

  const setupEvents = () => {
    els.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        state.view = tab.dataset.view;
        location.hash = state.view;
        render();
      });
    });

    els.search.addEventListener('input', () => {
      state.query = els.search.value.trim();
      runSearch();
      render();
    });

    els.filters.forEach((filter) => {
      filter.addEventListener('change', () => {
        state[filter.dataset.filter] = filter.value;
        render();
      });
    });

    els.reset.addEventListener('click', () => {
      Object.assign(state, { chapter: 'all', dusk: 'all', boss: 'all', mode: 'all', dropTable: 'all', sort: 'name', query: '' });
      els.search.value = '';
      els.filters.forEach((filter) => { filter.value = state[filter.dataset.filter] || 'all'; });
      state.searchResults = { item: [], boss: [], dusk: [] };
      render();
    });

    document.querySelectorAll('[data-close-panel]').forEach((button) => button.addEventListener('click', closeDetail));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeDetail();
    });

    window.addEventListener('hashchange', () => {
      state.view = location.hash.replace('#', '') || 'dashboard';
      render();
    });
  };

  let worker = null;

  const setupWorker = () => {
    if (!window.Worker) return;
    try {
      worker = new Worker('assets/js/search-worker.js');
      worker.addEventListener('message', (event) => {
        if (event.data.type === 'ready') {
          state.workerReady = true;
          return;
        }
        if (event.data.type === 'results' && event.data.query === state.query) {
          state.searchResults = event.data.results;
          render();
        }
      });
      worker.postMessage({ type: 'init', data });
    } catch (error) {
      state.workerReady = false;
    }
  };

  const runSearch = () => {
    if (!state.query) {
      state.searchResults = { item: [], boss: [], dusk: [] };
      return;
    }
    if (worker && state.workerReady) {
      worker.postMessage({ type: 'search', query: state.query });
      return;
    }
    const query = normalize(state.query);
    state.searchResults = {
      item: data.items.filter((item) => getItemSearchText(item).includes(query)).map((item) => item.id),
      boss: data.bosses.filter((boss) => getBossSearchText(boss).includes(query)).map((boss) => boss.id),
      dusk: data.dusks.filter((dusk) => getDuskSearchText(dusk).includes(query)).map((dusk) => dusk.id),
    };
  };

  setupFilters();
  setupEvents();
  setupWorker();
  render();
})();
