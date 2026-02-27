// Lazy-load service videos when they enter viewport (optimization)
const serviceVideoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const video = entry.target;
        const src = video.dataset.src || video.querySelector('source')?.dataset.src;
        if (src) {
            const source = video.querySelector('source');
            if (source && !source.src) {
                source.src = src;
                video.load();
            }
        }
        serviceVideoObserver.unobserve(video);
    });
}, { rootMargin: '100px' });

document.querySelectorAll('.service-video video[data-src]').forEach((video) => {
    serviceVideoObserver.observe(video);
});

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Smooth Scrolling (solo anclas válidas #id para evitar inyección)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href') || '';
        if (href === '#' || !/^#[A-Za-z0-9_-]+$/.test(href)) return;
        if (href === '#privacyModal') return; // lo maneja el modal de aviso de privacidad
        e.preventDefault();
        const target = document.getElementById(href.slice(1));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Dark mode toggle
const THEME_KEY = 'drfrio-theme';
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.querySelector('.theme-icon');

function setTheme(dark) {
    document.body.classList.toggle('dark-mode', dark);
    if (themeIcon) themeIcon.textContent = dark ? '☀️' : '🌙';
    if (themeToggle) themeToggle.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch (_) {}
}

function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved === 'dark' || (!saved && prefersDark);
    setTheme(dark);
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        setTheme(!document.body.classList.contains('dark-mode'));
    });
}
initTheme();

// Navbar scroll effect (respects dark mode)
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const isDark = document.body.classList.contains('dark-mode');
    if (!navbar) return;
    if (window.scrollY > 50) {
        navbar.style.background = isDark ? 'rgba(18, 18, 24, 0.98)' : 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = isDark ? '0 2px 30px rgba(0, 0, 0, 0.4)' : '0 2px 30px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.background = isDark ? 'rgba(18, 18, 24, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = isDark ? '0 2px 20px rgba(0, 0, 0, 0.3)' : '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
});
window.dispatchEvent(new Event('scroll'));

// Form: character count and validation
const orderForm = document.getElementById('orderForm');
const messageInput = document.getElementById('message');
const messageCount = document.getElementById('messageCount');
const formError = document.getElementById('formError');

// --- Dirección: ubicación exacta y mapa ---
const addressInput = document.getElementById('address');
const btnLocation = document.getElementById('btnLocation');
const addressLatInput = document.getElementById('addressLat');
const addressLngInput = document.getElementById('addressLng');
const addressMapPreview = document.getElementById('addressMapPreview');

function showAddressMap(lat, lng) {
    if (!addressMapPreview) return;
    const bbox = [lng - 0.008, lat - 0.006, lng + 0.008, lat + 0.006].join(',');
    const iframeSrc = 'https://www.openstreetmap.org/export/embed.html?bbox=' + encodeURIComponent(bbox) + '&layer=mapnik&marker=' + encodeURIComponent(lat + ',' + lng);
    addressMapPreview.innerHTML = '<iframe sandbox="allow-scripts" title="Mapa de ubicación" src="' + iframeSrc + '" width="100%" height="200"></iframe>' +
        '<p class="form-hint" style="margin-top:0.5rem;"><a href="https://www.google.com/maps?q=' + encodeURIComponent(lat + ',' + lng) + '" target="_blank" rel="noopener noreferrer">Abrir en Google Maps</a></p>';
    addressMapPreview.classList.add('is-visible');
}

function setAddressFromCoords(lat, lng, addressText) {
    if (addressInput) addressInput.value = addressText || (lat + ', ' + lng);
    if (addressLatInput) addressLatInput.value = lat;
    if (addressLngInput) addressLngInput.value = lng;
    showAddressMap(lat, lng);
}

