/* Funcionalidad de carruseles originales */
document.addEventListener('DOMContentLoaded', () => {
    
    // Duplicar elementos del carrusel para efecto infinito
    const duplicarElementosCarrusel = (pista) => {
        const elementos = Array.from(pista.children);
        elementos.forEach(elemento => {
            const clon = elemento.cloneNode(true);
            pista.appendChild(clon);
        });
    };

    const pistaSuperior = document.getElementById('pista-superior');
    const pistaInferior = document.getElementById('pista-inferior');
    
    if (pistaSuperior) {
        duplicarElementosCarrusel(pistaSuperior);
    }
    
    if (pistaInferior) {
        duplicarElementosCarrusel(pistaInferior);
    }

    const carruselElementos = document.querySelectorAll('.carrusel-elemento');
    
    carruselElementos.forEach(elemento => {
        elemento.addEventListener('click', () => {
            const url = elemento.getAttribute('data-url');
            
            if (url) {
                window.location.href = url;
                const textoProducto = elemento.querySelector('span').textContent;
                console.log('Navegando a:', url, '- Producto:', textoProducto);
            }
        });
    });
});