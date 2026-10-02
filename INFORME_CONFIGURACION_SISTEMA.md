# INFORME DE CONFIGURACIÓN DEL SISTEMA - ESTANCIAPERÚ

> **Sistema:** Plataforma Monorepo para la Gestión de Expedientes, Evaluación y Votación de Estancias Perú  
> **Fecha de generación:** Octubre 2026  
> **Estado:** Entorno Local y Monorepo Configurado  

---

## 1. Resumen de la Arquitectura del Sistema

EstanciaPerú utiliza una arquitectura híbrida de **Microfrontends (MFE)** combinada con un **Backend Modular por Dominios** y un **Microservicio en Go** para operaciones de alta concurrencia.

```
                                  USUARIO / NAVEGADOR
                                           │
                                           ▼
                     ┌───────────────────────────────────────────┐
                     │         SHELL PRINCIPAL (Next.js 16)      │
                     │         Puerto 3001 | Tailwind CSS v4     │
                     │  - Autenticación (Login / Registro)       │
                     │  - Navegación, Layout y Menú Global       │
                     │  - Módulo de Solicitantes                 │
                     └───────┬───────────────────────────┬───────┘
                             │ (Host de Microfrontends)  │
             ┌───────────────┘                           └──────────────┐
             ▼                                                          ▼
┌───────────────────────────────┐                      ┌───────────────────────────────┐
│     MFE EXPEDIENTES           │                      │      MFE EVALUACIÓN           │
│     (Angular 21)              │                      │      (Angular 21)             │
│     Puerto 4201               │                      │      Puerto 4202              │
│ - Gestor de Carga             │                      │ - Evaluación Ética & Legal    │
│ - Formularios Dinámicos       │                      │ - Recomendaciones y Veredicto │
│ - Máquina de Estados          │                      │ - Gestión de Firmas Digitales │
└──────────────┬────────────────┘                      └──────────────┬────────────────┘
               │                                                      │
               └───────────────────────┬──────────────────────────────┘
                                       │ Peticiones HTTP / WebSockets
                                       ▼
                     ┌───────────────────────────────────────────┐
                     │          API GATEWAY / BACKEND            │
                     │          NestJS 12 (Puerto 3000)          │
                     │  - Controladores REST + OpenAPI / Swagger │
                     │  - Gateway de WebSockets (Tiempo Real)   │
                     │  - Seguridad JWT & Control de Roles (RBAC)│
                     │  - Prisma ORM 8                          │
                     └───────┬───────────────────────────┬───────┘
                             │                           │
            ┌────────────────┘                           └────────────────┐
            ▼                                                             ▼
┌───────────────────────┐                                     ┌───────────────────────┐
│ MICROSERVICIO VOTACIÓN│                                     │  BASE DE DATOS & REDIS│
│ Go / Gin (Puerto 8080)│                                     │  PostgreSQL (5432)    │
│ - Concurrencia pura   │                                     │  Redis (6379)         │
│ - Voto atómico docs   │                                     │  pgAdmin (5050)       │
└───────────────────────┘                                     └───────────────────────┘
```

---

## 2. Tabla Maestra de Servidores, Servicios y Puertos

| Servicio / Servidor | Puerto | Tecnología / Versión | Propósito y Función |
| :--- | :---: | :--- | :--- |
| **Shell Frontend** | `3001` | **Next.js 16.3.8**<br>(React 19, Tailwind v4) | **Aplicación contenedora (Host)**. Brinda Server-Side Rendering (SSR), maneja el inicio de sesión, cabecera, navegación principal, control de accesos y aloja los microfrontends. |
| **Backend API** | `3000` | **NestJS 12**<br>(Node.js 20+, Express) | **Cerebro central del sistema**. Expone los endpoints REST (`/api/v1`), documentación Swagger (`/api/docs`), y el servidor de WebSockets para notificaciones y sincronización en tiempo real. |
| **MFE Expedientes** | `4201` | **Angular 21** | **Microfrontend de Administración y Expedientes**. Especializado en formularios reactivos complejos, carga de documentos pesados, transiciones de estados del expediente y validaciones estrictas. |
| **MFE Evaluación** | `4202` | **Angular 21** | **Microfrontend de Evaluadores**. Gestiona la matriz de evaluación ética y normativa legal, emisión de recomendaciones (Aprobado, Observado, No Aprobado) y captura de firmas digitales. |
| **Microservicio Votación** | `8080` | **Go (Golang)** | **Votación de Documentos de Alta Velocidad**. Microservicio optimizado para procesar ráfagas de votos concurrentes sobre documentos en comités de evaluación en vivo, garantizando operaciones atómicas. |
| **Base de Datos** | `5432` | **PostgreSQL 16** | **Persistencia Relacional Principal**. Almacena usuarios, expedientes, documentos, historial de auditoría, logs de estados y evaluaciones (administrado vía Prisma ORM). |
| **Caché y Mensajería** | `6379` | **Redis 7** | **Caché y Pub/Sub**. Manejo de sesiones de usuario, aceleración de consultas repetitivas y broker de eventos para sincronizar WebSockets en múltiples instancias. |
| **pgAdmin 4** | `5050` | **pgAdmin (Web)** | **Herramienta visual de administración**. Permite explorar tablas, ejecutar scripts SQL y monitorear la base de datos PostgreSQL desde el navegador (`http://localhost:5050`). |

