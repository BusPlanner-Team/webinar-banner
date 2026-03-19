// ===== Constants =====
const NAVY = '#00274C';
const GOLD = '#FCBA30';
const WHITE = '#FFFFFF';

const QUALITY_PRESETS = { 2: 0.92, 3: 0.90, 4: 0.85 };

// ===== State =====
let speakers = [{ id: 1, name: '', title: '', headshotUrl: null }];

// Hardcoded background SVG (cream/beige with map lines and gold circle)
function getBgSvg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="421" viewBox="0 0 600 421">
        <defs>
            <linearGradient id="cream" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#FDF6E3"/>
                <stop offset="60%" stop-color="#FBF2DC"/>
                <stop offset="100%" stop-color="#F8EDD2"/>
            </linearGradient>
        </defs>
        <rect width="600" height="421" fill="url(#cream)"/>
        <g stroke="#E0D8C8" stroke-width="1.5" fill="none" opacity="0.6">
            <path d="M0 320 Q80 300 160 310 T320 290 T480 305 T600 280"/>
            <path d="M0 340 Q100 320 200 335 T400 310 T600 325"/>
            <path d="M0 360 Q120 345 240 355 T480 340 T600 350"/>
            <path d="M0 380 Q90 365 180 375 T360 360 T540 370 T600 365"/>
            <path d="M0 400 Q110 385 220 395 T440 380 T600 390"/>
            <path d="M100 280 L100 421"/>
            <path d="M200 290 L200 421"/>
            <path d="M300 285 L300 421"/>
            <path d="M400 295 L400 421"/>
            <path d="M500 275 L500 421"/>
            <path d="M50 300 L150 350"/>
            <path d="M250 295 L350 340"/>
            <path d="M450 285 L550 330"/>
            <path d="M150 310 Q200 330 250 310"/>
            <path d="M350 300 Q400 320 450 300"/>
            <path d="M0 300 Q50 310 100 295 T200 305"/>
            <path d="M400 290 Q450 310 500 295 T600 305"/>
        </g>
        <circle cx="30" cy="421" r="90" fill="none" stroke="#FCBA30" stroke-width="16" opacity="0.8"/>
        <circle cx="30" cy="421" r="55" fill="none" stroke="#FCBA30" stroke-width="5" opacity="0.4"/>
    </svg>`;
}

function getBgDataUrl() {
    return 'data:image/svg+xml,' + encodeURIComponent(getBgSvg());
}

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    bindInputListeners();
    bindSpeakers();
    bindDownload();
    renderSpeakers();
    updatePreview();
});

// ===== Input Listeners =====
function bindInputListeners() {
    const inputs = [
        'webinarTitle', 'webinarSubtitle', 'webinarDate', 'webinarTime',
        'webinarPlatform', 'ctaText', 'seriesLabel',
        'titleSize', 'subtitleSize', 'detailsSize',
        'topBarEnabled', 'topBarText'
    ];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updatePreview);
            el.addEventListener('change', updatePreview);
        }
    });
}

// ===== Speakers =====
function bindSpeakers() {
    document.getElementById('addSpeakerBtn').addEventListener('click', () => {
        speakers.push({ id: Date.now(), name: '', title: '', headshotUrl: null });
        renderSpeakers();
        updatePreview();
    });
}

function renderSpeakers() {
    const container = document.getElementById('speakersList');
    container.innerHTML = speakers.map((s, i) => `
        <div class="speaker-entry" data-id="${s.id}">
            <div class="speaker-fields">
                <input type="text" placeholder="Speaker name" value="${escapeHtml(s.name)}" data-field="name">
                <input type="text" placeholder="Title / role" value="${escapeHtml(s.title)}" data-field="title">
                <div class="headshot-upload-zone" data-id="${s.id}">
                    ${s.headshotUrl
                        ? `<img src="${s.headshotUrl}" class="headshot-thumb"><button class="headshot-clear-btn">&times;</button>`
                        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg><span class="headshot-upload-label">Upload headshot</span>`}
                    <input type="file" accept="image/*" hidden>
                </div>
            </div>
            ${speakers.length > 1 ? `<button class="remove-speaker-btn" title="Remove">&times;</button>` : ''}
        </div>
    `).join('');

    container.querySelectorAll('.speaker-entry').forEach(entry => {
        const id = parseInt(entry.dataset.id);
        entry.querySelectorAll('input[type="text"]').forEach(input => {
            input.addEventListener('input', () => {
                const speaker = speakers.find(s => s.id === id);
                if (speaker) speaker[input.dataset.field] = input.value;
                updatePreview();
            });
        });
        const removeBtn = entry.querySelector('.remove-speaker-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                speakers = speakers.filter(s => s.id !== id);
                renderSpeakers();
                updatePreview();
            });
        }
        const zone = entry.querySelector('.headshot-upload-zone');
        const fileInput = zone.querySelector('input[type="file"]');
        const clearBtn = zone.querySelector('.headshot-clear-btn');
        zone.addEventListener('click', (e) => {
            if (e.target.classList.contains('headshot-clear-btn')) return;
            fileInput.click();
        });
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.borderColor = NAVY; });
        zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.style.borderColor = '';
            if (e.dataTransfer.files[0]) loadHeadshot(e.dataTransfer.files[0], id);
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) loadHeadshot(fileInput.files[0], id);
        });
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const speaker = speakers.find(s => s.id === id);
                if (speaker) speaker.headshotUrl = null;
                renderSpeakers();
                updatePreview();
            });
        }
    });
}

