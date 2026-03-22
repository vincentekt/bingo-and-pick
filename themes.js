/* ────────────────────────────────────────────────────────────────
   BingoPick – themes.js
   Festival / occasion theme registry
──────────────────────────────────────────────────────────────── */

const THEMES = {
  /* ── Country groups ── */
  regions: [
    { id: 'global',    label: '🌏 Global' },
    { id: 'asia',      label: '🌏 Asia' },
    { id: 'western',   label: '🌎 Western' },
  ],

  /* ── Themes keyed by region ── */
  byRegion: {
    global: [
      {
        id: 'default',
        label: '🎱 Default',
        emoji: '🎱',
        css: {
          '--accent':   '#7c6aff',
          '--accent2':  '#ff5e87',
          '--accent3':  '#00d2ff',
          '--bg':       '#0d0f1a',
          '--bg-card':  '#13162a',
          '--bg-card2': '#1a1e35',
          '--ball-a':   '#7c6aff',
          '--ball-b':   '#ff5e87',
        },
        ballColors: ['#7c6aff','#ff5e87','#00d2ff','#ffd166','#06d6a0'],
        prizes: ['Gift Voucher','Cash Prize','Dinner for 2','Movie Tickets','Spa Package',
                 'Shopping Mall Gift Card','Electronics','Weekend Getaway','Gold Bar','Grand Prize'],
      },
      {
        id: 'party',
        label: '🎉 Party Night',
        emoji: '🎉',
        css: {
          '--accent':   '#f59e0b',
          '--accent2':  '#ec4899',
          '--accent3':  '#8b5cf6',
          '--bg':       '#0a0a0f',
          '--bg-card':  '#111118',
          '--bg-card2': '#18181f',
          '--ball-a':   '#f59e0b',
          '--ball-b':   '#ec4899',
        },
        ballColors: ['#f59e0b','#ec4899','#8b5cf6','#10b981','#ef4444'],
        prizes: ['Party Pack','VIP Table','Champagne Bottle','DJ Night Pass','Party Hamper',
                 'Gift Basket','Luxury Candle Set','Wine Set','Spa Package','Grand Prize'],
      },
    ],

    asia: [
      {
        id: 'cny',
        label: '🧧 Chinese New Year',
        emoji: '🧧',
        css: {
          '--accent':   '#e63946',
          '--accent2':  '#ffd166',
          '--accent3':  '#f4a261',
          '--bg':       '#0e0808',
          '--bg-card':  '#1a0d0d',
          '--bg-card2': '#231212',
          '--ball-a':   '#c7002e',
          '--ball-b':   '#ffd166',
        },
        ballColors: ['#c7002e','#ffd166','#f4a261','#e63946','#ff9f1c'],
        prizes: ['🧧 Red Packet $10','🧧 Red Packet $20','🧧 Red Packet $50',
                 '🍊 Mandarin Orange Hamper','🥮 Mooncake Box','🍵 Premium Tea Set',
                 '💰 Ang Bao $100','🏮 Lucky Lantern Gift Set','💝 Reunion Dinner Voucher',
                 '🎊 Grand Prize – Cash $500'],
      },
      {
        id: 'deepavali',
        label: '🪔 Deepavali',
        emoji: '🪔',
        css: {
          '--accent':   '#f59e0b',
          '--accent2':  '#ef4444',
          '--accent3':  '#8b5cf6',
          '--bg':       '#0a0805',
          '--bg-card':  '#150f07',
          '--bg-card2': '#1e160a',
          '--ball-a':   '#f59e0b',
          '--ball-b':   '#ef4444',
        },
        ballColors: ['#f59e0b','#ef4444','#8b5cf6','#10b981','#ec4899'],
        prizes: ['🪔 Diya Set','🌸 Flower Garland Hamper','🍬 Mithai Box','💰 Cash Prize $50',
                 '👗 Saree Gift Voucher','🛍 Shopping Voucher $100','🍛 Restaurant Voucher',
                 '💫 Jewellery Voucher','🎁 Festival Hamper','🌟 Grand Prize $500'],
      },
      {
        id: 'hari-raya',
        label: '🌙 Hari Raya',
        emoji: '🌙',
        css: {
          '--accent':   '#059669',
          '--accent2':  '#fbbf24',
          '--accent3':  '#34d399',
          '--bg':       '#020a05',
          '--bg-card':  '#071409',
          '--bg-card2': '#0c1e0f',
          '--ball-a':   '#059669',
          '--ball-b':   '#fbbf24',
        },
        ballColors: ['#059669','#fbbf24','#34d399','#065f46','#10b981'],
        prizes: ['🌙 Hari Raya Hamper','💰 Duit Raya $20','💰 Duit Raya $50',
                 '🛍 Shopping Voucher','🍪 Kuih Hamper','👗 Baju Raya Voucher',
                 '🌿 Premium Dates Set','🎁 Festive Gift Basket','🌟 Voucher $200','🎊 Grand Prize $500'],
      },
    ],

    western: [
      {
        id: 'christmas',
        label: '🎄 Christmas',
        emoji: '🎄',
        css: {
          '--accent':   '#16a34a',
          '--accent2':  '#dc2626',
          '--accent3':  '#fbbf24',
          '--bg':       '#030d06',
          '--bg-card':  '#071510',
          '--bg-card2': '#0c1e17',
          '--ball-a':   '#16a34a',
          '--ball-b':   '#dc2626',
        },
        ballColors: ['#16a34a','#dc2626','#fbbf24','#166534','#b91c1c'],
        prizes: ['🎄 Christmas Hamper','🎁 Mystery Gift Box','🍫 Chocolate Hamper',
                 '🧣 Winter Accessories Set','☕ Coffee Machine','🍾 Wine Hamper',
                 '🛒 Supermarket Voucher $100','🎮 Gaming Voucher','✈ Travel Voucher','🌟 Grand Prize $1000'],
      },
      {
        id: 'halloween',
        label: '🎃 Halloween',
        emoji: '🎃',
        css: {
          '--accent':   '#ea580c',
          '--accent2':  '#7c3aed',
          '--accent3':  '#fbbf24',
          '--bg':       '#070308',
          '--bg-card':  '#0f060f',
          '--bg-card2': '#160a18',
          '--ball-a':   '#ea580c',
          '--ball-b':   '#7c3aed',
        },
        ballColors: ['#ea580c','#7c3aed','#fbbf24','#dc2626','#4c1d95'],
        prizes: ['🎃 Pumpkin Spice Hamper','🍬 Candy Bag','👻 Scary Movie Night Pack',
                 '🦇 Mystery Box','🧙 Witch Hat + Treats','🕷 Haunted House Ticket',
                 '🍭 Giant Candy Basket','🎭 Costume Voucher','🔮 Experience Voucher','🌟 Grand Prize $500'],
      },
    ],
  },
};

