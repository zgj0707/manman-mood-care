const STORAGE_KEY = 'manman-mood-care-v1';
const moods = {
  '平静': { emoji: '🌿', value: 3, message: '此刻有一点平静，愿你把这份安稳多留一会儿。', title: '让平静多停留一会儿。' },
  '开心': { emoji: '☀️', value: 5, message: '开心值得被记住。也可以留意，是哪一个小瞬间带来了它。', title: '把这一点开心收好。' },
  '疲惫': { emoji: '☁️', value: 2, message: '疲惫时，休息不是奖励，而是需要。今天可以少要求自己一点。', title: '你可以先歇一歇。' },
  '焦虑': { emoji: '🌫️', value: 1, message: '先不用想清楚所有事。试着把注意力放回此刻的一次呼吸。', title: '先不用解决所有事。' },
  '低落': { emoji: '🌧️', value: 1, message: '低落的时候，完成一件很小的事也值得肯定。你不必独自扛着。', title: '今天对自己轻一点。' },
  '烦躁': { emoji: '🌬️', value: 2, message: '烦躁可能是在提醒你有需要没被照顾到。给自己一点空间，慢慢找线索。', title: '先给自己一点空间。' }
};
let entries = loadEntries();
let selectedMood = '';
let toastTimer;

function loadEntries() {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }
function escapeHTML(value = '') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function dateKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function formatDate(date) { return new Intl.DateTimeFormat('zh-CN', { month:'long', day:'numeric', weekday:'long' }).format(date); }
function showToast(message) {
  const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}
function activateView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  if (name === 'diary') renderDiary();
  if (name === 'insight') renderInsights();
  window.scrollTo({top:0, behavior:'smooth'});
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => activateView(b.dataset.view)));
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => activateView(b.dataset.go)));
document.querySelector('#today-date').textContent = formatDate(new Date());

document.querySelectorAll('.mood-option').forEach(button => button.addEventListener('click', () => {
  selectedMood = button.dataset.mood;
  document.querySelectorAll('.mood-option').forEach(option => option.classList.toggle('selected', option === button));
  const data = moods[selectedMood];
  document.querySelector('#gentle-title').textContent = data.title;
  document.querySelector('#gentle-copy').textContent = data.message;
}));
document.querySelectorAll('.chip').forEach(button => button.addEventListener('click', () => button.classList.toggle('selected')));
const note = document.querySelector('#entry-note');
note.addEventListener('input', () => document.querySelector('#char-count').textContent = `${note.value.length} / 500`);

document.querySelector('#save-entry').addEventListener('click', () => {
  if (!selectedMood) { showToast('先选一个最接近此刻的心情吧'); document.querySelector('.mood-options').scrollIntoView({behavior:'smooth',block:'center'}); return; }
  const now = new Date();
  const triggers = [...document.querySelectorAll('.chip.selected')].map(b => b.dataset.trigger);
  entries.unshift({ id: `${now.getTime()}-${Math.random().toString(16).slice(2,7)}`, mood:selectedMood, triggers, note:note.value.trim(), createdAt:now.toISOString() });
  persist();
  selectedMood = ''; document.querySelectorAll('.mood-option,.chip').forEach(b => b.classList.remove('selected'));
  note.value = ''; document.querySelector('#char-count').textContent = '0 / 500';
  document.querySelector('#save-message').textContent = '这一刻已经被好好收下了。';
  renderWeek(); showToast('记下了，谢谢你愿意听听自己。');
  setTimeout(() => document.querySelector('#save-message').textContent = '', 3000);
});

