// Only your referral code (100% of the time)
const YOUR_REFERRAL_CODE = 'STAR-9L66-ZTDY';

// State management
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentCode = localStorage.getItem('lastCode') || getRandomCode();

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Set initial state
    updateCode(currentCode);
    setTheme(currentTheme);

    // Initialize stats
    initializeStats();

    // Event listeners
    document.getElementById('copy-btn').addEventListener('click', copyCode);
    document.getElementById('generate-btn').addEventListener('click', generateNewCode);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Update enlist link
    updateEnlistLink();

    // Update stats periodically (every 15 minutes = 900000ms)
    setInterval(updateStats, 900000); // Update every 15 minutes
});

// Get code (always returns your code now)
function getRandomCode() {
    return YOUR_REFERRAL_CODE;
}

// Update displayed code
function updateCode(code) {
    currentCode = code;
    document.getElementById('referral-code').value = code;
    localStorage.setItem('lastCode', code);
    updateEnlistLink();
}

// Update enlist link
function updateEnlistLink() {
    const enlistLink = document.getElementById('enlist-link');
    enlistLink.href = `https://robertsspaceindustries.com/enlist?referral=${currentCode}`;
}

// Generate new code
function generateNewCode() {
    const button = document.getElementById('generate-btn');
    button.disabled = true;
    button.innerHTML = '<span class="loading"></span> Generating...';

    // Simulate API delay for realism
    setTimeout(() => {
        const newCode = getRandomCode();
        updateCode(newCode);

        // Animate the change
        const codeInput = document.getElementById('referral-code');
        codeInput.style.animation = 'none';
        setTimeout(() => {
            codeInput.style.animation = 'glow 2s ease-in-out';
        }, 10);

        button.disabled = false;
        button.innerHTML = '<span>🎲</span> Get Different Code';

        showToast('New code generated!', 'success');
    }, 500);
}

// Copy code to clipboard
async function copyCode() {
    const code = currentCode;
    const button = document.getElementById('copy-btn');

    try {
        await navigator.clipboard.writeText(code);
        button.classList.add('copied');
        button.innerHTML = '<span>✓</span> Copied!';

        showToast('Code copied to clipboard!', 'success');

        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = '<span class="copy-icon">📋</span><span class="copy-text">Copy Code</span>';
        }, 2000);
    } catch (err) {
        showToast('Failed to copy code', 'error');
    }
}

// Toggle theme
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(currentTheme);
}

// Set theme
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    document.getElementById('theme-toggle').textContent = theme === 'dark' ? '🌙' : '☀️';
}


// Show toast notification
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Track page views (for analytics)
if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
        page_title: 'Star Citizen Referral Code Generator',
        page_location: window.location.href
    });
}

// Initialize stats with high but realistic numbers
function initializeStats() {
    // Get or set initial values (high numbers for credibility)
    const baseUsers = parseInt(localStorage.getItem('totalUsers') || '3847');
    const baseCodes = parseInt(localStorage.getItem('activeCodes') || '428');

    // Set initial display
    document.getElementById('total-users').textContent = baseUsers.toLocaleString();
    document.getElementById('active-codes').textContent = baseCodes;
    updateOnlineUsers();
}

// Update stats dynamically
function updateStats() {
    // Increment by 1 every 15 minutes (96 per day)
    const totalUsersEl = document.getElementById('total-users');
    const currentUsers = parseInt(totalUsersEl.textContent.replace(/,/g, ''));
    const newUsers = currentUsers + 1;

    totalUsersEl.textContent = newUsers.toLocaleString();
    localStorage.setItem('totalUsers', newUsers.toString());

    // Animate the change
    totalUsersEl.style.color = '#4caf50';
    setTimeout(() => {
        totalUsersEl.style.color = 'var(--primary-color)';
    }, 500);

    // Update online users
    updateOnlineUsers();

    // Occasionally update active codes
    if (Math.random() > 0.9) {
        const activeCodesEl = document.getElementById('active-codes');
        const currentCodes = parseInt(activeCodesEl.textContent);
        const newCodes = currentCodes + (Math.random() > 0.5 ? 1 : -1);
        if (newCodes > 400 && newCodes < 450) {
            activeCodesEl.textContent = newCodes;
            localStorage.setItem('activeCodes', newCodes.toString());
        }
    }
}

// Update online users (realistic daily pattern)
function updateOnlineUsers() {
    const hour = new Date().getHours();
    let baseOnline = 30;

    // Simulate daily traffic patterns
    if (hour >= 19 && hour <= 23) baseOnline = 60; // Peak evening
    else if (hour >= 14 && hour <= 18) baseOnline = 45; // Afternoon
    else if (hour >= 0 && hour <= 6) baseOnline = 15; // Night

    // Add some randomness
    const variance = Math.floor(Math.random() * 20) - 10;
    const onlineNow = Math.max(5, baseOnline + variance);

    document.getElementById('online-now').textContent = onlineNow;
}

// Service Worker registration disabled for now
// Uncomment when ready to implement offline functionality
// if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('/sw.js').catch(err => {
//         console.log('Service Worker registration failed:', err);
//     });
// }