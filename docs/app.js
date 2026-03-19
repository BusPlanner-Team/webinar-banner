// ===== State =====
let currentHeadshotUrl = null;
let currentBgImageUrl = null;
let additionalSpeakers = [];
let activeSeries = 'prospect';

const SERIES_CONFIG = {
    'prospect': { label: 'Prospect Webinar', color: '#00274C', gradient: 'linear-gradient(135deg, #00274C 0%, #003366 50%, #004080 100%)' },
    'us-client': { label: 'US Client Session', color: '#1B5E20', gradient: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)' },
    'can-client': { label: 'CAN Client Session', color: '#4A148C', gradient: 'linear-gradient(135deg, #4A148C 0%, #6A1B9A 50%, #7B1FA2 100%)' },
    'forum': { label: 'BusPlanner Forum', color: '#B71C1C', gradient: 'linear-gradient(135deg, #B71C1C 0%, #C62828 50%, #D32F2F 100%)' }
};

const QUALITY_PRESETS = { 2: 0.92, 3: 0.90, 4: 0.85 };

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    bindInputListeners();
    bindSeriesSelector();
    bindUploadZones();
    bindColorSync();
    bindRangeLabels();
    bindAdditionalSpeakers();
    bindDownload();
    updatePreview();
});

// ===== Input Listeners =====
function bindInputListeners() {
    const inputs = [
        'webinarTitle', 'webinarSubtitle', 'webinarDate', 'webinarTime',
        'webinarPlatform', 'speakerName', 'speakerTitle', 'ctaText',
        'accentColor', 'textColor', 'ctaBgColor', 'ctaTextColor',
        'titleSize', 'subtitleSize', 'detailsSize', 'overlayOpacity',
        'seriesLabel'
    ];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updatePreview);
    });
}

// ===== Series Selector =====
function bindSeriesSelector() {
    document.querySelectorAll('.series-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.series-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeSeries = btn.dataset.series;
            // Update the editable label to match the selected series default
            document.getElementById('seriesLabel').value = SERIES_CONFIG[activeSeries].label;
            updatePreview();
        });
    });
}

// ===== Upload Zones =====
function bindUploadZones() {
    setupUpload('headshotZone', 'headshotUpload', 'headshotPreview', 'clearHeadshot', (url) => { currentHeadshotUrl = url; updatePreview(); });
    setupUpload('bgImageZone', 'bgImageUpload', 'bgImagePreview', 'clearBgImage', (url) => { currentBgImageUrl = url; updatePreview(); });
}

function setupUpload(zoneId, inputId, previewId, clearId, onLoad) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const clearBtn = document.getElementById(clearId);

    zone.addEventListener('click', (e) => { if (e.target !== clearBtn) input.click(); });
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.borderColor = '#00274C'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.style.borderColor = '';
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', () => { if (input.files[0]) handleFile(input.files[0]); });
    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        preview.hidden = true;
        clearBtn.hidden = true;
        zone.querySelector('.upload-placeholder').hidden = false;
        zone.classList.remove('has-image');
        input.value = '';
        onLoad(null);
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) return showToast('Please upload an image file', 'error');
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.hidden = false;
            clearBtn.hidden = false;
            zone.querySelector('.upload-placeholder').hidden = true;
            zone.classList.add('has-image');
            onLoad(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// ===== Color Sync =====
function bindColorSync() {
    ['accent', 'text', 'ctaBg', 'ctaText'].forEach(name => {
        const picker = document.getElementById(name + 'Color');
        const hex = document.getElementById(name + 'ColorHex');
        picker.addEventListener('input', () => { hex.value = picker.value.toUpperCase(); updatePreview(); });
        hex.addEventListener('input', () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(hex.value)) { picker.value = hex.value; updatePreview(); }
        });
    });
}

// ===== Range Labels =====
function bindRangeLabels() {
    ['titleSize', 'subtitleSize', 'detailsSize'].forEach(id => {
        const el = document.getElementById(id);
        const label = document.getElementById(id + 'Val');
        el.addEventListener('input', () => { label.textContent = el.value + 'px'; });
    });
    // Overlay opacity label
    const opEl = document.getElementById('overlayOpacity');
    const opLabel = document.getElementById('overlayOpacityVal');
    if (opEl && opLabel) {
        opEl.addEventListener('input', () => { opLabel.textContent = opEl.value + '%'; });
    }
}

