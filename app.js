/**
 * ANGER STREETWEAR - MAIN APPLICATION LOGIC
 * Handles: Firebase Interactions, UI Rendering, Animations, Admin Logic.
 */

// REFERENCIAS DOM
const productGrid = document.getElementById('product-grid');
const authBtn = document.getElementById('auth-btn');
const ADMIN_EMAILS = ["josephivan3005@gmail.com", "luiscachay0118@gmail.com"]; // Admin List
const modalLogin = document.getElementById('modal-login');
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const closeLoginBtn = document.getElementById('close-login-btn');
const googleLoginBtn = document.getElementById('google-login-btn');
const toggleAdminBtn = document.getElementById('toggle-admin-btn');
const backToCustomerBtn = document.getElementById('back-to-customer-btn');
const customerView = document.getElementById('login-customer-view');
const adminView = document.getElementById('login-admin-view');
const fabAdd = document.getElementById('fab-add');
const searchInput = document.getElementById('search-input');
const modalUpload = document.getElementById('modal-upload');
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const fileTrigger = document.getElementById('file-trigger');
const previewContainer = document.getElementById('preview-container');
const uploadText = document.getElementById('upload-text');
const cancelUploadOverlay = document.getElementById('cancel-upload-overlay');
const submitBtn = document.getElementById('submit-btn');

// --- Custom Cursor Spotlight (Editorial Touch) ---
const cursor = document.createElement('div');
cursor.className = 'fixed w-8 h-8 rounded-full pointer-events-none z-[999] mix-blend-difference hidden md:block transition-transform duration-100 ease-out';
cursor.style.background = 'white';
document.body.appendChild(cursor);

document.addEventListener('mousemove', (e) => {
    cursor.style.transform = `translate(${e.clientX - 16}px, ${e.clientY - 16}px)`;
});

// Scale cursor on hoverable elements
document.querySelectorAll('a, button, img, .cursor-pointer').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.replace('w-8', 'w-16'));
    el.addEventListener('mouseenter', () => cursor.classList.replace('h-8', 'h-16'));
    el.addEventListener('mouseleave', () => cursor.classList.replace('w-16', 'w-8'));
    el.addEventListener('mouseleave', () => cursor.classList.replace('h-16', 'h-8'));
});

// Detail Modal
const modalProduct = document.getElementById('modal-product');
const closeProductOverlay = document.getElementById('close-product-overlay');
const closeProductBtn = document.getElementById('close-product-btn');
const detailMainImg = document.getElementById('detail-main-img');
const detailThumbnails = document.getElementById('detail-thumbnails');
const detailTitle = document.getElementById('detail-title');
const detailPrice = document.getElementById('detail-price');
const detailCategory = document.getElementById('detail-category');
const detailCondition = document.getElementById('detail-condition');
const detailWhatsappBtn = document.getElementById('detail-buy-btn');
const detailDescription = document.getElementById('detail-description');
const detailStockCont = document.getElementById('detail-stock-container');
const detailStockText = document.getElementById('detail-stock');

// ESTADO
let currentUser = null;
let productsData = [];
let currentCategory = 'all';
let currentSearchTerm = ''; // New
let currentUploadFiles = []; // Array para guardar bases64 temporalmente

// --- MOBILE MENU LOGIC ---
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeMobileMenuBtn = document.getElementById('close-mobile-menu');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-menu-link');

const toggleMobileMenu = (show) => {
    if (show) {
        mobileMenu.classList.remove('hidden');
        setTimeout(() => mobileMenu.classList.remove('hidden-menu'), 10);
        document.body.classList.add('menu-open');
    } else {
        mobileMenu.classList.add('hidden-menu');
        setTimeout(() => mobileMenu.classList.add('hidden'), 600);
        document.body.classList.remove('menu-open');
    }
};

if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => toggleMobileMenu(true));
if (closeMobileMenuBtn) closeMobileMenuBtn.addEventListener('click', () => toggleMobileMenu(false));
mobileLinks.forEach(link => link.addEventListener('click', () => toggleMobileMenu(false)));

// --- 1. AUTENTICACIÓN ---

