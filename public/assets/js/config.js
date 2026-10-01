/* ============================================================
   Config loader + page renderers
   - Binds [data-cfg], [data-cfg-src], [data-cfg-href] to config
   - Renders hobbies, gallery (with lightbox), music (with audio)
   - Single shared audio element — only one track plays at a time
   ============================================================ */
(function () {
  let CFG = null;

  // ------------------------------------------------------------
  // Utilities
  // ------------------------------------------------------------
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getByPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  function formatDuration(ms) {
    if (!ms || ms < 0) return '0:00';
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return iso;
    }
  }

  // ------------------------------------------------------------
  // 1. Bindings — [data-cfg], [data-cfg-src], [data-cfg-href]
  // ------------------------------------------------------------
  function applyBindings() {
    // Text / src / href based on tag name
    document.querySelectorAll('[data-cfg]').forEach(el => {
      const val = getByPath(CFG, el.dataset.cfg);
      if (val == null) return;
      if (el.tagName === 'IMG') el.src = val;
      else if (el.tagName === 'A') el.href = val;
      else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = val;
      else el.textContent = val;
    });

    // Explicit src binding
    document.querySelectorAll('[data-cfg-src]').forEach(el => {
      const val = getByPath(CFG, el.dataset.cfgSrc);
      if (val) el.src = val;
    });

    // Explicit href binding
    document.querySelectorAll('[data-cfg-href]').forEach(el => {
      const val = getByPath(CFG, el.dataset.cfgHref);
      if (val) el.href = val;
    });

    // Verified badge toggle
    const verified = CFG?.profile?.verified;
    document.querySelectorAll('[data-verified]').forEach(el => {
      el.style.display = verified ? 'inline-flex' : 'none';
    });

    // Page title suffix
    if (CFG?.site?.name && !document.title.includes(CFG.site.name)) {
      document.title = `${document.title} · ${CFG.site.name}`;
    }
  }

  // ------------------------------------------------------------
  // 2. Hobbies
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // 3. Gallery + lightbox
  // ------------------------------------------------------------
  function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid || !CFG.gallery?.images) return;

    // Update header
    const titleEl = document.getElementById('gallery-title');
    const subEl = document.getElementById('gallery-subtitle');
    if (titleEl && CFG.gallery.title) titleEl.textContent = CFG.gallery.title;
    if (subEl && CFG.gallery.subtitle) subEl.textContent = CFG.gallery.subtitle;

    grid.innerHTML = CFG.gallery.images.map((img, i) => `
      <figure class="gallery-item glass animate-reveal"
              style="animation-delay:${i * 0.05}s;"
              data-src="${esc(img.url)}"
              data-caption="${esc(img.caption || '')}">
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
        lbImg.alt = fig.dataset.caption || '';
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    function closeLightbox() {
      lb.classList.remove('open');
      document.body.style.overflow = '';
    }

    lb.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  // ------------------------------------------------------------
  // 4. Music — cards + single shared audio player
  // ------------------------------------------------------------
  function renderMusic() {
    const grid = document.getElementById('music-grid');
    if (!grid || !CFG.music?.tracks) return;

    // Header
    const titleEl = document.getElementById('music-title');
    const subEl = document.getElementById('music-subtitle');
    if (titleEl && CFG.music.title) titleEl.textContent = CFG.music.title;
    if (subEl && CFG.music.subtitle) subEl.textContent = CFG.music.subtitle;

    // Build cards
    grid.innerHTML = CFG.music.tracks.map((t, i) => `
      <article class="music-card glass animate-reveal" style="animation-delay:${i * 0.06}s;" data-index="${i}">
        <div class="music-cover">
          <img src="${esc(t.thumbnail)}" alt="${esc(t.title)}" loading="lazy" />
          <button class="music-play" data-play="${i}" title="Play preview" aria-label="Play preview">
            <i class="fas fa-play"></i>
          </button>
          <div class="music-progress"><div class="music-progress-bar"></div></div>
        </div>
        <div class="music-body">
          <h3 class="music-title">${esc(t.title)}</h3>
          <p class="music-artist"><i class="fas fa-user"></i> ${esc(t.artistName || 'Unknown')}</p>
          <p class="music-album">${esc(t.albumName || '')}</p>
          <div class="music-meta">
            <span><i class="fas fa-clock"></i> ${formatDuration(t.durationInMillis)}</span>
            <span><i class="fas fa-calendar"></i> ${formatDate(t.releaseDate)}</span>
          </div>
          <div class="music-tags">
            ${(t.genreNames || []).map(g => `<span class="music-tag">${esc(g)}</span>`).join('')}
          </div>
          <div class="music-actions">
            <a href="${esc(t.appleMusicUrl || '#')}" target="_blank" rel="noopener" class="music-link">
              <i class="fab fa-apple"></i> Apple Music
            </a>
            <button class="music-link" data-play="${i}">
              <i class="fas fa-play"></i> Preview
            </button>
          </div>
        </div>
      </article>
    `).join('');

    // ------------------------------------------------------------
    // Single shared audio element — guarantees only one plays
    // ------------------------------------------------------------
    const audio = new Audio();
    audio.preload = 'none';
    audio.volume = 0.75;

    let activeIndex = -1;

    function setIcon(btn, iconClass) {
      const icon = btn?.querySelector('i');
      if (icon) icon.className = `fas ${iconClass}`;
    }

    function updateAllIcons(playingIndex) {
      grid.querySelectorAll('[data-play]').forEach(btn => {
        const idx = +btn.dataset.play;
        setIcon(btn, idx === playingIndex ? 'fa-pause' : 'fa-play');
      });
      // Toggle 'playing' class on the cover for progress bar visibility
      grid.querySelectorAll('.music-cover').forEach((cover, i) => {
        cover.classList.toggle('playing', i === playingIndex);
      });
    }

    function resetProgress() {
      grid.querySelectorAll('.music-progress-bar').forEach(bar => {
        bar.style.width = '0%';
      });
    }

    function stopActive() {
      if (activeIndex === -1) return;
      audio.pause();
      activeIndex = -1;
      updateAllIcons(-1);
      resetProgress();
    }

    function playTrack(index) {
      const track = CFG.music.tracks[index];
      if (!track || !track.previewUrl) return;

      // Same track → toggle pause
      if (activeIndex === index && !audio.paused) {
        audio.pause();
        updateAllIcons(-1);
        activeIndex = -1;
        return;
      }

      // Different track → load and play
      stopActive();
      audio.src = track.previewUrl;
      activeIndex = index;

      audio.play()
        .then(() => {
          updateAllIcons(index);
        })
        .catch(err => {
          console.warn('Playback failed:', err);
          activeIndex = -1;
          updateAllIcons(-1);
        });
    }

    // Progress bar update
    audio.addEventListener('timeupdate', () => {
      if (activeIndex === -1) return;
      const cover = grid.querySelector(`.music-card[data-index="${activeIndex}"] .music-cover`);
      const bar = cover?.querySelector('.music-progress-bar');
      if (bar && audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        bar.style.width = `${pct}%`;
      }
    });

    audio.addEventListener('ended', () => {
      const prev = activeIndex;
      activeIndex = -1;
      updateAllIcons(-1);
      resetProgress();
    });

    audio.addEventListener('error', () => {
      console.warn('Audio error for track', activeIndex);
      activeIndex = -1;
      updateAllIcons(-1);
      resetProgress();
    });

    // Wire buttons
    grid.querySelectorAll('[data-play]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        playTrack(+btn.dataset.play);
      });
    });

    // Click cover also plays
    grid.querySelectorAll('.music-cover').forEach((cover, i) => {
      cover.addEventListener('click', (e) => {
        if (e.target.closest('.music-play')) return;
        playTrack(i);
      });
    });

    // Clean up when leaving page
    window.addEventListener('beforeunload', () => {
      audio.pause();
      audio.src = '';
    });

    // Pause when tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !audio.paused) {
        audio.pause();
        updateAllIcons(-1);
        activeIndex = -1;
      }
    });

    // Expose stop for other scripts
    window.stopMusic = stopActive;
  }

  // ------------------------------------------------------------
  // 5. Contact copy buttons
  // ------------------------------------------------------------
  function bindContactButtons() {
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
        } catch (err) {
          console.warn('Clipboard failed:', err);
        }
      });
    });
  }

  // ------------------------------------------------------------
  // 6. Init
  // ------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      CFG = await res.json();
    } catch (e) {
      console.error('Failed to load /api/config:', e);
      return;
    }

    applyBindings();
    renderHobbies();
    renderGallery();
    renderMusic();
    bindContactButtons();

    console.log('✓ Config loaded');
  });

  // Expose for debugging / other scripts
  window.getConfig = () => CFG;
})();