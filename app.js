'use strict';

const stores = {
  Amazon: {domains: ['amazon.in', 'amzn.in', 'amzn.to'], color: '#a25717'},
  Flipkart: {domains: ['flipkart.com', 'fkrt.it', 'dl.flipkart.com'], color: '#2864a0'},
  Myntra: {domains: ['myntra.com', 'myntr.it'], color: '#a33669'}
};
const key = 'tagtrack.v1';
const money = new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: 0});
const dates = new Intl.DateTimeFormat('en-IN', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'});
const $ = selector => document.querySelector(selector);
const list = $('#products');
const editor = $('#editor');
const fields = $('#fields');
const form = $('#editor-form');
const search = $('#search');
const targetOnly = $('#target-only');
const demoButton = $('#demo');
let saved = [];
let sample = null;
let submit;
let trigger;

try {
  const data = JSON.parse(localStorage.getItem(key) ?? '[]');
  if (!Array.isArray(data)) throw new Error('Invalid watchlist');
  saved = data;
} catch {
  $('#storage-status').textContent = 'Could not load your saved watchlist.';
}

function board() {
  return sample ?? saved;
}

function persist() {
  if (sample) return;
  try {
    localStorage.setItem(key, JSON.stringify(saved));
    $('#storage-status').textContent = 'Prices are entered by you. Your watchlist and reviews are saved in this browser.';
  } catch {
    $('#storage-status').textContent = 'Changes are only available while this tab stays open.';
  }
}

function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}

function button(text, action, className) {
  const el = node('button', text, className);
  el.type = 'button';
  el.addEventListener('click', () => action(el));
  return el;
}

function formatDate(date) {
  return dates.format(new Date(date + 'T00:00:00Z'));
}

