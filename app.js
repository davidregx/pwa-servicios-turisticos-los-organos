// Variables globales
let currentSlide = 0;
let cart = [];
let selectedServices = {};

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Registrar service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => console.log('SW registrado:', registration))
            .catch(error => console.log('Error SW:', error));
    }
    
    // Inicializar modo noche
    initializeDarkMode();
    
    // Inicializar carrusel automático
    if (document.querySelector('.carousel-slide')) {
        startCarousel();
    }
    
    // Inicializar funcionalidades específicas de cada página
    initializePageSpecificFeatures();
}

// Funcionalidad de modo noche
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    
    // Verificar preferencia guardada
    const darkModePreference = localStorage.getItem('darkMode');
    if (darkModePreference === 'enabled') {
        body.classList.add('dark-mode');
        updateDarkModeToggleIcon(true);
    }
    
    // Event listener para el botón
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
}

function toggleDarkMode() {
    const body = document.body;
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    body.classList.toggle('dark-mode');
    
    const isDarkMode = body.classList.contains('dark-mode');
    
    // Guardar preferencia
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    
    // Actualizar icono
    updateDarkModeToggleIcon(isDarkMode);
}

function updateDarkModeToggleIcon(isDarkMode) {
    const toggleIcon = document.querySelector('.toggle-icon');
    if (toggleIcon) {
        toggleIcon.textContent = isDarkMode ? '☀️' : '🌙';
    }
}

// Navegación entre páginas
function navigateTo(page) {
    window.location.href = page;
}

function goBack() {
    window.location.href = 'index.html';
}

// Funcionalidad del carrusel
function startCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    
    if (slides.length === 0) return;
    
    // Cambio automático cada 4 segundos
    setInterval(() => {
        nextSlide();
    }, 4000);
}

function showSlide(n) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    
    if (n >= slides.length) currentSlide = 0;
    if (n < 0) currentSlide = slides.length - 1;
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    if (slides[currentSlide]) {
        slides[currentSlide].classList.add('active');
    }
    if (dots[currentSlide]) {
        dots[currentSlide].classList.add('active');
    }
}

function nextSlide() {
    currentSlide++;
    showSlide(currentSlide);
}

function currentSlideSet(n) {
    currentSlide = n - 1;
    showSlide(currentSlide);
}

// Funcionalidades específicas por página
function initializePageSpecificFeatures() {
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'movilidad.html':
            initializeMovilidad();
            break;
        case 'restaurantes.html':
            initializeRestaurantes();
            break;
        case 'tours.html':
            initializeTours();
            break;
        case 'tienda.html':
            initializeTienda();
            break;
    }
}

// Funcionalidad de Movilidad (Taxi)
function initializeMovilidad() {
    console.log('Inicializando página de movilidad');
}

function selectTaxi(taxiId, taxiName, price) {
    // Limpiar selecciones anteriores
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Seleccionar el taxi actual
    event.target.closest('.service-card').classList.add('selected');
    
    selectedServices.taxi = {
        id: taxiId,
        name: taxiName,
        price: price
    };
    
    updateCartSummary();
}

function reserveTaxi() {
    if (!selectedServices.taxi) {
        alert('Por favor selecciona un taxi primero');
        return;
    }
    
    const pickup = document.getElementById('pickup-location')?.value || 'No especificado';
    const destination = document.getElementById('destination')?.value || 'No especificado';
    const time = document.getElementById('pickup-time')?.value || 'Ahora';
    
    const message = `🚗 *RESERVA DE TAXI*\n\n` +
                   `Taxi: ${selectedServices.taxi.name}\n` +
                   `Precio: ${selectedServices.taxi.price}\n` +
                   `Recojo: ${pickup}\n` +
                   `Destino: ${destination}\n` +
                   `Hora: ${time}\n\n` +
                   `Por favor confirmar disponibilidad.`;
    
    sendWhatsAppMessage(message, '51999999999'); // Número de ejemplo
}

// Funcionalidad de Restaurantes
function initializeRestaurantes() {
    console.log('Inicializando página de restaurantes');
    cart = [];
}

function selectDish(dishId, dishName, price, restaurant) {
    const existingItem = cart.find(item => item.id === dishId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: dishId,
            name: dishName,
            price: price,
            restaurant: restaurant,
            quantity: 1
        });
    }
    
    updateCartSummary();
    
    // Feedback visual
    event.target.textContent = 'Agregado ✓';
    event.target.style.background = '#4CAF50';
    
    setTimeout(() => {
        event.target.textContent = 'Agregar al pedido';
        event.target.style.background = '';
    }, 1500);
}

function orderFood() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    let message = `🍽️ *PEDIDO DE RESTAURANTE*\n\n`;
    let total = 0;
    
    // Agrupar por restaurante
    const ordersByRestaurant = {};
    cart.forEach(item => {
        if (!ordersByRestaurant[item.restaurant]) {
            ordersByRestaurant[item.restaurant] = [];
        }
        ordersByRestaurant[item.restaurant].push(item);
        total += parseFloat(item.price.replace('S/', '')) * item.quantity;
    });
    
    // Construir mensaje
    Object.keys(ordersByRestaurant).forEach(restaurant => {
        message += `📍 *${restaurant}*\n`;
        ordersByRestaurant[restaurant].forEach(item => {
            message += `• ${item.name} x${item.quantity} - ${item.price}\n`;
        });
        message += '\n';
    });
    
    message += `💰 *Total: S/${total.toFixed(2)}*\n\n`;
    message += `Dirección de entrega: _Por favor proporcionar_\n`;
    message += `Teléfono: _Por favor proporcionar_`;
    
    sendWhatsAppMessage(message, '51888888888'); // Número de ejemplo
}

