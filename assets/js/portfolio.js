// ── Mobile menu ────────────────────────────────────────────────
function initMobileMenu() {
  const hamburger = requireEl('nav-hamburger');
  const mobileMenu = requireEl('mobile-menu');

  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });

  // Close mobile menu on link click
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
}

// ── Terminal typewriter ────────────────────────────────────────
const lines = [
  { type: 'prompt', text: 'envr@thinkpad:~$' },
  { type: 'cmd',   text: 'whoami' },
  { type: 'out',   text: 'enver-avisena' },
  { type: 'prompt', text: '~/envr@thinkpad:$' },
  { type: 'cmd',   text: 'cat about.txt' },
  { type: 'out',   text: 'Developer · Tinkerer · Writer' },
  { type: 'out',   text: 'Obsessed with clean systems.' },
  { type: 'prompt', text: '~/envr@thinkpad:$' },
  { type: 'cmd',   text: 'ls projects/' },
  { type: 'accent', text: 'project-one/   project-two/   project-three/' },
  { type: 'prompt', text: '~/envr@thinkpad:$' },
  { type: 'cmd',   text: 'echo "Open to work ✓"' },
  { type: 'out',   text: 'Open to work ✓' },
  { type: 'prompt', text: '~/envr@thinkpad:$' },
];

function initTerminal() {
  const terminalEl = requireEl('terminal-body');

  let lineIdx = 0;
  let charIdx = 0;
  let outputHTML = '';

  // Errors thrown inside a timer callback are invisible to the caller, so the
  // animation reports them itself and then stops instead of retrying forever.
  function schedule(delay) {
    setTimeout(() => {
      try {
        nextChar();
      } catch (err) {
        reportError('portfolio: terminal animation', err);
      }
    }, delay);
  }

  function nextChar() {
    if (lineIdx >= lines.length) {
      // add blinking cursor at end
      outputHTML += '<span class="t-cursor"></span>';
      terminalEl.innerHTML = outputHTML;
      return;
    }

    const line = lines[lineIdx];

    if (charIdx === 0 && line.type === 'prompt') {
      outputHTML += `<span class="t-prompt">❯ </span><span class="t-out" style="color:var(--muted)">${line.text} </span>`;
      lineIdx++;
      charIdx = 0;
      terminalEl.innerHTML = outputHTML;
      schedule(60);
      return;
    }

    const text = line.text;
    const colorClass = line.type === 'cmd' ? 't-cmd' : line.type === 'accent' ? 't-accent' : 't-out';

    if (charIdx < text.length) {
      if (charIdx === 0) outputHTML += `<span class="${colorClass}">`;
      outputHTML += text[charIdx];
      charIdx++;
      terminalEl.innerHTML = outputHTML + '</span><span class="t-cursor"></span>';
      schedule(line.type === 'cmd' ? 55 : 18);
    } else {
      outputHTML += '</span>\n';
      lineIdx++;
      charIdx = 0;
      terminalEl.innerHTML = outputHTML;
      schedule(lineIdx % 2 === 0 ? 350 : 80);
    }
  }

  // Start terminal after short delay
  schedule(800);
}

// ── Counter animation ──────────────────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  if (!Number.isFinite(target)) {
    throw new Error(`Counter element is missing a numeric data-target (got "${el.dataset.target}")`);
  }
  const duration = 1600;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  }

  requestAnimationFrame(tick);
}

// ── Scroll reveal ──────────────────────────────────────────────
function initScrollReveal() {
  const revealEls = document.querySelectorAll(
    '.pf-skill-card, .pf-project-card, .pf-cert-card, .pf-contact-card, .pf-stat, .pf-about-text, .pf-stats-grid'
  );

  revealEls.forEach(el => el.classList.add('pf-reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => observer.observe(el));
}

// ── Counters ───────────────────────────────────────────────────
function initCounters() {
  const counterEls = document.querySelectorAll('.pf-stat-num');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        counterObserver.unobserve(entry.target);
        // One bad counter must not stop the others from animating.
        safeInit('portfolio: counter animation', () => animateCounter(entry.target));
      }
    });
  }, { threshold: 0.5 });

  counterEls.forEach(el => counterObserver.observe(el));
}

// ── Active nav link on scroll ──────────────────────────────────
function initActiveNav() {
  const sections = document.querySelectorAll('section[id], div[id="blog"]');
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === '#' + entry.target.id) {
            link.style.color = 'var(--accent)';
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));
}

safeInit('portfolio: mobile menu', initMobileMenu);
safeInit('portfolio: terminal', initTerminal);
safeInit('portfolio: scroll reveal', initScrollReveal);
safeInit('portfolio: counters', initCounters);
safeInit('portfolio: active nav', initActiveNav);