function today() {
  const now = new Date();
  const local = new Date(now.valueOf() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function storeURL(value, store) {
  try {
    const url = new URL(value);
    const domains = stores[store]?.domains ?? [];
    if (url.protocol === 'https:' && !url.username && !url.password
      && domains.some(domain => url.hostname === domain || url.hostname.endsWith('.' + domain))) {
      return url.href;
    }
  } catch {
    return null;
  }
  return null;
}

function ordered(product) {
  return product.prices.slice().sort((a, b) => a.date.localeCompare(b.date));
}

function offers(product) {
  const latest = new Map();
  for (const point of ordered(product)) latest.set(point.store, point);
  return [...latest.values()].sort((a, b) => a.price - b.price);
}

function reached(product) {
  return (offers(product)[0]?.price ?? Infinity) <= product.target;
}

function openDialog(title, templates, previous, onSave, button) {
  trigger = button;
  $('#editor-title').textContent = title;
  fields.replaceChildren(...templates.map(name => $('#' + name + '-fields').content.cloneNode(true)));
  for (const input of fields.querySelectorAll('[name]')) {
    if (previous[input.name] !== undefined) input.value = previous[input.name];
    input.addEventListener('input', () => input.setCustomValidity(''));
    input.addEventListener('change', () => input.setCustomValidity(''));
  }
  const date = form.elements.namedItem('date');
  if (date) date.max = today();
  submit = onSave;
  editor.showModal();
  fields.querySelector('input, select').focus();
}

function invalid(name, message) {
  const input = form.elements.namedItem(name);
  input.setCustomValidity(message);
  input.reportValidity();
  return false;
}

function setPrice(product, values) {
  const url = storeURL(values.url, values.store);
  if (!url) return invalid('url', 'Enter an HTTPS product link from ' + values.store + '.');
  const point = {store: values.store, url, date: values.date, price: Number(values.price)};
  const index = product.prices.findIndex(item => item.store === point.store && item.date === point.date);
  if (index === -1) product.prices.push(point);
  else product.prices[index] = point;
  return true;
}

function addProduct(button) {
  openDialog('Add a product', ['product', 'price'], {date: today()}, values => {
    const title = values.title.trim();
    if (!title) return invalid('title', 'Enter a product name.');
    const product = {id: crypto.randomUUID?.() ?? String(Date.now()) + Math.random(), title, target: Number(values.target), prices: [], review: null};
    if (!setPrice(product, values)) return false;
    board().unshift(product);
    search.value = '';
    targetOnly.checked = false;
    return true;
  }, button);
}

function showPrice(product, button) {
  const previous = offers(product)[0];
  openDialog('Log a price', ['price'], {store: previous.store, url: previous.url, date: today()}, values => setPrice(product, values), button);
  form.elements.namedItem('store').addEventListener('change', event => {
    const match = offers(product).find(point => point.store === event.target.value);
    const url = form.elements.namedItem('url');
    url.value = match?.url ?? '';
    url.setCustomValidity('');
  });
}

function editProduct(product, button) {
  openDialog('Edit product', ['product'], product, values => {
    const title = values.title.trim();
    if (!title) return invalid('title', 'Enter a product name.');
    product.title = title;
    product.target = Number(values.target);
    return true;
  }, button);
}

function editReview(product, button) {
  openDialog('Your review', ['review'], product.review ?? {}, values => {
    const verdict = values.verdict.trim();
    if (!verdict) return invalid('verdict', 'Enter a short verdict.');
    product.review = {rating: Number(values.rating), pros: values.pros.trim(), cons: values.cons.trim(), verdict};
    return true;
  }, button);
}

function draw(canvas, points, target) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(ratio, ratio);
  const left = 61, right = width - 10, top = 15, bottom = height - 25;
  const values = points.map(point => point.price).concat(target);
  const low = Math.min(...values), high = Math.max(...values);
  const padding = Math.max((high - low) * .12, .01);
  const min = Math.max(0, low - padding), max = high + padding;
  const first = Date.parse(points[0].date), last = Date.parse(points.at(-1).date);
  const x = date => first === last ? (left + right) / 2 : left + (Date.parse(date) - first) / (last - first) * (right - left);
  const y = price => bottom - (price - min) / (max - min) * (bottom - top);
  ctx.font = '11px system-ui';
  ctx.fillStyle = '#516155';
  for (let i = 0; i < 3; i++) {
    const value = min + (max - min) * i / 2;
    const line = y(value);
    ctx.fillText(money.format(value), 1, line + 4, left - 5);
    ctx.strokeStyle = '#d9ddd1';
    ctx.beginPath();
    ctx.moveTo(left, line);
    ctx.lineTo(right, line);
    ctx.stroke();
  }
  ctx.fillText(formatDate(points[0].date), left, height - 5, (right - left) / 2);
  if (first !== last) {
    ctx.textAlign = 'right';
    ctx.fillText(formatDate(points.at(-1).date), right, height - 5, (right - left) / 2);
    ctx.textAlign = 'left';
  }
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = '#516155';
  ctx.beginPath();
  ctx.moveTo(left, y(target));
  ctx.lineTo(right, y(target));
  ctx.stroke();
  ctx.setLineDash([]);
  for (const [store, config] of Object.entries(stores)) {
    const series = points.filter(point => point.store === store);
    if (!series.length) continue;
    ctx.strokeStyle = config.color;
    ctx.fillStyle = config.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    series.forEach((point, i) => ctx[i ? 'lineTo' : 'moveTo'](x(point.date), y(point.price)));
    ctx.stroke();
    for (const point of series) {
      ctx.beginPath();
      ctx.arc(x(point.date), y(point.price), 3.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

const chartData = new WeakMap();
const resize = new ResizeObserver(entries => {
  for (const {target} of entries) {
    const data = chartData.get(target);
    if (data) draw(target, data.points, data.target);
  }
});

function chart(product) {
  const points = ordered(product);
  const section = node('section');
  const canvas = node('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Price history by store with a dashed target line. Exact prices and dates are listed under Price log.');
  const legend = node('ul', undefined, 'legend');
  for (const store of new Set(points.map(point => point.store))) {
    const item = node('li');
    const swatch = node('span');
    swatch.style.background = stores[store].color;
    item.append(swatch, store);
    legend.append(item);
  }
  legend.append(node('li', 'Dashed line: target'));
  const log = node('details');
  const entries = node('ol', undefined, 'history');
  for (const point of points.slice().reverse()) {
    entries.append(node('li', formatDate(point.date) + ' · ' + point.store + ' · ' + money.format(point.price)));
  }
  log.append(node('summary', 'Price log (' + points.length + ')'), entries);
  chartData.set(canvas, {points, target: product.target});
  section.append(node('h4', 'Price history'), canvas, legend, log);
  return section;
}

function storeList(product) {
  const list = node('ul', undefined, 'store-list');
  for (const point of offers(product)) {
    const item = node('li');
    const url = storeURL(point.url, point.store);
    const name = node(url && !sample ? 'a' : 'span', point.store);
    if (name.tagName === 'A') {
      name.href = url;
      name.target = '_blank';
      name.rel = 'noopener noreferrer';
    }
    item.append(name, node('strong', money.format(point.price)), node('small', 'Recorded ' + formatDate(point.date)));
    list.append(item);
  }
  return list;
}

function card(product) {
  const article = node('article', undefined, 'card');
  article.dataset.productId = product.id;
  const header = node('header', undefined, 'card-head');
  const title = node('div');
  title.append(node('h3', product.title), node('p', 'Target ' + money.format(product.target), 'muted'));
  header.append(title);
  if (reached(product)) header.append(node('span', 'Target reached', 'badge'));

  const review = node('section', undefined, 'review');
  review.append(node('h4', 'Your review'));
  if (product.review) {
    const {rating, pros, cons, verdict} = product.review;
    review.append(node('p', '★ ' + rating + ' / 5'), node('p', verdict));
    if (pros) review.append(node('p', 'Pros: ' + pros));
    if (cons) review.append(node('p', 'Cons: ' + cons));
  } else {
    review.append(node('p', 'No review yet.', 'muted'));
  }

  const actions = node('div', undefined, 'actions');
  actions.append(
    button('Log price', el => showPrice(product, el), 'primary'),
    button(product.review ? 'Edit review' : 'Write review', el => editReview(product, el)),
    button('Edit product', el => editProduct(product, el)),
    button('Remove', () => {
      if (!window.confirm('Remove this product and its price history and review?')) return;
      board().splice(board().indexOf(product), 1);
      persist();
      render();
      $('#add').focus();
    }, 'remove')
  );
  article.append(header, storeList(product), chart(product), review, actions);
  return article;
}

function render() {
  const all = board();
  const query = search.value.trim().toLowerCase();
  const visible = all.filter(product => (!targetOnly.checked || reached(product))
    && [product.title, ...product.prices.map(point => point.store)].some(value => value.toLowerCase().includes(query)));
  $('#watched').textContent = all.length;
  $('#reached').textContent = all.filter(reached).length;
  $('#summary').textContent = (query || targetOnly.checked) ? visible.length + ' of ' + all.length + ' products shown' : '';
  resize.disconnect();
  const empty = all.length ? 'No products match these filters.' : 'Add a product to start tracking its price.';
  list.replaceChildren(...(visible.length ? visible.map(card) : [node('p', empty, 'empty')]));
  for (const canvas of list.querySelectorAll('canvas')) resize.observe(canvas);
}

function sampleProducts() {
  return [{
    id: 'sample', title: 'Wireless headphones', target: 2499,
    prices: [
      {store: 'Amazon', price: 3199, date: '2025-10-02', url: 'https://www.amazon.in/'},
      {store: 'Flipkart', price: 2999, date: '2025-10-05', url: 'https://www.flipkart.com/'},
      {store: 'Amazon', price: 2799, date: '2025-10-12', url: 'https://www.amazon.in/'},
      {store: 'Flipkart', price: 2399, date: '2025-10-17', url: 'https://www.flipkart.com/'}
    ],
    review: {rating: 4, pros: 'Lightweight and easy to pair.', cons: 'Small controls.', verdict: 'A good everyday option at the target price.'}
  }];
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  if (!submit(values)) return;
  const original = trigger;
  const article = original.closest('.card');
  const id = article?.dataset.productId;
  const buttonIndex = article ? [...article.querySelectorAll('button')].indexOf(original) : -1;
  persist();
  editor.close();
  render();
  const updated = [...list.children].find(item => item.dataset.productId === id && id);
  (updated?.querySelectorAll('button')[buttonIndex] ?? $('#add')).focus();
});
$('#cancel').addEventListener('click', () => editor.close());
editor.addEventListener('close', () => {
  if (trigger?.isConnected) trigger.focus();
});
$('#add').addEventListener('click', event => addProduct(event.currentTarget));
search.addEventListener('input', render);
targetOnly.addEventListener('change', render);
demoButton.addEventListener('click', () => {
  sample = sample ? null : sampleProducts();
  demoButton.textContent = sample ? 'Back to my watchlist' : 'Try sample data';
  $('#demo-note').hidden = !sample;
  search.value = '';
  targetOnly.checked = false;
  render();
});
render();
