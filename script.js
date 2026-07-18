

// ---------- STATE ----------
let chargeSheetGroups = {};
let penalCodes = {};
let radioCodesData = {};
let activeRadioCodes = [];
let currentTab = 'charge-sheet';
let currentCategoryFilter = 'all';
let currentRadioCategory = '10-CODES';
let currentPriorityFilter = 'all';
let globalCart = [];
const CMS_DEFAULT_VALUE = 5;

const getBaseUrl = () => {
    if (window.location.hostname.includes('github.io')) {
        return 'https://ayazpatel.github.io/student-academy/';
    }
    return './';
};

// ---------- CUSTOM CURSOR ----------
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
const cursorLabel = document.getElementById('cursorLabel');
let targetX = 0, targetY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', (e) => {
    targetX = e.clientX; targetY = e.clientY;
    cursorDot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%,-50%)`;
});

function animateCursor() {
    ringX += (targetX - ringX) * 0.18;
    ringY += (targetY - ringY) * 0.18;
    cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%,-50%)`;
    requestAnimationFrame(animateCursor);
}
if (window.matchMedia('(pointer: fine)').matches) animateCursor();
else document.body.classList.add('no-cursor');

// Hover attachment
function attachCursorHover() {
    document.querySelectorAll('button, a, .tab-btn, [data-tab-jump], .card, .filter-btn, .summary-item-row, input, select, .theme-toggle, .menu-toggle, .brand, .btn-add, .btn-ghost, .btn-clear-all, .btn-action-cart').forEach(el => {
        if (el.dataset.cursorBound) return;
        el.dataset.cursorBound = '1';
        const label = el.getAttribute('data-cursor') || '';
        el.addEventListener('mouseenter', () => {
            cursorRing.classList.add('hover');
            cursorLabel.textContent = label;
        });
        el.addEventListener('mouseleave', () => {
            cursorRing.classList.remove('hover');
            cursorLabel.textContent = '';
        });
    });
}

// ---------- CLOCK ----------
function tickClock() {
    const now = new Date();
    const t = now.toISOString().substr(11, 8);
    const el = document.getElementById('clockText');
    if (el) el.textContent = `${t} UTC · LA-CENTRAL`;
}
setInterval(tickClock, 1000);
tickClock();

// ---------- THEME TOGGLE ----------
const themeBtn = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');
const savedTheme = localStorage.getItem('sasp-theme');
if (savedTheme === 'day') { document.body.classList.add('day'); themeLabel.textContent = 'DAY'; }
themeBtn?.addEventListener('click', () => {
    document.body.classList.toggle('day');
    const isDay = document.body.classList.contains('day');
    themeLabel.textContent = isDay ? 'DAY' : 'NIGHT';
    localStorage.setItem('sasp-theme', isDay ? 'day' : 'night');
});

// ---------- PRELOADER ----------
function runPreloader(then) {
    const bar = document.getElementById('preBar');
    const cnt = document.getElementById('preCount');
    let p = 0;
    const iv = setInterval(() => {
        p += Math.random() * 12 + 4;
        if (p >= 100) { p = 100; clearInterval(iv); setTimeout(then, 400); }
        bar.style.width = p + '%';
        cnt.textContent = String(Math.floor(p)).padStart(3, '0');
    }, 90);
}

// ---------- CHAPTER TITLE REVEAL ----------
function revealChapterTitle(section) {
    if (!section) return;
    const lines = section.querySelectorAll('.reveal-lines .line > span, .chap-title .line > span, .manifesto-title .line > span');
    lines.forEach((el, i) => {
        el.style.transition = 'transform 1s cubic-bezier(0.19, 1, 0.22, 1)';
        el.style.transitionDelay = `${i * 0.09}s`;
        el.style.transform = 'translateY(0)';
    });
}

