(function () {
  'use strict';

  const els = {
    photoInput: document.getElementById('photoInput'),
    uploadZone: document.getElementById('uploadZone'),
    bookTitle: document.getElementById('bookTitle'),
    bookAuthor: document.getElementById('bookAuthor'),
    minutesRead: document.getElementById('minutesRead'),
    pagesRead: document.getElementById('pagesRead'),
    streakDays: document.getElementById('streakDays'),
    booksYear: document.getElementById('booksYear'),
    quote: document.getElementById('quote'),
    stars: document.getElementById('stars'),
    formatSeg: document.getElementById('formatSeg'),
    themeSeg: document.getElementById('themeSeg'),
    layoutSeg: document.getElementById('layoutSeg'),
    canvas: document.getElementById('canvas'),
    previewShell: document.getElementById('previewShell'),
    downloadBtn: document.getElementById('downloadBtn'),
    shareBtn: document.getElementById('shareBtn'),
    shareHint: document.getElementById('shareHint'),
  };

  const state = {
    image: null,
    rating: 0,
    format: 'square',
    theme: 'dark',
    layout: 'bottom',
  };

  const THEMES = {
    dark: {
      cardBg: 'rgba(14, 15, 19, 0.78)',
      text: '#ffffff',
      muted: 'rgba(255,255,255,0.72)',
      accent: '#fc5200',
      starOn: '#ffc24a',
      starOff: 'rgba(255,255,255,0.3)',
      gradient: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)'],
    },
    light: {
      cardBg: 'rgba(255,255,255,0.88)',
      text: '#0e0f13',
      muted: 'rgba(14,15,19,0.65)',
      accent: '#fc5200',
      starOn: '#f5a524',
      starOff: 'rgba(14,15,19,0.18)',
      gradient: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)'],
    },
    ember: {
      cardBg: 'linear-gradient(135deg, rgba(252,82,0,0.92), rgba(180,30,30,0.92))',
      text: '#ffffff',
      muted: 'rgba(255,255,255,0.82)',
      accent: '#ffd166',
      starOn: '#ffd166',
      starOff: 'rgba(255,255,255,0.35)',
      gradient: ['rgba(0,0,0,0)', 'rgba(120,30,0,0.7)'],
    },
    forest: {
      cardBg: 'linear-gradient(135deg, rgba(20,80,60,0.92), rgba(10,40,30,0.92))',
      text: '#ffffff',
      muted: 'rgba(255,255,255,0.78)',
      accent: '#a7e8c1',
      starOn: '#ffd166',
      starOff: 'rgba(255,255,255,0.3)',
      gradient: ['rgba(0,0,0,0)', 'rgba(0,40,30,0.75)'],
    },
  };

  // --- Inputs --------------------------------------------------------------

  els.photoInput.addEventListener('change', handleFileChange);
  els.uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.uploadZone.classList.add('dragover');
  });
  els.uploadZone.addEventListener('dragleave', () =>
    els.uploadZone.classList.remove('dragover')
  );
  els.uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    els.uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) loadFile(file);
  });

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) loadFile(file);
  }

  function loadFile(file) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        state.image = img;
        els.previewShell.classList.add('has-image');
        render();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Re-render on any text/number input
  ['input', 'change'].forEach((evt) => {
    [
      els.bookTitle,
      els.bookAuthor,
      els.minutesRead,
      els.pagesRead,
      els.streakDays,
      els.booksYear,
      els.quote,
    ].forEach((el) => el.addEventListener(evt, render));
  });

  // Stars
  els.stars.addEventListener('click', (e) => {
    const btn = e.target.closest('.star');
    if (!btn) return;
    const v = Number(btn.dataset.value);
    state.rating = state.rating === v ? 0 : v;
    updateStars();
    render();
  });

  function updateStars() {
    Array.from(els.stars.children).forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.value) <= state.rating);
    });
  }

  // Segmented controls
  function wireSeg(container, key, onChange) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      Array.from(container.children).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state[key] = btn.dataset[key];
      if (onChange) onChange();
      render();
    });
  }

  wireSeg(els.formatSeg, 'format', () => {
    if (state.format === 'story') {
      els.canvas.width = 1080;
      els.canvas.height = 1920;
      els.previewShell.classList.add('story');
    } else {
      els.canvas.width = 1080;
      els.canvas.height = 1080;
      els.previewShell.classList.remove('story');
    }
  });
  wireSeg(els.themeSeg, 'theme');
  wireSeg(els.layoutSeg, 'layout');

  // --- Rendering -----------------------------------------------------------

  function render() {
    const ctx = els.canvas.getContext('2d');
    const W = els.canvas.width;
    const H = els.canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background
    if (state.image) {
      drawCover(ctx, state.image, 0, 0, W, H);
    } else {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#1a1c24');
      g.addColorStop(1, '#11131a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    const theme = THEMES[state.theme];

    // Vignette gradient over image to make text readable
    if (state.layout !== 'minimal') {
      const grad = ctx.createLinearGradient(
        0,
        state.layout === 'top' ? 0 : H * 0.4,
        0,
        state.layout === 'top' ? H * 0.6 : H
      );
      if (state.layout === 'top') {
        grad.addColorStop(0, theme.gradient[1]);
        grad.addColorStop(1, theme.gradient[0]);
      } else {
        grad.addColorStop(0, theme.gradient[0]);
        grad.addColorStop(1, theme.gradient[1]);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    if (state.layout === 'bottom') drawBottomCard(ctx, W, H, theme);
    else if (state.layout === 'top') drawTopBanner(ctx, W, H, theme);
    else drawMinimal(ctx, W, H, theme);

    drawWatermark(ctx, W, H, theme);
  }

  function drawCover(ctx, img, x, y, w, h) {
    const ir = img.width / img.height;
    const tr = w / h;
    let sx, sy, sw, sh;
    if (ir > tr) {
      sh = img.height;
      sw = img.height * tr;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = img.width / tr;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function fillCardBg(ctx, x, y, w, h, themeBg) {
    if (themeBg.startsWith('linear-gradient')) {
      const colors = themeBg.match(/rgba?\([^)]+\)/g);
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = themeBg;
    }
    roundRect(ctx, x, y, w, h, 28);
    ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBottomCard(ctx, W, H, theme) {
    const margin = 48;
    const cardH = state.format === 'story' ? 720 : 480;
    const x = margin;
    const y = H - cardH - margin;
    const w = W - margin * 2;
    fillCardBg(ctx, x, y, w, cardH, theme.cardBg);

    let cy = y + 56;
    const cx = x + 48;
    const innerW = w - 96;

    // Header chip
    ctx.fillStyle = theme.accent;
    ctx.font = '600 28px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    ctx.fillText('NOW READING', cx, cy);
    cy += 18;

    // Title
    cy += 30;
    ctx.fillStyle = theme.text;
    ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    cy = wrapText(ctx, getTitle(), cx, cy, innerW, 70, 2);

    // Author
    if (els.bookAuthor.value.trim()) {
      cy += 12;
      ctx.fillStyle = theme.muted;
      ctx.font = '400 36px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
      ctx.fillText('by ' + els.bookAuthor.value.trim(), cx, cy);
      cy += 16;
    }

    // Stars
    if (state.rating > 0) {
      cy += 40;
      drawStars(ctx, cx, cy, 44, state.rating, theme);
      cy += 12;
    }

    // Stat row
    cy += 50;
    drawStatRow(ctx, cx, cy, innerW, theme);

    // Quote
    const q = els.quote.value.trim();
    if (q) {
      cy += state.format === 'story' ? 180 : 140;
      ctx.fillStyle = theme.muted;
      ctx.font = 'italic 30px Georgia, serif';
      wrapText(ctx, '“' + q + '”', cx, cy, innerW, 40, 3);
    }
  }

  function drawTopBanner(ctx, W, H, theme) {
    const margin = 48;
    const bannerH = state.format === 'story' ? 520 : 360;
    fillCardBg(ctx, margin, margin, W - margin * 2, bannerH, theme.cardBg);

    const cx = margin + 48;
    let cy = margin + 80;
    const innerW = W - margin * 2 - 96;

    ctx.fillStyle = theme.accent;
    ctx.font = '600 26px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    ctx.fillText('READING SESSION', cx, cy);

    cy += 56;
    ctx.fillStyle = theme.text;
    ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    cy = wrapText(ctx, getTitle(), cx, cy, innerW, 60, 1);

    if (els.bookAuthor.value.trim()) {
      cy += 8;
      ctx.fillStyle = theme.muted;
      ctx.font = '400 30px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
      ctx.fillText('by ' + els.bookAuthor.value.trim(), cx, cy);
    }

    if (state.rating > 0) {
      cy += 50;
      drawStars(ctx, cx, cy, 38, state.rating, theme);
    }

    // Bottom stat strip
    const stripH = 200;
    const stripY = H - stripH - margin;
    fillCardBg(ctx, margin, stripY, W - margin * 2, stripH, theme.cardBg);
    drawStatRow(ctx, margin + 48, stripY + 80, W - margin * 2 - 96, theme);
  }

  function drawMinimal(ctx, W, H, theme) {
    // Small floating ribbon at bottom-left
    const margin = 48;
    const padX = 32;
    const padY = 22;

    const lines = [];
    if (getTitle()) lines.push({ text: getTitle(), size: 40, weight: 'bold' });
    const stats = buildStatLine();
    if (stats) lines.push({ text: stats, size: 26, weight: '500', muted: true });

    if (lines.length === 0) return;

    ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    let maxW = 0;
    lines.forEach((l) => {
      ctx.font = `${l.weight} ${l.size}px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`;
      maxW = Math.max(maxW, ctx.measureText(l.text).width);
    });

    const ribbonW = Math.min(W - margin * 2, maxW + padX * 2);
    const ribbonH = padY * 2 + lines.reduce((s, l) => s + l.size + 8, 0) + (state.rating > 0 ? 50 : 0);
    const x = margin;
    const y = H - ribbonH - margin;

    fillCardBg(ctx, x, y, ribbonW, ribbonH, theme.cardBg);

    let cy = y + padY + lines[0].size;
    lines.forEach((l) => {
      ctx.fillStyle = l.muted ? theme.muted : theme.text;
      ctx.font = `${l.weight} ${l.size}px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`;
      ctx.fillText(l.text, x + padX, cy);
      cy += l.size + 8;
    });

    if (state.rating > 0) {
      drawStars(ctx, x + padX, cy + 6, 30, state.rating, theme);
    }
  }

  function drawStatRow(ctx, x, y, w, theme) {
    const stats = [];
    if (els.minutesRead.value) stats.push({ value: els.minutesRead.value, label: 'minutes' });
    if (els.pagesRead.value) stats.push({ value: els.pagesRead.value, label: 'pages' });
    if (els.streakDays.value) stats.push({ value: els.streakDays.value + '🔥', label: 'day streak' });
    if (els.booksYear.value) stats.push({ value: els.booksYear.value, label: 'books / yr' });

    if (stats.length === 0) return;

    const colW = w / stats.length;
    stats.forEach((s, i) => {
      const cx = x + colW * i;
      ctx.fillStyle = theme.text;
      ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
      ctx.fillText(s.value, cx, y);

      ctx.fillStyle = theme.muted;
      ctx.font = '500 24px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
      ctx.fillText(s.label.toUpperCase(), cx, y + 36);
    });
  }

  function drawStars(ctx, x, y, size, rating, theme) {
    ctx.font = `${size}px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < rating ? theme.starOn : theme.starOff;
      ctx.fillText('★', x + i * (size + 6), y);
    }
  }

  function drawWatermark(ctx, W, H, theme) {
    ctx.fillStyle = theme.muted;
    ctx.font = '600 22px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    const text = '📚 BookTrack';
    const m = ctx.measureText(text);
    ctx.fillText(text, W - m.width - 36, H - 36);
  }

  function wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
    if (!text) return y;
    const words = text.split(' ');
    let line = '';
    let lineNum = 0;
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        if (lineNum + 1 >= maxLines) {
          let rest = line;
          while (ctx.measureText(rest + '…').width > maxW && rest.length > 0) {
            rest = rest.slice(0, -1);
          }
          ctx.fillText(rest + '…', x, y);
          return y;
        }
        ctx.fillText(line, x, y);
        y += lineH;
        lineNum++;
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) {
      let final = line;
      if (ctx.measureText(final).width > maxW) {
        while (ctx.measureText(final + '…').width > maxW && final.length > 0) {
          final = final.slice(0, -1);
        }
        ctx.fillText(final + '…', x, y);
      } else {
        ctx.fillText(final, x, y);
      }
    }
    return y;
  }

  function getTitle() {
    return els.bookTitle.value.trim() || 'Untitled book';
  }

  function buildStatLine() {
    const parts = [];
    if (els.minutesRead.value) parts.push(els.minutesRead.value + ' min');
    if (els.pagesRead.value) parts.push(els.pagesRead.value + ' pp');
    if (els.streakDays.value) parts.push(els.streakDays.value + 'd streak');
    return parts.join(' · ');
  }

  // --- Export / Share ------------------------------------------------------

  function getExportBlob() {
    return new Promise((resolve) => {
      els.canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
  }

  function makeFilename() {
    const slug = (els.bookTitle.value || 'reading')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    return `booktrack-${slug || 'reading'}.jpg`;
  }

  els.downloadBtn.addEventListener('click', async () => {
    const blob = await getExportBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = makeFilename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  els.shareBtn.addEventListener('click', async () => {
    const blob = await getExportBlob();
    const file = new File([blob], makeFilename(), { type: 'image/jpeg' });

    // Web Share API (Level 2) — works on iOS/Android, lets user pick Instagram
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My reading session',
          text: buildShareText(),
        });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    // Fallback: copy caption + download image
    const caption = buildShareText();
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(caption);
        els.shareHint.textContent =
          'Caption copied to clipboard. Image downloaded — open Instagram and paste!';
      } catch (_) {
        els.shareHint.textContent = 'Image downloaded. Open Instagram to upload.';
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = makeFilename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  function buildShareText() {
    const parts = [];
    const title = els.bookTitle.value.trim();
    const author = els.bookAuthor.value.trim();
    if (title) parts.push('📖 ' + title + (author ? ' — ' + author : ''));
    const stats = buildStatLine();
    if (stats) parts.push(stats);
    if (state.rating) parts.push('★'.repeat(state.rating));
    parts.push('#booktrack #bookstagram #amreading');
    return parts.join('\n');
  }

  // Initial render
  render();
})();
