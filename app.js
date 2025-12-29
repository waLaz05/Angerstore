/**
 * BLACK WINGS BMX - MAIN APPLICATION LOGIC
 * Handles: Firebase Interactions, UI Rendering, Animations, Admin Logic.
 * Author: Black Wings Dev Team
 */

// REFERENCIAS DOM
const productGrid = document.getElementById('product-grid');
const authBtn = document.getElementById('auth-btn');
const fabAdd = document.getElementById('fab-add');

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

function filterAndRender() {
    const filtered = currentCategory === 'all'
        ? productsData
        : productsData.filter(p => p.category === currentCategory);

    renderGrid(filtered);
}

function renderGrid(items) {
    productGrid.innerHTML = '';

    const productsToShow = items || [];

    if (productsToShow.length === 0) {
        productGrid.innerHTML = `
            <div class="col-span-full text-center py-20">
                <p class="text-zinc-600 font-mono text-sm uppercase tracking-widest">// NO HEMOS ENCONTRADO PIEZAS EN ESTA SECCIÓN.</p>
            </div>`;
        return;
    }

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

        // Tailwind Card Container
        // Added cursor-pointer because clicking opens the modal now
        card.className = 'group relative bg-zinc-900 border border-zinc-800 hover:border-zinc-500 hover:shadow-2xl hover:shadow-neon/10 hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', (index % 4) * 50);

        // Open Detail Modal on Click
        card.addEventListener('click', (e) => {
            // Prevent opening if clicking admin delete button
            if (e.target.closest('.delete-btn')) return;
            openProductDetail(product);
        });

        // Admin Controls
        let adminControls = '';
        if (currentUser) {
            adminControls = `
                <div class="absolute top-2 right-2 z-20">
                    <button onclick="deleteProduct(event, '${product.id}')" class="delete-btn bg-red-600 text-white p-2 hover:bg-red-700 transition-colors shadow-lg rounded-full">
                        <i data-lucide="trash-2" width="16"></i>
                    </button>
                </div>
            `;
        }

        const isNew = product.condition === 'Nuevo';
        const badgeColor = isNew ? 'bg-neon text-white' : 'bg-zinc-700 text-zinc-300';
        const categoryName = product.category || 'PART';

        // HTML Logic
        card.innerHTML = `
            <!-- Image Container -->
            <div class="relative w-full aspect-square overflow-hidden bg-black">
                <img src="${mainImage}" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700 ease-out" alt="${product.name}" loading="lazy">
                
                <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-60"></div>
                
                <div class="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 w-full pr-2">
                    <span class="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md ${badgeColor} shadow-lg">
                        ${product.condition}
                    </span>
                    <span class="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-black/80 text-white border border-white/20 rounded-md shadow-lg truncate max-w-[80%]">
                        ${categoryName}
                    </span>
                </div>
                ${multiImageBadge}
                ${adminControls}
            </div>

            <!-- Info Container -->
            <div class="p-4 relative">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-white font-display font-bold text-lg leading-tight uppercase tracking-tight group-hover:text-neon transition-colors line-clamp-2">
                        ${product.name}
                    </h3>
                </div>
                
                <div class="flex items-center justify-between mt-4 border-t border-zinc-800 pt-3">
                    <div class="font-mono font-bold text-white text-lg tracking-tight">
                        S/ ${product.price}
                    </div>
                    <div class="text-zinc-400 group-hover:text-white transition-colors">
                        <i data-lucide="maximize-2" class="w-5 h-5"></i>
                    </div>
                </div>
            </div>
            
            <div class="absolute inset-0 border-2 border-neon opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 rounded-2xl"></div>
        `;

        productGrid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

// --- 3. DETAIL MODAL LOGIC ---

function openProductDetail(product) {
    // 1. Get images (array or single string)
    const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl];

    // 2. Set Info
    detailTitle.textContent = product.name;
    detailPrice.textContent = product.price;
    detailCategory.textContent = product.category || 'GENERAL';
    detailCondition.textContent = product.condition;

    // WhatsApp Link
    const msg = `Hola Black Wings! Estoy interesado en el producto: *${product.name}* (S/${product.price}). ¿Podrías enviarme más info?`;
    detailWhatsappBtn.href = `https://wa.me/51901889707?text=${encodeURIComponent(msg)}`;

    // 3. Set Images
    // Main Image defaults to first
    detailMainImg.src = images[0];

    // Build Thumbnails
    detailThumbnails.innerHTML = '';

    if (images.length > 1) {
        detailThumbnails.classList.remove('hidden');
        images.forEach((imgSrc, index) => {
            const thumbBtn = document.createElement('button');
            thumbBtn.className = `w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${index === 0 ? 'border-neon opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`;
            thumbBtn.innerHTML = `<img src="${imgSrc}" class="w-full h-full object-cover">`;

            thumbBtn.addEventListener('click', () => {
                // Change main image
                detailMainImg.style.opacity = '0.5'; // cheap transition effect
                setTimeout(() => {
                    detailMainImg.src = imgSrc;
                    detailMainImg.style.opacity = '1';
                }, 100);

                // Update active border
                Array.from(detailThumbnails.children).forEach(btn => {
                    btn.classList.remove('border-neon', 'opacity-100');
                    btn.classList.add('border-transparent', 'opacity-60');
                });
                thumbBtn.classList.add('border-neon', 'opacity-100');
                thumbBtn.classList.remove('border-transparent', 'opacity-60');
            });

            detailThumbnails.appendChild(thumbBtn);
        });
    } else {
        // Hide thumbnails if only 1 image
        detailThumbnails.classList.add('hidden');
    }

    // 4. Show Modal
    modalProduct.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Lock Body Scroll
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
