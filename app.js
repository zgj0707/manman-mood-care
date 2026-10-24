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
const selfCheckAnswers = {};
const observationLabels = {
  sleep: { when: value => value === 0, label: '睡眠带来的恢复感' },
  daily: { when: value => value === 0, label: '日常节奏与精力' },
  impact: { when: value => value === 2, label: '压力对日常的影响' },
  support: { when: value => value === 0, label: '可以获得的支持' }
};
document.querySelectorAll('.self-check-item').forEach(item => {
  item.querySelectorAll('[data-value]').forEach(button => button.addEventListener('click', () => {
    const key = item.dataset.question;
    selfCheckAnswers[key] = Number(button.dataset.value);
    item.querySelectorAll('[data-value]').forEach(option => option.classList.toggle('selected', option === button));
    document.querySelector('#self-check-result').hidden = true;
  }));
});
document.querySelector('#self-check-submit').addEventListener('click', () => {
  const keys = Object.keys(observationLabels);
  const answered = keys.filter(key => Number.isInteger(selfCheckAnswers[key]));
  const result = document.querySelector('#self-check-result');
  if (answered.length < keys.length) { showToast('还有几项可以按你的感受选择，跳过也没关系'); return; }
  const needs = keys.filter(key => observationLabels[key].when(selfCheckAnswers[key])).map(key => observationLabels[key].label);
  const summary = needs.length
    ? `这次自我观察里，你标记了 ${needs.length} 个想多照顾的方面：${needs.join('、')}。可以先挑一个最想处理的方面，从很小的一步开始。`
    : '这次自我观察中，你没有选出特别想多照顾的项目。它只反映这一次的回答，不代表整体心理状态；若有任何事情仍让你挂心，也可以优先照顾它。';
  result.innerHTML = `<span class="result-kicker">你的自我观察 · 本地生成</span><p>${escapeHTML(summary)}</p><small>这不是心理健康等级或诊断。如果困扰持续，或明显影响日常生活，可以考虑寻求专业支持。</small>`;
  result.hidden = false;
});

function createReviewCard({moodText, triggerText, noteText, suggestion, demo = false}) {
  const output = document.querySelector('#review-output');
  const source = document.querySelector('#review-source');
  source.textContent = demo ? '虚构示例 · 不会写入日记' : `仅使用你最近 7 天的 ${entries.filter(entry => Date.now() - new Date(entry.createdAt).getTime() <= 7*86400000).length} 条记录`;
  output.innerHTML = `<div class="review-content"><div class="review-content-top"><span>✳</span><b>${demo ? '回顾示例' : '给自己的温柔回顾'}</b><span class="local-stamp">本地规则生成</span></div><p>最近的记录里，${escapeHTML(moodText)}${triggerText ? `；你也几次留意到 <strong>${escapeHTML(triggerText)}</strong> 这个线索` : ''}。${noteText ? `你写下：“${escapeHTML(noteText)}”` : ''} 这些内容可能在提醒你，有些感受值得多一点空间。这个观察贴近你的体验吗？</p><div class="review-suggestion"><span>可以试试</span><b>${escapeHTML(suggestion)}</b><small>只是一种选择，你可以按自己的状态调整或跳过。</small></div></div>`;
  document.querySelector('#review-feedback').hidden = false;
}
document.querySelector('#generate-review').addEventListener('click', () => {
  const weekEntries = entries.filter(entry => Date.now() - new Date(entry.createdAt).getTime() <= 7*86400000);
  if (!weekEntries.length) { showToast('最近 7 天还没有记录，可以先体验一段虚构示例'); return; }
  const moodCounts = new Map(); weekEntries.forEach(entry => moodCounts.set(entry.mood, (moodCounts.get(entry.mood)||0)+1));
  const [topMood] = [...moodCounts.entries()].sort((a,b) => b[1]-a[1])[0];
  const triggerCounts = new Map(); weekEntries.flatMap(entry => entry.triggers || []).forEach(trigger => triggerCounts.set(trigger,(triggerCounts.get(trigger)||0)+1));
  const topTrigger = [...triggerCounts.entries()].sort((a,b) => b[1]-a[1])[0]?.[0] || '';
  const mostRecentNote = weekEntries.find(entry => entry.note)?.note?.slice(0, 80) || '';
  const supportByMood = { '疲惫':'给自己留一个 10 分钟的休息间隙，暂时不安排任务。', '焦虑':'试试一分钟缓慢呼吸，把注意力放回脚底与地面。', '低落':'挑一件几分钟内能完成的小事，完成后停下来感受一下。', '烦躁':'到窗边或室外走两分钟，让身体先换个节奏。', '开心':'记下今天带来一点开心的具体时刻，留给未来的自己。', '平静':'找一个不被打扰的片刻，感受这份安稳。' };
  createReviewCard({ moodText:`你最常记录到「${topMood}」`, triggerText:topTrigger, noteText:mostRecentNote, suggestion:supportByMood[topMood] || '做一次缓慢呼吸，看看身体此刻最需要什么。' });
});
document.querySelector('#demo-review').addEventListener('click', () => createReviewCard({ moodText:'示例记录里连续几天出现「疲惫」', triggerText:'睡眠不足', noteText:'最近总觉得要赶快把事情做完', suggestion:'把手边的事缩小成一个 5 分钟的小步骤，然后给自己一个短暂休息。', demo:true }));
document.querySelectorAll('[data-feedback]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-feedback]').forEach(option => option.classList.toggle('selected', option === button));
  showToast(button.dataset.feedback === 'yes' ? '谢谢你告诉我，这段观察贴近你的感受。' : '谢谢你的提醒，你比这段文字更了解自己的感受。');
}));
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

