/* Arithmetic for fictional game currency; no storage or network requests. */
(() => {
    'use strict';
    function calculate({reward, crew, costs, minutes}) {
        for (const value of [reward, crew, costs, minutes]) {
            if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Enter finite numbers for every field.');
        }
        if (!Number.isInteger(reward) || reward < 0 || reward > 1e12) throw new Error('Reward must be a whole amount from 0 to 1,000,000,000,000.');
        if (!Number.isInteger(costs) || costs < 0 || costs > 1e12) throw new Error('Costs must be a whole amount from 0 to 1,000,000,000,000.');
        if (!Number.isInteger(crew) || crew < 1 || crew > 1000) throw new Error('Use 1 to 1,000 participants.');
        if (!Number.isInteger(minutes) || minutes < 1 || minutes > 100000) throw new Error('Use 1 to 100,000 whole minutes.');
        const share = reward / crew;
        const net = share - costs;
        return {share, net, rate: net * 60 / minutes};
    }
    if (typeof module !== 'undefined' && module.exports) module.exports = {calculate};
    if (typeof document === 'undefined') return;
    const form = document.querySelector('[data-budget-form]');
    if (!form) return;
    const results = form.querySelector('[data-budget-results]');
    const error = form.querySelector('[data-budget-error]');
    const format = new Intl.NumberFormat('en-US', {maximumFractionDigits: 2});
    function clearResults() {
        results.hidden = true;
        error.textContent = '';
    }
    function render() {
        clearResults();
        if (!form.checkValidity()) {
            error.textContent = 'Complete every field using the allowed whole-number range.';
            form.reportValidity();
            return;
        }
        try {
            const values = Object.fromEntries(['reward','crew','costs','minutes'].map(name => [name, form.elements.namedItem(name).valueAsNumber]));
            const estimate = calculate(values);
            for (const name of ['share','net','rate']) form.querySelector(`[data-budget-${name}]`).textContent = format.format(estimate[name]) + ' aUEC' + (name === 'rate' ? ' / hour' : '');
            form.querySelector('[data-budget-note]').textContent = estimate.net < 0
                ? 'Your entered costs exceed your share. This estimate assumes the mission reward is received.'
                : 'Estimate only. Equal shares assumed; actual game rounding and mission completion are not predicted.';
            results.hidden = false;
        } catch (problem) {
            error.textContent = problem.message;
        }
    }
    form.noValidate = true;
    form.addEventListener('submit', event => {event.preventDefault();render();});
    form.addEventListener('input', clearResults);
    form.addEventListener('reset', clearResults);
    form.querySelector('[data-budget-example]').addEventListener('click', () => {
        for (const [name,value] of Object.entries({reward:30000,crew:2,costs:3000,minutes:45})) form.elements.namedItem(name).value = value;
        render();
    });
    form.hidden = false;
})();
