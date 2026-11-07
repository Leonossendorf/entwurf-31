/* Hewing & Tschirner, Entwurf. Kein Dienst von außen, keine Cookies. */
(function () {
  var doc = document, wurzel = doc.documentElement;
  wurzel.classList.add('js');

  function $(s, b) { return (b || doc).querySelector(s); }
  function $$(s, b) { return Array.prototype.slice.call((b || doc).querySelectorAll(s)); }

  /* Einstellungen merken, soweit der Browser das erlaubt */
  var speicher = {
    lesen: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    setzen: function (k, w) { try { localStorage.setItem(k, w); } catch (e) { /* ohne Speicher geht es auch */ } }
  };

  /* Menü am Handy */
  var mk = $('.menu-knopf'), nav = $('.nav');
  if (mk && nav) {
    mk.addEventListener('click', function () {
      var offen = nav.classList.toggle('offen');
      mk.setAttribute('aria-expanded', offen ? 'true' : 'false');
    });
    $$('a', nav).forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('offen');
        mk.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Lesehilfen */
  var hk = $('.hilfe-knopf'), hp = $('.hilfe-panel');
  if (hk && hp) {
    var zu = function () { hp.hidden = true; hk.setAttribute('aria-expanded', 'false'); };
    hk.addEventListener('click', function () {
      hp.hidden = !hp.hidden;
      hk.setAttribute('aria-expanded', hp.hidden ? 'false' : 'true');
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !hp.hidden) { zu(); hk.focus(); }
    });
    doc.addEventListener('click', function (e) {
      if (!hp.hidden && !hp.contains(e.target) && !hk.contains(e.target)) zu();
    });

    $$('[data-schrift]', hp).forEach(function (b) {
      b.addEventListener('click', function () { schrift(b.getAttribute('data-schrift'), true); });
    });
    var schrift = function (s, merken) {
      wurzel.classList.remove('schrift-1', 'schrift-2');
      if (s !== '0') wurzel.classList.add('schrift-' + s);
      $$('[data-schrift]', hp).forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-schrift') === s ? 'true' : 'false');
      });
      if (merken) speicher.setzen('ht-schrift', s);
    };
    schrift(speicher.lesen('ht-schrift') || '0');

    $$('[data-klasse]', hp).forEach(function (b) {
      var k = b.getAttribute('data-klasse');
      var setzen = function (an) {
        wurzel.classList.toggle(k, an);
        b.setAttribute('aria-pressed', an ? 'true' : 'false');
        b.textContent = an ? 'An' : 'Aus';
      };
      setzen(speicher.lesen('ht-' + k) === '1');
      b.addEventListener('click', function () {
        var an = b.getAttribute('aria-pressed') !== 'true';
        setzen(an);
        speicher.setzen('ht-' + k, an ? '1' : '0');
      });
    });

    var vb = $('[data-vorlesen]', hp);
    if (vb) {
      if (!('speechSynthesis' in window)) {
        vb.closest('.hilfe-zeile').hidden = true;
      } else {
        vb.addEventListener('click', function () {
          if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            vb.setAttribute('aria-pressed', 'false');
            vb.textContent = 'Aus';
            return;
          }
          var u = new SpeechSynthesisUtterance($('main').innerText);
          u.lang = 'de-DE';
          u.onend = function () { vb.setAttribute('aria-pressed', 'false'); vb.textContent = 'Aus'; };
          speechSynthesis.speak(u);
          vb.setAttribute('aria-pressed', 'true');
          vb.textContent = 'An';
        });
      }
    }
  }

  /* Merkblätter */
  var reiter = $$('.reiter [role=tab]');
  function zeigeBlatt(id, fokus) {
    reiter.forEach(function (t) {
      var an = t.getAttribute('data-blatt') === id;
      t.setAttribute('aria-selected', an ? 'true' : 'false');
      t.tabIndex = an ? 0 : -1;
      var b = doc.getElementById('blatt-' + t.getAttribute('data-blatt'));
      b.hidden = !an;
      if (an) {
        b.classList.remove('reiter-wechsel');
        void b.offsetWidth;
        b.classList.add('reiter-wechsel');
        if (fokus) t.focus();
      }
    });
  }
  if (reiter.length) {
    zeigeBlatt(reiter[0].getAttribute('data-blatt'));
    reiter.forEach(function (t, i) {
      t.addEventListener('click', function () { zeigeBlatt(t.getAttribute('data-blatt')); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % reiter.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + reiter.length) % reiter.length;
        if (n === null) return;
        e.preventDefault();
        zeigeBlatt(reiter[n].getAttribute('data-blatt'), true);
      });
    });
  }
  $$('[data-merkblatt]').forEach(function (a) {
    a.addEventListener('click', function () { zeigeBlatt(a.getAttribute('data-merkblatt')); });
  });
  $$('[data-drucken]').forEach(function (b) {
    b.addEventListener('click', function () { window.print(); });
  });

  /* Knopf wählt im Formular die passende Auswahl vor */
  $$('[data-wahl]').forEach(function (a) {
    a.addEventListener('click', function () {
      var f = doc.querySelector('input[name=anliegen][value="' + a.getAttribute('data-wahl') + '"]');
      if (f) f.checked = true;
    });
  });

  /* Formulare: im Entwurf wird nichts versendet */
  $$('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var feld = form.elements.kontakt, fehler = $('.fehler', form), w = feld.value.trim();
      var ok = /@/.test(w) || w.replace(/\D/g, '').length >= 6;
      if (!ok) {
        fehler.hidden = false;
        fehler.textContent = 'Bitte geben Sie eine Telefonnummer oder E-Mail-Adresse an, damit wir Sie erreichen.';
        feld.setAttribute('aria-invalid', 'true');
        feld.focus();
        return;
      }
      var box = doc.createElement('div');
      box.className = 'erfolg';
      box.setAttribute('role', 'status');
      box.tabIndex = -1;
      box.innerHTML = '<h3>Vielen Dank.</h3><p>Das Büro meldet sich zu den Öffnungszeiten bei Ihnen.</p>' +
        '<p class="demo-hinweis">Entwurf: Es wurde nichts versendet. In der fertigen Seite geht Ihre Anfrage an info@anwalt-ochtrup.de.</p>';
      form.parentNode.replaceChild(box, form);
      box.focus();
    });
  });

  /* Erreichbarkeit nach den echten Bürozeiten, Zeitzone Ochtrup */
  var ZEITEN = { 1: [[510, 750], [870, 1080]], 2: [[510, 750], [870, 1080]], 3: [[510, 750]], 4: [[510, 750], [870, 1080]], 5: [[510, 750]] };
  var TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  function uhr(m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); }
  function ostern(j) {
    var a = j % 19, b = Math.floor(j / 100), c = j % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mo = Math.floor((h + l - 7 * m + 114) / 31), ta = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(j, mo - 1, ta));
  }
  function schluessel(d) { return d.toISOString().slice(0, 10); }
  function feiertage(j) {
    var o = ostern(j).getTime(), t = 864e5, l = [j + '-01-01', j + '-05-01', j + '-10-03', j + '-11-01', j + '-12-25', j + '-12-26'];
    [-2, 1, 39, 50, 60].forEach(function (n) { l.push(schluessel(new Date(o + n * t))); });
    return l;
  }
  function berlin() {
    var p = {};
    new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { d: new Date(Date.UTC(+p.year, +p.month - 1, +p.day)), min: (+p.hour % 24) * 60 + (+p.minute) };
  }
  function bloecke(d) {
    if (feiertage(d.getUTCFullYear()).indexOf(schluessel(d)) > -1) return [];
    return ZEITEN[d.getUTCDay()] || [];
  }
  function lage() {
    var n = berlin(), heute = bloecke(n.d), i;
    for (i = 0; i < heute.length; i++) {
      if (n.min >= heute[i][0] && n.min < heute[i][1]) return { offen: true, text: 'Heute erreichbar bis ' + uhr(heute[i][1]) + ' Uhr', tag: n.d.getUTCDay() };
      if (n.min < heute[i][0]) return { offen: false, text: 'Heute ab ' + uhr(heute[i][0]) + ' Uhr erreichbar', tag: n.d.getUTCDay() };
    }
    for (i = 1; i < 10; i++) {
      var d = new Date(n.d.getTime() + i * 864e5), b = bloecke(d);
      if (b.length) return { offen: false, text: (i === 1 ? 'Morgen' : TAGE[d.getUTCDay()]) + ' ab ' + uhr(b[0][0]) + ' Uhr erreichbar', tag: n.d.getUTCDay() };
    }
    return { offen: false, text: '', tag: n.d.getUTCDay() };
  }
  function status() {
    var l = lage();
    $$('[data-status]').forEach(function (e) {
      e.textContent = l.text;
      var w = e.closest('[data-offen]');
      if (w) w.setAttribute('data-offen', l.offen ? 'ja' : 'nein');
    });
    $$('[data-tag]').forEach(function (z) {
      var t = z.getAttribute('data-tag').split(',').indexOf(String(l.tag)) > -1;
      z.classList.toggle('heute', t);
    });
  }
  try { status(); setInterval(status, 60000); } catch (e) { /* dann bleibt die Tabelle stehen */ }

  /* Ruhiges Einblenden */
  var teile = $$('[data-zeigen]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('ist-da'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    teile.forEach(function (t) { io.observe(t); });
  } else {
    teile.forEach(function (t) { t.classList.add('ist-da'); });
  }
})();
