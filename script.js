const imageLoader = document.getElementById('imageLoader');
const resetButton = document.getElementById('resetButton');

const widthInput = document.getElementById('canvasWidth');
const heightInput = document.getElementById('canvasHeight');
const ratioInput = document.getElementById('canvasRatio');

const grayscaleButton = document.getElementById('grayscaleButton');
const resetZoomButton = document.getElementById('resetZoomButton');

const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');

let originalImage = new Image(); // Para guardar la imagen original
let currentImage = new Image(); // Para la imagen actualmente mostrada/editada
let scale = 1; // Variable para el nivel de zoom

const config = {
    subdivisiones: 3,
    colorLineas: '#0f0',
    grosorLineas: 2,
}

// Función para actualizar el zoom visualmente
function updateZoom() {
    canvas.style.width = (canvas.width * scale) + 'px';
    canvas.style.height = (canvas.height * scale) + 'px';
}

// Función para cargar la imagen en el canvas
function loadImageToCanvas(img) {
    // 1. Obtener dimensiones deseadas del input (en cm, pero usaremos la proporción)
    const desiredWidthCm = parseFloat(widthInput.value) || 30;
    const desiredHeightCm = parseFloat(heightInput.value) || 40;
    const targetAspectRatio = desiredWidthCm / desiredHeightCm;

    console.log(targetAspectRatio);

    // 2. Determinar dimensiones del canvas basadas en la imagen y el ratio objetivo
    // Queremos que la imagen quepa enteramente (contain).
    // El canvas debe tener el ratio targetAspectRatio.
    // Y debe ser lo suficientemente grande para contener la imagen 'img'.

    const imgWidth = img.width;
    const imgHeight = img.height;
    const imgAspectRatio = imgWidth / imgHeight;

    let canvasWidth, canvasHeight;

    if (imgAspectRatio > targetAspectRatio) {
        // La imagen es más ancha que el canvas (relativamente)
        // El ancho de la imagen dicta el ancho del canvas
        canvasWidth = imgWidth;
        canvasHeight = imgWidth / targetAspectRatio;
    } else {
        // La imagen es más alta que el canvas (relativamente)
        // El alto de la imagen dicta el alto del canvas
        canvasHeight = imgHeight;
        canvasWidth = imgHeight * targetAspectRatio;
    }

    // Establecer dimensiones del canvas
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 3. Dibujar la imagen centrada (contain)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Rellenar fondo (opcional, por defecto transparente, podemos poner blanco si se quiere ver el "papel")
    // ctx.fillStyle = "#ffffff";
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calcular posición para centrar
    const x = (canvasWidth - imgWidth) / 2;
    const y = (canvasHeight - imgHeight) / 2;

    ctx.drawImage(img, x, y, imgWidth, imgHeight);

    // Resetear zoom al cargar nueva imagen
    //scale = 1;
    //updateZoom();

    // Llamar a la función al cargar la página
    dibujarCuadricula();

    // Actualizar el texto de proporción si existe la función
    if (typeof updateAspectRatioText === 'function') {
        updateAspectRatioText();
    }
}

// Función para procesar los píxeles
function processImage(filterFunction) {
    if (!originalImage.src) {
        alert('Por favor, carga una imagen primero.');
        return;
    }

    // Dibujar la imagen actual (o la original para empezar)
    loadImageToCanvas(currentImage);

    // Obtener los datos de los píxeles
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data; // Este es un TypedArray: [R1, G1, B1, A1, R2, G2, B2, A2, ...]

    // Aplicar la función de filtro a cada píxel
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3]; // Alpha

        // Aquí aplicamos el filtro
        const newColors = filterFunction(r, g, b, a);
        pixels[i] = newColors.r;
        pixels[i + 1] = newColors.g;
        pixels[i + 2] = newColors.b;
        pixels[i + 3] = newColors.a;
    }

    // Poner los datos de los píxeles modificados de nuevo en el canvas
    ctx.putImageData(imageData, 0, 0);

    // Actualizar currentImage para que las ediciones sean acumulativas si se desea
    currentImage.src = canvas.toDataURL();
}

// --- Funciones de Filtro ---

// Filtro: Escala de Grises (promedio simple)
function grayscaleFilter(r, g, b, a) {
    const avg = (r + g + b) / 3;
    return { r: avg, g: avg, b: avg, a: a };
}

/**
 * Usa el Algoritmo de Euclides para encontrar el Máximo Común Divisor (MCD)
 * de dos números.
 */
function calcularMCD(a, b) {
    // El algoritmo se ejecuta hasta que el segundo número (b) sea 0.
    // En cada iteración, 'a' se convierte en 'b', y 'b' se convierte en el residuo de a / b.
    while (b !== 0) {
        let temp = b;
        b = a % b; // El residuo de a dividido por b
        a = temp;
    }
    // Cuando b es 0, 'a' contiene el MCD
    return a;
}