// ===== Additional Speakers =====
function bindAdditionalSpeakers() {
    document.getElementById('addSpeakerBtn').addEventListener('click', () => {
        const id = Date.now();
        additionalSpeakers.push({ id, name: '', title: '', headshotUrl: null });
        renderAdditionalSpeakers();
    });
}

function renderAdditionalSpeakers() {
    const container = document.getElementById('additionalSpeakers');
    container.innerHTML = additionalSpeakers.map(s => `
        <div class="speaker-entry" data-id="${s.id}">
            <div class="speaker-fields">
                <input type="text" placeholder="Speaker name" value="${escapeHtml(s.name)}" data-field="name">
                <input type="text" placeholder="Speaker title" value="${escapeHtml(s.title)}" data-field="title">
                <div class="mini-upload-zone" data-id="${s.id}">
                    ${s.headshotUrl
                        ? `<img src="${s.headshotUrl}" class="mini-upload-preview"><button class="mini-clear-btn">&times;</button>`
                        : `<span class="mini-upload-label">+ Headshot</span>`}
                    <input type="file" accept="image/*" hidden>
                </div>
            </div>
            <button class="remove-speaker-btn" title="Remove">&times;</button>
        </div>
    `).join('');

    container.querySelectorAll('.speaker-entry').forEach(entry => {
        const id = parseInt(entry.dataset.id);
        entry.querySelectorAll('input[type="text"]').forEach(input => {
            input.addEventListener('input', () => {
                const speaker = additionalSpeakers.find(s => s.id === id);
                if (speaker) speaker[input.dataset.field] = input.value;
                updatePreview();
            });
        });
        entry.querySelector('.remove-speaker-btn').addEventListener('click', () => {
            additionalSpeakers = additionalSpeakers.filter(s => s.id !== id);
            renderAdditionalSpeakers();
            updatePreview();
        });

        // Mini headshot upload
        const miniZone = entry.querySelector('.mini-upload-zone');
        const miniInput = miniZone.querySelector('input[type="file"]');
        const miniClear = miniZone.querySelector('.mini-clear-btn');

        miniZone.addEventListener('click', (e) => {
            if (e.target.classList.contains('mini-clear-btn')) return;
            miniInput.click();
        });
        miniInput.addEventListener('change', () => {
            if (!miniInput.files[0]) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const speaker = additionalSpeakers.find(s => s.id === id);
                if (speaker) speaker.headshotUrl = e.target.result;
                renderAdditionalSpeakers();
                updatePreview();
            };
            reader.readAsDataURL(miniInput.files[0]);
        });
        if (miniClear) {
            miniClear.addEventListener('click', (e) => {
                e.stopPropagation();
                const speaker = additionalSpeakers.find(s => s.id === id);
                if (speaker) speaker.headshotUrl = null;
                renderAdditionalSpeakers();
                updatePreview();
            });
        }
    });
}

