# 🔖 LinkStash

<div align="center">

![LinkStash Banner](https://img.shields.io/badge/LinkStash-AI%20Bookmark%20Vault-blue?style=for-the-badge&logo=bookmark)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Powered-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

**Tu bóveda personal e inteligente de enlaces con integración nativa a Telegram, categorización automática con IA y dashboard web de última generación.**

[Características](#-características) •
[Arquitectura](#-arquitectura-y-stack) •
[Instalación](#-instalación-rápida) •
[Variables de Entorno](#-variables-de-entorno) •
[Uso](#-cómo-usarlo)

</div>

---

## ✨ Características Principales

* 🤖 **Bot de Telegram Integrado**: Enviá cualquier link desde tu celular (Instagram Reels, TikTok, YouTube Shorts, artículos, GitHub, cursos de TryHackMe) y se guardará al instante.
* 🧠 **Categorización y Títulos Inteligentes con IA**: Integrado con Google Gemini. Genera automáticamente **títulos cortos y descriptivos** (reemplazando nombres kilométricos o sitios sin metadatos) y clasifica el contenido en la categoría más precisa.
* 🛡️ **Cascada de Resiliencia en IA**: Sistema multi-modelo (*Gemini Flash Lite*) que garantiza respuestas rápidas sin agotar cuotas y con fallback inteligente por reglas de palabras clave.
* 🎨 **Dashboard Web Moderno y Minimalista**:
  * Estética *Dark Mode* con efectos *Glassmorphism*.
  * **Sidebar fijo permanente**: Navegación fluida por categorías y estados (*Pendientes*, *Revisados*, *Todos*) sin perder de vista los controles al hacer scroll.
  * **Botón Flotante (FAB)**: Agregá links manualmente en cualquier momento desde la web.
  * Gestor interactivo de palabras clave por categoría.
* 🐳 **Optimizado para Servidores y Raspberry Pi**: Diseñado para bajo consumo de memoria y CPU, desplegable en segundos vía Docker Compose.
* 🔒 **Seguro por Diseño**: Base de datos SQLite local con consultas 100% parametrizadas contra inyecciones SQL y sanitización de caracteres UTF-8.

---

## 🛠️ Arquitectura y Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide React, Framer Motion |
| **Backend & API** | Node.js, Express, TypeScript, REST API |
| **Bot** | Grammy (Telegram Bot Framework) |
| **Inteligencia Artificial** | Google GenAI SDK (`gemini-2.5-flash-lite` / `gemini-3.5-flash-lite`) |
| **Almacenamiento** | SQLite 3 (`sqlite` & `sqlite3`) |
| **Infraestructura** | Docker, Docker Compose (Multi-stage build) |

---

## 🚀 Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone https://github.com/ManuT18/LinkStash.git
cd LinkStash
```

### 2. Configurar variables de entorno
Copiá la plantilla y completá tus claves:
```bash
cp .env.example .env
```

### 3. Despliegue con Docker Compose (Recomendado)
```bash
docker compose up -d --build
```
El dashboard quedará accesible inmediatamente en:
👉 **`http://localhost:3500`** *(o la IP de tu servidor)*

---

## ⚙️ Variables de Entorno

Configurá tu archivo `.env` según tus necesidades:

```env
# Bot de Telegram
TELEGRAM_BOT_TOKEN=tu_token_de_botfather
TELEGRAM_ALLOWED_USER_ID=tu_chat_id_numerico

# IA Google Gemini
GEMINI_API_KEY=tu_api_key_de_google_ai_studio

# Configuración del Servidor
PORT=3500
DIGEST_HOUR=20:00
```

> [!NOTE]
> Podés obtener tu API Key gratuita de Gemini en [Google AI Studio](https://aistudio.google.com/).

---

## 📱 Cómo Usarlo

### Guardar desde Telegram
1. Abrí el chat con tu bot de Telegram y enviale `/start`.
2. Reenviá o compartí cualquier link directamente al chat.
3. El bot extraerá los datos, consultará a Gemini para acortar el título, lo categorizará y te responderá con una confirmación visual instantánea.

### Explorar en el Dashboard Web
1. Ingresá a la interfaz web en tu navegador.
2. Utilizá el **Sidebar fijo** para filtrar por estados (*Pending*, *Reviewed*) o por categorías temáticas (*Ciberseguridad*, *Programación & IT*, *Herramientas & AI*, *Impresión 3D*, etc.).
3. Usá el **botón flotante `+`** abajo a la derecha si querés pegar un enlace manualmente desde tu computadora.
4. Hacé clic en el logo de **LinkStash** en cualquier momento para volver al resumen principal.

---

## 📄 Licencia

Este proyecto se encuentra bajo la Licencia [GPL-3.0](LICENSE).
