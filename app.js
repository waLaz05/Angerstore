/**
 * BLACK WINGS BMX - MAIN APPLICATION LOGIC
 * Handles: Firebase Interactions, UI Rendering, Animations, Admin Logic.
 * Author: Black Wings Dev Team
 */

// REFERENCIAS DOM
const productGrid = document.getElementById('product-grid');
const authBtn = document.getElementById('auth-btn');
const fabAdd = document.getElementById('fab-add');
const searchInput = document.getElementById('search-input'); // New

// Upload Modal
const modalUpload = document.getElementById('modal-upload');
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const fileTrigger = document.getElementById('file-trigger');
const previewContainer = document.getElementById('preview-container');
const uploadText = document.getElementById('upload-text');
const cancelUploadOverlay = document.getElementById('cancel-upload-overlay');
const submitBtn = document.getElementById('submit-btn');

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
const detailWhatsappBtn = document.getElementById('detail-whatsapp-btn');

// ESTADO
let currentUser = null;
let productsData = [];
let currentCategory = 'all';
let currentSearchTerm = ''; // New
let currentUploadFiles = []; // Array para guardar bases64 temporalmente

// --- 1. AUTENTICACIÓN ---

// Login/Logout simple con Google
authBtn.addEventListener('click', () => {
    if (currentUser) {
        firebase.auth().signOut();
    } else {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).catch(error => {
            console.error(error);
            showToast("Error al iniciar sesión: " + error.message, "error");
        });
    }
});

// Listener de Auth State
firebase.auth().onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        // Modo Admin
        authBtn.textContent = 'LOGOUT';
        authBtn.classList.add('bg-red-900', 'border-red-500'); // Visual feedback
        fabAdd.classList.remove('hidden');
        filterAndRender(); // Re-render para mostrar botones de borrar
    } else {
        // Modo Cliente
        authBtn.textContent = 'ACCESS';
        authBtn.classList.remove('bg-red-900', 'border-red-500');
        fabAdd.classList.add('hidden');
        filterAndRender();
    }
});

// --- 2. GESTIÓN DE PRODUCTOS (FIRESTORE) ---

const db = firebase.firestore();

