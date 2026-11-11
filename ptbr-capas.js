
(function () {
    'use strict';

    var ID = 'LAMPA_PTBR_CAPAS_V1';
    if (window[ID]) return;
    window[ID] = true;

    var STORE = 'lampa_ptbr_verified_titles_v1';
    var BADGE = 'lampa-ptbr-cover-badge';
    var currentTitle = '';

    function norm(s) {
        return String(s || '').toLowerCase()
            .replace(/_/g, '-')
            .replace(/[^a-z0-9à-ú-]+/g, ' ')
            .replace(/\s+/g, ' ').trim();
    }

    function read() {
        try {
            return JSON.parse(localStorage.getItem(STORE) || '[]');
        } catch (e) {
            return [];
        }
    }

    function save(title) {
        if (!title) return;
        var items = read();
        var found = false;

        items.forEach(function (item) {
            if (item.title === title) found = true;
        });

        if (!found) {
            items.push({ title: title, date: Date.now() });
        }

        try {
            localStorage.setItem(STORE, JSON.stringify(items.slice(-200)));
        } catch (e) {}

        scan();
    }

    function isPTBR(track) {
        var lang = norm(
            track.language || track.lang ||
            track.label || track.name
        );

        return /pt-br|ptbr|pob|por-br|brazilian|português brasileiro|brasil/.test(lang);
    }

    function checkTracks() {
        try {
            var video = Lampa.PlayerVideo.video();
            if (!video || !video.audioTracks) return;

            for (var i = 0; i < video.audioTracks.length; i++) {
                if (isPTBR(video.audioTracks[i])) {
                    save(currentTitle);
                    return;
                }
            }
        } catch (e) {}
    }

    function css() {
        var style = document.createElement('style');
        style.textContent =
            '.card__view{position:relative}' +
            '.' + BADGE + '{position:absolute;top:5px;left:5px;' +
            'z-index:9;background:#16833e;color:white;' +
            'padding:4px 6px;border-radius:4px;' +
            'font-size:10px;font-weight:bold;' +
            'pointer-events:none}';

        document.head.appendChild(style);
    }

    function scan() {
        var items = read();
        var cards = document.querySelectorAll('.card');

        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            var title = card.querySelector('.card__title');
            var view = card.querySelector('.card__view');

            if (!title || !view) continue;

            var name = norm(title.textContent);
            var found = false;

            for (var j = 0; j < items.length; j++) {
                if (items[j].title === name) {
                    found = true;
                    break;
                }
            }

            var old = view.querySelector('.' + BADGE);

            if (found && !old) {
                var badge = document.createElement('span');
                badge.className = BADGE;
                badge.textContent = '🇧🇷 DUBLADO PT-BR';
                view.appendChild(badge);
            }

            if (!found && old) old.remove();
        }
    }

    function init() {
        css();

        if (Lampa.Player && Lampa.Player.listener) {
            Lampa.Player.listener.follow('start', function () {
                var title = document.querySelector(
                    '.full-start__title, .full-start-new__title'
                );

                currentTitle = title ? norm(title.textContent) : '';
                setTimeout(checkTracks, 1000);
            });

            Lampa.Player.listener.follow('destroy', function () {
                currentTitle = '';
            });
        }

        if (Lampa.PlayerVideo && Lampa.PlayerVideo.listener) {
            ['canplay', 'tracks', 'timeupdate'].forEach(function (event) {
                Lampa.PlayerVideo.listener.follow(event, checkTracks);
            });
        }

        var observer = new MutationObserver(function () {
            scan();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        scan();
        console.log('[PTBR CAPAS] Plugin ativo');
    }

    function ready() {
        if (!window.Lampa || !Lampa.Listener) {
            setTimeout(ready, 500);
            return;
        }

        if (window.appready) init();
        else Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }

    ready();
})();