function renderWeek() {
  const root = document.querySelector('#mood-week');
  const days = Array.from({length:7}, (_,i) => { const d = new Date(); d.setDate(d.getDate() - (6-i)); return d; });
  root.innerHTML = days.map(date => {
    const key = dateKey(date); const item = entries.find(e => dateKey(new Date(e.createdAt)) === key); const meta = item ? moods[item.mood] : null;
    const h = meta ? 15 + meta.value * 8 : 7;
    return `<div class="week-day"><span class="week-emoji">${meta ? meta.emoji : ''}</span><span class="week-bar" style="height:${h}px;${meta ? '' : 'opacity:.48'}"></span><small>${['日','一','二','三','四','五','六'][date.getDay()]}</small></div>`;
  }).join('');
}
function renderDiary() {
  const root = document.querySelector('#diary-list');
  if (!entries.length) {
    root.innerHTML = `<div class="empty-state"><div class="empty-icon">☁</div><h2>这里会慢慢装下你的心情</h2><p>从一条很短的记录开始，也完全可以。</p><button class="primary-button" data-go="home">写下第一条 <span>↗</span></button></div>`;
    root.querySelector('[data-go]').addEventListener('click', () => activateView('home')); return;
  }
  root.innerHTML = entries.map(item => {
    const meta = moods[item.mood] || moods['平静']; const d = new Date(item.createdAt);
    const when = `${formatDate(d)} · ${new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit'}).format(d)}`;
    return `<article class="diary-entry"><div class="entry-meta"><div class="entry-mood"><span>${meta.emoji}</span>${escapeHTML(item.mood)}</div><div class="entry-time">${escapeHTML(when)}</div></div><div><p class="entry-note">${escapeHTML(item.note || '（这一刻没有写下文字，也没关系。）')}</p>${item.triggers?.length ? `<div class="entry-tags">${item.triggers.map(t => `<span>${escapeHTML(t)}</span>`).join('')}</div>`:''}<button class="delete-entry" data-delete="${escapeHTML(item.id)}" aria-label="删除这条记录">删除记录</button></div></article>`;
  }).join('');
  root.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => {
    entries = entries.filter(e => e.id !== button.dataset.delete); persist(); renderDiary(); renderWeek(); showToast('这条记录已从此设备移除');
  }));
}
function renderInsights() {
  const days = Array.from({length:7}, (_,i) => { const d = new Date(); d.setDate(d.getDate() - (6-i)); return d; });
  const chart = document.querySelector('#insight-chart');
  chart.innerHTML = days.map(date => {
    const entry = entries.find(e => dateKey(new Date(e.createdAt)) === dateKey(date)); const meta = entry ? moods[entry.mood] : null;
    const height = meta ? 35 + meta.value * 20 : 13;
    return `<div class="chart-day"><span class="chart-mark" style="--h:${height}px" data-emoji="${meta ? meta.emoji : '·'}"></span><small>${['日','一','二','三','四','五','六'][date.getDay()]}</small></div>`;
  }).join('');
  const counts = new Map(); entries.flatMap(e => e.triggers || []).forEach(t => counts.set(t,(counts.get(t)||0)+1));
  const summary = document.querySelector('#trigger-summary');
  const rows = [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0,5); const max = Math.max(1,...rows.map(r=>r[1]));
  summary.innerHTML = rows.length ? rows.map(([label,count]) => `<div class="trigger-row"><span>${escapeHTML(label)}</span><div class="trigger-track"><div class="trigger-fill" style="width:${Math.max(8,count/max*100)}%"></div></div><span class="trigger-count">${count} 次</span></div>`).join('') : '<div class="insight-empty">还没有足够的记录。写下一条后，这里会帮你看见反复出现的线索。</div>';
}
renderWeek();

const privacyDialog = document.querySelector('#privacy-dialog');
document.querySelector('#privacy-button').addEventListener('click', () => privacyDialog.showModal());
document.querySelector('.dialog-close').addEventListener('click', () => privacyDialog.close());
document.querySelector('.dialog-ok').addEventListener('click', () => privacyDialog.close());

let breathInterval;
document.querySelector('#breath-start').addEventListener('click', event => {
  if (breathInterval) { clearInterval(breathInterval); breathInterval = null; document.querySelector('#breath-visual').classList.remove('active'); document.querySelector('#breath-caption').textContent = ''; event.currentTarget.textContent = '开始一分钟 →'; return; }
  let left = 60; const button = event.currentTarget; const visual = document.querySelector('#breath-visual'); visual.classList.add('active'); button.textContent = '结束练习';
  document.querySelector('#breath-caption').textContent = '吸气 · 呼气 · 慢慢来';
  breathInterval = setInterval(() => { left -= 1; if (left <= 0) { clearInterval(breathInterval); breathInterval = null; visual.classList.remove('active'); button.textContent = '再来一分钟 →'; document.querySelector('#breath-caption').textContent = '做得很好，给自己一个小小的肯定。'; } }, 1000);
});
document.querySelectorAll('.activity').forEach(button => button.addEventListener('click', () => showToast(`好主意：${button.dataset.activity}。按自己的节奏来就好。`)));
document.querySelector('#sound-start').addEventListener('click', event => {
  const feedback = document.querySelector('#sound-feedback'); let left = 30; event.currentTarget.disabled = true; feedback.textContent = '找一个舒服的姿势，听听周围的声音…';
  const interval = setInterval(() => { left -= 1; if (left <= 0) { clearInterval(interval); feedback.textContent = '这一小段安静，是你送给自己的。'; event.currentTarget.disabled = false; } }, 1000);
});

