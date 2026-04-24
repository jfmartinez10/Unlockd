/* Toast Unlockd */

/* Inyectar CSS */
if (!document.querySelector('link[href*="toast.css"]')) {
    const _link = document.createElement('link');
    _link.rel  = 'stylesheet';
    _link.href = '/src/styles/components/toast.css';
    document.head.appendChild(_link);
}


const CLOSE_SVG = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="10" y1="2" x2="2" y2="10"/><line x1="2" y1="2" x2="10" y2="10"/></svg>`;

function _getContainer() {
    let c = document.getElementById('unlockd-toast-container');
    if (!c) {
        c = document.createElement('div');
        c.id = 'unlockd-toast-container';
        document.body.appendChild(c);
    }
    return c;
}

export function showNotification(message, type = 'info', duration = 3500) {
    const container = _getContainer();

    const toast = document.createElement('div');
    toast.className = `unlockd-toast toast-${type}`;
    toast.innerHTML = `
        <div class="unlockd-toast-marco">
            <div class="toast-glass-bg"></div>
            <div class="unlockd-toast-inner">
                <span class="unlockd-toast-msg">${message}</span>
                <button class="unlockd-toast-cerrar" aria-label="Cerrar">${CLOSE_SVG}</button>
            </div>
        </div>`;

    container.appendChild(toast);

    /* Animación entrada */
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('visible')));

    let gone = false;
    function dismiss() {
        if (gone) return;
        gone = true;
        clearTimeout(timer);
        toast.classList.remove('visible');
        toast.classList.add('saliendo');
        setTimeout(() => toast.remove(), 340);
    }

    toast.querySelector('.unlockd-toast-cerrar').addEventListener('click', dismiss);
    const timer = setTimeout(dismiss, duration);
}