// Escuchar cambios en tiempo real
db.collection('products')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(snapshot => {
        productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        filterAndRender();
    });

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
        // UI Update
        document.querySelectorAll('.filter-btn').forEach(b => {
            // Reset all buttons to default state
            b.classList.remove('border-neon', 'text-white', 'bg-zinc-800', 'active', 'shadow-[0_0_15px_rgba(255,77,0,0.15)]');
            b.classList.add('text-zinc-400');
        });

        // Set Active State
        btn.classList.remove('text-zinc-400');
        btn.classList.add('border-neon', 'text-white', 'bg-zinc-800', 'active', 'shadow-[0_0_15px_rgba(255,77,0,0.15)]');

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

        // Determinar imagen principal (Backward compatibility)
        const mainImage = product.images && product.images.length > 0 ? product.images[0] : product.imageUrl;
        const imageCount = product.images ? product.images.length : 1;

        // Visual indicator for multiple images
        const multiImageBadge = imageCount > 1
            ? `<span class="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-bold z-10">
                <i data-lucide="layers" class="w-3 h-3 inline mr-1"></i>${imageCount}
               </span>`
            : '';

        // Tailwind Card Container (Cyber Upgrade)
        // Added cursor-pointer because clicking opens the modal now
        card.className = 'group relative bg-black border border-zinc-800 hover:border-neon hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] hover:-translate-y-1 transition-all duration-300 rounded-xl overflow-hidden cursor-pointer';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', (index % 4) * 50);

        // Open Detail Modal on Click
        card.addEventListener('click', (e) => {
            // Prevent opening if clicking admin button or if sold out (for non-admins)
            if (e.target.closest('.action-btn') || e.target.closest('.delete-btn')) return;

            // If Sold Out, do nothing for regular users
            if (product.status === 'sold' && !currentUser) return;

            openProductDetail(product);
        });

        // Admin Controls
        let adminControls = '';
        if (currentUser) {
            const isSold = product.status === 'sold';
            const soldIcon = isSold ? 'refresh-ccw' : 'tag'; // Icon changes
            const soldColor = isSold ? 'bg-zinc-600' : 'bg-blue-600 hover:bg-blue-700';

            adminControls = `
                <div class="absolute top-2 right-2 z-20 flex gap-2">
                    <button onclick="toggleSoldStatus(event, '${product.id}', ${isSold})" class="action-btn ${soldColor} text-white p-2 transition-colors shadow-lg rounded-full" title="${isSold ? 'Marcar Disponible' : 'Marcar Vendido'}">
                        <i data-lucide="${soldIcon}" width="16"></i>
                    </button>
                    <button onclick="deleteProduct(event, '${product.id}')" class="delete-btn bg-red-600 text-white p-2 hover:bg-red-700 transition-colors shadow-lg rounded-full">
                        <i data-lucide="trash-2" width="16"></i>
                    </button>
                </div>
            `;
        }

        const isNew = product.condition === 'Nuevo';
        // Tech Badges Style (Outline/Ghost)
        const badgeColor = isNew
            ? 'border border-neon text-neon bg-neon/10'
            : 'border border-zinc-600 text-zinc-400 bg-zinc-900/50';

        const categoryName = product.category || 'PART';
        const isSoldOut = product.status === 'sold';

        // Custom Styles for Sold Out
        const containerClasses = isSoldOut ? 'grayscale opacity-75 md:opacity-60 pointer-events-none' : 'group-hover:opacity-100 group-hover:scale-110';
        const badgeSoldOut = isSoldOut
            ? `<div class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                 <div class="bg-red-600 text-white font-black font-display rotate-[-12deg] text-3xl px-4 py-2 border-4 border-white shadow-2xl tracking-widest uppercase opacity-100">AGOTADO</div>
               </div>`
            : '';

        // HTML Logic
        card.innerHTML = `
            <!-- Image Container -->
            <div class="relative w-full aspect-square overflow-hidden bg-zinc-900">
                <img src="${mainImage}" class="w-full h-full object-cover opacity-90 transition-transform duration-700 ease-out ${containerClasses}" alt="${product.name}" loading="lazy">
                
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                ${badgeSoldOut}
                
                <!-- Tech Tags -->
                <div class="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 w-full pr-2">
                    <span class="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md ${badgeColor} backdrop-blur-sm">
                        ${product.condition}
                    </span>
                    <span class="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 bg-black/80 text-white border border-white/20 rounded-md backdrop-blur-sm truncate max-w-[80%]">
                        ${categoryName}
                    </span>
                </div>
                ${multiImageBadge}
                ${adminControls}
            </div>

            <!-- Info Container -->
            <div class="p-5 relative ${isSoldOut ? 'opacity-40' : ''} border-t border-zinc-900">
                <div class="flex flex-col gap-1 mb-3">
                    <h3 class="text-white font-display font-bold text-lg leading-tight uppercase tracking-tight group-hover:text-neon transition-colors line-clamp-1">
                        ${product.name}
                    </h3>
                    <div class="w-8 h-0.5 bg-zinc-800 group-hover:bg-neon transition-colors duration-500"></div>
                </div>
                
                <div class="flex items-end justify-between mt-auto">
                    <div class="flex flex-col">
                        <span class="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-px">Precio</span>
                        <div class="font-display font-black text-white text-2xl tracking-tighter group-hover:text-neon transition-colors">
                            S/ ${product.price}
                        </div>
                    </div>
                    <div class="text-zinc-600 group-hover:text-white transition-colors bg-zinc-900/50 p-2 rounded-lg border border-transparent group-hover:border-zinc-700">
                        <i data-lucide="arrow-up-right" class="w-5 h-5"></i>
                    </div>
                </div>
            </div>
        `;

        productGrid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

// --- SLIDER LOGIC & STATE ---
let currentModalImages = [];
let currentImageIndex = 0;
const sliderPrev = document.getElementById('slider-prev');
const sliderNext = document.getElementById('slider-next');
const swipeHint = document.getElementById('swipe-hint');
const mainImgContainer = document.getElementById('detail-main-img')?.parentElement; // Safe access