function loadHeadshot(file, speakerId) {
    if (!file.type.startsWith('image/')) return showToast('Please upload an image file', 'error');
    const reader = new FileReader();
    reader.onload = (e) => {
        const speaker = speakers.find(s => s.id === speakerId);
        if (speaker) speaker.headshotUrl = e.target.result;
        renderSpeakers();
        updatePreview();
    };
    reader.readAsDataURL(file);
}

// ===== Update Preview =====
function updatePreview() {
    const preview = document.getElementById('bannerPreview');
    const title = document.getElementById('webinarTitle').value.trim();
    const subtitle = document.getElementById('webinarSubtitle').value.trim();
    const date = document.getElementById('webinarDate').value.trim();
    const time = document.getElementById('webinarTime').value.trim();
    const platform = document.getElementById('webinarPlatform').value.trim();
    const ctaText = document.getElementById('ctaText').value.trim();
    const seriesLabel = document.getElementById('seriesLabel').value.trim();
    const topBarEnabled = document.getElementById('topBarEnabled').checked;
    const topBarText = document.getElementById('topBarText').value.trim();
    const titleSize = document.getElementById('titleSize').value;
    const subtitleSize = document.getElementById('subtitleSize').value;
    const detailsSize = document.getElementById('detailsSize').value;

    const firstSpeaker = speakers[0]?.name || '';

    if (!title && !date && !firstSpeaker) {
        preview.innerHTML = `<div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
            <p>Start filling in details to see your banner</p>
        </div>`;
        return;
    }

    const allHeadshots = speakers.filter(s => s.headshotUrl).map(s => ({ url: s.headshotUrl, name: s.name, title: s.title }));
    const hasHeadshots = allHeadshots.length > 0;

    // Top bar
    let topBarHtml = '';
    if (topBarEnabled && topBarText) {
        topBarHtml = `<div class="banner-top-bar">
            <span>${escapeHtml(topBarText)}</span>
        </div>`;
    }

    // Headshots with names below
    let speakerHtml = '';
    if (hasHeadshots) {
        const headshotItems = allHeadshots.map(h => `
            <div class="banner-headshot-item">
                <div class="banner-headshot-arch"></div>
                <img class="banner-headshot-oval" src="${h.url}" alt="${escapeHtml(h.name)}">
                ${h.name ? `<div class="banner-headshot-name">${escapeHtml(h.name)}</div>` : ''}
                ${h.title ? `<div class="banner-headshot-title">${escapeHtml(h.title)}</div>` : ''}
            </div>
        `).join('');
        speakerHtml = `<div class="banner-headshots-area">${headshotItems}</div>`;
    }

    // Build platform row (stays in left content)
    let platformRow = '';
    if (platform) {
        platformRow = `<div class="banner-detail-row">
            <svg width="${detailsSize}" height="${detailsSize}" viewBox="0 0 24 24" fill="none" stroke="${GOLD}" stroke-width="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>
            ${escapeHtml(platform)}
        </div>`;
    }

    // Date/time block (positioned top-right)
    let dateTimeHtml = '';
    if (date || time) {
        let dtRows = '';
        if (date) {
            dtRows += `<div class="banner-dt-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${GOLD}" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>${escapeHtml(date)}</span>
            </div>`;
        }
        if (time) {
            dtRows += `<div class="banner-dt-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${GOLD}" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>${escapeHtml(time)}</span>
            </div>`;
        }
        dateTimeHtml = `<div class="banner-datetime">${dtRows}</div>`;
    }

    preview.innerHTML = `
        <div class="banner-inner ${topBarEnabled && topBarText ? 'has-top-bar' : ''}">
            <div class="banner-bg" style="background-image: url('${getBgDataUrl()}'); background-size: cover;"></div>
            ${topBarHtml}
            ${dateTimeHtml}
            <div class="banner-body">
                <div class="banner-content">
                    <img src="logo.png" class="banner-bp-logo" alt="BusPlanner">
                    ${seriesLabel ? `<div class="banner-series-tag">${escapeHtml(seriesLabel)}</div>` : ''}
                    ${title ? `<div class="banner-title" style="font-size: ${titleSize}px;">${escapeHtml(title)}</div>` : ''}
                    ${subtitle ? `<div class="banner-subtitle" style="font-size: ${subtitleSize}px;">${escapeHtml(subtitle)}</div>` : ''}
                    ${platformRow ? `<div class="banner-details" style="font-size: ${detailsSize}px;">${platformRow}</div>` : ''}
                    ${ctaText ? `<div class="banner-cta">
                        ${escapeHtml(ctaText)}
                        <span class="banner-cta-arrow">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${NAVY}" stroke-width="3"><line x1="7" y1="12" x2="17" y2="12"/><polyline points="12 7 17 12 12 17"/></svg>
                        </span>
                    </div>` : ''}
                </div>
                ${speakerHtml}
            </div>
        </div>`;
}

