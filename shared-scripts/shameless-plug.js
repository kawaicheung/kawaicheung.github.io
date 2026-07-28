/**
 * ShamelessPlug by Ka Wai Cheung
 * Drop this one line on any subdomain of kawaicheung.io:
 *
 *   <script src="https://kawaicheung.io/shared-scripts/shamelessplug.js" defer></script>
 *
 * It auto-mounts on load using DEFAULTS below. To override per-page,
 * add data-attributes to the same script tag (no separate <script> needed):
 *
 *   <script src="https://kawaicheung.io/shared-scriptsshamelessplug.js"
 *           data-delay="3"
 *           data-img="https://kawaicheung.io/shared-scripts/img/kc.png"
 *           data-href="https://buymeacoffee.com/kawaicheung"
 *           data-text="Check out RunKWC.<br>Support it <u>here</u>!"
 *           data-mobile-hide
 *           defer></script>
 *
 * data-mobile-hide (bare attr, or "true"/"false") hides the plug via
 * `display:none` at max-width:768px.
 *
 * Manual control is still available post-mount via window.ShamelessPlug:
 *   ShamelessPlug.setText('New message here')
 *   ShamelessPlug.setDelay(2)
 *   ShamelessPlug.destroy()
 *   ShamelessPlug.init({...})   // re-mount with new options
 */
(function (global) {
  const STYLE_ID = 'kcsp-styles';
  const ROOT_ID = 'kcsp-root';

  const DEFAULTS = {
    delay: 1.5,
    img: 'https://kawaicheung.io/shared-scripts/img/kc.png',
    href: 'https://kawaicheung.io/software',
    target: '_blank',
    mobileHide: false,
    text:
      'A piece of simple software by Ka Wai Cheung.<br>' +
      "<u>Tap to see more of my work.</u>",
  };

  // Pull overrides off the <script> tag itself so every subdomain can
  // include the identical <script src="..."> line, optionally with
  // data-* attributes for per-page customization.
  function optsFromScriptTag() {
    const script = document.currentScript;
    if (!script) return {};
    const d = script.dataset;
    const opts = {};
    if (d.delay !== undefined) opts.delay = parseFloat(d.delay);
    if (d.img !== undefined) opts.img = d.img;
    if (d.href !== undefined) opts.href = d.href;
    if (d.target !== undefined) opts.target = d.target;
    if (d.text !== undefined) opts.text = d.text;
    if (d.mobileHide !== undefined) opts.mobileHide = d.mobileHide !== 'false';
    return opts;
  }

  const CSS = `
    .kcsp {
      position: fixed;
      bottom: 0rem;
      left: 1rem;
      z-index: 10;
      align-items: center;
      display: flex;
      font-size: 16px;
      font-family: sans-serif;
      letter-spacing: -0.05rem;
      animation: kcsp_shamelessPlugMovement 5s ease-in-out var(--kcsp-delay, 1.5s) infinite;
    
      img {
        opacity: 0;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        object-fit: cover;
        border: solid 2px #000;
        z-index: 1;
        animation:
          kcsp_wigglePlug 3s infinite linear,
          kcsp_popPlugImage 0.4s ease-in-out calc(var(--kcsp-delay, 1.5s) + 0.5s) forwards;
      }

      a {
        opacity: 0;
        background: #000;
        color: #fff;
        padding: 0.4rem 1.2rem;
        font-weight: 600;
        font-size: 0.8rem;
        text-decoration: none;
        margin: 0 0 50px -10px;
        animation:
          kcsp_wigglePlug 5s infinite linear,
          kcsp_popPlugText 0.3s ease-out calc(var(--kcsp-delay, 1.5s) + 0.8s) forwards;
      }
    }

    @keyframes kcsp_shamelessPlugMovement {
      0% { transform: translateX(0) translateY(0); }
      50% { transform: translateX(-5px) translateY(10px); }
      100% { transform: translateX(0) translateY(0); }
    }

    @keyframes kcsp_wigglePlug {
      0% { rotate: 0; }
      50% { rotate: -5deg; }
      100% { rotate: 0; }
    }

    @keyframes kcsp_popPlugText {
      0% { opacity: 0; transform: scale(0); }
      70% { opacity: 1; transform: scale(1.04); }
      100% { opacity: 1; transform: scale(1); }
    }

    @keyframes kcsp_popPlugImage {
      0% { opacity: 0; transform: scale(0) rotate(20deg); }
      70% { opacity: 1; transform: scale(1.2) rotate(-5deg); }
      100% { opacity: 1; transform: scale(1) rotate(-5deg); }
    }

    @media (max-width: 768px) {
      .kcsp-hide-mobile {
        display: none;
      }
    }
  `;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function buildMarkup(opts) {
    const wrapper = document.createElement('div');
    wrapper.className = 'kcsp';
    wrapper.id = ROOT_ID;
    wrapper.style.setProperty('--kcsp-delay', `${opts.delay}s`);
    if (opts.mobileHide) wrapper.classList.add('kcsp-hide-mobile');

    const img = document.createElement('img');
    img.src = opts.img;

    const a = document.createElement('a');
    a.href = opts.href;
    a.target = opts.target;
    a.innerHTML = opts.text;

    wrapper.appendChild(img);
    wrapper.appendChild(a);
    return wrapper;
  }

  const ShamelessPlug = {
    _opts: null,
    _el: null,

    init(userOpts = {}) {
      this._opts = { ...DEFAULTS, ...userOpts };
      injectStyles();

      // Replace existing instance if init() is called again.
      const existing = document.getElementById(ROOT_ID);
      if (existing) existing.remove();

      this._el = buildMarkup(this._opts);
      document.body.appendChild(this._el);
      return this;
    },

    setText(html) {
      if (!this._el) return this;
      const a = this._el.querySelector('a');
      if (a) a.innerHTML = html;
      return this;
    },

    setDelay(seconds) {
      if (!this._el) return this;
      this._el.style.setProperty('--kcsp-delay', `${seconds}s`);
      return this;
    },

    destroy() {
      if (this._el) this._el.remove();
      this._el = null;
      return this;
    },
  };

  global.ShamelessPlug = ShamelessPlug;

  // Auto-mount. `document.currentScript` is only reliable synchronously
  // during initial parse, so capture the tag's config now regardless of
  // when DOMContentLoaded fires.
  const scriptOpts = optsFromScriptTag();
  function mount() {
    ShamelessPlug.init(scriptOpts);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})(window);
