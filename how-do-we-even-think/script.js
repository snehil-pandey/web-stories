
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const icon = themeToggle.querySelector('i');

// Detect system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

function setDarkMode(isDark) {
    if (isDark) {
        body.classList.add('dark-mode');
        icon.classList.replace('fa-moon', 'fa-sun');
        themeToggle.querySelector('span').textContent = 'Light Mode';
    } else {
        body.classList.remove('dark-mode');
        icon.classList.replace('fa-sun', 'fa-moon');
        themeToggle.querySelector('span').textContent = 'Dark Mode';
    }
}

// Initialize theme based on system preference only
setDarkMode(prefersDark);

// Toggle theme (without saving)
themeToggle.addEventListener('click', () => {
    const isDark = !body.classList.contains('dark-mode');
    setDarkMode(isDark);
});

// Watch for system theme changes (and respond accordingly)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    setDarkMode(e.matches);
});

// Share Story handler
function handleShareStory() {
    const shareData = {
        title: 'How Do We Even Think? — Snehil Pandey',
        text: '“Some thoughts arrive without a sound. And some never leave.” Read this short mysterious tale by Snehil Pandey.',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).then(() => {
            const feedback = document.getElementById('shareFeedback');
            if (feedback) {
                feedback.style.display = 'block';
                setTimeout(() => {
                    feedback.style.display = 'none';
                }, 2500);
            }
        });
    }
}