// ===== Download =====
function bindDownload() {
    document.getElementById('downloadBtn').addEventListener('click', downloadBanner);
}

async function downloadBanner() {
    const bannerEl = document.querySelector('.banner-inner');
    if (!bannerEl) return showToast('Nothing to export — add some content first', 'error');

    const btn = document.getElementById('downloadBtn');
    btn.disabled = true;
    btn.textContent = 'Exporting...';

    try {
        const format = document.getElementById('exportFormat').value;
        const scale = parseInt(document.getElementById('exportQuality').value);

        const exportWidth = 1200;
        const exportHeight = 842;
        const scaleX = exportWidth / 600;
        const scaleY = exportHeight / bannerEl.offsetHeight;
        const exportScale = Math.max(scaleX, scaleY) * scale;

        const canvas = await html2canvas(bannerEl, {
            scale: exportScale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: 600,
            height: bannerEl.offsetHeight
        });

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = 1200;
        finalCanvas.height = 842;
        const ctx = finalCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0, 1200, 842);

        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const quality = format === 'jpeg' ? QUALITY_PRESETS[scale] : undefined;
        const dataUrl = finalCanvas.toDataURL(mimeType, quality);

        const link = document.createElement('a');
        const title = document.getElementById('webinarTitle').value.trim() || 'webinar-banner';
        const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
        link.download = `${safeName}-banner.${format}`;
        link.href = dataUrl;
        link.click();

        showToast('Banner downloaded!', 'success');
    } catch (err) {
        console.error('Export failed:', err);
        showToast('Export failed — try again', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download Banner`;
    }
}

// ===== Helpers =====
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}