function updateSliderUI() {
    // Hide controls if 0 or 1 image
    if (!currentModalImages || currentModalImages.length <= 1) {
        if (sliderPrev) sliderPrev.classList.remove('md:flex');
        if (sliderPrev) sliderPrev.classList.add('hidden');
        if (sliderNext) sliderNext.classList.remove('md:flex');
        if (sliderNext) sliderNext.classList.add('hidden');
        if (swipeHint) swipeHint.classList.add('hidden');
        return;
    }

    // Show controls
    if (sliderPrev) { sliderPrev.classList.remove('hidden'); sliderPrev.classList.add('md:flex'); }
    if (sliderNext) { sliderNext.classList.remove('hidden'); sliderNext.classList.add('md:flex'); }
    if (swipeHint) swipeHint.classList.remove('hidden');
}

function showImage(index) {
    if (!currentModalImages || currentModalImages.length === 0) return;

    if (index < 0) index = currentModalImages.length - 1;
    if (index >= currentModalImages.length) index = 0;

    currentImageIndex = index;

    // Transition
    if (detailMainImg) {
        detailMainImg.style.opacity = '0.5';
        setTimeout(() => {
            detailMainImg.src = currentModalImages[currentImageIndex];
            detailMainImg.style.opacity = '1';
        }, 150);
    }

    // Update thumbnails active state
    if (detailThumbnails) {
        const thumbs = detailThumbnails.querySelectorAll('img');
        thumbs.forEach((t, i) => {
            if (i === currentImageIndex) {
                t.classList.add('border-neon', 'opacity-100');
                t.classList.remove('border-transparent', 'opacity-60');
                t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                t.classList.remove('border-neon', 'opacity-100');
                t.classList.add('border-transparent', 'opacity-60');
            }
        });
    }
}

// Slider Event Listeners
if (sliderPrev) sliderPrev.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentImageIndex - 1); });
if (sliderNext) sliderNext.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentImageIndex + 1); });

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
    // 1. Setup Images
    currentModalImages = (product.images && product.images.length > 0) ? product.images : [product.imageUrl];
    currentImageIndex = 0;

    // 2. Set Main Image (Reset opacity first)
    detailMainImg.style.opacity = '1';
    detailMainImg.src = currentModalImages[0];
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
    detailPrice.innerHTML = product.price; // innerHTML for styling if needed, but safe here

    detailCategory.textContent = product.category || 'GENERAL';
    detailCondition.textContent = product.condition;

    // Colors for badges
    if (product.condition === 'Nuevo') {
        detailCondition.className = "text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-neon text-white rounded-full shadow-lg shadow-neon/20";
    } else {
        detailCondition.className = "text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-zinc-700 text-zinc-300 rounded-full";
    }

    // WhatsApp Link
    const message = `Hola Black Wings! Estoy interesado en el producto: *${product.name}* (S/ ${product.price}). ¿Está disponible?`;
    const encodedMessage = encodeURIComponent(message);
    detailWhatsappBtn.href = `https://wa.me/51958988632?text=${encodedMessage}`;

    // Show Modal
    modalProduct.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Lock Body Scroll

    // Animation
    const modalContent = modalProduct.querySelector('#detail-main-img').closest('div').parentElement; // Target main wrapper
    // Actually simpler to just target the inner div we know
    const innerContent = modalProduct.querySelector('.max-w-5xl');
    if (innerContent) {
        innerContent.classList.remove('scale-95', 'opacity-0');
        innerContent.classList.add('scale-100', 'opacity-100');
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
        const maxWidth = 800; // Limit size
        const quality = 0.5;  // Aggressive compression for multi-image

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
    const price = document.getElementById('price-input').value;
    const condition = document.getElementById('condition-input').value;

    submitBtn.disabled = true;
    submitBtn.textContent = "PROCESANDO FOTOS...";

    try {
        // Compress ALL images
        const imagePromises = currentUploadFiles.map(file => compressImage(file));
        const base64Images = await Promise.all(imagePromises);

        // Save to Firestore (Array 'images')
        await db.collection('products').add({
            name, price, condition, category,
            images: base64Images, // New Array Field
            imageUrl: base64Images[0], // Fallback for old logic
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.uid
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
