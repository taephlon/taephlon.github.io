// ── Mobile menu ────────────────────────────────────────────────
const hamburger = document.getElementById('nav-hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

// Close mobile menu on link click
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// ── Terminal typewriter ────────────────────────────────────────
const terminalEl = document.getElementById('terminal-body');

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

let lineIdx = 0;
let charIdx = 0;
let currentEl = null;
let outputHTML = '';

function nextChar() {
  if (lineIdx >= lines.length) {
    // add blinking cursor at end
    outputHTML += '<span class="t-cursor"></span>';
    terminalEl.innerHTML = outputHTML;
    return;
  }

  const line = lines[lineIdx];

  if (charIdx === 0) {
    // Start new line
    if (line.type === 'prompt') {
      outputHTML += `<span class="t-prompt">❯ </span><span class="t-out" style="color:var(--muted)">${line.text} </span>`;
      lineIdx++;
      charIdx = 0;
      terminalEl.innerHTML = outputHTML;
      setTimeout(nextChar, 60);
      return;
    }
  }

  const text = line.type === 'prompt' ? line.text : line.text;
  const colorClass = line.type === 'cmd' ? 't-cmd' : line.type === 'accent' ? 't-accent' : 't-out';

  if (charIdx < text.length) {
    if (charIdx === 0) outputHTML += `<span class="${colorClass}">`;
    outputHTML += text[charIdx];
    charIdx++;
    terminalEl.innerHTML = outputHTML + '</span><span class="t-cursor"></span>';
    setTimeout(nextChar, line.type === 'cmd' ? 55 : 18);
  } else {
    outputHTML += '</span>\n';
    lineIdx++;
    charIdx = 0;
    terminalEl.innerHTML = outputHTML;
    setTimeout(nextChar, lineIdx % 2 === 0 ? 350 : 80);
  }
}

// Start terminal after short delay
setTimeout(nextChar, 800);

// ── Counter animation ──────────────────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
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

// Counter observer
const counterEls = document.querySelectorAll('.pf-stat-num');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

counterEls.forEach(el => counterObserver.observe(el));

// ── Active nav link on scroll ──────────────────────────────────
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
