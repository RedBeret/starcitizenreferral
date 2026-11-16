/* Shared behavior. Referral identity is intentionally fixed to the owner's code. */
(() => {
    'use strict';
    const CODE = 'STAR-9L66-ZTDY';
    const ANALYTICS_ID = 'G-0GGWQK594R';
    const storage = {
        get(key) { try { return localStorage.getItem(key); } catch { return null; } },
        set(key, value) { try { localStorage.setItem(key, value); } catch { /* Preferences remain usable without storage. */ } }
    };
    const messages = {
        en: { title: 'A better start<br>in the <em>’verse.</em>', lede: 'Your next adventure starts with a Star Citizen referral code. Add yours at signup for the standard <strong>50,000 UEC bonus.</strong>', copy: 'Copy', cta: 'Create account on RSI', label: 'Your referral code', language: 'en' },
        de: { title: 'Dein Start<br>ins <em>’Verse.</em>', lede: 'Dein nächstes Abenteuer beginnt mit einem Star-Citizen-Empfehlungscode. Nutze ihn bei der Registrierung für den regulären <strong>Bonus von 50.000 UEC.</strong>', copy: 'Kopieren', cta: 'RSI-Konto erstellen', label: 'Dein Empfehlungscode', language: 'de' },
        fr: { title: 'Un bon départ<br>dans le <em>’Verse.</em>', lede: 'Votre prochaine aventure commence avec un code de parrainage Star Citizen. Ajoutez-le à l’inscription pour le <strong>bonus standard de 50 000 UEC.</strong>', copy: 'Copier', cta: 'Créer un compte RSI', label: 'Votre code de parrainage', language: 'fr' },
        es: { title: 'Tu aventura<br>en el <em>’Verse.</em>', lede: 'Tu próxima aventura empieza con un código de referido de Star Citizen. Añádelo al registrarte para recibir el <strong>bono estándar de 50.000 UEC.</strong>', copy: 'Copiar', cta: 'Crear cuenta en RSI', label: 'Tu código de referido', language: 'es' },
        pt: { title: 'Um bom começo<br>no <em>’Verse.</em>', lede: 'Sua próxima aventura começa com um código de indicação de Star Citizen. Use-o no cadastro para receber o <strong>bônus padrão de 50.000 UEC.</strong>', copy: 'Copiar', cta: 'Criar conta na RSI', label: 'Seu código de indicação', language: 'pt' },
        it: { title: 'La tua avventura<br>nel <em>’Verse.</em>', lede: 'La tua prossima avventura inizia con un codice referral di Star Citizen. Inseriscilo alla registrazione per il <strong>bonus standard di 50.000 UEC.</strong>', copy: 'Copia', cta: 'Crea un account RSI', label: 'Il tuo codice referral', language: 'it' },
        pl: { title: 'Dobry początek<br>w <em>’Verse.</em>', lede: 'Twoja przygoda zaczyna się od kodu polecającego Star Citizen. Dodaj go przy rejestracji, aby otrzymać <strong>standardowy bonus 50 000 UEC.</strong>', copy: 'Kopiuj', cta: 'Utwórz konto RSI', label: 'Twój kod polecający', language: 'pl' },
        ru: { title: 'Удачный старт<br>во <em>Вселенной.</em>', lede: 'Ваше приключение начинается с реферального кода Star Citizen. Добавьте его при регистрации, чтобы получить <strong>стандартный бонус 50 000 UEC.</strong>', copy: 'Копировать', cta: 'Создать аккаунт RSI', label: 'Ваш реферальный код', language: 'ru' },
        jp: { title: '新たな冒険へ<br><em>旅立とう。</em>', lede: 'Star Citizenの紹介コードで冒険を始めましょう。アカウント登録時に入力すると、<strong>通常特典の50,000 UEC</strong>を受け取れます。', copy: 'コピー', cta: 'RSIアカウントを作成', label: '紹介コード', language: 'ja' },
        kr: { title: '새로운 모험의<br><em>시작.</em>', lede: 'Star Citizen 추천 코드와 함께 모험을 시작하세요. 가입할 때 입력하면 <strong>기본 보너스 50,000 UEC</strong>를 받을 수 있습니다.', copy: '복사', cta: 'RSI 계정 만들기', label: '추천 코드', language: 'ko' },
        cn: { title: '开启你的<br><em>星际旅程。</em>', lede: '使用 Star Citizen 推荐码开始新的冒险。在注册时填写，即可获得<strong>标准奖励 50,000 UEC。</strong>', copy: '复制', cta: '创建 RSI 账号', label: '你的推荐码', language: 'zh' }
    };
    let language = 'en';
    let toastTimer;
    function announce(message) {
        const toast = document.getElementById('site-status');
        if (!toast) return;
        clearTimeout(toastTimer);
        toast.textContent = message;
        toast.hidden = false;
        toastTimer = setTimeout(() => { toast.hidden = true; }, 4000);
    }
    function track(name, placement) {
        if (typeof window.gtag === 'function') window.gtag('event', name, {
            placement: placement || 'content', page_path: location.pathname, referral_code: CODE
        });
    }
    function fallbackCopy() {
        const active = document.activeElement;
        const text = document.createElement('textarea');
        text.value = CODE;
        text.setAttribute('readonly', '');
        text.style.cssText = 'position:fixed;left:-9999px;top:0;';
        document.body.append(text);
        text.select();
        let copied = false;
        try { copied = document.execCommand('copy'); } catch { /* Manual copy instructions follow. */ }
        text.remove();
        if (active && active.focus) active.focus({ preventScroll: true });
        return copied;
    }
    async function copyCode(button) {
        let copied = false;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(CODE);
                copied = true;
            }
        } catch { /* Try browser fallback before asking for manual copy. */ }
        if (!copied) copied = fallbackCopy();
        if (!copied) {
            announce('Copy unavailable. Select and copy this code: ' + CODE);
            const code = button.closest('.claim-panel')?.querySelector('.referral-code');
            if (code && window.getSelection) {
                const range = document.createRange(); range.selectNodeContents(code);
                const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
            }
            return;
        }
        button.dataset.copied = 'true';
        announce(CODE + ' copied. Paste it into the referral field on RSI.');
        track('copy_referral_code', button.dataset.placement);
        setTimeout(() => { delete button.dataset.copied; }, 2200);
    }
    function setTheme(theme) {
        const value = theme === 'light' ? 'light' : 'dark';
        document.documentElement.dataset.theme = value;
        storage.set('theme', value);
        const button = document.getElementById('theme-toggle');
        if (button) {
            button.setAttribute('aria-label', value === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
            button.setAttribute('aria-pressed', String(value === 'light'));
        }
    }
    function setLanguage(value) {
        language = messages[value] ? value : 'en';
        storage.set('language', language);
        const dict = messages[language];
        document.querySelectorAll('[data-signup-text]').forEach(el => {
            const key = el.dataset.signupText;
            if (dict[key]) { el.innerHTML = dict[key]; el.lang = dict.language; }
        });
        const select = document.getElementById('language-select');
        if (select) select.value = language;
    }
    function setupAnalytics() {
        if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        // One config call sends the page view; never send a duplicate manual page_view.
        window.gtag('config', ANALYTICS_ID);
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ANALYTICS_ID;
        document.head.append(script);
    }
    function init() {
        setTheme(storage.get('theme'));
        const saved = storage.get('language');
        const aliases = { ja: 'jp', ko: 'kr', zh: 'cn' };
        const base = (navigator.language || 'en').split('-')[0];
        setLanguage(saved || aliases[base] || base);
        document.querySelectorAll('[data-copy-code]').forEach(button => button.addEventListener('click', () => copyCode(button)));
        document.querySelectorAll('[data-referral-link]').forEach(link => link.addEventListener('click', () => track('open_rsi_signup', link.dataset.placement)));
        document.getElementById('theme-toggle')?.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
        document.getElementById('language-select')?.addEventListener('change', event => setLanguage(event.target.value));
        const menu = document.getElementById('main-nav');
        const menuButton = document.getElementById('menu-toggle');
        function closeMenu() { if (menu) menu.dataset.open = 'false'; menuButton?.setAttribute('aria-expanded', 'false'); }
        menuButton?.addEventListener('click', () => {
            const open = menu?.dataset.open !== 'true';
            if (menu) menu.dataset.open = String(open);
            menuButton.setAttribute('aria-expanded', String(open));
        });
        menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
        document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); if (menuButton && menuButton.offsetParent) menuButton.focus(); } });
        const heroAction = document.getElementById('enlist-link');
        const dock = document.getElementById('mobile-dock');
        if (heroAction && dock && 'IntersectionObserver' in window) {
            new IntersectionObserver(entries => {
                const entry = entries[0];
                dock.dataset.show = String(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
            }, { rootMargin: '-80px 0px 0px 0px' }).observe(heroAction);
        }
        // Fixed event dates expire instead of moving forward on every visit.
        document.querySelectorAll('[data-event-end]').forEach(event => {
            if (Date.now() >= Date.parse(event.dataset.eventEnd)) {
                const state = event.querySelector('[data-event-state]');
                if (state) state.textContent = 'Event ended';
                const copy = event.querySelector('[data-event-copy]');
                if (copy && event.dataset.expiredCopy) copy.textContent = event.dataset.expiredCopy;
            }
        });
        setupAnalytics();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