// Funcionalidad de Tours
function initializeTours() {
    console.log('Inicializando página de tours');
}

function selectTour(tourId, tourName, price) {
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    event.target.closest('.service-card').classList.add('selected');
    
    selectedServices.tour = {
        id: tourId,
        name: tourName,
        price: price
    };
    
    updateCartSummary();
}

function bookTour() {
    if (!selectedServices.tour) {
        alert('Por favor selecciona un tour primero');
        return;
    }
    
    const date = document.getElementById('tour-date')?.value || 'Por definir';
    const people = document.getElementById('people-count')?.value || '1';
    
    const message = `🏄‍♂️ *RESERVA DE TOUR*\n\n` +
                   `Tour: ${selectedServices.tour.name}\n` +
                   `Precio: ${selectedServices.tour.price}\n` +
                   `Fecha preferida: ${date}\n` +
                   `Número de personas: ${people}\n\n` +
                   `Por favor confirmar disponibilidad y detalles.`;
    
    sendWhatsAppMessage(message, '51777777777'); // Número de ejemplo
}

// Funcionalidad de Tienda
function initializeTienda() {
    console.log('Inicializando página de tienda');
    cart = [];
}

function addToShoppingList(productId, productName, price) {
    const quantity = parseInt(document.getElementById(`quantity-${productId}`)?.value) || 1;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: price,
            quantity: quantity
        });
    }
    
    updateCartSummary();
    
    // Feedback visual
    event.target.textContent = 'Agregado ✓';
    event.target.style.background = '#4CAF50';
    
    setTimeout(() => {
        event.target.textContent = 'Agregar a lista';
        event.target.style.background = '';
    }, 1500);
}

function sendShoppingList() {
    if (cart.length === 0) {
        alert('Tu lista está vacía');
        return;
    }
    
    let message = `🛒 *LISTA DE COMPRAS*\n\n`;
    let total = 0;
    
    cart.forEach(item => {
        const itemPrice = parseFloat(item.price.replace('S/', ''));
        const itemTotal = itemPrice * item.quantity;
        message += `• ${item.name} x${item.quantity} - ${item.price} c/u = S/${itemTotal.toFixed(2)}\n`;
        total += itemTotal;
    });
    
    message += `\n💰 *Total estimado: S/${total.toFixed(2)}*\n\n`;
    message += `Dirección de entrega: _Por favor proporcionar_\n`;
    message += `Teléfono: _Por favor proporcionar_`;
    
    sendWhatsAppMessage(message, '51666666666'); // Número de ejemplo
}

// Funciones auxiliares
function updateCartSummary() {
    const cartSummary = document.getElementById('cart-summary');
    if (!cartSummary) return;
    
    if (cart.length === 0 && Object.keys(selectedServices).length === 0) {
        cartSummary.classList.add('hidden');
        return;
    }
    
    cartSummary.classList.remove('hidden');
    
    let summaryHTML = '<h4>Resumen</h4>';
    
    // Mostrar servicios seleccionados
    Object.values(selectedServices).forEach(service => {
        summaryHTML += `<p>${service.name} - ${service.price}</p>`;
    });
    
    // Mostrar items del carrito
    if (cart.length > 0) {
        let total = 0;
        cart.forEach(item => {
            const itemPrice = parseFloat(item.price.replace('S/', ''));
            total += itemPrice * item.quantity;
            summaryHTML += `<p>${item.name} x${item.quantity}</p>`;
        });
        summaryHTML += `<p><strong>Total: S/${total.toFixed(2)}</strong></p>`;
    }
    
    cartSummary.innerHTML = summaryHTML;
}

function sendWhatsAppMessage(message, phoneNumber) {
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
}

function clearCart() {
    cart = [];
    selectedServices = {};
    updateCartSummary();
    
    // Limpiar selecciones visuales
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('selected');
    });
}

// Funciones para el carrusel (accesibles globalmente)
window.currentSlide = function(n) {
    currentSlideSet(n);
};

// Funciones de navegación (accesibles globalmente)
window.navigateTo = navigateTo;
window.goBack = goBack;

// Funciones de servicios (accesibles globalmente)
window.selectTaxi = selectTaxi;
window.reserveTaxi = reserveTaxi;
window.selectDish = selectDish;
window.orderFood = orderFood;
window.selectTour = selectTour;
window.bookTour = bookTour;
window.addToShoppingList = addToShoppingList;
window.sendShoppingList = sendShoppingList;
window.clearCart = clearCart;

// Utilidades adicionales
function formatCurrency(amount) {
    return `S/${parseFloat(amount).toFixed(2)}`;
}

function getCurrentDateTime() {
    return new Date().toLocaleString('es-PE');
}

// Manejo de errores global
window.addEventListener('error', function(e) {
    console.error('Error en la aplicación:', e.error);
});

// Funcionalidad offline
window.addEventListener('online', function() {
    console.log('Conexión restaurada');
    // Aquí podrías sincronizar datos pendientes
});

window.addEventListener('offline', function() {
    console.log('Sin conexión a internet');
    // Mostrar mensaje al usuario sobre funcionalidad offline
});
