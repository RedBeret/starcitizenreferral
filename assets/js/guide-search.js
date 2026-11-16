/* Local filtering only: search text is never stored or added to the URL. */
(() => {
    const aliases = {
        doors:'door', controls:'control', keybind:'control', keybinds:'control', keybinding:'control', keybindings:'control', binding:'control', bindings:'control',
        credits:'credit', rentals:'rent', rental:'rent', renting:'rent', friends:'friend',
        refueling:'refuel', refuelling:'refuel', fueling:'refuel', fuelling:'refuel', repairing:'repair',
        profits:'profit', income:'profit', earnings:'profit', earning:'profit',
        created:'signup', creating:'signup', creation:'signup', register:'signup', registering:'signup', registration:'signup',
        retrieval:'retrieve'
    };
    const questionWords = new Set('a an the i my me we our you your how what where why who when which do does did can could should would will is are was were be been being to for from of in on at with and or all some much get getting use using add added after before make mean please'.split(' '));
    function normalize(value) {
        return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
            .replace(/\b50\s*[, ]\s*000\b/g,'50000').replace(/\b50k\b/g,'50000')
            .replace(/\bset\s+up\b/g,'setup').replace(/[^a-z0-9]+/g,' ').trim();
    }
    function tokens(value) { return normalize(value).split(/\s+/).filter(Boolean).map(word=>aliases[word]||word); }
    function queryTerms(value) {
        const question = normalize(value);
        if (['where is my ship','where can i find my ship','my ship is missing','missing ship','lost ship'].includes(question)) return ['retrieve','ship'];
        // Keep meaningful negatives such as "not working" and "no credits".
        return tokens(value).filter(word=>!questionWords.has(word));
    }
    if (typeof module!=='undefined' && module.exports) module.exports={normalize,tokens,queryTerms};
    if (typeof document==='undefined') return;
    const form = document.querySelector('[data-guide-search]');
    if (!form) return;
    const query = form.querySelector('[name="guide-query"]');
    const category = form.querySelector('[name="guide-category"]');
    const groups = [...document.querySelectorAll('[data-guide-group]')];
    const links = [...document.querySelectorAll('[data-guide-category]')];
    const cards = [...document.querySelectorAll('.library-card')];
    const index = new Map(cards.map(card => {
        const words=tokens(card.dataset.search || card.textContent);
        return [card,{words:new Set(words),text:words.join(' ')}];
    }));
    function filter() {
        const words = queryTerms(query.value);
        let count = 0;
        for (const group of groups) {
            let visible = 0;
            for (const card of group.querySelectorAll('.library-card')) {
                const content=index.get(card);
                const matches = (!category.value || category.value === group.dataset.guideGroup) && words.every(word => word.length<=2 ? content.words.has(word) : content.text.includes(word));
                card.hidden = !matches;
                if (matches) {visible++;count++;}
            }
            group.hidden = visible === 0;
            const link = links.find(item => item.dataset.guideCategory === group.id);
            if (link) link.hidden = group.hidden;
        }
        form.querySelector('[data-guide-count]').textContent = `${count} of ${cards.length} guides shown`;
        document.querySelector('[data-guide-empty]').hidden = count !== 0;
    }
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('input', filter);
    form.addEventListener('change', filter);
    form.addEventListener('reset', () => setTimeout(filter, 0));
    window.addEventListener('pageshow', filter);
    form.hidden = false;
    filter();
})();
