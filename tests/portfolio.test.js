import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  animateCounter,
  initActiveNav,
  initCounters,
  initMobileMenu,
  initScrollReveal,
  initTerminal,
} from '../assets/js/portfolio.js';

let observers;

beforeEach(() => {
  document.body.innerHTML = '';
  observers = [];
  vi.restoreAllMocks();
  global.IntersectionObserver = class {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observed = [];
      observers.push(this);
    }
    observe(element) { this.observed.push(element); }
    unobserve(element) { this.observed = this.observed.filter(item => item !== element); }
  };
});

describe('portfolio interactions', () => {
  it('toggles and closes the mobile menu', () => {
    document.body.innerHTML = '<button id="nav-hamburger"></button><nav id="mobile-menu"><a href="#about">About</a></nav>';
    initMobileMenu();
    document.querySelector('#nav-hamburger').click();
    expect(document.querySelector('#mobile-menu').classList.contains('open')).toBe(true);
    document.querySelector('#mobile-menu a').click();
    expect(document.querySelector('#mobile-menu').classList.contains('open')).toBe(false);
  });

  it('animates a counter to exactly its target', () => {
    vi.useFakeTimers();
    const element = document.createElement('span');
    element.dataset.target = '42';
    vi.spyOn(performance, 'now').mockReturnValue(0);
    global.requestAnimationFrame = vi.fn(callback => {
      callback(1600);
      return 1;
    });
    animateCounter(element);
    expect(element.textContent).toBe('42');
    vi.useRealTimers();
  });

  it('types the terminal content and finishes with a cursor', () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="terminal-body"></div>';
    initTerminal();
    vi.runAllTimers();
    expect(document.querySelector('#terminal-body').textContent).toContain('whoami');
    expect(document.querySelector('#terminal-body').textContent).toContain('Open to work ✓');
    expect(document.querySelector('#terminal-body .t-cursor')).not.toBeNull();
    vi.useRealTimers();
  });

  it('marks reveal elements and handles intersecting entries', () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div class="pf-skill-card"></div><div class="pf-stat"></div>';
    initScrollReveal();
    expect(document.querySelectorAll('.pf-reveal')).toHaveLength(2);
    observers[0].callback([{ target: document.querySelector('.pf-skill-card'), isIntersecting: true }]);
    vi.runAllTimers();
    expect(document.querySelector('.pf-skill-card').classList.contains('visible')).toBe(true);
    vi.useRealTimers();
  });

  it('triggers counters for intersecting stat numbers', () => {
    document.body.innerHTML = '<span class="pf-stat-num" data-target="7"></span>';
    global.requestAnimationFrame = vi.fn(callback => {
      callback(1600);
      return 1;
    });
    vi.spyOn(performance, 'now').mockReturnValue(0);
    initCounters();
    observers[0].callback([{ target: document.querySelector('.pf-stat-num'), isIntersecting: true }]);
    expect(document.querySelector('.pf-stat-num').textContent).toBe('7');
  });

  it('highlights the nav link matching an intersecting section', () => {
    document.body.innerHTML = `
      <section id="about"></section>
      <nav class="nav-links"><a href="#about"></a><a href="#work"></a></nav>
      <nav class="mobile-menu"><a href="#about"></a></nav>
    `;
    initActiveNav();
    observers[0].callback([{ target: document.querySelector('#about'), isIntersecting: true }]);
    expect(document.querySelector('.nav-links a[href="#about"]').style.color).toBe('var(--accent)');
    expect(document.querySelector('.nav-links a[href="#work"]').style.color).toBe('');
  });
});