// ---------- MARQUEE ----------
function buildMarquee() {
    const track = document.getElementById('marqueeTrack');
    const items = [
        'Edition MMXXVI', 'Field Operations Manual', 'Node: LA-Central',
        'Radio · Clear', 'Cadet Cohort · 34', 'Standard Operating Framework',
        'Discipline · Memory · Made · Muscular', 'Console v2026.1',
        'Cite the statute, then the human', 'Speak in codes, not opinions'
    ];
    const seq = [...items, ...items].map(t => `<span>${t}</span>`).join('');
    track.innerHTML = seq + seq;
}

// ---------- DATA LOAD ----------
window.addEventListener('DOMContentLoaded', async () => {
    buildMarquee();
    const baseUrl = getBaseUrl();
    try {
        const [chargesRes, penalRes, radioRes] = await Promise.all([
            fetch(`${baseUrl}chargesPresets.json`),
            fetch(`${baseUrl}penalCodes.json`),
            fetch(`${baseUrl}radioCodes.json`),
        ]);
        if (!chargesRes.ok || !penalRes.ok || !radioRes.ok) throw new Error('HTTP verification failed');
        chargeSheetGroups = await chargesRes.json();
        penalCodes = await penalRes.json();
        radioCodesData = await radioRes.json();

        renderChargeSheetGrid();
        renderPenalCodesTable();
        updateCartUI();
        if (typeof changeRadioCategory === 'function') changeRadioCategory();

        document.getElementById('presetCount').textContent = String(Object.keys(chargeSheetGroups).length).padStart(2, '0') + ' presets';
        document.getElementById('penalCount').textContent = String(Object.keys(penalCodes).length).padStart(3, '0') + ' codes';

        runPreloader(() => {
            document.getElementById('appPreloader').classList.add('done');
            document.getElementById('mainAppContent').classList.add('ready');
            setTimeout(() => revealChapterTitle(document.querySelector('.tab-content.active')), 100);
            initScrollReveals();
            initLenis();
            attachCursorHover();
        });
    } catch (e) {
        console.error(e);
    }

    // Bind tab jumps
    document.querySelectorAll('[data-tab-jump]').forEach(el => {
        el.addEventListener('click', () => switchTab(el.dataset.tabJump));
    });
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.addEventListener('click', () => switchTab(el.dataset.tab));
    });
    document.getElementById('menuToggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebarOverlay')?.addEventListener('click', toggleSidebar);
});

// ---------- LENIS SMOOTH SCROLL ----------
function initLenis() {
    if (typeof Lenis === 'undefined') return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((t) => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
    }
    window.__lenis = lenis;
}

// ---------- SCROLL REVEALS ----------
function initScrollReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.card').forEach((card, i) => {
        gsap.from(card, {
            y: 40, opacity: 0, duration: 0.9, ease: 'power3.out',
            delay: (i % 3) * 0.08,
            scrollTrigger: { trigger: card, start: 'top 92%' }
        });
    });
    gsap.utils.toArray('.manifesto-list li').forEach((li) => {
        gsap.from(li, {
            y: 30, opacity: 0, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: li, start: 'top 90%' }
        });
    });
    gsap.utils.toArray('.chap-lede, .filter-bar, .table-container, .booking-workspace-container, .video-frame').forEach((el) => {
        gsap.from(el, {
            y: 30, opacity: 0, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%' }
        });
    });

    // Parallax on chap titles
    gsap.utils.toArray('.chap-title, .manifesto-title').forEach(el => {
        gsap.to(el, {
            yPercent: -6, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
        });
    });

    // Footer huge letters scale
    const fh = document.querySelector('.footer-huge');
    if (fh) {
        gsap.from(fh, {
            scale: 0.94, opacity: 0.4, duration: 1.4, ease: 'power3.out',
            scrollTrigger: { trigger: fh, start: 'top 90%' }
        });
    }
}

// ---------- CARD CURSOR SPOTLIGHT ----------
document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.card').forEach(card => {
        const r = card.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
});

// ---------- SIDEBAR / TABS ----------
function toggleSidebar() {
    document.getElementById('sidebarMenu').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('visible');
    document.getElementById('menuToggle').classList.toggle('open');
}

