/**
 * The page's inline script, kept as a string so the generated file stays a
 * single self-contained artifact with no build step and no network calls.
 */
export const client = String.raw`
const grid = document.getElementById('grid');
const dialog = document.getElementById('detail');
const sheet = document.getElementById('sheet');

const lightbox = document.getElementById('lightbox');
const stage = document.getElementById('viewerStage');
const viewerImage = document.getElementById('viewerImage');
const viewerTitle = document.getElementById('viewerTitle');
const viewerSub = document.getElementById('viewerSub');
const viewerRaw = document.getElementById('viewerRaw');
const fitWidth = document.getElementById('fitWidth');
const fitWhole = document.getElementById('fitWhole');

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---- Filtering --------------------------------------------------------- */

document.querySelectorAll('.filter').forEach(function (button) {
  button.addEventListener('click', function () {
    document.querySelectorAll('.filter').forEach(function (other) {
      other.setAttribute('aria-pressed', String(other === button));
    });
    const want = button.dataset.family;
    grid.querySelectorAll('.card').forEach(function (card) {
      card.hidden = !(want === '*' || card.dataset.family === want);
    });
  });
});

/* ---- Detail ------------------------------------------------------------ */

function measuredTable(item) {
  const t = item.tokens;
  if (!t) return '';

  const colorRows = t.colors.map(function (c) {
    return '<tr><td><span class="swatch"><i style="background:' + esc(c.hex) + '"></i>' + esc(c.hex) +
      '</span></td><td>' + esc(c.role) + '</td><td class="num">' +
      (c.areaPct ? c.areaPct + '%' : '&mdash;') + '</td></tr>';
  }).join('');

  const detailRows = [
    ['Fonts', t.fonts.join(', ')],
    ['Radii', t.radii.join(', ')],
    ['Spacing', t.spacing.join(', ')],
    ['Shadow', t.shadows[0] || ''],
    ['Transition', t.transitions[0] || ''],
  ].filter(function (row) { return row[1]; }).map(function (row) {
    return '<tr><th scope="row">' + row[0] + '</th><td class="token">' + esc(row[1]) + '</td></tr>';
  }).join('');

  return '<section class="block">' +
    '<h3 class="block-label">Measured off the live page</h3>' +
    '<table><caption class="meta">Colours ranked by share of the painted area.</caption>' +
    '<thead><tr><th scope="col">Colour</th><th scope="col">Role</th><th scope="col" class="num">Area</th></tr></thead>' +
    '<tbody>' + colorRows + '</tbody></table>' +
    (detailRows ? '<table><tbody>' + detailRows + '</tbody></table>' : '') +
    '</section>';
}

function tokenCss(item) {
  const t = item.tokens;
  return ['/* ' + t.title + ' — ' + item.source + ' */', ':root {']
    .concat(t.colors.map(function (c, i) { return '  --color-' + c.role + '-' + (i + 1) + ': ' + c.hex + ';'; }))
    .concat(t.fonts.map(function (f, i) { return '  --font-' + (i + 1) + ': "' + f + '";'; }))
    .concat(t.radii.slice(0, 4).map(function (r, i) { return '  --radius-' + (i + 1) + ': ' + r + ';'; }))
    .concat(t.spacing.slice(0, 8).map(function (s, i) { return '  --space-' + (i + 1) + ': ' + s + ';'; }))
    .concat(['}'])
    .join('\n');
}

function open(id) {
  const item = ITEMS[id];
  if (!item || !item.extract) return;
  const e = item.extract;

  sheet.innerHTML =
    '<button class="sheet-figure" data-view aria-label="View the full capture of ' + esc(e.name) + '">' +
      '<img src="assets/' + esc(item.asset) + '" alt="">' +
      '<span class="sheet-figure-hint">View full capture</span>' +
    '</button>' +
    '<div class="sheet-body">' +
      '<header class="sheet-head">' +
        '<h2>' + esc(e.name) + '</h2>' +
        '<span class="descriptor">' + esc(e.descriptor) + '</span>' +
      '</header>' +
      '<p class="thesis">' + esc(e.thesis) + '</p>' +
      '<div class="tags">' + e.keywords.map(function (k) {
        return '<span class="tag">' + esc(k) + '</span>';
      }).join('') + '</div>' +
      '<section class="block">' +
        '<h3 class="block-label">Image recipe</h3>' +
        '<p class="meta">Replace [SUBJECT] and send to any image model. The style stays locked.</p>' +
        '<pre>' + esc(e.imageRecipe).replace('[SUBJECT]', '<mark>[SUBJECT]</mark>') + '</pre>' +
      '</section>' +
      '<section class="block">' +
        '<h3 class="block-label">Brief</h3>' +
        '<pre>' + esc(e.brief) + '</pre>' +
      '</section>' +
      // Actions sit above the measured table: the recipe and the brief are the
      // payoff, and the table can run to sixteen rows of supporting evidence.
      '<div class="actions">' +
        '<button class="button" data-variant="primary" data-copy="recipe">Copy image prompt</button>' +
        '<button class="button" data-copy="brief">Copy brief</button>' +
        (item.tokens ? '<button class="button" data-copy="tokens">Copy tokens</button>' : '') +
        (/^https?:/.test(item.source)
          ? '<a class="button" href="' + esc(item.source) + '" target="_blank" rel="noopener">Open source</a>'
          : '') +
        '<button class="button" data-close>Close</button>' +
      '</div>' +
      measuredTable(item) +
    '</div>';

  sheet.querySelectorAll('[data-copy]').forEach(function (button) {
    button.addEventListener('click', function () {
      const kind = button.dataset.copy;
      const text = kind === 'recipe' ? e.imageRecipe : kind === 'brief' ? e.brief : tokenCss(item);
      navigator.clipboard.writeText(text).then(function () {
        const original = button.textContent;
        button.textContent = 'Copied';
        setTimeout(function () { button.textContent = original; }, 1200);
      });
    });
  });

  sheet.querySelector('[data-close]').addEventListener('click', function () { dialog.close(); });
  sheet.querySelector('[data-view]').addEventListener('click', function () { openViewer(id); });

  dialog.showModal();
  sheet.scrollTop = 0;
}

/* ---- Full-capture viewer ----------------------------------------------- */

let viewing = null;

/** Navigation follows what is actually on screen, so it respects the filter. */
function visibleIds() {
  return Array.prototype.slice
    .call(grid.querySelectorAll('.card:not([hidden])'))
    .filter(function (card) { return card.dataset.state !== 'pending'; })
    .map(function (card) { return card.dataset.id; });
}

function setFit(mode) {
  stage.dataset.fit = mode;
  fitWidth.setAttribute('aria-pressed', String(mode === 'width'));
  fitWhole.setAttribute('aria-pressed', String(mode === 'whole'));
  stage.scrollTop = 0;
}

function openViewer(id) {
  const item = ITEMS[id];
  if (!item) return;
  viewing = id;

  const ids = visibleIds();
  const position = ids.indexOf(id);

  viewerImage.src = 'assets/' + item.asset;
  viewerImage.alt = item.extract ? item.extract.name : item.source;
  viewerTitle.textContent = item.extract ? item.extract.name : item.source;
  viewerSub.textContent = (item.family || 'Unfiled') +
    (position >= 0 ? '  ·  ' + (position + 1) + ' / ' + ids.length : '');
  viewerRaw.href = 'assets/' + item.asset;

  // A full-page capture is read by scrolling, so width-fit is the useful default.
  setFit('width');
  if (!lightbox.open) lightbox.showModal();
}

function step(delta) {
  const ids = visibleIds();
  if (ids.length === 0) return;
  const current = ids.indexOf(viewing);
  const next = (current + delta + ids.length) % ids.length;
  openViewer(ids[next]);
}

fitWidth.addEventListener('click', function () { setFit('width'); });
fitWhole.addEventListener('click', function () { setFit('whole'); });
document.getElementById('viewerClose').addEventListener('click', function () { lightbox.close(); });

lightbox.querySelectorAll('.viewer-nav').forEach(function (button) {
  button.addEventListener('click', function () { step(button.dataset.dir === 'next' ? 1 : -1); });
});

lightbox.addEventListener('click', function (event) {
  // Only the backdrop and the empty stage dismiss; the image itself does not.
  if (event.target === lightbox || event.target === stage) lightbox.close();
});

document.addEventListener('keydown', function (event) {
  if (!lightbox.open) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
});

/* ---- Grid interaction --------------------------------------------------- */

grid.addEventListener('click', function (event) {
  const card = event.target.closest('.card');
  if (!card || card.dataset.state === 'pending') return;

  if (event.target.closest('[data-zoom]')) {
    event.stopPropagation();
    openViewer(card.dataset.id);
    return;
  }

  open(card.dataset.id);
});

grid.addEventListener('keydown', function (event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const card = event.target.closest('.card');
  if (card && card.dataset.state !== 'pending') {
    event.preventDefault();
    open(card.dataset.id);
  }
});

dialog.addEventListener('click', function (event) {
  if (event.target === dialog) dialog.close();
});
`;
