
(function () {
    'use strict';

    var ID = 'LAMPA_PTBR_CAPAS_V2';
    if (window[ID]) return;
    window[ID] = true;

    var STORE = 'lampa_ptbr_verified_titles_v2';
    var BADGE = 'lampa-ptbr-cover-badge';
    var currentTitle = '';
    var initialized = false;

    function norm(value) {
        return String(value || '').toLowerCase()
            .replace(/_/g, '-')
            .replace(/[^a-z0-9à-ú-]+/g, ' ')
            .replace(/\s+/g, ' ').trim();
    }

    function read() {
        try {
            return JSON.parse(
                window.localStorage.getItem(STORE) || '[]'
            );
        } catch (e) {
            return [];
        }
    }

    function save(title) {
        if (!title) return;

        var items = read();
        var found = items.some(function (item) {
            return item.title === title;
        });

        if (!found) {
            items.push({ title: title });
        }

        try {
            window.localStorage.setItem(
                STORE,
                JSON.stringify(items.slice(-200))
            );
        } catch (e) {}

        scan();
    }

    function isPTBR(track) {
        var lang = norm(
            track.language || track.lang ||
            track.label || track.name
        );

        return /pt-br|ptbr|pob|por-br|brazilian|portugu[eê]s brasileiro|brasil/.test(lang);
    }

    function checkTracks() {
        try {
            if (!window.Lampa || !Lampa.PlayerVideo) return;

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
        if (!document.head) return;

        var style = document.createElement('style');
        style.textContent =
            '.card__view{position:relative}' +
            '.' + BADGE + '{position:absolute;top:5px;left:5px;' +
            'z-index:99;background:#16833e;color:#fff;' +
            'padding:4px 6px;border-radius:4px;' +
            'font-size:10px;font-weight:bold;pointer-events:none}';

        document.head.appendChild(style);
    }

    function scan() {
        try {
            var items = read();
            var cards = document.querySelectorAll('.card');

            for (var i = 0; i < cards.length; i++) {
                var card = cards[i];
                var title = card.querySelector('.card__title');
                var view = card.querySelector('.card__view');

                if (!title || !view) continue;

                var name = norm(title.textContent);
                var found = items.some(function (item) {
                    return item.title === name;
                });

                var old = view.querySelector('.' + BADGE);

                if (found && !old) {
                    var badge = document.createElement('span');
                    badge.className = BADGE;
                    badge.textContent = '🇧🇷 DUBLADO PT-BR';
                    view.appendChild(badge);
                }

                if (!found && old && old.parentNode) {
                    old.parentNode.removeChild(old);
                }
            }
        } catch (e) {}
    }

    function init() {
        if (initialized) return;
        initialized = true;

        css();

        try {
            if (Lampa.Player && Lampa.Player.listener) {
                Lampa.Player.listener.follow('start', function () {
                    var title = document.querySelector(
                        '.full-start__title, .full-start-new__title'
                    );

                    currentTitle = title ? norm(title.textContent) : '';
                    window.setTimeout(checkTracks, 1500);
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
        } catch (e) {}

        if (window.MutationObserver && document.body) {
            try {
                var observer = new window.MutationObserver(scan);
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            } catch (e) {}
        }

        scan();
        console.log('[PTBR CAPAS V2] Ativo');
    }

    function ready() {
        if (!window.Lampa) {
            window.setTimeout(ready, 1000);
            return;
        }

        if (window.appready) {
            init();
            return;
        }

        if (Lampa.Listener && Lampa.Listener.follow) {
            Lampa.Listener.follow('app', function (event) {
                if (event.type === 'ready') init();
            });
        } else {
            window.setTimeout(ready, 1000);
        }
    }

    ready();
})();