/* ────────────────────────────────────────────────────────────────
   Helper: apply theme CSS variables to :root
──────────────────────────────────────────────────────────────── */
function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme.css).forEach(([key, val]) => root.style.setProperty(key, val));
  // Emit custom event so app.js can react
  document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

/* ────────────────────────────────────────────────────────────────
   Helper: get flat list of all themes
──────────────────────────────────────────────────────────────── */
function getAllThemes() {
  return Object.values(THEMES.byRegion).flat();
}

/* ────────────────────────────────────────────────────────────────
   Helper: find theme by id
──────────────────────────────────────────────────────────────── */
function getThemeById(id) {
  return getAllThemes().find(t => t.id === id) || getAllThemes()[0];
}

/* ────────────────────────────────────────────────────────────────
   Populate dropdowns
──────────────────────────────────────────────────────────────── */
function populateThemePicker() {
  const selRegion  = document.getElementById('sel-region');
  const selFestival = document.getElementById('sel-festival');
  if (!selRegion || !selFestival) return;

  // Populate regions
  THEMES.regions.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id; opt.textContent = r.label;
    selRegion.appendChild(opt);
  });

  function updateFestivalOptions(regionId) {
    selFestival.innerHTML = '';
    (THEMES.byRegion[regionId] || []).forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id; opt.textContent = t.label;
      selFestival.appendChild(opt);
    });
    // Apply first theme in region by default
    const first = (THEMES.byRegion[regionId] || [])[0];
    if (first) applyTheme(first);
  }

  // Default: global → default theme → CNY
  selRegion.value = 'asia';
  updateFestivalOptions('asia');
  selFestival.value = 'cny';
  applyTheme(getThemeById('cny'));

  selRegion.addEventListener('change', () => {
    updateFestivalOptions(selRegion.value);
    const first = (THEMES.byRegion[selRegion.value] || [])[0];
    if (first) { selFestival.value = first.id; applyTheme(first); }
  });

  selFestival.addEventListener('change', () => {
    const theme = getThemeById(selFestival.value);
    if (theme) applyTheme(theme);
  });
}
