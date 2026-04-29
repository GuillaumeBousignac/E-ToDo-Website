document.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button');
    btn.id = 'colorblind-toggle';
    btn.className = 'icon-btn';
    btn.setAttribute('aria-label', 'Colorblind mode');
    btn.setAttribute('title', 'Colorblind mode');
    btn.innerHTML = '<i class="fas fa-eye"></i>';

    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        headerActions.insertBefore(btn, headerActions.firstChild);
    }

    const notification = document.createElement('div');
    notification.id = 'colorblind-notification';
    notification.className = 'colorblind-notification';
    notification.style.display = 'none';

    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
        headerTitle.parentNode.insertBefore(notification, headerTitle.nextSibling);
    }

    const modes = ['normal', 'tritanopia'];
    const modeLabels = {
        'normal': '👁️ Normal',
        'tritanopia': '👓 Tritanopia'
    };

    let currentModeIndex = 0;

    function applyColorblindMode(mode) {
        const root = document.documentElement;

        if (mode === 'normal') {
            root.removeAttribute('data-colorblind');
        } else {
            root.setAttribute('data-colorblind', mode);
        }
        
        localStorage.setItem('colorblindMode', mode);
    }

    function showNotification(mode) {
        notification.textContent = modeLabels[mode];
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 4000);
    }

    function updateButtonStyle(mode) {
        if (mode !== 'normal') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }

    const savedMode = localStorage.getItem('colorblindMode') || 'normal';
    applyColorblindMode(savedMode);
    updateButtonStyle(savedMode);

    currentModeIndex = modes.indexOf(savedMode);

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        currentModeIndex = (currentModeIndex + 1) % modes.length;
        const nextMode = modes[currentModeIndex];
        
        applyColorblindMode(nextMode);
        updateButtonStyle(nextMode);
        
        showNotification(nextMode);
    });
});