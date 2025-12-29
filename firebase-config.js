// CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCaBPLmMTLwxl30Nrafn5IQSj1u-bV_qzY",
    authDomain: "blackwingsbasededatos.firebaseapp.com",
    projectId: "blackwingsbasededatos",
    storageBucket: "blackwingsbasededatos.firebasestorage.app", // No se usará por ahora
    messagingSenderId: "394005928684",
    appId: "1:394005928684:web:b5d6c4e76f68fdd103e3c9",
    measurementId: "G-EBY2M45PLC"
};

if (!firebase || !firebase.initializeApp) {
    console.error("Firebase no cargó correctamente del CDN.");
} else {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase inicializado con credenciales reales.");
}
