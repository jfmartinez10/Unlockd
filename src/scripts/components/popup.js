import { validateEmail } from '../utils/validation.js';
import { setItem, getItem, setSessionItem, getSessionItem } from '../utils/storage.js';
import { disableBodyScroll, enableBodyScroll, showNotification } from '../main.js';

/* Inyectar CSS una sola vez */
if (!document.querySelector('link[href*="popup.css"]')) {
    const _link = document.createElement('link');
    _link.rel  = 'stylesheet';
    _link.href = '/src/styles/pages/popup.css';
    document.head.appendChild(_link);
}

/* Previene parpadeo visual */
const _critStyle = document.createElement('style');
_critStyle.textContent = '.popup-overlay:not(.active){opacity:0;visibility:hidden;pointer-events:none}';
document.head.prepend(_critStyle);

/* HTML del popup */
const POPUP_HTML = `
<div class="popup-overlay" id="popupOverlay">
    <div class="popup-contenedor">
        <button class="popup-cerrar" id="popupCerrar" aria-label="Cerrar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path fill="#000000" d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"/>
            </svg>
        </button>
        <div class="popup-contenido">
            <div class="popup-izquierda">
                <h2 class="popup-titulo">¡Desbloquea<br>tu estilo!</h2>
                <div class="popup-texto">
                    <p>Suscríbete para recibir un <strong>10% de descuento</strong> en tu primera compra y ser el primero en saber sobre nuevos drops.</p>
                </div>
                <form class="popup-formulario" id="popupFormulario">
                    <input
                        type="email"
                        class="popup-entrada"
                        placeholder="Email"
                        required
                        id="popupEmail"
                    >
                    <button type="submit" class="popup-boton">DESBLOQUEAR AHORA</button>
                </form>
                <p class="popup-pie-texto">Paso, que pereza!</p>
            </div>
            <div class="popup-derecha">
                <img src="/public/assets/images/pestaña-emergente.png" alt="Modelo Unlockd" class="popup-imagen">
            </div>
        </div>
    </div>
</div>`;

const POPUP_CONFIG = {
    delay: 4000,               
    frequency: 'always',        
    devMode: false             
};

document.addEventListener('DOMContentLoaded', () => {
    /* Inyectar HTML si no existe */
    if (!document.getElementById('popupOverlay')) {
        document.body.insertAdjacentHTML('beforeend', POPUP_HTML);
    }

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
