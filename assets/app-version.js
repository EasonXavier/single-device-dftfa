(() => {
  'use strict';

  const APP_VERSION = Object.freeze({
    number: '1.5.2',
    releasedAt: '2026-07-17',
    scheme: 'a.b.c'
  });

  window.SINGLEDEVICE_DFTFA_VERSION = APP_VERSION;
  document.documentElement.dataset.appVersionNumber = APP_VERSION.number;

  const versionMeta = document.querySelector('meta[name="application-version"]');
  if (versionMeta) versionMeta.content = APP_VERSION.number;

  if (document.body) document.body.dataset.appVersionNumber = APP_VERSION.number;

  document.querySelectorAll('[data-app-version]').forEach(element => {
    element.textContent = `v${APP_VERSION.number}`;
  });

  document.querySelectorAll('[data-app-release-date]').forEach(element => {
    element.textContent = APP_VERSION.releasedAt;
    if (element.tagName === 'TIME') element.dateTime = APP_VERSION.releasedAt;
  });
})();
