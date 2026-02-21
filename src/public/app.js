/* ── Navbar scroll effect ── */
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

/* ── Scroll animations ── */
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));

/* ── Endpoint accordion ── */
document.querySelectorAll('.endpoint-header').forEach(header => {
    header.addEventListener('click', () => {
        header.closest('.endpoint').classList.toggle('open');
    });
});

/* ── Playground ── */
const pgTabs = document.querySelectorAll('.pg-tab');
const searchFields = document.getElementById('search-fields');
const lyricsFields = document.getElementById('lyrics-fields');
const urlPreview = document.getElementById('url-preview');
const sendBtn = document.getElementById('pg-send');
const responseBody = document.getElementById('pg-response-body');
let currentMode = 'search';

pgTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        pgTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentMode = tab.dataset.mode;
        searchFields.style.display = currentMode === 'search' ? 'block' : 'none';
        lyricsFields.style.display = currentMode === 'lyrics' ? 'block' : 'none';
        updateUrlPreview();
    });
});

function updateUrlPreview() {
    const base = window.location.origin;
    if (currentMode === 'search') {
        const q = document.getElementById('pg-query').value || 'your+query';
        const t = document.getElementById('pg-type').value;
        const typeParam = t !== 'all' ? `&type=${t}` : '';
        urlPreview.innerHTML = `<span class="method">GET</span> <span class="path">${base}/search</span><span class="param">?q=${encodeURIComponent(q)}${typeParam}</span>`;
    } else {
        const vid = document.getElementById('pg-videoid').value || 'videoId';
        urlPreview.innerHTML = `<span class="method">GET</span> <span class="path">${base}/lyrics/</span><span class="param">${vid}</span>`;
    }
}

document.getElementById('pg-query')?.addEventListener('input', updateUrlPreview);
document.getElementById('pg-type')?.addEventListener('change', updateUrlPreview);
document.getElementById('pg-videoid')?.addEventListener('input', updateUrlPreview);
updateUrlPreview();

/* ── JSON Syntax Highlighting ── */
function highlightJSON(json) {
    const str = JSON.stringify(json, null, 2);
    return str.replace(
        /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                cls = /:$/.test(match) ? 'json-key' : 'json-string';
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        }
    ).replace(/[{}[\]]/g, m => `<span class="json-bracket">${m}</span>`);
}

/* ── Send Request ── */
sendBtn.addEventListener('click', async () => {
    sendBtn.classList.add('loading');
    responseBody.innerHTML = '<pre>Loading...</pre>';

    try {
        let url;
        if (currentMode === 'search') {
            const q = document.getElementById('pg-query').value;
            const t = document.getElementById('pg-type').value;
            if (!q) { responseBody.innerHTML = '<pre><span class="json-key">"error"</span>: <span class="json-string">"Please enter a search query"</span></pre>'; return; }
            url = `/search?q=${encodeURIComponent(q)}${t !== 'all' ? `&type=${t}` : ''}`;
        } else {
            const vid = document.getElementById('pg-videoid').value;
            if (!vid) { responseBody.innerHTML = '<pre><span class="json-key">"error"</span>: <span class="json-string">"Please enter a video ID"</span></pre>'; return; }
            url = `/lyrics/${vid}`;
        }

        const res = await fetch(url);
        const json = await res.json();
        responseBody.innerHTML = `<pre>${highlightJSON(json)}</pre>`;
    } catch (err) {
        responseBody.innerHTML = `<pre><span class="json-key">"error"</span>: <span class="json-string">"${err.message}"</span></pre>`;
    } finally {
        sendBtn.classList.remove('loading');
    }
});

/* ── Smooth scroll for nav links ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