/**
 * Calcula la proporción simplificada (ratio) de una resolución (ancho x alto).
 *
 * @param {number} ancho - El valor del ancho (ej: 1920).
 * @param {number} alto - El valor del alto (ej: 1080).
 * @returns {string} La proporción en formato A:B (ej: "16:9").
 */
function calcularProporcion(ancho, alto) {
    if (ancho <= 0 || alto <= 0) {
        return "Error: Los valores deben ser positivos.";
    }

    // 1. Calcula el MCD de ancho y alto
    const mcd = calcularMCD(ancho, alto);

    // 2. Divide ambos valores por el MCD para simplificar
    const ratioAncho = ancho / mcd;
    const ratioAlto = alto / mcd;

    // 3. Devuelve el resultado en formato A:B
    return `${ratioAncho}:${ratioAlto}`;
}

// Actualizar proporción en el input al cambiar valores
function updateAspectRatioText() {
    const w = parseFloat(widthInput.value);
    const h = parseFloat(heightInput.value);
    if (!isNaN(w) && !isNaN(h)) {
        ratioInput.value = calcularProporcion(w, h);
    }
}

// Recargar canvas cuando cambian las medidas
function refreshCanvasLayout() {
    if (currentImage.src) {
        // Si hay una imagen actual, la volvemos a "cargar" para recalcular el layout
        // Usamos originalImage si queremos resetear transformaciones o currentImage si es solo layout
        // Dado que loadImageToCanvas usa img.width/img.height originales del objeto imagen pasado,
        // para "re-encuadrar" lo mejor es usar la originalImage o asegurar que currentImage no está deformada.
        // En este flujo simple, usaremos originalImage para garantizar calidad al redimensionar.
        if (originalImage.complete) {
            loadImageToCanvas(originalImage);
        }
    }
    updateAspectRatioText();
}

function dibujarCuadricula() {
    const subdivisiones = config.subdivisiones;
    const colorLineas = config.colorLineas;
    const grosorLineas = config.grosorLineas;

    const ancho = canvas.width;
    const alto = canvas.height;

    // Configuración del estilo de la cuadrícula
    ctx.strokeStyle = colorLineas;
    ctx.lineWidth = grosorLineas;

    const tamañoCeldaAlto = alto / subdivisiones;
    const tamañoCeldaAncho = ancho / subdivisiones;

    // Dibujar Líneas Verticales
    for (let x = 0; x < ancho; x += tamañoCeldaAncho) {
        ctx.beginPath();
        // Mover el punto de inicio para evitar anti-aliasing borroso en líneas de 1px
        // Math.floor(x) + 0.5 es un truco común para líneas nítidas
        ctx.moveTo(Math.floor(x) + 0.5, 0);
        ctx.lineTo(Math.floor(x) + 0.5, alto);
        ctx.stroke();
    }

    // Dibujar Líneas Horizontales
    for (let y = 0; y < alto; y += tamañoCeldaAlto) {
        ctx.beginPath();
        ctx.moveTo(0, Math.floor(y) + 0.5);
        ctx.lineTo(ancho, Math.floor(y) + 0.5);
        ctx.stroke();
    }
}

/**
 * Eventos
 */

// Evento para cargar un archivo de imagen
imageLoader.addEventListener('change', function (e) {
    const reader = new FileReader();
    reader.onload = function (event) {
        originalImage.onload = function () {
            // Guardar una copia de la imagen original
            currentImage.src = originalImage.src; // Necesario para resetear
            loadImageToCanvas(originalImage);
        };
        originalImage.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

// Eventos de Teclado (Zoom)
document.addEventListener('keydown', (e) => {
    if (!originalImage.src) return; // No hacer zoom si no hay imagen

    if (e.key === '+' || e.key === 'Equal' || e.key === 'Add') { // + o = (para teclados sin numpad)
        scale += 0.1;
        updateZoom();
    } else if (e.key === '-' || e.key === 'Minus' || e.key === 'Subtract') { // -
        scale = Math.max(0.1, scale - 0.1); // Evitar zoom negativo o 0
        updateZoom();
    }
});

/**
 * Eventos de Botones
 */

// Botón de Escala de Grises
grayscaleButton.addEventListener('click', () => {
    processImage(grayscaleFilter);
});

// Botón de Restablecimiento
resetButton.addEventListener('click', () => {
    if (originalImage.src) {
        currentImage.src = originalImage.src; // Restablecer la imagen actual a la original
        loadImageToCanvas(originalImage);
    } else {
        alert('No hay imagen para restablecer.');
    }
});

// Botón de Restablecimiento de Zoom
resetZoomButton.addEventListener('click', () => {
    scale = 1;
    updateZoom();
});

/**
 * Eventos de Inputs
 */

widthInput.addEventListener('change', refreshCanvasLayout);
heightInput.addEventListener('change', refreshCanvasLayout);

// Llamar a la función al cargar la página
dibujarCuadricula();

// Inicializar
updateAspectRatioText();