/* ============================================================
   Loads /api/config and populates every element with data-cfg
   ============================================================ */
(function () {
  let CFG = null;

  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function getByPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  function applyBindings() {
    // data-cfg="profile.name" → sets textContent
    document.querySelectorAll('[data-cfg]').forEach(el => {
      const path = el.dataset.cfg;
      const val = getByPath(CFG, path);
      if (val == null) return;
      if (el.tagName === 'IMG') el.src = val;
      else if (el.tagName === 'A') el.href = val;
      else el.textContent = val;
    });

    // data-cfg-href="profile.avatar" → sets href
    document.querySelectorAll('[data-cfg-href]').forEach(el => {
      const val = getByPath(CFG, el.dataset.cfgHref);
      if (val) el.href = val;
    });

    // data-cfg-src="profile.avatar" → sets img src
    document.querySelectorAll('[data-cfg-src]').forEach(el => {
      const val = getByPath(CFG, el.dataset.cfgSrc);
      if (val) el.src = val;
    });

    // Verified badge toggle
    const verified = CFG?.profile?.verified;
    document.querySelectorAll('[data-verified]').forEach(el => {
      el.style.display = verified ? 'inline-flex' : 'none';
    });

    // Page title
    if (CFG?.site?.name && !document.title.includes(CFG.site.name)) {
      document.title = `${document.title} · ${CFG.site.name}`;
    }
  }

  function renderHobbies() {
    const grid = document.getElementById('hobby-grid');
    if (!grid || !CFG.hobbies) return;

    grid.innerHTML = CFG.hobbies.map((h, i) => `
      <article class="hobby-card glass animate-reveal" style="animation-delay:${i * 0.08}s;">
        <div class="hobby-icon hobby-${esc(h.color || 'cyan')}">
          <i class="fas ${esc(h.icon || 'fa-star')}"></i>
        </div>
        <div class="hobby-body">
          <div class="hobby-tag">${esc(h.tag || '')}</div>
          <h3 class="hobby-title">${esc(h.title)}</h3>
          <p class="hobby-desc">${esc(h.description)}</p>
        </div>
      </article>
    `).join('');
  }

  function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid || !CFG.gallery?.images) return;

    grid.innerHTML = CFG.gallery.images.map((img, i) => `
      <figure class="gallery-item glass animate-reveal" style="animation-delay:${i * 0.05}s;" data-src="${esc(img.url)}" data-caption="${esc(img.caption || '')}">
        <img src="${esc(img.url)}" alt="${esc(img.caption || '')}" loading="lazy" />
        <figcaption>
          <span>${esc(img.caption || '')}</span>
          <small>${esc(img.tag || '')}</small>
        </figcaption>
      </figure>
    `).join('');

    // Lightbox
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    const lbImg = lb.querySelector('img');
    grid.querySelectorAll('.gallery-item').forEach(fig => {
      fig.addEventListener('click', () => {
        lbImg.src = fig.dataset.src;
        lb.classList.add('open');
      });
    });
    lb.addEventListener('click', () => lb.classList.remove('open'));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') lb.classList.remove('open');
    });
  }

  function bindContactButtons() {
    // Copy to clipboard for email/phone
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const val = btn.dataset.copy;
        if (!val) return;
        try {
          await navigator.clipboard.writeText(val);
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check"></i>';
          setTimeout(() => btn.innerHTML = orig, 1500);
          const toast = document.getElementById('toast');
          if (toast) {
            toast.textContent = 'Copied to clipboard';
            toast.className = 'toast toast-ok show';
            setTimeout(() => toast.classList.remove('show'), 2200);
          }
        } catch {}
      });
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const res = await fetch('/api/config');
      CFG = await res.json();
    } catch {
      console.error('Failed to load config');
      return;
    }

    applyBindings();
    renderHobbies();
    renderGallery();
    bindContactButtons();

    // Update gallery header
    const gTitle = document.getElementById('gallery-title');
    const gSub = document.getElementById('gallery-subtitle');
    if (gTitle && CFG.gallery?.title) gTitle.textContent = CFG.gallery.title;
    if (gSub && CFG.gallery?.subtitle) gSub.textContent = CFG.gallery.subtitle;
  });

  window.getConfig = () => CFG;
})();