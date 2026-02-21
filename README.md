
# NutriTico IA: Sport & Health Edition 🇨🇷

Aplicación de nutrición avanzada para el contexto costarricense, combinando salud metabólica (Keto/Ayuno) con periodización deportiva.

## 🚀 Despliegue Rápido

### 1. Variables de Entorno
Crea un archivo `.env` o configúralo en Vercel:
`API_KEY=tu_google_gemini_api_key`

### 2. Instalación
```bash
npm install
npm run dev
```

## 🛡️ Seguridad de la API
Este proyecto utiliza `process.env.API_KEY`. 
- **Local**: Se lee desde el entorno del sistema.
- **Producción (Vercel)**: Se inyecta durante el build, lo que significa que la clave nunca se expone en el cliente de forma plana ni se sube al historial de Git si usas `.gitignore`.

## 🛠️ Tecnologías
- **Frontend**: React + Tailwind CSS
- **IA**: Google Gemini 2.5/3 (Multimodal)
- **Gráficos**: Recharts
- **Iconos**: Material Symbols

## 📅 Roadmap para GitHub
- [x] Onboarding Biométrico
- [x] Escáner de etiquetas inteligente (OCR + AI)
- [x] Ciclado de Carbohidratos automático
- [ ] Integración real con Firebase Firestore (Pendiente configurar `firebaseConfig.ts`)
- [ ] Exportación de reportes en PDF

---
Desarrollado con ❤️ para los atletas de Costa Rica.