---

## 3. Árbol de Carpetas del Proyecto y Función de Cada Elemento

A continuación se detalla la estructura completa del monorepo `estanciaperu`, indicando la responsabilidad operativa de cada carpeta y archivo clave:

```text
estanciaperu/
│
├── .git/                                   # Directorio de control de versiones Git
├── .gitignore                              # Reglas de exclusión de Git (node_modules, dist, .env, etc.)
├── .env.example                            # Plantilla de variables de entorno con documentación detallada
├── docker-compose.yml                      # Orquestador multi-contenedor con 8 servicios para despliegue y BD
├── iniciar-dev.bat                         # Script Windows de 1 clic: levanta Backend, Shell y ambos MFEs
├── detener-dev.bat                         # Script Windows de 1 clic: detiene todos los puertos locales (3000, 3001, 4201, 4202)
├── package.json                            # Configuración raíz de dependencias y workspaces de npm
├── package-lock.json                       # Registro exacto del árbol de versiones instaladas
├── stack.txt                               # Documento de especificación de requisitos y arquitectura base
│
├── apps/                                   # Contenedor de todas las aplicaciones ejecutables
│   │
│   ├── backend/                            # API REST y WebSockets (NestJS 12)
│   │   ├── prisma/                         # Configuración y esquemas de base de datos
│   │   │   └── schema.prisma               # Modelo relacional completo: Usuarios, Expedientes, Votos, etc.
│   │   ├── src/                            # Código fuente de NestJS
│   │   │   ├── app.module.ts               # Módulo raíz que importa submódulos de la aplicación
│   │   │   ├── app.controller.ts           # Controlador base de prueba de salud (health check)
│   │   │   ├── app.service.ts              # Servicio base
│   │   │   └── main.ts                     # Punto de entrada de NestJS (arranca en el puerto 3000)
│   │   ├── nest-cli.json                   # Configuración del CLI de NestJS
│   │   ├── tsconfig.json                   # Configuración de TypeScript para compilación del Backend
│   │   ├── .env                            # Variables de entorno locales del backend (DATABASE_URL, JWT)
│   │   └── package.json                    # Dependencias de NestJS (@nestjs/*, @prisma/client, etc.)
│   │
│   ├── shell/                              # Aplicación Frontend Host / Shell (Next.js 16 + React 19)
│   │   ├── public/                         # Archivos estáticos públicos (logos, imágenes, favicon)
│   │   ├── src/                            # Código fuente del Shell
│   │   │   └── app/                        # App Router de Next.js
│   │   │       ├── layout.tsx              # Estructura HTML base con soporte para supresión de hydration
│   │   │       ├── page.tsx                # Página de inicio del Shell
│   │   │       └── globals.css             # Importación de Tailwind CSS v4 y variables CSS globales
│   │   ├── next.config.ts                  # Configuración de Next.js (aislamiento Turbopack para monorepos)
│   │   ├── postcss.config.mjs              # Integración de @tailwindcss/postcss para estilos
│   │   ├── tsconfig.json                   # Reglas de TypeScript para React y Next.js
│   │   └── package.json                    # Dependencias del Shell (Next 16, React 19, Tailwind 4)
│   │
│   ├── mfe-expedientes/                    # Microfrontend de Expedientes (Angular 21)
│   │   ├── src/                            # Código fuente Angular
│   │   │   ├── app/                        # Componentes, servicios y rutas de expedientes
│   │   │   │   ├── app.config.ts           # Configuración de providers de Angular 21 (standalone)
│   │   │   │   ├── app.routes.ts           # Rutas internas de gestión de expedientes
│   │   │   │   ├── app.component.ts        # Componente raíz del MFE
│   │   │   │   ├── app.component.html      # Plantilla HTML
│   │   │   │   └── app.component.css       # Estilos del componente
│   │   │   ├── index.html                  # HTML de arranque independiente
│   │   │   ├── main.ts                     # Bootstrap de la aplicación Angular (puerto 4201)
│   │   │   └── styles.css                  # Estilos globales de Angular
│   │   ├── angular.json                    # Configuración del compilador y servidor de desarrollo de Angular
│   │   ├── tsconfig.json                   # Configuración TypeScript para Angular
│   │   └── package.json                    # Dependencias de Angular 21 (@angular/core, @angular/forms, etc.)
│   │
│   ├── mfe-evaluacion/                     # Microfrontend de Evaluación y Firmas (Angular 21)
│   │   ├── src/                            # Código fuente del módulo de evaluación
│   │   │   ├── app/                        # Componentes de criterios éticos, legales y firmas
│   │   │   │   ├── app.config.ts           # Configuración de proveedores standalone
│   │   │   │   ├── app.routes.ts           # Rutas internas de evaluación
│   │   │   │   ├── app.component.ts        # Componente principal de evaluación
│   │   │   │   ├── app.component.html      # Plantilla visual
│   │   │   │   └── app.component.css       # Estilos específicos
│   │   │   ├── index.html                  # Página de visualización independiente
│   │   │   ├── main.ts                     # Bootstrap en el puerto 4202
│   │   │   └── styles.css                  # Estilos globales
│   │   ├── angular.json                    # Configuración de compilación Angular
│   │   └── package.json                    # Dependencias de Angular 21
│   │
│   └── go-votacion/                        # [Próxima fase] Microservicio en Go para votación en tiempo real
│       ├── main.go                         # Punto de entrada HTTP (Gin / Fiber) en puerto 8080
│       └── go.mod                          # Módulo y dependencias de Go
│
└── packages/                               # Librerías compartidas entre aplicaciones
    ├── shared-types/                       # DTOs, interfaces TypeScript y enums comunes a React, Angular y NestJS
    └── ui-components/                      # Componentes visuales y tokens de diseño reutilizables
```

