/* Local filtering only: search text is never stored or added to the URL. */
(() => {
    const form = document.querySelector('[data-guide-search]');
    if (!form) return;
    const query = form.querySelector('[name="guide-query"]');
    const category = form.querySelector('[name="guide-category"]');
    const groups = [...document.querySelectorAll('[data-guide-group]')];
    const links = [...document.querySelectorAll('[data-guide-category]')];
    const cards = [...document.querySelectorAll('.library-card')];
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const index = new Map(cards.map(card => [card, normalize(card.dataset.search || card.textContent)]));
    function filter() {
        const words = normalize(query.value).split(/\s+/).filter(Boolean);
        let count = 0;
        for (const group of groups) {
            let visible = 0;
            for (const card of group.querySelectorAll('.library-card')) {
                const matches = (!category.value || category.value === group.dataset.guideGroup) && words.every(word => word.length <= 2 ? index.get(card).split(' ').includes(word) : index.get(card).includes(word));
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
