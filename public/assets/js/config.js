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
    // Text / src / href / value based on tag name
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
  // 4. Music — cards + single shared audio player (FIXED)
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
    // Shared audio element (FIXED: preload=auto, crossOrigin, load())
    // ------------------------------------------------------------
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = 0.85;
    audio.crossOrigin = 'anonymous';

    let activeIndex = -1;
    let playToken = 0; // guards against race conditions

    function setIcon(btn, iconClass) {
      const icon = btn?.querySelector('i');
      if (icon) icon.className = `fas ${iconClass}`;
    }

    function updateAllIcons(playingIndex) {
      grid.querySelectorAll('[data-play]').forEach(btn => {
        const idx = +btn.dataset.play;
        setIcon(btn, idx === playingIndex ? 'fa-pause' : 'fa-play');
      });
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
      try { audio.pause(); } catch {}
      activeIndex = -1;
      updateAllIcons(-1);
      resetProgress();
    }

    // ------------------------------------------------------------
    // Robust play: load(), wait for canplay, then play()
    // ------------------------------------------------------------
    function playTrack(index) {
      const track = CFG.music.tracks[index];
      if (!track || !track.previewUrl) {
        console.warn('No preview URL for track', index);
        return;
      }

      // Toggle pause on same track
      if (activeIndex === index && !audio.paused) {
        audio.pause();
        activeIndex = -1;
        updateAllIcons(-1);
        return;
      }

      // Stop previous
      stopActive();

      // Guard against late events from earlier attempts
      const token = ++playToken;
      activeIndex = index;

      // Point audio to new source and force load
      audio.src = track.previewUrl;
      audio.load();

      // Show the "playing" state optimistically
      updateAllIcons(index);

      let started = false;

      function attemptPlay() {
        if (started || token !== playToken) return;
        started = true;

        const p = audio.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            if (token === playToken) updateAllIcons(index);
          }).catch(err => {
            console.warn('play() rejected:', err);
            if (token === playToken) {
              activeIndex = -1;
              updateAllIcons(-1);
              resetProgress();
            }
          });
        }
      }

      // Prefer canplay, but fall back after 1.5s if event never fires
      audio.addEventListener('canplay', attemptPlay, { once: true });
      setTimeout(() => {
        if (!started && token === playToken) attemptPlay();
      }, 1500);
    }

    // Progress bar
    audio.addEventListener('timeupdate', () => {
      if (activeIndex === -1) return;
      const card = grid.querySelector(`.music-card[data-index="${activeIndex}"]`);
      const bar = card?.querySelector('.music-progress-bar');
      if (bar && audio.duration && isFinite(audio.duration)) {
        const pct = (audio.currentTime / audio.duration) * 100;
        bar.style.width = `${pct}%`;
      }
    });

    audio.addEventListener('ended', () => {
      activeIndex = -1;
      updateAllIcons(-1);
      resetProgress();
    });

    audio.addEventListener('error', () => {
      console.warn('Audio error for track', activeIndex, audio.error);
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
      try { audio.pause(); audio.src = ''; } catch {}
    });

    // Pause on tab switch
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !audio.paused) {
        audio.pause();
        activeIndex = -1;
        updateAllIcons(-1);
      }
    });

    // Debug helper — call debugAudio() in console
    window.debugAudio = () => ({
      src: audio.src,
      paused: audio.paused,
      duration: audio.duration,
      currentTime: audio.currentTime,
      readyState: audio.readyState,
      error: audio.error,
      activeIndex,
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