// Open Login Modal / Logout Flow
authBtn.addEventListener('click', () => {
    // Instead of instant logout, we show the modal with a logout option
    modalLogin.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    if (currentUser) {
        // Show Logout View
        customerView.classList.add('hidden');
        adminView.classList.add('hidden');

        // Add or show a logout section in the modal
        let logoutSection = document.getElementById('logout-section');
        if (!logoutSection) {
            logoutSection = document.createElement('div');
            logoutSection.id = 'logout-section';
            logoutSection.className = 'text-center space-y-6 animate-fade-in-up';
            logoutSection.innerHTML = `
                <div class="flex flex-col items-center gap-4">
                    <img src="${currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + currentUser.email}" class="w-20 h-20 rounded-full border-2 border-neon/50 p-1">
                    <div>
                        <p class="text-white font-display font-bold uppercase tracking-widest text-lg">${currentUser.displayName || 'Master Admin'}</p>
                        <p class="text-zinc-500 font-mono text-[10px] italic">${currentUser.email}</p>
                    </div>
                </div>
                <button id="final-logout-btn" class="w-full bg-red-600/20 border border-red-600/50 text-red-500 font-display font-black uppercase tracking-[0.3em] py-4 hover:bg-red-600 hover:text-white transition-all rounded-xl">
                    Cerrar Sesión Activa
                </button>
            `;
            modalLogin.querySelector('.max-w-md').appendChild(logoutSection);

            document.getElementById('final-logout-btn').addEventListener('click', () => {
                firebase.auth().signOut().then(() => {
                    modalLogin.classList.add('hidden');
                    document.body.style.overflow = 'auto';
                    showToast("Sesión cerrada", "info");
                    logoutSection.remove();
                });
            });
        }
    } else {
        // NORMAL LOGIN FLOW
        const logoutSection = document.getElementById('logout-section');
        if (logoutSection) logoutSection.remove();
        customerView.classList.remove('hidden');
        adminView.classList.add('hidden');
    }
});

// Toggle Views
toggleAdminBtn.addEventListener('click', () => {
    customerView.classList.add('hidden');
    adminView.classList.remove('hidden');
});

backToCustomerBtn.addEventListener('click', () => {
    customerView.classList.remove('hidden');
    adminView.classList.add('hidden');
});

closeLoginBtn.addEventListener('click', () => {
    modalLogin.classList.add('hidden');
    document.body.style.overflow = 'auto';
});

// --- 1. AUTENTICACIÓN (Persistencia Mejorada) ---
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch(error => console.error("Error de persistencia:", error));

// Handle Google Login (For Customers)
googleLoginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(() => {
            modalLogin.classList.add('hidden');
            document.body.style.overflow = 'auto';
            showToast("Bienvenido", "success");
        })
        .catch(error => showToast("Error: " + error.message, "error"));
});

// Handle Email/Password Login (For Admin)
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let email = loginEmailInput.value;
        const password = loginPasswordInput.value;

        if (!email.includes('@')) email = email + "@anger.com";

        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(() => {
                modalLogin.classList.add('hidden');
                document.body.style.overflow = 'auto';
                showToast("Admin Autenticado", "success");
            })
            .catch(error => showToast("Credenciales Inválidas", "error"));
    });
}

// Global Auth Switch
firebase.auth().onAuthStateChanged(user => {
    currentUser = user;

    // Reset UI
    if (fabAdd) {
        fabAdd.classList.add('hidden');
        fabAdd.style.setProperty('display', 'none', 'important');
    }

    if (user) {
        const userEmail = user.email.toLowerCase().trim();
        const isAdmin = ADMIN_EMAILS.some(e => e.toLowerCase().trim() === userEmail);

        console.log("ANGER DEBUG - Current User:", userEmail);
        console.log("ANGER DEBUG - Admin List:", ADMIN_EMAILS);

        if (isAdmin) {
            // ADMIN MODE - MASTER ACCESS (Red Dashboard Icon)
            authBtn.innerHTML = `<i data-lucide="layout-dashboard" class="w-5 h-5 text-red-600"></i>`;
            if (fabAdd) {
                fabAdd.classList.remove('hidden');
                fabAdd.style.setProperty('display', 'flex', 'important');
                fabAdd.style.zIndex = '999999';
            }
            showToast("Master Access Granted", "success");
        } else {
            // CUSTOMER MODE
            authBtn.innerHTML = `<img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + user.email}" class="w-6 h-6 rounded-full border border-white/20">`;
        }
    } else {
        // LOGGED OUT
        authBtn.innerHTML = `<i data-lucide="user" class="w-5 h-5"></i>`;
    }

    // Refresh catalog with current role context
    filterAndRender();
    if (window.lucide) lucide.createIcons();
});

