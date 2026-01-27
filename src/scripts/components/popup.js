import { validateEmail } from '../utils/validation.js';
import { setItem, getItem, setSessionItem, getSessionItem } from '../utils/storage.js';
import { disableBodyScroll, enableBodyScroll, showNotification } from '../main.js';

const POPUP_CONFIG = {
    delay: 4000,               
    frequency: 'always',        
    devMode: false             
};

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('popupOverlay');
    const form = document.getElementById('popupFormulario');
    const emailInput = document.getElementById('popupEmail');
    
    if (!overlay || !form) return;

    /* Cerrar popup */
    const cerrar = () => {
        overlay.classList.remove('active');
        enableBodyScroll();
    };

    /* Verificar si debe mostrarse */
    const verificarMostrar = () => {
        if (POPUP_CONFIG.devMode) return true;

        const hoy = new Date().toDateString();
        const yaSuscrito = getItem('popupSubscribed');

        switch (POPUP_CONFIG.frequency) {
            case 'session': 
                return !yaSuscrito && !getSessionItem('popupClosed');
            case 'daily':   
                return !yaSuscrito && getItem('popupLastShown') !== hoy;
            case 'once':    
                return !yaSuscrito && !getItem('popupPermanentClose');
            case 'always':  
                return true;
            default:        
                return true;
        }
    };

    /* Registrar cierre */
    const registrarCierre = () => {
        const hoy = new Date().toDateString();
        
        if (POPUP_CONFIG.frequency === 'session') {
            setSessionItem('popupClosed', 'true');
        }
        if (POPUP_CONFIG.frequency === 'daily') {
            setItem('popupLastShown', hoy);
        }
        if (POPUP_CONFIG.frequency === 'once') {
            setItem('popupPermanentClose', 'true');
        }
    };

    /* Abrir popup */
    if (verificarMostrar()) {
        setTimeout(() => {
            overlay.classList.add('active');
            disableBodyScroll();
        }, POPUP_CONFIG.delay);
    }

    /* Eventos de cierre */
    const btnCerrar = document.getElementById('popupCerrar');
    const piePaso = document.querySelector('.popup-pie-texto');
    
    if (btnCerrar) {
        btnCerrar.addEventListener('click', (e) => {
            e.preventDefault();
            registrarCierre();
            cerrar();
        });
    }

    if (piePaso) {
        piePaso.addEventListener('click', (e) => {
            e.preventDefault();
            registrarCierre();
            cerrar();
        });
    }

    /* Cerrar al hacer click fuera */
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            registrarCierre();
            cerrar();
        }
    });

    /* Cerrar con tecla Escape */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            registrarCierre();
            cerrar();
        }
    });

    /* Envío de formulario */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();

        /* Validar email */
        if (!validateEmail(email)) {
            showNotification('Introduce un email válido', 'error');
            return;
        }

        const btn = form.querySelector('.popup-boton');
        const textoOriginal = btn.textContent;
        
        btn.textContent = 'ENVIANDO...';
        btn.disabled = true;

        /* Simulación de envío (reemplazar con API real) */
        setTimeout(() => {
            setItem('popupSubscribed', 'true');
            setItem('subscribedEmail', email);
            
            showNotification('¡Gracias por suscribirte! Revisa tu email.', 'success');
            
            /* Cerrar popup */
            cerrar();
            
            /* Resetear formulario */
            form.reset();
            btn.textContent = textoOriginal;
            btn.disabled = false;
        }, 1500);
    });
});