if (btnLocation && addressInput) {
    btnLocation.addEventListener('click', function () {
        if (!navigator.geolocation) {
            if (formError) formError.textContent = 'Tu navegador no soporta geolocalización. Escribe la dirección manualmente.';
            return;
        }
        btnLocation.disabled = true;
        btnLocation.querySelector('.btn-location-text').textContent = 'Detectando...';
        if (formError) formError.textContent = '';

        navigator.geolocation.getCurrentPosition(
            function (pos) {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&accept-language=es')
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        const addressText = data.display_name || (lat + ', ' + lng);
                        setAddressFromCoords(lat, lng, addressText);
                    })
                    .catch(function () {
                        setAddressFromCoords(lat, lng, lat + ', ' + lng);
                    })
                    .finally(function () {
                        btnLocation.disabled = false;
                        btnLocation.querySelector('.btn-location-text').textContent = 'Mi ubicación';
                    });
            },
            function () {
                if (formError) formError.textContent = 'No se pudo obtener la ubicación. Comprueba los permisos o escribe la dirección manualmente.';
                btnLocation.disabled = false;
                btnLocation.querySelector('.btn-location-text').textContent = 'Mi ubicación';
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
}

// Google Places Autocomplete (opcional): pon tu API key para sugerencias al escribir
const GOOGLE_MAPS_API_KEY = '';
if (GOOGLE_MAPS_API_KEY && addressInput) {
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + GOOGLE_MAPS_API_KEY + '&libraries=places&callback=initGooglePlaces';
    script.async = true;
    script.defer = true;
    window.initGooglePlaces = function () {
        const autocomplete = new google.maps.places.Autocomplete(addressInput, {
            componentRestrictions: { country: 'mx' },
            fields: ['formatted_address', 'geometry'],
            types: ['address']
        });
        autocomplete.addListener('place_changed', function () {
            const place = autocomplete.getPlace();
            if (!place.geometry) return;
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            if (addressLatInput) addressLatInput.value = lat;
            if (addressLngInput) addressLngInput.value = lng;
            showAddressMap(lat, lng);
        });
    };
    document.head.appendChild(script);
}

if (messageInput && messageCount) {
    const updateCount = () => {
        messageCount.textContent = `${messageInput.value.length} / 500`;
    };
    messageInput.addEventListener('input', updateCount);
    updateCount();
}

if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (formError) formError.textContent = '';
        var successEl = document.getElementById('formSuccess');
        if (successEl) successEl.classList.remove('is-visible');

        const name = orderForm.querySelector('#name');
        const email = orderForm.querySelector('#email');
        const phone = orderForm.querySelector('#phone');
        const service = orderForm.querySelector('#service');

        let valid = true;
        if (!name?.value?.trim() || name.value.trim().length < 2) {
            if (formError) formError.textContent = 'Por favor ingresa tu nombre completo (mín. 2 caracteres).';
            name?.focus();
            valid = false;
        } else if (!email?.value?.trim()) {
            if (formError) formError.textContent = 'Por favor ingresa un email válido.';
            email?.focus();
            valid = false;
        } else if (!phone?.value?.trim() || phone.value.replace(/\D/g, '').length < 10) {
            if (formError) formError.textContent = 'Por favor ingresa un teléfono válido (mín. 10 dígitos).';
            phone?.focus();
            valid = false;
        } else if (!service?.value) {
            if (formError) formError.textContent = 'Por favor selecciona un tipo de servicio.';
            service?.focus();
            valid = false;
        }

        if (!valid) return;

        const serviceSelect = orderForm.querySelector('#service');
        const addressInput = orderForm.querySelector('#address');
        const messageField = orderForm.querySelector('#message');
        const serviceLabel = serviceSelect.options[serviceSelect.selectedIndex]?.text || serviceSelect.value;

        const addressText = addressInput?.value?.trim() || 'No indicada';
        const lat = addressLatInput?.value?.trim();
        const lng = addressLngInput?.value?.trim();
        const hasExactLocation = lat && lng;

        const lines = [
            '*Nueva solicitud desde la web*',
            '',
            '*Nombre:* ' + (name?.value?.trim() || ''),
            '*Email:* ' + (email?.value?.trim() || ''),
            '*Teléfono:* ' + (phone?.value?.trim() || ''),
            '*Servicio:* ' + serviceLabel,
            '*Dirección:* ' + addressText,
            hasExactLocation ? ('*Ubicación exacta (mapa):* https://www.google.com/maps?q=' + lat + ',' + lng) : '',
            '',
            '*Mensaje / detalles:*',
            (messageField?.value?.trim() || 'Sin mensaje adicional')
        ].filter(function (line) { return line !== ''; });
        const text = lines.join('\n');
        const whatsappNumber = '528120527078';
        const url = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(text);

        window.open(url, '_blank', 'noopener,noreferrer');

        orderForm.reset();
        if (messageCount) messageCount.textContent = '0 / 500';
        if (formError) formError.textContent = '';
        if (addressLatInput) addressLatInput.value = '';
        if (addressLngInput) addressLngInput.value = '';
        if (addressMapPreview) {
            addressMapPreview.innerHTML = '';
            addressMapPreview.classList.remove('is-visible');
        }
        const formSuccess = document.getElementById('formSuccess');
        if (formSuccess) {
            formSuccess.textContent = 'Se abrió WhatsApp con tu solicitud. Envía el mensaje para completar el registro.';
            formSuccess.classList.add('is-visible');
            formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        var btnSubmit = document.getElementById('btnSubmit');
        if (btnSubmit) btnSubmit.focus();
    });
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.service-card, .news-card, .contact-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-background');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Gallery Carousel
const galleryTrack = document.getElementById('galleryTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

function getItemsPerView() {
    return window.innerWidth >= 968 ? 3 : window.innerWidth >= 768 ? 2 : 1;
}

if (galleryTrack && prevBtn && nextBtn) {
    let currentIndex = 0;
    const totalItems = galleryTrack.children.length;

    function updateCarousel() {
        if (galleryTrack.children.length === 0) return;
        const itemWidth = galleryTrack.children[0].offsetWidth;
        const gap = 16;
        const translateX = -currentIndex * (itemWidth + gap);
        galleryTrack.style.transform = `translateX(${translateX}px)`;
    }

    nextBtn.addEventListener('click', () => {
        const itemsPerView = getItemsPerView();
        const maxIndex = Math.max(0, totalItems - itemsPerView);
        if (currentIndex < maxIndex) {
            currentIndex++;
            updateCarousel();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const itemsPerView = getItemsPerView();
            currentIndex = Math.min(currentIndex, Math.max(0, totalItems - itemsPerView));
            updateCarousel();
        }, 250);
    });

    let startX = 0;
    let isDragging = false;
    galleryTrack.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });
    galleryTrack.addEventListener('touchmove', (e) => { if (isDragging) e.preventDefault(); });
    galleryTrack.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) (diff > 0 ? nextBtn : prevBtn).click();
    });

    updateCarousel();
}