---

## 4. Detalle Operativo de Cada Módulo del Sistema

### 4.1. Shell (Next.js 16 + React 19 + Tailwind v4)
* **Ubicación:** `apps/shell`
* **Puerto:** `3001`
* **Rol:** Es la cara principal del sistema. Provee renderizado del lado del servidor (SSR) para carga instantánea y SEO. Cuando un evaluador o administrador inicia sesión, el Shell descarga dinámicamente los microfrontends de Angular y los renderiza dentro de su layout unificado sin recargar la página.
* **Estilos:** Utiliza **Tailwind CSS v4** mediante el motor `@tailwindcss/postcss`.

### 4.2. Backend API (NestJS 12 + Prisma 8)
* **Ubicación:** `apps/backend`
* **Puerto:** `3000`
* **Rol:** Ejecuta toda la lógica de negocio orientada a dominios:
  - **Autenticación:** JWT con cifrado de contraseñas y control de roles (`ADMIN`, `EVALUADOR`, `SOLICITANTE`).
  - **Expedientes:** Implementa una máquina de estados finita que audita cada transición de un expediente (`BORRADOR` ➔ `ENVIADO` ➔ `EN_EVALUACION` ➔ `OBSERVADO` ➔ `APROBADO` / `RECHAZADO`).
  - **WebSockets:** Notifica instantáneamente a los evaluadores cuando se sube una nueva versión de un documento o se emite un veredicto.
  - **Persistencia:** Gestiona las migraciones y consultas a PostgreSQL a través de Prisma ORM.

### 4.3. MFE Expedientes (Angular 21)
* **Ubicación:** `apps/mfe-expedientes`
* **Puerto:** `4201`
* **Rol:** Maneja la interacción pesada de datos para el administrador y solicitante:
  - Carga masiva de documentos con validación de tipo y peso (PDFs, certificados).
  - Formularios reactivos multi-paso para datos generales y de estancia.
  - Monitoreo de estados y línea de tiempo del expediente.

### 4.4. MFE Evaluación (Angular 21)
* **Ubicación:** `apps/mfe-evaluacion`
* **Puerto:** `4202`
* **Rol:** Dedicado al comité de evaluación:
  - Rúbrica de evaluación estructurada en dos ramas obligatorias: **Principios Éticos** y **Normativa Legal**.
  - Generación de veredicto con observaciones obligatorias en caso de reparos.
  - Módulo de firma digital para los dictámenes finales.

### 4.5. Microservicio de Votación (Go)
* **Ubicación prevista:** `apps/go-votacion`
* **Puerto:** `8080`
* **Rol:** Diseñado para comités de evaluación en vivo donde múltiples revisores votan simultáneamente por documento. Go ofrece tiempos de respuesta sub-milisegundo y bajo consumo de memoria gracias a sus goroutines y canales.

---

## 5. Scripts de Control Rápido en Windows

Para simplificar el día a día sin necesidad de recordar comandos largos ni abrir múltiples terminales manualmente:

| Archivo | Acción | Descripción |
| :--- | :--- | :--- |
| **`iniciar-dev.bat`** | Doble clic | Abre automáticamente 4 terminales independientes levantando:<br>1. NestJS (`localhost:3000`)<br>2. Shell Next.js (`localhost:3001`)<br>3. MFE Expedientes (`localhost:4201`)<br>4. MFE Evaluación (`localhost:4202`) |
| **`detener-dev.bat`** | Doble clic | Busca y cierra de forma segura todos los procesos Node.js asociados a los puertos 3000, 3001, 4201 y 4202. |

---

## 6. Comandos Manuales de Terminal

Si prefieres ejecutar los comandos de forma manual:

```bash
# Iniciar el Shell (Next.js)
cd apps/shell
npm run dev -- --port 3001

# Iniciar el Backend (NestJS)
cd apps/backend
npm run start:dev

# Iniciar Microfrontend de Expedientes (Angular)
cd apps/mfe-expedientes
npm start

# Iniciar Microfrontend de Evaluación (Angular)
cd apps/mfe-evaluacion
npm start
```
