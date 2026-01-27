const POPUP_CONFIG = {
    delay: 5000,
    frequency: 'always', 
    devMode: false
};

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('popupOverlay');
    const form = document.getElementById('popupFormulario');
    if (!overlay || !form) return;

    const cerrar = () => {
        overlay.classList.add('closing'); 
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    const verificarMostrar = () => {
        if (POPUP_CONFIG.devMode) return true;
        if (localStorage.getItem('popupSubscribed')) return false;

        const hoy = new Date().toDateString();

        switch (POPUP_CONFIG.frequency) {
            case 'session': return !sessionStorage.getItem('popupClosed');
            case 'daily':   return localStorage.getItem('popupLastShown') !== hoy;
            case 'once':    return !localStorage.getItem('popupPermanentClose');
            case 'always':  return true;
            default:        return true;
        }
    };

    const registrarCierre = () => {
        const hoy = new Date().toDateString();
        if (POPUP_CONFIG.frequency === 'session') sessionStorage.setItem('popupClosed', 'true');
        if (POPUP_CONFIG.frequency === 'daily')   localStorage.setItem('popupLastShown', hoy);
        if (POPUP_CONFIG.frequency === 'once')    localStorage.setItem('popupPermanentClose', 'true');
    };
});