// --- 2. GESTIÓN DE PRODUCTOS (FIRESTORE) ---

// --- 2. GESTIÓN DE PRODUCTOS (FIRESTORE) ---
const db = firebase.firestore();
let unsubscribe = null;
let visibleLimit = 12; // Start small for speed
const LIMIT_INCREMENT = 12;

// Skeleton Loader
// Skeleton Loader (Premium Editorial Shimmer)
function renderSkeleton() {
    productGrid.innerHTML = '';
    const skeletonHTML = `
        <div class="group relative bg-zinc-950 overflow-hidden">
            <div class="aspect-[3/4] shimmer"></div>
            <div class="p-4 space-y-3">
                <div class="h-3 w-2/3 shimmer rounded-sm opacity-50"></div>
                <div class="h-4 w-1/3 shimmer rounded-sm opacity-30"></div>
            </div>
        </div>
    `.repeat(8);
    productGrid.innerHTML = skeletonHTML;
}

// Subscribe with dynamic limit
function subscribeToProducts() {
    if (unsubscribe) unsubscribe(); // Unsub previous

    // Show skeleton only on first load
    if (productsData.length === 0) renderSkeleton();

    unsubscribe = db.collection('products')
        .orderBy('createdAt', 'desc')
        .limit(visibleLimit)
        .onSnapshot(snapshot => {
            productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            filterAndRender();
        }, err => {
            console.error("Error fetching products:", err);
            showToast("Error de conexión.", "error");
        });
}

// Initial Sub
subscribeToProducts();

// Load More Function
window.loadMoreProducts = () => {
    const btn = document.getElementById('load-more-btn');
    if (btn) {
        btn.textContent = 'CARGANDO...';
        btn.disabled = true;
    }

    visibleLimit += LIMIT_INCREMENT;
    subscribeToProducts();
};

// --- FILTER LOGIC ---
// --- FILTER LOGIC ---
const filterBtns = document.querySelectorAll('.filter-btn');

// Toggle Filters Logic (New)
const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
const expandedFilters = document.getElementById('expanded-filters');
const filterChevron = document.getElementById('filter-chevron');

if (toggleFiltersBtn) {
    toggleFiltersBtn.addEventListener('click', () => {
        const isHidden = expandedFilters.classList.contains('hidden');
        if (isHidden) {
            expandedFilters.classList.remove('hidden');
            // Rotate chevron
            if (filterChevron) filterChevron.style.transform = 'rotate(180deg)';
            // Optional: Update text
            const span = toggleFiltersBtn.querySelector('span');
            if (span) span.textContent = 'Ocultar Arsenal';
        } else {
            expandedFilters.classList.add('hidden');
            if (filterChevron) filterChevron.style.transform = 'rotate(0deg)';
            const span = toggleFiltersBtn.querySelector('span');
            if (span) span.textContent = 'Ver Todo el Arsenal';
        }
    });
}

// Global Filter Button Click Listener (Delegation or re-query if dynamic, but here static)
// IMPORTANT: Re-query buttons in case you add more dynamically, though here they are static HTML.
// Using existing `filterBtns` logic but simplified for new active states.
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // UI Update (Rome Style)
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('text-white', 'after:w-full');
            b.classList.add('text-zinc-500', 'after:w-0');
        });
        btn.classList.add('text-white', 'after:w-full');
        btn.classList.remove('text-zinc-500', 'after:w-0');

        currentCategory = btn.dataset.category;
        filterAndRender();

        // Optional: Scroll to products
        // document.getElementById('product-grid').scrollIntoView({ behavior: 'smooth' });
    });
});

// --- SEARCH LOGIC ---
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.trim();
        filterAndRender();
    });
}