// ===== Update Preview =====
function updatePreview() {
    const preview = document.getElementById('bannerPreview');
    const title = document.getElementById('webinarTitle').value.trim();
    const subtitle = document.getElementById('webinarSubtitle').value.trim();
    const date = document.getElementById('webinarDate').value.trim();
    const time = document.getElementById('webinarTime').value.trim();
    const platform = document.getElementById('webinarPlatform').value;
    const speakerName = document.getElementById('speakerName').value.trim();
    const speakerTitle = document.getElementById('speakerTitle').value.trim();
    const ctaText = document.getElementById('ctaText').value.trim();
    const seriesLabel = document.getElementById('seriesLabel').value.trim();

    const textColor = document.getElementById('textColor').value;
    const accentColor = document.getElementById('accentColor').value;
    const ctaBgColor = document.getElementById('ctaBgColor').value;
    const ctaTextColor = document.getElementById('ctaTextColor').value;
    const titleSize = document.getElementById('titleSize').value;
    const subtitleSize = document.getElementById('subtitleSize').value;
    const detailsSize = document.getElementById('detailsSize').value;

    const overlayOpacity = document.getElementById('overlayOpacity').value / 100;
    const series = SERIES_CONFIG[activeSeries];

    if (!title && !date && !speakerName) {
        preview.innerHTML = `<div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
            <p>Start filling in details to see your banner</p>
        </div>`;
        return;
    }

    // Collect all headshots (primary + additional)
    const allHeadshots = [];
    if (currentHeadshotUrl) allHeadshots.push({ url: currentHeadshotUrl, name: speakerName });
    additionalSpeakers.forEach(s => {
        if (s.headshotUrl) allHeadshots.push({ url: s.headshotUrl, name: s.name });
    });

    const hasHeadshots = allHeadshots.length > 0;
    const contentMaxWidth = hasHeadshots ? '350px' : '520px';

    // Background
    let bgStyle = '';
    let overlayHtml = '';
    if (currentBgImageUrl) {
        bgStyle = `background-image: url('${currentBgImageUrl}'); background-size: cover; background-position: center;`;
        overlayHtml = `<div class="banner-overlay" style="background: linear-gradient(135deg, ${series.color}ee ${overlayOpacity * 100}%, ${series.color}99 100%);"></div>`;
    } else {
        bgStyle = `background: ${series.gradient};`;
    }

    // Oval headshots with gold arch
    let speakerHtml = '';
    if (hasHeadshots) {
        const headshotItems = allHeadshots.map(h => `
            <div class="banner-headshot-item">
                <div class="banner-headshot-arch" style="background: ${accentColor};"></div>
                <img class="banner-headshot-oval" src="${h.url}" alt="${escapeHtml(h.name)}">
            </div>
        `).join('');
        speakerHtml = `<div class="banner-headshots-area">${headshotItems}</div>`;
    }

    const allSpeakerNames = [speakerName, ...additionalSpeakers.map(s => s.name).filter(Boolean)].filter(Boolean);
    const dateTimeStr = [date, time].filter(Boolean).join(' | ');
    const displayLabel = seriesLabel || series.label;

    preview.innerHTML = `
        <div class="banner-inner">
            <div class="banner-bg" style="${bgStyle}"></div>
            ${overlayHtml}
            <div class="banner-content" style="color: ${textColor}; max-width: ${contentMaxWidth};">
                <div class="banner-series-tag" style="color: ${accentColor};">${escapeHtml(displayLabel)}</div>
                ${title ? `<div class="banner-title" style="font-size: ${titleSize}px;">${escapeHtml(title)}</div>` : ''}
                ${subtitle ? `<div class="banner-subtitle" style="font-size: ${subtitleSize}px;">${escapeHtml(subtitle)}</div>` : ''}
                <div class="banner-details" style="font-size: ${detailsSize}px;">
                    ${dateTimeStr ? `<div class="banner-detail-row">
                        <svg width="${detailsSize}" height="${detailsSize}" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${escapeHtml(dateTimeStr)}
                    </div>` : ''}
                    ${platform ? `<div class="banner-detail-row">
                        <svg width="${detailsSize}" height="${detailsSize}" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>
                        ${escapeHtml(platform)}
                    </div>` : ''}
                    ${allSpeakerNames.length > 0 ? `<div class="banner-detail-row">
                        <svg width="${detailsSize}" height="${detailsSize}" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>
                        ${escapeHtml(allSpeakerNames.join(', '))}
                    </div>` : ''}
                </div>
                ${ctaText ? `<div class="banner-cta" style="background: ${ctaBgColor}; color: ${ctaTextColor};">
                    ${escapeHtml(ctaText)}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${ctaTextColor}" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>` : ''}
            </div>
            ${speakerHtml}
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

        const canvas = await html2canvas(bannerEl, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: 600,
            height: bannerEl.offsetHeight
        });

        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const quality = format === 'jpeg' ? QUALITY_PRESETS[scale] : undefined;
        const dataUrl = canvas.toDataURL(mimeType, quality);

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
