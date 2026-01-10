// ==============================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ==============================================

const imageLoader = document.getElementById('imageLoader');
const resetButton = document.getElementById('resetButton');
const widthInput = document.getElementById('canvasWidth');
const heightInput = document.getElementById('canvasHeight');
const ratioInput = document.getElementById('canvasRatio');
const grayscaleButton = document.getElementById('grayscaleButton');
const resetZoomButton = document.getElementById('resetZoomButton');

const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');

let originalImage = new Image();
let currentImage = new Image();
let scale = 1;

const config = {
    subdivisiones: 3,
    colorLineas: '#0f0',
    grosorLineas: 2,
};

// ==============================================
// FUNCIONES DE UTILIDAD
// ==============================================

/**
 * Calcula el MCD usando el algoritmo de Euclides
 */
function calcularMCD(a, b) {
    while (b !== 0) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

/**
 * Calcula la proporción simplificada de ancho:alto
 */
function calcularProporcion(ancho, alto) {
    if (ancho <= 0 || alto <= 0) {
        return "Error: Los valores deben ser positivos.";
    }

    const mcd = calcularMCD(ancho, alto);
    const ratioAncho = ancho / mcd;
    const ratioAlto = alto / mcd;

    return `${ratioAncho}:${ratioAlto}`;
}

/**
 * Actualiza el texto de proporción en el input
 */
function updateAspectRatioText() {
    const w = parseFloat(widthInput.value);
    const h = parseFloat(heightInput.value);
    if (!isNaN(w) && !isNaN(h)) {
        ratioInput.value = calcularProporcion(w, h);
    }
}

/**
 * Actualiza el zoom visual del canvas
 */
function updateZoom() {
    canvas.style.width = (canvas.width * scale) + 'px';
    canvas.style.height = (canvas.height * scale) + 'px';
}

// ==============================================
// FUNCIONES DE DIBUJO
// ==============================================

/**
 * Dibuja una cuadrícula sobre el canvas
 */
function dibujarCuadricula() {
    const { subdivisiones, colorLineas, grosorLineas } = config;
    const ancho = canvas.width;
    const alto = canvas.height;

    ctx.strokeStyle = colorLineas;
    ctx.lineWidth = grosorLineas;

    const tamañoCeldaAlto = alto / subdivisiones;
    const tamañoCeldaAncho = ancho / subdivisiones;

    // Líneas verticales
    for (let x = 0; x < ancho; x += tamañoCeldaAncho) {
        ctx.beginPath();
        ctx.moveTo(Math.floor(x) + 0.5, 0);
        ctx.lineTo(Math.floor(x) + 0.5, alto);
        ctx.stroke();
    }

    // Líneas horizontales
    for (let y = 0; y < alto; y += tamañoCeldaAlto) {
        ctx.beginPath();
        ctx.moveTo(0, Math.floor(y) + 0.5);
        ctx.lineTo(ancho, Math.floor(y) + 0.5);
        ctx.stroke();
    }
}

/**
 * Carga y dibuja una imagen en el canvas con el aspecto especificado
 */
function loadImageToCanvas(img) {
    const desiredWidthCm = parseFloat(widthInput.value) || 30;
    const desiredHeightCm = parseFloat(heightInput.value) || 40;
    const targetAspectRatio = desiredWidthCm / desiredHeightCm;

    const imgWidth = img.width;
    const imgHeight = img.height;
    const imgAspectRatio = imgWidth / imgHeight;

    let canvasWidth, canvasHeight;

    if (imgAspectRatio > targetAspectRatio) {
        canvasWidth = imgWidth;
        canvasHeight = imgWidth / targetAspectRatio;
    } else {
        canvasHeight = imgHeight;
        canvasWidth = imgHeight * targetAspectRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const x = (canvasWidth - imgWidth) / 2;
    const y = (canvasHeight - imgHeight) / 2;

    ctx.drawImage(img, x, y, imgWidth, imgHeight);
    dibujarCuadricula();
    updateAspectRatioText();
}

/**
 * Filtro de escala de grises
 */
function grayscaleFilter(r, g, b, a) {
    const avg = (r + g + b) / 3;
    return { r: avg, g: avg, b: avg, a: a };
}

/**
 * Procesa la imagen actual con un filtro
 */
function processImage(filterFunction) {
    if (!originalImage.src) {
        alert('Por favor, carga una imagen primero.');
        return;
    }

    loadImageToCanvas(currentImage);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        const newColors = filterFunction(r, g, b, a);
        pixels[i] = newColors.r;
        pixels[i + 1] = newColors.g;
        pixels[i + 2] = newColors.b;
        pixels[i + 3] = newColors.a;
    }

    ctx.putImageData(imageData, 0, 0);
    currentImage.src = canvas.toDataURL();
}

/**
 * Recarga el layout del canvas cuando cambian las medidas
 */
function refreshCanvasLayout() {
    if (currentImage.src && originalImage.complete) {
        loadImageToCanvas(originalImage);
    }
    updateAspectRatioText();
}

// ==============================================
// MANEJO DE EVENTOS
// ==============================================

// Cargar imagen
imageLoader.addEventListener('change', function (e) {
    const reader = new FileReader();
    reader.onload = function (event) {
        originalImage.onload = function () {
            currentImage.src = originalImage.src;
            loadImageToCanvas(originalImage);
        };
        originalImage.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

// Zoom con teclado
document.addEventListener('keydown', (e) => {
    if (!originalImage.src) return;

    if (e.key === '+' || e.key === 'Equal' || e.key === 'Add') {
        scale += 0.1;
        updateZoom();
    } else if (e.key === '-' || e.key === 'Minus' || e.key === 'Subtract') {
        scale = Math.max(0.1, scale - 0.1);
        updateZoom();
    }
});

// Botón escala de grises
grayscaleButton.addEventListener('click', () => {
    processImage(grayscaleFilter);
});

// Botón restablecer imagen
resetButton.addEventListener('click', () => {
    if (originalImage.src) {
        currentImage.src = originalImage.src;
        loadImageToCanvas(originalImage);
    } else {
        alert('No hay imagen para restablecer.');
    }
});

// Botón restablecer zoom
resetZoomButton.addEventListener('click', () => {
    scale = 1;
    updateZoom();
});

// Cambios en dimensiones del canvas
widthInput.addEventListener('change', refreshCanvasLayout);
heightInput.addEventListener('change', refreshCanvasLayout);

// ==============================================
// INICIALIZACIÓN
// ==============================================

dibujarCuadricula();
updateAspectRatioText();