function filterAndRender() {
    // Start with all products
    let filtered = productsData;

    // 1. Filter by Category
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }

    // 2. Filter by Search Term
    if (currentSearchTerm) {
        const lowerTerm = currentSearchTerm.toLowerCase();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(lowerTerm) ||
            (p.category && p.category.toLowerCase().includes(lowerTerm))
        );
    }

    renderGrid(filtered);
}

function renderGrid(items) {
    productGrid.innerHTML = '';

    const productsToShow = items || [];

    if (productsToShow.length === 0) {
        productGrid.innerHTML = `
            <div class="col-span-full text-center py-20 flex flex-col items-center animate-fade-in-up">
                <i data-lucide="search-x" class="w-12 h-12 text-zinc-700 mb-4"></i>
                <p class="text-zinc-600 font-mono text-sm uppercase tracking-widest">// SIN RESULTADOS EN EL RADAR.</p>
            </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }
    // ... existing render loop ...

    productsToShow.forEach((product, index) => {
        const card = document.createElement('div');

        // Determine images (Backward compatibility)
        const thumbnails = (product.images && product.images.length > 0) ? product.images : [product.imageUrl];
        const isSoldOut = product.status === 'sold';

        // Card Container (Add Cinematic reveal classes)
        card.className = 'group relative bg-zinc-950 overflow-hidden cursor-pointer selection-premium';
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';

        setTimeout(() => {
            card.style.transition = 'all 0.8s cubic-bezier(0.2, 1, 0.3, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50); // Staggered reveal

        // Open Detail Modal on Click
        card.addEventListener('click', (e) => {
            // Prevent opening if clicking admin button or if sold out (for non-admins)
            if (e.target.closest('.action-btn') || e.target.closest('.delete-btn')) return;

            // If Sold Out, do nothing for regular users
            if (product.status === 'sold' && !currentUser) return;

            openProductDetail(product);
        });

        // Admin Controls (SECURITY FIX: Strictly check email)
        let adminControls = '';
        if (currentUser && ADMIN_EMAILS.some(e => e.toLowerCase().trim() === currentUser.email.toLowerCase().trim())) {
            const isSold = product.status === 'sold';
            const soldIcon = isSold ? 'refresh-ccw' : 'tag';
            const soldColor = isSold ? 'bg-zinc-600' : 'bg-red-600 hover:bg-red-700';

            adminControls = `
                <div class="absolute top-2 right-2 z-20 flex gap-2">
                    <button onclick="toggleSoldStatus(event, '${product.id}', ${isSold})" class="action-btn ${soldColor} text-white p-3 md:p-2 transition-colors shadow-lg rounded-full" title="${isSold ? 'Marcar Disponible' : 'Marcar Vendido'}">
                        <i data-lucide="${soldIcon}" class="w-5 h-5 md:w-4 md:h-4"></i>
                    </button>
                    <button onclick="deleteProduct(event, '${product.id}')" class="delete-btn bg-black text-white p-3 md:p-2 hover:bg-zinc-800 transition-colors shadow-lg rounded-full">
                        <i data-lucide="trash-2" class="w-5 h-5 md:w-4 md:h-4"></i>
                    </button>
                </div>
            `;
        }

        // HTML Logic
        const hasMultiple = thumbnails.length > 1;
        const secondaryImg = hasMultiple ? thumbnails[1] : thumbnails[0];

        // Show Info
        const stockInfo = product.stock ? `<span class="block text-zinc-600 text-[9px] uppercase tracking-widest mt-1">Stock: ${product.stock}</span>` : '';

        card.innerHTML = `
            <!-- Image Container -->
            <div class="aspect-[4/5] overflow-hidden bg-[#0a0a0a] flex items-center justify-center p-0 relative transition-colors duration-500 overflow-hidden">
                <!-- Primary Image -->
                <img src="${thumbnails[0]}"
                    class="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${hasMultiple ? 'group-hover:opacity-0' : ''}"
                    alt="${product.name}">
                
                ${hasMultiple ? `
                <!-- Secondary Image (Hover) -->
                <img src="${secondaryImg}"
                    class="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out scale-110 group-hover:scale-105"
                    alt="${product.name} back">
                
                <!-- Multi-image Indicator Badge -->
                <div class="absolute top-4 left-4 z-10">
                    <div class="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-sm border border-white/10">
                        <i data-lucide="layers" class="w-2.5 h-2.5 text-white/70"></i>
                        <span class="text-[8px] text-white/70 font-display font-bold uppercase tracking-widest">${thumbnails.length}</span>
                    </div>
                </div>
                ` : ''}

                ${isSoldOut ? `
                    <div class="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px] z-20">
                        <span class="text-white text-[10px] font-display font-black uppercase tracking-[0.4em]">OUT OF STOCK</span>
                    </div>` : ''}
                ${adminControls}
            </div>

            <!-- Info Container -->
            <div class="py-6 px-0 text-left flex flex-col items-start border-t border-white/5">
                <h3 class="text-zinc-400 font-display text-[10px] uppercase tracking-[0.3em] group-hover:text-white transition-colors mb-2 italic">
                    ${product.name}
                </h3>
                <div class="text-white font-sans font-light text-base tracking-tighter">
                   S/ ${parseFloat(product.price).toFixed(2)}
                </div>
                ${stockInfo}
            </div>
        `;

        productGrid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
    // AOS Refresh for new elements
    /* if (window.AOS) setTimeout(() => window.AOS.refresh(), 500); -> Removed excessive refreshes, better to just let it init */

    // Load More Button Logic
    // If we have as many items as the limit, likely there are more (or exactly that many).
    // Show button to be safe.
    if (productsToShow.length >= visibleLimit && currentCategory === 'all' && !currentSearchTerm) {
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'col-span-full flex justify-center py-8 animate-fade-in-up';
        loadMoreContainer.innerHTML = `
            <button id="load-more-btn" onclick="loadMoreProducts()"
                class="group relative px-8 py-3 bg-zinc-900 border border-zinc-700 text-white font-display font-bold uppercase tracking-widest hover:bg-zinc-800 hover:border-neon transition-all duration-300 rounded-full shadow-lg">
                <span class="relative z-10 flex items-center gap-2">
                    Cargar Más Arsenal <i data-lucide="arrow-down" class="w-4 h-4 group-hover:translate-y-1 transition-transform"></i>
                </span>
            </button>
        `;
        productGrid.appendChild(loadMoreContainer);
        if (window.lucide) lucide.createIcons();
    }
}

// --- SLIDER LOGIC & STATE ---
let currentModalImages = [];
let currentImageIndex = 0;
let isTransitioning = false;
let transitionTimeout = null;
const sliderPrev = document.getElementById('slider-prev');
const sliderNext = document.getElementById('slider-next');
const swipeHint = document.getElementById('swipe-hint');
const mainImgContainer = document.getElementById('detail-main-img')?.parentElement; // Safe access

function updateSliderUI() {
    console.log("Gallerie length:", currentModalImages?.length);
    // Hide controls if 0 or 1 image
    if (!currentModalImages || currentModalImages.length <= 1) {
        if (sliderPrev) sliderPrev.classList.add('hidden');
        if (sliderNext) sliderNext.classList.add('hidden');
        if (swipeHint) swipeHint.classList.add('hidden');
        return;
    }

    // Show controls (Using flex for all screens if multi-image)
    if (sliderPrev) {
        sliderPrev.classList.remove('hidden');
        sliderPrev.style.display = 'flex';
    }
    if (sliderNext) {
        sliderNext.classList.remove('hidden');
        sliderNext.style.display = 'flex';
    }
    if (swipeHint) swipeHint.classList.remove('hidden');
}

function showImage(index) {
    if (!currentModalImages || currentModalImages.length <= 1 || !detailMainImg || isTransitioning) return;

    if (index < 0) index = currentModalImages.length - 1;
    if (index >= currentModalImages.length) index = 0;

    currentImageIndex = index;
    isTransitioning = true;

    // Limpiar cualquier timeout previo
    if (transitionTimeout) clearTimeout(transitionTimeout);

    // Efecto de Salida (Rápido y fluido)
    detailMainImg.style.opacity = '0';
    detailMainImg.style.transform = 'scale(1.05)';

    transitionTimeout = setTimeout(() => {
        const nextImg = new Image();
        nextImg.src = currentModalImages[currentImageIndex];

        const finalize = () => {
            detailMainImg.src = nextImg.src;
            requestAnimationFrame(() => {
                detailMainImg.style.opacity = '1';
                detailMainImg.style.transform = 'scale(1)';

                // Desbloquear después de que la animación CSS termine (aprox 700ms)
                setTimeout(() => {
                    isTransitioning = false;
                }, 400);
            });
        };

        if (nextImg.complete) {
            finalize();
        } else {
            nextImg.onload = finalize;
            nextImg.onerror = () => { isTransitioning = false; };
        }
    }, 100);

    // Actualizar miniaturas (esto puede ser instantáneo)
    if (detailThumbnails) {
        const thumbs = detailThumbnails.querySelectorAll('img');
        thumbs.forEach((t, i) => {
            const isActive = i === currentImageIndex;
            t.classList.toggle('border-neon', isActive);
            t.classList.toggle('opacity-100', isActive);
            t.classList.toggle('border-transparent', !isActive);
            t.classList.toggle('opacity-60', !isActive);
            if (isActive) t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
    }
}

// Pre-carga para fluidez total
function preloadModalImages(urls) {
    if (!urls) return;
    urls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

// Slider Event Listeners (Using a wrapper to ensure current index is always fresh)
if (sliderPrev) {
    sliderPrev.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Prev Button Clicked");
        showImage(currentImageIndex - 1);
    });
}
if (sliderNext) {
    sliderNext.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Next Button Clicked");
        showImage(currentImageIndex + 1);
    });
}

// Touch Swipe Logic
let touchStartX = 0;
let touchEndX = 0;

if (mainImgContainer) {
    mainImgContainer.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    mainImgContainer.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    if (currentModalImages.length <= 1) return;
    const threshold = 50;
    if (touchEndX < touchStartX - threshold) {
        showImage(currentImageIndex + 1); // Left -> Next
    }
    if (touchEndX > touchStartX + threshold) {
        showImage(currentImageIndex - 1); // Right -> Prev
    }
}

// --- 3. DETAIL MODAL LOGIC ---
function openProductDetail(product) {
    // 1. Setup Images & Preload
    currentModalImages = (product.images && product.images.length > 0) ? product.images : [product.imageUrl];
    currentImageIndex = 0;
    preloadModalImages(currentModalImages);

    // 2. Set Main Image con reset de animación
    isTransitioning = false;
    if (transitionTimeout) clearTimeout(transitionTimeout);

    detailMainImg.style.transition = 'none';
    detailMainImg.style.opacity = '0';
    detailMainImg.style.transform = 'scale(1.05)';

    setTimeout(() => {
        detailMainImg.src = currentModalImages[0];
        detailMainImg.style.transition = 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
        detailMainImg.style.opacity = '1';
        detailMainImg.style.transform = 'scale(1)';
    }, 50);

    detailMainImg.alt = product.name;

    // 3. Generate Thumbnails
    detailThumbnails.innerHTML = '';
    if (currentModalImages.length > 1) {
        detailThumbnails.classList.remove('hidden');
        currentModalImages.forEach((imgSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.className = `h-16 w-16 md:h-20 md:w-20 object-cover cursor-pointer hover:opacity-100 transition-opacity rounded-md border-2 ${index === 0 ? 'border-neon opacity-100' : 'border-transparent opacity-60'}`;
            thumb.onclick = () => showImage(index);
            detailThumbnails.appendChild(thumb);
        });
    } else {
        detailThumbnails.classList.add('hidden');
    }

    // 4. Update Slider UI (Arrows/Swipe)
    updateSliderUI();

    // 5. Set Info
    detailTitle.textContent = product.name;
    detailPrice.innerHTML = `S/ ${parseFloat(product.price).toFixed(2)}`; // Ensure 2 decimal places

    detailCategory.textContent = product.category || 'GENERAL';
    detailCondition.textContent = product.condition;
    detailDescription.textContent = product.description || 'Sin descripción disponible.';

    // Colors for badges
    if (product.condition === 'Nuevo') {
        detailCondition.className = "text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-neon text-white rounded-full shadow-lg shadow-neon/20";
    } else {
        detailCondition.className = "text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-zinc-700 text-zinc-300 rounded-full";
    }

    // WhatsApp Link Logic
    const message = `Hola Anger! Estoy interesado en el producto: *${product.name}* (S/ ${parseFloat(product.price).toFixed(2)}). ¿Está disponible?`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/51907455019?text=${encodedMessage}`;

    if (detailWhatsappBtn) detailWhatsappBtn.href = whatsappLink;

    // Set Stock (Visible for everyone)
    if (product.stock && detailStockCont && detailStockText) {
        detailStockCont.classList.remove('hidden');
        detailStockText.textContent = `Stock: ${product.stock}`;
        // Color based on stock
        const dot = detailStockCont.querySelector('span');
        if (dot) dot.className = product.stock <= 2 ? 'w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse' : 'w-1.5 h-1.5 rounded-full bg-green-500';
    } else if (detailStockCont) {
        detailStockCont.classList.add('hidden');
    }

    // Show Modal with Cinematic Entrance
    modalProduct.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const innerContent = modalProduct.querySelector('.max-w-5xl');
    if (innerContent) {
        innerContent.style.opacity = '0';
        innerContent.style.transform = 'scale(1.1) translateY(40px)';
        innerContent.style.transition = 'none'; // Reset

        requestAnimationFrame(() => {
            innerContent.style.transition = 'all 0.9s cubic-bezier(0.2, 1, 0.3, 1)';
            innerContent.style.opacity = '1';
            innerContent.style.transform = 'scale(1) translateY(0)';
        });
    }
}

// Close Product Modal
const closeProductModal = () => {
    modalProduct.classList.add('hidden');
    document.body.style.overflow = ''; // Unlock Body Scroll
};

if (closeProductBtn) closeProductBtn.addEventListener('click', closeProductModal);
if (closeProductOverlay) closeProductOverlay.addEventListener('click', closeProductModal);


// --- 4. UPLOAD LOGIC (MULTI-IMAGE) ---

// Compress Image Logic
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const maxWidth = 1200; // Increased size for better quality
        const quality = 0.85;  // Higher quality (was 0.5)

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// Toggle Upload Modal
fabAdd.addEventListener('click', () => {
    modalUpload.classList.remove('hidden');
    currentUploadFiles = [];
    previewContainer.innerHTML = '';
    previewContainer.classList.add('hidden');
    uploadText.classList.remove('hidden');
    uploadForm.reset();
});

// Close Upload Modal
const closeUploadModal = () => modalUpload.classList.add('hidden');
if (document.getElementById('close-modal-btn')) document.getElementById('close-modal-btn').addEventListener('click', closeUploadModal);
if (cancelUploadOverlay) cancelUploadOverlay.addEventListener('click', closeUploadModal);

// Multi-Image Preview Loop
fileTrigger.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (files.length > 4) {
        showToast("Máximo 4 fotos permitidas.", "error");
        return;
    }

    currentUploadFiles = files; // Store for submission

    // UI Update
    uploadText.classList.add('hidden');
    previewContainer.innerHTML = '';
    previewContainer.classList.remove('hidden');
    previewContainer.classList.add('grid');

    // Generate Previews
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'w-full h-full object-cover aspect-square rounded-md border border-zinc-700';
            previewContainer.appendChild(img);
        }
        reader.readAsDataURL(file);
    });
});

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    // Style based on type
    const borderColor = type === 'success' ? 'border-green-500' : 'border-red-600';
    const bgColor = type === 'success' ? 'bg-green-950/90' : 'bg-red-950/90';
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';

    toast.className = `max-w-xs w-full ${bgColor} border-l-4 ${borderColor} text-white p-4 rounded-r shadow-2xl backdrop-blur-md transform translate-x-full transition-all duration-300 pointer-events-auto flex items-center gap-3`;

    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0"></i>
        <span class="text-xs font-bold font-mono uppercase tracking-wide overflow-hidden">${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    // Animate In
    requestAnimationFrame(() => toast.classList.remove('translate-x-full'));

    // Animate Out & remove
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Submit Multi-Image
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validate
    if (currentUploadFiles.length === 0) { showToast("Sube al menos una foto.", "error"); return; }
    const category = document.getElementById('category-input').value;
    if (!category) { showToast("Selecciona una categoría.", "error"); return; }

    const name = document.getElementById('name-input').value;
    const priceStr = document.getElementById('price-input').value;
    const price = parseFloat(priceStr).toFixed(2);
    const stock = parseInt(document.getElementById('stock-input').value) || 1;
    const description = document.getElementById('description-input').value;

    submitBtn.disabled = true;
    submitBtn.textContent = "PROCESANDO FOTOS...";

    try {
        // Compress ALL images
        const imagePromises = currentUploadFiles.map(file => compressImage(file));
        const base64Images = await Promise.all(imagePromises);

        // Save to Firestore (Array 'images')
        await db.collection('products').add({
            name, price, stock, category,
            images: base64Images,
            imageUrl: base64Images[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.uid,
            status: 'available'
        });

        // Success
        modalUpload.classList.add('hidden');
        uploadForm.reset();
        currentUploadFiles = [];
        showToast("Producto lanzado con éxito", "success");
        window.scrollTo(0, 500); // Scroll to grid

    } catch (error) {
        console.error(error);
        showToast("Error al subir: " + error.message, "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "LANZAR AL MERCADO";
    }
});

// Custom Confirm Dialog Logic to replace Native 'confirm'
function showConfirmDialog(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirm');
        const box = document.getElementById('confirm-box');
        const msgEl = document.getElementById('confirm-message');
        const cancelBtn = document.getElementById('cancel-confirm-btn');
        const acceptBtn = document.getElementById('accept-confirm-btn');

        // Set Message
        msgEl.textContent = message || "Esta acción es permanente.";

        // Show Modal
        modal.classList.remove('hidden');
        // Animate in
        requestAnimationFrame(() => {
            box.classList.remove('scale-95', 'opacity-0');
            box.classList.add('scale-100', 'opacity-100');
        });

        const close = (result) => {
            box.classList.remove('scale-100', 'opacity-100');
            box.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                resolve(result);
            }, 200);

            // Clean up listeners to prevent duplicates if called multiple times
            cancelBtn.onclick = null;
            acceptBtn.onclick = null;
        };

        cancelBtn.onclick = () => close(false);
        acceptBtn.onclick = () => close(true);
    });
}