// Lightbox: open on gallery item click
const lightbox = document.getElementById('lightbox');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxVideo = document.getElementById('lightboxVideo');
const lightboxVideoSource = document.getElementById('lightboxVideoSource');

function openLightbox(mediaType, src) {
    if (!lightbox || !lightboxImage || !lightboxVideo) return;
    lightboxImage.classList.remove('is-visible');
    lightboxImage.removeAttribute('src');
    lightboxVideo.classList.remove('is-active');
    lightboxVideo.pause();
    if (lightboxVideoSource) lightboxVideoSource.removeAttribute('src');

    if (mediaType === 'image') {
        lightboxImage.src = src;
        lightboxImage.alt = 'Vista ampliada';
        lightboxImage.classList.add('is-visible');
    } else {
        if (lightboxVideoSource) lightboxVideoSource.src = src;
        lightboxVideo.load();
        lightboxVideo.classList.add('is-active');
    }
    lightbox.classList.add('is-open');
    lightboxClose.focus();
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightboxVideo.pause();
    document.body.style.overflow = '';
}

if (lightbox && lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox?.classList.contains('is-open')) closeLightbox(); });
}

document.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => {
        const media = item.getAttribute('data-media');
        const src = item.getAttribute('data-src');
        if (media && src) openLightbox(media, src);
    });
});

// Modal Aviso de Privacidad
const privacyModal = document.getElementById('privacyModal');
const openPrivacyLink = document.getElementById('openPrivacyLink');
const closePrivacyModalBtn = document.getElementById('closePrivacyModal');

function openPrivacyModal() {
    if (!privacyModal) return;
    privacyModal.classList.add('is-open');
    privacyModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closePrivacyModalBtn) closePrivacyModalBtn.focus();
}

function closePrivacyModal() {
    if (!privacyModal) return;
    privacyModal.classList.remove('is-open');
    privacyModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

if (openPrivacyLink) {
    openPrivacyLink.addEventListener('click', function (e) {
        e.preventDefault();
        openPrivacyModal();
    });
}
if (closePrivacyModalBtn) closePrivacyModalBtn.addEventListener('click', closePrivacyModal);
if (privacyModal) {
    privacyModal.addEventListener('click', function (e) {
        if (e.target === privacyModal) closePrivacyModal();
    });
}
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && privacyModal && privacyModal.classList.contains('is-open')) closePrivacyModal();
});