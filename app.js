(() => {
  'use strict';

  const slides = Array.from(document.querySelectorAll('.slide'));
  const dockPillsEl = document.getElementById('dockPills');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const slideCounterEl = document.getElementById('slideCounter');
  const hikingCounterEl = document.getElementById('hikingCounter');
  const deckStage = document.getElementById('deckStage');

  // Lightbox elements
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');

  // Google Maps Key Modal elements
  const gmapsModal = document.getElementById('gmapsModal');
  const gmapsModalBackdrop = document.getElementById('gmapsModalBackdrop');
  const openGmapsModalBtn = document.getElementById('openGmapsModalBtn');
  const closeGmapsModalBtn = document.getElementById('closeGmapsModalBtn');
  const saveGmapsKeyBtn = document.getElementById('saveGmapsKeyBtn');
  const clearGmapsKeyBtn = document.getElementById('clearGmapsKeyBtn');
  const gmapsKeyInput = document.getElementById('gmapsKeyInput');
  const mapEngineDot = document.getElementById('mapEngineDot');
  const mapEngineLabel = document.getElementById('mapEngineLabel');

  // Verified real-world locations (official mskh.am addresses & OpenStreetMap)
  const LOCATIONS = {
    main: {
      name: 'Main School (7–12)',
      address: '25 Arno Babajanyan St',
      lat: 40.169328,
      lng: 44.439566,
      variant: 'eco-pin-main eco-pin-above'
    },
    schools: [
      {
        name: 'North School (1–6)',
        address: '69/1 Raffi St',
        lat: 40.172692,
        lng: 44.441280,
        variant: 'eco-pin-above'
      },
      {
        name: 'West School (1–6)',
        address: '38/1 Babajanyan St',
        lat: 40.170473,
        lng: 44.433947,
        variant: 'eco-pin-left'
      },
      {
        name: 'East School (1–6)',
        address: '124 Andranik / 47/1 Babajanyan',
        lat: 40.168450,
        lng: 44.443750,
        variant: 'eco-pin-below'
      },
      {
        name: 'South School (1–6)',
        address: '52/6 Admiral Isakov Ave',
        lat: 40.160853,
        lng: 44.436179,
        variant: ''
      },
      {
        name: 'College',
        address: '92/1 Zoravar Andranik St',
        lat: 40.171200,
        lng: 44.445500,
        variant: 'eco-pin-college eco-pin-above'
      }
    ],
    camps: [
      {
        name: 'Artanish Camp',
        address: 'Lake Sevan Peninsula',
        lat: 40.497681,
        lng: 45.363639,
        variant: 'eco-pin-camp'
      },
      {
        name: 'Arates Camp',
        address: 'Vayots Dzor Highlands',
        lat: 39.904759,
        lng: 45.439948,
        variant: 'eco-pin-camp'
      }
    ]
  };

  const CAMERAS = {
    step0: { lat: 40.1694, lng: 44.4396, zoom: 15.3 },
    step1: { lat: 40.1672, lng: 44.4398, zoom: 14.9 },
    step2: { lat: 40.2150, lng: 44.9600, zoom: 8.6 }
  };

  const slideLabels = ['Intro', 'Ecosystem', 'Synergy', 'Research', 'Adventures'];

  let currentSlide = 0;
  let currentStep = 0;
  let hikingAnimFrame = null;

  // =====================================================================
  // SLIDE 2 REAL MAP ENGINE (Google Maps JS API + Standalone Leaflet Fallback)
  // =====================================================================
  const mapEl = document.getElementById('ecosystemMap');
  let activeMapMode = null; // 'google' | 'leaflet'
  let mapReady = false;
  let pendingStep = 0;

  // Google Maps state
  let gMap = null;
  let gMarkersMain = [];
  let gMarkersCampus = [];
  let gMarkersCamps = [];
  let gLinesCampus = [];
  let gLinesCamps = [];
  let gCamAnim = null;

  // Leaflet state
  let lMap = null;
  let lGroupMain = null;
  let lGroupCampus = null;
  let lGroupCamps = null;

  function createPinElement(label, variantClass = '') {
    const div = document.createElement('div');
    div.className = `eco-pin ${variantClass}`.trim();
    const dot = document.createElement('span');
    dot.className = 'eco-pin-dot';
    const text = document.createElement('span');
    text.textContent = label;
    div.appendChild(dot);
    div.appendChild(text);
    return div;
  }

  function getConfiguredGoogleMapsKey() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('gmapsKey') || params.get('key');
    if (fromUrl) {
      localStorage.setItem('sebastatsi_gmaps_key', fromUrl.trim());
      return fromUrl.trim();
    }
    return (localStorage.getItem('sebastatsi_gmaps_key') || '').trim();
  }

  // Official Maps JS API dynamic bootstrap loader
  function loadGoogleMapsBootstrap(apiKey) {
    if (window.google?.maps?.importLibrary) return Promise.resolve();
    return new Promise((resolve, reject) => {
      ((g) => {
        let h, a, k;
        const p = 'The Google Maps JavaScript API';
        const c = 'google';
        const l = 'importLibrary';
        const q = '__ib__';
        const m = document;
        const b = window;
        b[c] = b[c] || {};
        const d = (b[c].maps = b[c].maps || {});
        const r = new Set();
        const e = new URLSearchParams();
        const u = () =>
          h ||
          (h = new Promise(async (f, n) => {
            a = m.createElement('script');
            e.set('libraries', [...r] + '');
            for (k in g) {
              e.set(k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()), g[k]);
            }
            e.set('callback', c + '.maps.' + q);
            a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
            d[q] = f;
            a.onerror = () => (h = n(Error(p + ' could not load.')));
            a.nonce = m.querySelector('script[nonce]')?.nonce || '';
            m.head.append(a);
          }));
        d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n));
      })({
        key: apiKey,
        v: 'weekly',
        language: 'en',
        region: 'AM'
      });
      resolve();
    });
  }

  async function initGoogleMaps(apiKey) {
    try {
      await loadGoogleMapsBootstrap(apiKey);
      const { Map, Polyline } = await google.maps.importLibrary('maps');
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');

      mapEl.innerHTML = '';
      gMap = new Map(mapEl, {
        center: { lat: CAMERAS.step0.lat, lng: CAMERAS.step0.lng },
        zoom: CAMERAS.step0.zoom,
        mapId: 'DEMO_MAP_ID',
        disableDefaultUI: true,
        gestureHandling: 'cooperative',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1']
      });

      const makeGMarker = (loc) => {
        const marker = new AdvancedMarkerElement({
          map: null,
          position: { lat: loc.lat, lng: loc.lng },
          title: `${loc.name} — ${loc.address}`
        });
        marker.append(createPinElement(loc.name, loc.variant));
        return marker;
      };

      gMarkersMain = [makeGMarker(LOCATIONS.main)];
      gMarkersCampus = LOCATIONS.schools.map(makeGMarker);
      gMarkersCamps = LOCATIONS.camps.map(makeGMarker);

      gLinesCampus = LOCATIONS.schools.map(
        (loc) =>
          new Polyline({
            map: null,
            path: [
              { lat: LOCATIONS.main.lat, lng: LOCATIONS.main.lng },
              { lat: loc.lat, lng: loc.lng }
            ],
            strokeColor: '#3b694c',
            strokeOpacity: 0.72,
            strokeWeight: 2.2
          })
      );

      gLinesCamps = LOCATIONS.camps.map(
        (loc) =>
          new Polyline({
            map: null,
            path: [
              { lat: LOCATIONS.main.lat, lng: LOCATIONS.main.lng },
              { lat: loc.lat, lng: loc.lng }
            ],
            strokeColor: '#6e3a24',
            strokeOpacity: 0.85,
            strokeWeight: 2.6
          })
      );

      activeMapMode = 'google';
      mapReady = true;
      mapEngineDot?.classList.add('gmaps-live');
      if (mapEngineLabel) mapEngineLabel.textContent = 'Google Maps Active';
      syncMapStep(pendingStep, false);
    } catch (err) {
      console.warn('Google Maps initialization fallback:', err);
      initLeafletFallback();
    }
  }

  function animateGoogleCamera(target, durationMs = 950) {
    if (!gMap) return;
    if (gCamAnim) cancelAnimationFrame(gCamAnim);
    const startCenter = gMap.getCenter();
    const startZoom = gMap.getZoom() ?? target.zoom;
    if (!startCenter) {
      gMap.moveCamera({ center: { lat: target.lat, lng: target.lng }, zoom: target.zoom });
      return;
    }
    const sLat = startCenter.lat();
    const sLng = startCenter.lng();
    const start = performance.now();

    const frame = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      gMap.moveCamera({
        center: {
          lat: sLat + (target.lat - sLat) * ease,
          lng: sLng + (target.lng - sLng) * ease
        },
        zoom: startZoom + (target.zoom - startZoom) * ease
      });
      if (t < 1) {
        gCamAnim = requestAnimationFrame(frame);
      }
    };
    gCamAnim = requestAnimationFrame(frame);
  }

  function initLeafletFallback() {
    if (!window.L || !mapEl) return;
    mapEl.innerHTML = '';
    lMap = L.map(mapEl, {
      center: [CAMERAS.step0.lat, CAMERAS.step0.lng],
      zoom: CAMERAS.step0.zoom,
      zoomSnap: 0.1,
      zoomControl: false,
      scrollWheelZoom: false
    });

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; OpenStreetMap contributors',
        maxNativeZoom: 15,
        maxZoom: 18
      }
    ).addTo(lMap);

    const makeLMarker = (loc) => {
      const icon = L.divIcon({
        className: '',
        html: createPinElement(loc.name, loc.variant).outerHTML,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
      return L.marker([loc.lat, loc.lng], { icon });
    };

    lGroupMain = L.layerGroup([makeLMarker(LOCATIONS.main)]);
    lGroupCampus = L.layerGroup([
      ...LOCATIONS.schools.map((loc) =>
        L.polyline(
          [
            [LOCATIONS.main.lat, LOCATIONS.main.lng],
            [loc.lat, loc.lng]
          ],
          { color: '#3b694c', weight: 2.2, dashArray: '5 6', opacity: 0.78 }
        )
      ),
      ...LOCATIONS.schools.map(makeLMarker)
    ]);

    // Curved quadratic arc generator for Armenia camp routes
    const makeCurve = (from, to, bend = 0.08) => {
      const pts = [];
      const midLat = (from.lat + to.lat) / 2 + bend;
      const midLng = (from.lng + to.lng) / 2;
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const lat = (1 - t) * (1 - t) * from.lat + 2 * (1 - t) * t * midLat + t * t * to.lat;
        const lng = (1 - t) * (1 - t) * from.lng + 2 * (1 - t) * t * midLng + t * t * to.lng;
        pts.push([lat, lng]);
      }
      return pts;
    };

    lGroupCamps = L.layerGroup([
      L.polyline(makeCurve(LOCATIONS.main, LOCATIONS.camps[0], 0.09), {
        color: '#6e3a24',
        weight: 2.8,
        dashArray: '6 6',
        opacity: 0.88
      }),
      L.polyline(makeCurve(LOCATIONS.main, LOCATIONS.camps[1], -0.07), {
        color: '#6e3a24',
        weight: 2.8,
        dashArray: '6 6',
        opacity: 0.88
      }),
      ...LOCATIONS.camps.map(makeLMarker)
    ]);

    activeMapMode = 'leaflet';
    mapReady = true;
    syncMapStep(pendingStep, false);
  }

  function ensureMapInitialized() {
    if (mapReady) return;
    const key = getConfiguredGoogleMapsKey();
    if (key) {
      initGoogleMaps(key);
    } else {
      initLeafletFallback();
    }
  }

  function syncMapStep(step, animate = true) {
    pendingStep = step;
    if (!mapReady) return;

    const cam = step === 0 ? CAMERAS.step0 : step === 1 ? CAMERAS.step1 : CAMERAS.step2;

    if (activeMapMode === 'google' && gMap) {
      gMarkersMain.forEach((m) => (m.map = gMap));
      gMarkersCampus.forEach((m) => (m.map = step === 1 ? gMap : null));
      gLinesCampus.forEach((l) => l.setMap(step === 1 ? gMap : null));
      gMarkersCamps.forEach((m) => (m.map = step === 2 ? gMap : null));
      gLinesCamps.forEach((l) => l.setMap(step === 2 ? gMap : null));

      if (animate) {
        animateGoogleCamera(cam, step === 2 ? 1200 : 750);
      } else {
        gMap.moveCamera({ center: { lat: cam.lat, lng: cam.lng }, zoom: cam.zoom });
      }
      return;
    }

    if (activeMapMode === 'leaflet' && lMap) {
      if (!lMap.hasLayer(lGroupMain)) lGroupMain.addTo(lMap);

      if (step === 1) {
        if (!lMap.hasLayer(lGroupCampus)) lGroupCampus.addTo(lMap);
      } else {
        if (lMap.hasLayer(lGroupCampus)) lMap.removeLayer(lGroupCampus);
      }

      if (step === 2) {
        if (!lMap.hasLayer(lGroupCamps)) lGroupCamps.addTo(lMap);
      } else {
        if (lMap.hasLayer(lGroupCamps)) lMap.removeLayer(lGroupCamps);
      }

      if (animate) {
        lMap.flyTo([cam.lat, cam.lng], cam.zoom, {
          duration: step === 2 ? 1.35 : 0.85,
          easeLinearity: 0.25
        });
      } else {
        lMap.setView([cam.lat, cam.lng], cam.zoom, { animate: false });
      }
    }
  }

  // =====================================================================
  // SLIDE & CLICKER ENGINE
  // =====================================================================
  function getMaxStep(slideIdx) {
    return parseInt(slides[slideIdx].dataset.maxStep || '0', 10);
  }

  function animateNumber(el, from, to, durationMs = 780) {
    if (!el) return;
    if (hikingAnimFrame) cancelAnimationFrame(hikingAnimFrame);
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (t < 1) {
        hikingAnimFrame = requestAnimationFrame(tick);
      } else {
        el.textContent = String(to);
      }
    };
    hikingAnimFrame = requestAnimationFrame(tick);
  }

  function buildDockPills() {
    dockPillsEl.innerHTML = '';
    slides.forEach((_, idx) => {
      const maxStep = getMaxStep(idx);
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'dock-slide-pill';
      pill.title = `Slide ${idx + 1}: ${slideLabels[idx]}`;

      const numSpan = document.createElement('span');
      numSpan.textContent = `0${idx + 1}`;
      pill.appendChild(numSpan);

      if (maxStep > 0) {
        const dotsWrap = document.createElement('span');
        dotsWrap.className = 'beat-dots';
        for (let s = 0; s <= maxStep; s++) {
          const dot = document.createElement('span');
          dot.className = 'beat-dot';
          dotsWrap.appendChild(dot);
        }
        pill.appendChild(dotsWrap);
      }

      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        goTo(idx, 0);
      });
      dockPillsEl.appendChild(pill);
    });
  }

  function updateSlideSpecificUI(prevSlideIdx, prevStepIdx) {
    // Slide 2: Initialize / resize & sync real map
    if (currentSlide === 1) {
      ensureMapInitialized();
      setTimeout(() => {
        if (activeMapMode === 'leaflet' && lMap) lMap.invalidateSize();
        syncMapStep(currentStep, prevSlideIdx === 1);
      }, 120);
    }

    // Slide 5: Re-trigger Armenia arrows & animate 40 km counter
    if (currentSlide === 4 && (prevSlideIdx !== 4 || (prevStepIdx === 0 && currentStep === 1))) {
      animateNumber(hikingCounterEl, 0, 40, 850);
    }

    if (currentSlide === 4 && prevSlideIdx !== 4) {
      slides[4].querySelectorAll('.exp-ray').forEach((ray) => {
        ray.style.animation = 'none';
        void ray.getBoundingClientRect();
        ray.style.animation = '';
      });
    }
  }

  function render(prevSlideIdx = currentSlide, prevStepIdx = currentStep) {
    slides.forEach((slide, idx) => {
      slide.classList.remove('active', 'prev-out');
      if (idx === currentSlide) {
        slide.classList.add('active');
        slide.dataset.step = String(currentStep);
      } else if (idx < currentSlide) {
        slide.classList.add('prev-out');
      }
    });

    const currentNumEl = slideCounterEl.querySelector('.counter-current');
    if (currentNumEl) currentNumEl.textContent = `0${currentSlide + 1}`;

    dockPillsEl.querySelectorAll('.dock-slide-pill').forEach((pill, idx) => {
      const isActive = idx === currentSlide;
      pill.classList.toggle('active', isActive);
      pill.querySelectorAll('.beat-dot').forEach((dot, dIdx) => {
        dot.classList.toggle('filled', isActive ? dIdx <= currentStep : idx < currentSlide);
      });
    });

    updateSlideSpecificUI(prevSlideIdx, prevStepIdx);
  }

  function goTo(slideIdx, stepIdx = 0) {
    const clampedSlide = Math.max(0, Math.min(slides.length - 1, slideIdx));
    const clampedStep = Math.max(0, Math.min(getMaxStep(clampedSlide), stepIdx));
    const prevS = currentSlide;
    const prevSt = currentStep;
    currentSlide = clampedSlide;
    currentStep = clampedStep;
    render(prevS, prevSt);
  }

  function next() {
    if (isModalOpen()) return;
    if (isLightboxOpen()) {
      closeLightbox();
      return;
    }
    if (currentStep < getMaxStep(currentSlide)) {
      goTo(currentSlide, currentStep + 1);
    } else if (currentSlide < slides.length - 1) {
      goTo(currentSlide + 1, 0);
    }
  }

  function prev() {
    if (isModalOpen()) return;
    if (isLightboxOpen()) {
      closeLightbox();
      return;
    }
    if (currentStep > 0) {
      goTo(currentSlide, currentStep - 1);
    } else if (currentSlide > 0) {
      goTo(currentSlide - 1, getMaxStep(currentSlide - 1));
    }
  }

  // Lightbox
  function isLightboxOpen() {
    return lightbox.classList.contains('open');
  }
  function openLightbox(src, caption) {
    lightboxImg.src = src;
    lightboxImg.alt = caption || '';
    lightboxCaption.textContent = caption || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('[data-lightbox-src]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(el.dataset.lightboxSrc, el.dataset.lightboxCaption);
    });
  });
  lightboxClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLightbox();
  });
  lightboxBackdrop.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLightbox();
  });

  // Google Maps Key Modal
  function isModalOpen() {
    return gmapsModal.classList.contains('open');
  }
  function openGmapsModal() {
    gmapsKeyInput.value = getConfiguredGoogleMapsKey();
    gmapsModal.classList.add('open');
    gmapsModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => gmapsKeyInput.focus(), 50);
  }
  function closeGmapsModal() {
    gmapsModal.classList.remove('open');
    gmapsModal.setAttribute('aria-hidden', 'true');
  }

  openGmapsModalBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    openGmapsModal();
  });
  closeGmapsModalBtn?.addEventListener('click', closeGmapsModal);
  gmapsModalBackdrop?.addEventListener('click', closeGmapsModal);

  saveGmapsKeyBtn?.addEventListener('click', () => {
    const val = gmapsKeyInput.value.trim();
    if (val) {
      localStorage.setItem('sebastatsi_gmaps_key', val);
      closeGmapsModal();
      window.location.reload();
    }
  });

  clearGmapsKeyBtn?.addEventListener('click', () => {
    localStorage.removeItem('sebastatsi_gmaps_key');
    closeGmapsModal();
    window.location.reload();
  });

  // Direct spotlight clicks on Slide 3
  document.querySelector('.block-craft')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentSlide === 2) goTo(2, 1);
  });
  document.querySelector('.block-tech')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentSlide === 2) goTo(2, 2);
  });
  document.querySelector('.story-takeaway')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentSlide === 2) goTo(2, 3);
  });

  // Fullscreen & Dock Buttons
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  fullscreenBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFullscreen();
  });
  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    prev();
  });
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    next();
  });

  // Clicker & Keyboard Navigation
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (isModalOpen()) {
      if (e.code === 'Escape') closeGmapsModal();
      return;
    }

    switch (e.code) {
      case 'ArrowRight':
      case 'PageDown':
      case 'Space':
      case 'Enter':
      case 'ArrowDown':
      case 'KeyN':
        e.preventDefault();
        next();
        break;
      case 'ArrowLeft':
      case 'PageUp':
      case 'ArrowUp':
      case 'Backspace':
      case 'KeyP':
        e.preventDefault();
        prev();
        break;
      case 'KeyF':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'KeyR':
        e.preventDefault();
        goTo(currentSlide, 0);
        break;
      case 'Escape':
        if (isLightboxOpen()) {
          e.preventDefault();
          closeLightbox();
        }
        break;
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5': {
        const idx = parseInt(e.code.replace('Digit', ''), 10) - 1;
        if (idx >= 0 && idx < slides.length) {
          e.preventDefault();
          goTo(idx, 0);
        }
        break;
      }
      default:
        break;
    }
  });

  // Click open background to advance (ignore interactive map & controls!)
  deckStage.addEventListener('click', (e) => {
    if (
      e.target.closest(
        'button, a, input, [data-lightbox-src], .map-stage-card, .story-block, .story-takeaway'
      )
    ) {
      return;
    }
    next();
  });

  // Touch swipe
  let touchStartX = 0;
  let touchStartY = 0;
  deckStage.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1 || e.target.closest('.map-stage-card')) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );
  deckStage.addEventListener(
    'touchend',
    (e) => {
      if (!e.changedTouches.length || e.target.closest('.map-stage-card')) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next();
        else prev();
      }
    },
    { passive: true }
  );

  // Initialize
  buildDockPills();
  render(0, 0);
})();