// Toggle Sold Status (Admin)
window.toggleSoldStatus = async (event, id, currentStatus) => {
    event.stopPropagation(); // Prevent opening modal
    const newStatus = currentStatus ? 'available' : 'sold';
    const message = newStatus === 'sold' ? 'Marcado como VENDIDO' : 'Marcado como DISPONIBLE';

    try {
        await db.collection('products').doc(id).update({
            status: newStatus
        });
        showToast(message, "success");
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        showToast("Error al actualizar", "error");
    }
};

// Delete Function (Updated to handle event propagation)
window.deleteProduct = async (event, id) => {
    event.stopPropagation(); // Prevent opening modal

    // Use Custom Dialog
    const confirmed = await showConfirmDialog("¿Estás seguro de ELIMINAR este producto del arsenal?");
    if (!confirmed) return;

    try {
        await db.collection('products').doc(id).delete();
        showToast("Producto eliminado correctamente", "success"); // Add success feedback
    } catch (error) {
        console.error("Error al borrar:", error);
        showToast("Error al eliminar", "error");
    }
};

// --- Premium Smooth Scroll for Internal Links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        if (this.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Update cursor for dynamically added elements (like product cards)
const updateCursorInteractions = () => {
    document.querySelectorAll('a, button, img, .cursor-pointer, .filter-btn').forEach(el => {
        if (!el.dataset.cursorBound) {
            el.addEventListener('mouseenter', () => {
                cursor.style.width = '64px';
                cursor.style.height = '64px';
                cursor.style.opacity = '0.3';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.width = '32px';
                cursor.style.height = '32px';
                cursor.style.opacity = '1';
            });
            el.dataset.cursorBound = "true";
        }
    });
};

// Call initially
setTimeout(updateCursorInteractions, 1000);

// Observer for Section Reveals (Adds extra layer of animation)
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('section, main').forEach(section => {
    sectionObserver.observe(section);
});
