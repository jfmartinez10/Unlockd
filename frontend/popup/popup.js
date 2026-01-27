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
});