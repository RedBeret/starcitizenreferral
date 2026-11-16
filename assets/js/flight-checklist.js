/* Session-only checklist: no storage, requests or connection to the game. */
(() => {
    const form = document.querySelector('[data-flight-checklist]');
    if (!form) return;
    const boxes = [...form.querySelectorAll('input[type="checkbox"]')];
    const progress = form.querySelector('[data-checklist-progress]');
    progress.hidden = false;
    function update() {
        const checked = boxes.filter(box => box.checked).length;
        progress.textContent = `${checked} of ${boxes.length} items checked${checked === boxes.length ? ' — review complete' : ''}`;
    }
    form.addEventListener('change', update);
    form.addEventListener('reset', () => {
        // Native reset applies after the event; update the count afterwards.
        setTimeout(update, 0);
    });
    const print = form.querySelector('[data-print-checklist]');
    print.hidden = false;
    print.addEventListener('click', () => window.print());
    window.addEventListener('pageshow', update);
    update();
})();
