const POPUP_CONFIG = {
    delay: 4000,
    frequency: 'always', // 'session', 'daily', 'once', 'always'
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

        const hoy = new Date().toDateString();
        const yaSuscrito = localStorage.getItem('popupSubscribed');

        switch (POPUP_CONFIG.frequency) {
            case 'session': 
                return !yaSuscrito && !sessionStorage.getItem('popupClosed');
            case 'daily':   
                return !yaSuscrito && localStorage.getItem('popupLastShown') !== hoy;
            case 'once':    
                return !yaSuscrito && !localStorage.getItem('popupPermanentClose');
            case 'always':  
                return true;
            default:        
                return true;
        }
    };

    const registrarCierre = () => {
        const hoy = new Date().toDateString();
        if (POPUP_CONFIG.frequency === 'session') sessionStorage.setItem('popupClosed', 'true');
        if (POPUP_CONFIG.frequency === 'daily')   localStorage.setItem('popupLastShown', hoy);
        if (POPUP_CONFIG.frequency === 'once')    localStorage.setItem('popupPermanentClose', 'true');
    };

    // Lógica de apertura
    if (verificarMostrar()) {
        setTimeout(() => {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, POPUP_CONFIG.delay);
    }

    // Eventos de cierre
    document.querySelectorAll('#popupCerrar, .popup-pie-texto').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            registrarCierre();
            cerrar();
        });
    });

    overlay.addEventListener('click', (e) => { if (e.target === overlay) { registrarCierre(); cerrar(); } });
    document.addEventListener('keydown', (e) => { 
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            registrarCierre();
            cerrar();
        }
    });

    // Envío de Formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('.popup-boton');
        const email = document.getElementById('popupEmail').value.trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('Introduce un email válido');

        btn.textContent = 'ENVIANDO...';
        btn.disabled = true;

        // Simulación de éxito
        setTimeout(() => {
            localStorage.setItem('popupSubscribed', 'true');
            alert('¡Gracias por suscribirte!');
            cerrar();
        }, 1200);
    });
});