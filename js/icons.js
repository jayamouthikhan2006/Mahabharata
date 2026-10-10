/* Line-icon sprite shared by every page. Injected first so <use href="#i-..."> resolves. */
(function () {
  const s = (id, body, vb = '0 0 24 24') => `<symbol id="${id}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</symbol>`;
  const icons = [
    s('i-arrow', '<path d="M4 12h15M13 6l6 6-6 6"/>'),
    s('i-chev-left', '<path d="M15 5l-7 7 7 7"/>'),
    s('i-chev-right', '<path d="M9 5l7 7-7 7"/>'),
    s('i-close', '<path d="M6 6l12 12M18 6L6 18"/>'),
    s('i-quote', '<path d="M10 7c-3 1-5 3.5-5 7v3h5v-5H7.5c0-2 1-3.5 3-4.2zM19 7c-3 1-5 3.5-5 7v3h5v-5h-2.5c0-2 1-3.5 3-4.2z" fill="currentColor" stroke="none"/>'),
    s('i-reset', '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/>'),
    s('i-mouse', '<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 7v3"/>'),
    s('i-share', '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>'),
    s('i-instagram', '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>'),
    s('i-youtube', '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor"/>'),
    s('i-mail', '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6l8.5 7 8.5-7"/>'),
    s('i-play', '<path d="M8 5v14l11-7z"/>'),
    // brand: bow & arrow emblem
    s('i-bowmark', '<path d="M7 3c6 3 6 15 0 18"/><path d="M7 3v18"/><path d="M3 12h17M17 9l3 3-3 3"/><path d="M12 6.5l1.2 1.2L12 9l-1.2-1.3z" fill="currentColor"/>'),
    // gurukul features
    s('i-book', '<path d="M3 5.5C5.5 4.5 9 4.5 12 6.5c3-2 6.5-2 9-1v13c-2.5-1-6-1-9 1-3-2-6.5-2-9-1z"/><path d="M12 6.5v13"/>'),
    s('i-people', '<circle cx="12" cy="7.5" r="2.6"/><circle cx="5.5" cy="10" r="2"/><circle cx="18.5" cy="10" r="2"/><path d="M7.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5M2.5 18c0-2.2 1.3-3.8 3-3.8M21.5 18c0-2.2-1.3-3.8-3-3.8"/>'),
    s('i-target', '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
    s('i-chart', '<path d="M4 20V10M9.5 20v-6M15 20v-9M20.5 20V6"/><path d="M4 8l5.5-3 5.5 3 5.5-5"/>'),
    // principles
    s('i-lotus', '<path d="M12 4c2 2.2 3 4.6 3 7.2 0 2.6-1.3 4.6-3 5.8-1.7-1.2-3-3.2-3-5.8C9 8.6 10 6.2 12 4z"/><path d="M8.6 9.2C6 8.6 4 9 2.5 10c.8 3.8 3.4 6.4 7 7"/><path d="M15.4 9.2c2.6-.6 4.6-.2 6.1.8-.8 3.8-3.4 6.4-7 7"/><path d="M4 19.5h16"/>'),
    s('i-wheel', '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.4"/><path d="M12 3.5v6.1M12 14.4v6.1M3.5 12h6.1M14.4 12h6.1M6 6l4.3 4.3M13.7 13.7L18 18M18 6l-4.3 4.3M10.3 13.7L6 18"/>'),
    s('i-network', '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="8" cy="19.5" r="2"/><circle cx="16" cy="19.5" r="2"/><path d="M10.7 6.5L6.3 10.5M13.3 6.5l4.4 4M5.8 13.8l1.4 3.8M18.2 13.8l-1.4 3.8M10 19.5h4"/>'),
    s('i-focus', '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>'),
    s('i-meditate', '<circle cx="12" cy="5" r="2.2"/><path d="M12 8v5.5M8 11l4 2.5 4-2.5"/><path d="M5 18c2-2 4.5-2.8 7-2.8s5 .8 7 2.8"/><path d="M4 20.5h16"/>'),
    s('i-guru', '<circle cx="8" cy="6.5" r="2.4"/><circle cx="16.5" cy="9" r="2"/><path d="M3.5 20c0-4 2-7 4.5-7s4.5 3 4.5 7"/><path d="M13 20c0-3.2 1.5-5.4 3.5-5.4S20 16.8 20 20"/><path d="M10.5 11l3.5 1.6"/>'),
    s('i-scales', '<path d="M12 3v17M7 20h10M5 7h14"/><path d="M5 7l-3 6c0 1.6 1.4 2.6 3 2.6s3-1 3-2.6zM19 7l-3 6c0 1.6 1.4 2.6 3 2.6s3-1 3-2.6z"/><circle cx="12" cy="4" r="1"/>'),
    // problem
    s('i-puzzle', '<path d="M4 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4h-4a2 2 0 1 0-4 0H4v-4a2 2 0 1 0 0-4z"/>'),
    s('i-user-x', '<circle cx="10" cy="7.5" r="3.5"/><path d="M3.5 20c0-4 3-6.5 6.5-6.5 1.6 0 3 .5 4.2 1.4"/><path d="M16 15l5 5M21 15l-5 5"/>'),
    s('i-clock', '<circle cx="12" cy="12.5" r="8"/><path d="M12 8v4.5l3 2M9.5 2.5h5"/>'),
    s('i-gauge', '<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5"/><circle cx="12" cy="17" r="1.3" fill="currentColor"/><path d="M6.5 11.5l1 .8M12 8.5v1.3M17.5 11.5l-1 .8"/>'),
    // research
    s('i-laptop', '<rect x="4.5" y="5" width="15" height="10" rx="1.2"/><path d="M2.5 18.5h19l-1.5-3.5h-16z"/><path d="M10 9.5l2 1.5 2-1.5"/>'),
    s('i-brain', '<path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5.2A3 3 0 0 0 7 18a2.5 2.5 0 0 0 5 .5V5.5A2.5 2.5 0 0 0 9 4.5z"/><path d="M15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 2 5.2A3 3 0 0 1 17 18a2.5 2.5 0 0 1-5 .5"/><path d="M8.5 10h1.5M14 10h1.5M8.5 14H10M14 14h1.5"/>'),
    s('i-vr', '<path d="M3 9.5c0-1.4 1-2.5 2.5-2.5h13C20 7 21 8.1 21 9.5V15c0 1.1-.9 2-2 2h-3.3l-1.7-2.3h-4L8.3 17H5c-1.1 0-2-.9-2-2z"/><circle cx="8" cy="11.5" r="1.6"/><circle cx="16" cy="11.5" r="1.6"/>'),
    // simulator / path
    s('i-assess', '<circle cx="9" cy="7" r="3"/><path d="M3 20c0-3.6 2.7-6 6-6 1.5 0 2.8.4 3.8 1.2"/><circle cx="17.5" cy="16.5" r="3.5"/><circle cx="17.5" cy="16.5" r="1" fill="currentColor"/>'),
    s('i-compass', '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>'),
    s('i-bow', '<path d="M6 3c7 2.5 7 15.5 0 18"/><path d="M6 3l0 18" stroke-dasharray="1.5 1.5"/><path d="M3 12h16M16 9l3 3-3 3M4.5 10.5L3 12l1.5 1.5"/>'),
    s('i-feedback', '<path d="M4 5h16v10H9l-5 4z"/><path d="M8 12l2.5-2.5 2 2L16 8"/>'),
    s('i-podium', '<path d="M3 20h18M4 20v-5h5v5M9 20V10h6v10M15 20v-7h5v7"/><path d="M12 3l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/>'),
    s('i-clipboard', '<rect x="5" y="4.5" width="14" height="16.5" rx="1.5"/><path d="M9 4.5V3h6v1.5M8.5 10l1.5 1.5 3-3M8.5 16h7"/>'),
    s('i-guide', '<circle cx="7" cy="6" r="2.4"/><circle cx="17" cy="9" r="2"/><path d="M3 20v-3.5C3 13.5 5 12 7 12s4 1.5 4 4.5V20M14 20v-2.5c0-2 1.3-3.4 3-3.4s3 1.4 3 3.4V20"/><path d="M9.5 9.5L14.5 9"/>'),
    s('i-mountain', '<path d="M2.5 20l7-11 4 6 2.5-3.5 5.5 8.5z"/><path d="M9.5 3v6M9.5 3l3.5 1.5L9.5 6"/>'),
    s('i-crown', '<path d="M3.5 8l4.5 4 4-7 4 7 4.5-4-2 10.5h-13z"/><path d="M6 21h12"/>'),
    // impact
    s('i-spark', '<path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>'),
    s('i-heart', '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>'),
    s('i-growth', '<path d="M3 20h18"/><path d="M5 16l5-5 3 3 6-7"/><path d="M15 7h4v4"/>'),
    s('i-shield', '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'),
  ];
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">${icons.join('')}</svg>`;
  document.body.insertAdjacentHTML('afterbegin', sprite);
})();
