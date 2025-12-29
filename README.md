# Black Wings BMX Project 🚲

Un proyecto web SPA (Single Page Application) moderno para la venta y exhibición de componentes de BMX.

## 🚀 Tecnologías

* **HTML5 & CSS3**: Estructura semántica y diseño moderno.
* **Tailwind CSS**: Framework de utilidades para estilos rápidos y responsivos.
* **JavaScript (Vanilla)**: Lógica de cliente sin dependencias pesadas.
* **Firebase**:
  * **Firestore**: Base de datos NoSQL en tiempo real para el catálogo de productos.
  * **Authentication**: Sistema de login seguro con Google.
* **AOS (Animate On Scroll)**: Animaciones al hacer scroll.
* **Lucide Icons**: Iconografía SVG ligera y nítida.

## ✨ Características

* **Diseño Industrial Premium**: Estética oscura con acentos neón y efectos "glassmorphism".
* **Catálogo Dinámico**: Filtrado en tiempo real por categoría (Cuadros, Manubrios, etc.).
* **Sistema de Carga Multi-Imagen**: Panel de administrador para subir productos con hasta 4 fotos comprimidas automáticamente.
* **Modo Admin Seguro**: Gestión de inventario (Borrar/Subir) protegida por autenticación.
* **Responsive 100%**: Optimizado para móviles y escritorio.
* **Notificaciones Personalizadas**: Sistema de "Toasts" para feedback visual y Modales de confirmación con estilo propio.

## 🛠️ Instalación y Uso

1. **Clonar el repositorio**:

    ```bash
    git clone https://github.com/usuario/black-wings-bmx.git
    cd black-wings-bmx
    ```

2. **Configurar Firebase**:
    * Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
    * Habilita **Firestore Database** y **Authentication** (Google Provider).
    * Crea un archivo `firebase-config.js` en la raíz con tus credenciales:

        ```javascript
        const firebaseConfig = {
            apiKey: "TU_API_KEY",
            authDomain: "TU_PROJECT.firebaseapp.com",
            projectId: "TU_PROJECT_ID",
            storageBucket: "TU_PROJECT.appspot.com",
            messagingSenderId: "...",
            appId: "..."
        };
        firebase.initializeApp(firebaseConfig);
        ```

3. **Correr localmente**:
    * Puedes usar cualquier servidor estático, por ejemplo con Python:

        ```bash
        python -m http.server 8000
        ```

    * O la extensión **Live Server** de VS Code.

## 📝 Autor

Desarrollado con pasión para la comunidad BMX.