function switchTab(tabId) {
    if (!tabId) return;
    currentTab = tabId;
    const sidebar = document.getElementById('sidebarMenu');
    if (sidebar.classList.contains('open')) toggleSidebar();

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === tabId));

    // scroll to top of main
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });

    // reveal
    const active = document.getElementById(tabId);
    if (active) {
        active.querySelectorAll('.chap-title .line > span, .reveal-lines .line > span').forEach(el => {
            el.style.transition = 'none';
            el.style.transform = 'translateY(105%)';
        });
        requestAnimationFrame(() => revealChapterTitle(active));
    }
    updateCartUI();
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    setTimeout(attachCursorHover, 100);
}

// ---------- CMS CALC ----------
function calculateCMSValue(jailTimeMonths) {
    if (jailTimeMonths === 999999 || jailTimeMonths === 9999997 || jailTimeMonths === 9999999 || jailTimeMonths === 99999999) return 0;
    if (jailTimeMonths === 0) return CMS_DEFAULT_VALUE;
    return jailTimeMonths * CMS_DEFAULT_VALUE;
}

// ---------- CHARGE SHEET RENDER ----------
function renderChargeSheetGrid() {
    const grid = document.getElementById('robberyGrid');
    grid.innerHTML = '';
    for (const key in chargeSheetGroups) {
        const group = chargeSheetGroups[key];
        let presetCMS = 0;
        group.charges.forEach(c => { presetCMS += calculateCMSValue(c.jailTime); });
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div>
                <h3>${group.label}</h3>
                <div class=\"card-meta\">
                    <span>$${group.capFine.toLocaleString()}<em>·</em></span>
                    <span>${group.capTime}m<em>·</em></span>
                    <span>${presetCMS} CMS</span>
                </div>
            </div>
            <div class=\"card-actions\">
                <span class=\"linked\">${String(group.charges.length).padStart(2,'0')} · Linked</span>
                <button class=\"btn-add\" data-cursor=\"load\" onclick=\"addPresetToCart('${key}')\">Load →</button>
            </div>
        `;
        grid.appendChild(card);
    }
    setTimeout(attachCursorHover, 50);
}

// ---------- PENAL CODES RENDER ----------
function renderPenalCodesTable() {
    const tbody = document.getElementById('penalCodesTableBody');
    tbody.innerHTML = '';
    for (const key in penalCodes) {
        const item = penalCodes[key];
        const tr = document.createElement('tr');
        tr.setAttribute('data-category', item.category);
        tr.setAttribute('data-name', item.label.toLowerCase());
        tr.setAttribute('data-desc', item.description.toLowerCase());

        const readableCategory = item.category.replace('_', ' ');
        const fineDisplay = item.fine === 999999 ? 'Judicial' : `$${item.fine.toLocaleString()}`;
        const isHUT = (item.jailTime === 999999 || item.jailTime === 9999999 || item.jailTime === 99999999);
        const jailDisplay = isHUT ? 'H.U.T' : `${item.jailTime}m`;
        const cmsDisplay = isHUT ? '—' : `${calculateCMSValue(item.jailTime)}`;

        tr.innerHTML = `
            <td>${item.label}</td>
            <td><span class=\"badge ${item.category}\">${readableCategory}</span></td>
            <td style=\"font-size:13px; color:var(--text-2);\">${item.description}</td>
            <td class=\"mono\" style=\"color:${item.fine===999999?'var(--muted)':'var(--text)'};\">${fineDisplay}</td>
            <td class=\"mono\" style=\"color:var(--text);\">${jailDisplay}</td>
            <td class=\"mono\" style=\"color:var(--accent);\">${cmsDisplay}</td>
            <td style=\"text-align:center;\"><button class=\"btn-add\" data-cursor=\"add\" style=\"padding:6px 12px;font-size:11px;\" onclick=\"addSingleCodeToCart('${key}')\">+ Add</button></td>
        `;
        tbody.appendChild(tr);
    }
    setTimeout(attachCursorHover, 50);
}

function addPresetToCart(groupKey) {
    const group = chargeSheetGroups[groupKey];
    let dup = false;
    group.charges.forEach(charge => {
        if (!globalCart.some(c => c.label.toLowerCase() === charge.label.toLowerCase())) {
            globalCart.push({ label: charge.label, fine: charge.fine, jailTime: charge.jailTime, cms: calculateCMSValue(charge.jailTime) });
        } else dup = true;
    });
    if (dup) toast('Duplicate charges skipped.');
    else toast(`Preset loaded — ${group.label}`);
    updateCartUI();
}

function addSingleCodeToCart(itemKey) {
    const item = penalCodes[itemKey];
    if (globalCart.some(c => c.label.toLowerCase() === item.label.toLowerCase())) { toast(`Already added — ${item.label}`); return; }
    const jt = (item.jailTime === 999999 || item.jailTime === 9999999) ? 0 : item.jailTime;
    globalCart.push({ label: item.label, fine: item.fine === 999999 ? 0 : item.fine, jailTime: jt, cms: calculateCMSValue(jt) });
    toast(`Added — ${item.label}`);
    updateCartUI();
}

function removeCartItem(i) { globalCart.splice(i, 1); updateCartUI(); }
function clearGlobalCart() { globalCart = []; updateCartUI(); toast('Booking cleared.'); }

function updateCartUI() {
    const count = globalCart.length;
    document.getElementById('globalCartBadge').innerText = String(count).padStart(2, '0');
    document.getElementById('floatingCartBadge').innerText = String(count).padStart(2, '0');
    const floatBar = document.getElementById('floatingSummaryBar');
    if (count > 0 && window.innerWidth < 1100 && currentTab !== 'booking-summary') floatBar.classList.add('visible');
    else floatBar.classList.remove('visible');

    const container = document.getElementById('workspaceCartItems');
    container.innerHTML = '';
    let f = 0, t = 0, c = 0;
    if (count === 0) {
        container.innerHTML = `<div style=\"background:var(--panel); border:1px solid var(--border); border-radius:var(--radius-sm); padding:60px 24px; text-align:center;\">
            <span class=\"mono\" style=\"color:var(--muted);\">No active codes</span>
            <p style=\"margin-top:12px; color:var(--text-2); font-size:15px;\">Load a preset from Chapter 01, or add a single offense from Chapter 03.</p>
        </div>`;
    } else {
        globalCart.forEach((it, i) => {
            f += it.fine; t += it.jailTime; c += it.cms;
            const row = document.createElement('div');
            row.className = 'summary-item-row';
            row.innerHTML = `
                <div class=\"details-pane\">
                    <h4>${it.label}</h4>
                    <p>$${it.fine.toLocaleString()} <em>·</em> ${it.jailTime}m <em>·</em> ${it.cms} cms</p>
                </div>
                <button class=\"btn-action-cart remove\" data-cursor=\"remove\" onclick=\"removeCartItem(${i})\">Remove</button>
            `;
            container.appendChild(row);
        });
    }
    document.getElementById('boxFine').innerText = `$${f.toLocaleString()}`;
    document.getElementById('boxTime').innerText = `${t} months`;
    document.getElementById('boxCMS').innerText = `${c} tasks`;
    document.getElementById('boxGrandTotal').innerText = `$${f.toLocaleString()} · ${t}m · ${c}t`;
    setTimeout(attachCursorHover, 30);
}

// ---------- PENAL FILTER ----------
function filterCategory(cat, el) {
    document.querySelectorAll('#penal-codes .filter-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    currentCategoryFilter = cat;
    filterTable();
}
function filterTable() {
    const q = document.getElementById('searchBox').value.toLowerCase();
    document.querySelectorAll('#penalCodesTableBody tr').forEach(r => {
        const catMatch = currentCategoryFilter === 'all' || r.getAttribute('data-category') === currentCategoryFilter;
        const nMatch = (r.getAttribute('data-name') || '').includes(q);
        const dMatch = (r.getAttribute('data-desc') || '').includes(q);
        r.style.display = (catMatch && (nMatch || dMatch)) ? '' : 'none';
    });
}

// ---------- RADIO CODES ----------
function changeRadioCategory() {
    currentRadioCategory = document.getElementById('radioCodeCategory').value;
    const pri = document.getElementById('priorityFilters');
    const extra = document.querySelectorAll('.radio-extra-col');
    if (currentRadioCategory === '10-CODES') {
        pri.style.display = '';
        extra.forEach(c => c.style.display = '');
    } else {
        pri.style.display = 'none';
        extra.forEach(c => c.style.display = 'none');
    }
    document.getElementById('radioSearchBox').value = '';
    filterRadioPriority('all', document.querySelector('#priorityFilters .filter-btn'));
}
function filterRadioPriority(p, el) {
    if (el) { document.querySelectorAll('#priorityFilters .filter-btn').forEach(b => b.classList.remove('active')); el.classList.add('active'); }
    currentPriorityFilter = p;
    applyRadioFilters();
}
function applyRadioFilters() {
    const q = document.getElementById('radioSearchBox').value.toLowerCase();
    const data = radioCodesData[currentRadioCategory] || [];
    activeRadioCodes = data.filter(it => {
        const s = it.code.toLowerCase().includes(q) || it.meaning.toLowerCase().includes(q);
        let pm = true;
        if (currentRadioCategory === '10-CODES' && currentPriorityFilter !== 'all') pm = it.priority === currentPriorityFilter;
        return s && pm;
    });
    renderRadioTable();
}
function shuffleRadioCodes() {
    for (let i = activeRadioCodes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activeRadioCodes[i], activeRadioCodes[j]] = [activeRadioCodes[j], activeRadioCodes[i]];
    }
    renderRadioTable();
}
function renderRadioTable() {
    const tb = document.getElementById('radioCodesTableBody');
    tb.innerHTML = '';
    if (activeRadioCodes.length === 0) {
        tb.innerHTML = `<tr><td colspan=\"3\" class=\"empty-cell\">No matching codes.</td></tr>`;
        return;
    }
    activeRadioCodes.forEach(it => {
        const tr = document.createElement('tr');
        let extra = '';
        if (currentRadioCategory === '10-CODES') {
            extra = `<td><span class=\"badge\">${it.priority || '—'}</span></td>`;
        }
        tr.innerHTML = `
            <td class=\"mono\" style=\"color:var(--accent); font-size:14px; letter-spacing:0.04em;\">${it.code}</td>
            <td style=\"color:var(--text); font-family:var(--font-display); font-weight:400; font-size:17px; letter-spacing:-0.01em;\">${it.meaning}</td>
            ${extra}
        `;
        tb.appendChild(tr);
    });
}

// ---------- TOAST ----------
let toastEl;
function toast(msg) {
    if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.style.cssText = `position:fixed; bottom:70px; left:50%; transform:translateX(-50%) translateY(20px); background:var(--text); color:var(--bg); padding:12px 22px; border-radius:999px; font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:0.08em; z-index:200; opacity:0; transition:all .4s cubic-bezier(0.19,1,0.22,1); pointer-events:none;`;
        document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    toastEl.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toastEl.__t);
    toastEl.__t = setTimeout(() => { toastEl.style.opacity = '0'; toastEl.style.transform = 'translateX(-50%) translateY(20px)'; }, 2200);
}

window.addPresetToCart = addPresetToCart;
window.addSingleCodeToCart = addSingleCodeToCart;
window.removeCartItem = removeCartItem;
window.clearGlobalCart = clearGlobalCart;
window.filterCategory = filterCategory;
window.filterTable = filterTable;
window.changeRadioCategory = changeRadioCategory;
window.filterRadioPriority = filterRadioPriority;
window.applyRadioFilters = applyRadioFilters;
window.shuffleRadioCodes = shuffleRadioCodes;
window.switchTab = switchTab;
