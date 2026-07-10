# MANUAL TÉCNICO DE IMPLEMENTACIÓN
**SISTEMA RECRED - CI/CD & ARQUITECTURA**
Versión: 1.1
Destinatario: Equipo de Desarrollo e Ingeniería DevOps
Clasificación: Interno / Confidencial

## 1. Visión General y Arquitectura del Sistema
El presente manual estandariza los procedimientos de configuración, desarrollo local y despliegue en producción del sistema Recred. Este documento está diseñado para garantizar la correcta transferencia tecnológica, el aislamiento de entornos mediante contenedores y la estandarización de los flujos de Integración Continua (CI) y Despliegue Continuo (CD).

### 1.1 Stack Tecnológico Principal

| Componente | Tecnología Base | Propósito y Rol en la Arquitectura |
| :--- | :--- | :--- |
| **Frontend** | Angular 20 (Node.js/npm) | SPA (Single Page Application) que maneja la interfaz de cliente e interactúa con la API y Cognito. Incorpora capacidades PWA (Service Workers), escaneo nativo de códigos (ZXing) y visualización de datos (Chart.js). |
| **Backend** | Java 17 & Spring Boot 3/4 | API RESTful central. Expone la lógica de negocio, seguridad vía JWT e integración transaccional. |
| **Base de Datos** | PostgreSQL 16 (Supabase) | Persistencia de datos. En producción operado como DBaaS. En local contenedorizado. |
| **Autenticación** | AWS Cognito & Firebase | Gestión de identidades, flujos de login/registro y emisión de tokens seguros. |
| **Infraestructura Web** | Netlify | Hosting y CDN distribuida para la aplicación frontend estática. |
| **Infraestructura API** | AWS EC2 | Servidor de despliegue donde corre la API Spring Boot alojada dentro de un contenedor Docker. |
| **Orquestación / CI** | GitHub Actions | Automatización de flujos: linter, tests (unit/web/integration), compilación y delivery a EC2/Netlify. |

---

## 2. Configuración del Entorno de Desarrollo Local
Para garantizar la paridad entre desarrollo y producción, es obligatorio configurar el entorno siguiendo estas normativas de seguridad y aislamiento.

### 2.1 Requisitos Previos
* **Java Development Kit (JDK) 17:** Se recomienda la distribución Eclipse Temurin.
* **Node.js & npm:** Versión LTS (Long-Term Support) compatible con Angular 20.
* **Docker Desktop & Docker Compose:** Obligatorio para la orquestación del servidor y base de datos.
* **Apache Maven:** Para ejecución y validación independiente del wrapper local.

### 2.2 Cliente Web (Frontend - Angular)
El proyecto no sube credenciales al repositorio. El gestor de entorno requiere un archivo `.env` en la raíz para inyectar configuraciones dinámicamente utilizando el script interno `set-env.js`.

| Variable | Valor en Desarrollo Local | Descripción |
| :--- | :--- | :--- |
| `COGNITO_USER_POOL_ID` | `[Pool ID AWS Cognito]` | Identificador único del conjunto de usuarios en AWS. |
| `COGNITO_CLIENT_ID` | `[Client ID AWS Cognito]` | Identificador de la aplicación cliente conectada. |
| `COGNITO_REGION` | `[ej. us-east-1]` | Región donde se aloja el servicio Cognito. |
| `REDIRECT_SIGN_IN` | `http://localhost:4200` | URL de redirección post-login exitoso. |
| `REDIRECT_SIGN_OUT` | `http://localhost:4200` | URL de redirección post-logout. |
| `API_URL` | `http://localhost:8080` | Endpoint base del backend local (Spring Boot). |

Una vez creado el archivo `.env`, ejecute el servidor de desarrollo local:
```bash
npm install
npm start
```

### 2.3 Servidor (Backend - Spring Boot y PostgreSQL)
La API y la base de datos están configuradas en un entorno de Docker Compose que incluye un healthcheck nativo para asegurar que la DB esté receptiva antes de iniciar el Backend.

| Variable | Valor en Desarrollo Local | Descripción |
| :--- | :--- | :--- |
| `POSTGRES_DB` | `recred_local` | Nombre de la base de datos inicializada por Docker. |
| `POSTGRES_USER` | `postgres` | Usuario maestro de acceso local. |
| `POSTGRES_PASSWORD` | `postgres` | Contraseña del usuario maestro. |
| `DB_URL` | `jdbc:postgresql://postgres:5432/recred_local` | URL de conexión JDBC. IMPORTANTE: El host debe ser 'postgres', no localhost, para permitir la resolución en la red interna de Docker. |
| `DB_USERNAME` | `postgres` | Usuario de conexión del backend. |
| `DB_PASSWORD` | `postgres` | Contraseña de conexión del backend. |

Comandos de inicialización:
```bash
# Clonar el archivo de ejemplo a su entorno real
cp .env.example .env
# Construir y levantar contenedores en background
docker compose up --build -d
```
Verificación de conectividad: Valide la salud del microservicio consultando el endpoint del actuador:
`GET http://localhost:8080/actuator/health`

---

## 3. Estrategia de Testing y Control de Calidad

### 3.1 Validaciones Pre-Push del Frontend
Antes de integrar código (Push/PR), es obligatorio validar la calidad estática y funcional:
```bash
npm run lint && npm test -- --watch=false --browsers=ChromeHeadless && npm run build -- --configuration=production
```

### 3.2 Jerarquía de Tests del Backend (Maven Profiles)
Se ha configurado una estructura jerárquica con perfiles (Profiles) de Maven para optimizar los tiempos de ejecución y distinguir entre la lógica del dominio puro y los adaptadores de infraestructura.

| Tipo de Prueba | Comando de Ejecución | Descripción / Impacto |
| :--- | :--- | :--- |
| **Unitarios (El Cerebro)** | `./mvnw test -Punit` | Lógica pura de negocio (Casos de uso/Modelos) usando JUnit 5 y Mockito. Ejecución ultrarrápida sin Spring context. |
| **Integración Web (El Contrato)** | `./mvnw test -Pweb` | Validación de la API y ruteo utilizando `@WebMvcTest` y Mockito puro. |
| **Integración Infra (Los Cables)** | `./mvnw test -Pintegration`<br>`./mvnw failsafe:integration-test` | Ejecuta clases con terminación `*IT.java`. Validación quirúrgica de repositorios de datos y servicios externos. |

---

## 4. Pipeline de CI/CD (GitHub Actions)
La automatización del ciclo de vida asegura despliegues sin interrupciones y filtros estrictos contra regresiones de código.

### 4.1 Integración Continua Dinámica (CI)
El flujo automatizado en GitHub Actions posee comportamiento condicional:
* **Ramas Feature (`feature/*`):** Corren únicamente pruebas unitarias rápidas (`-Punit`) para otorgar feedback al desarrollador en menos de un minuto.
* **Ramas Protegidas (`develop`/`main`):** Ejecutan la validación exhaustiva (`mvn clean verify`), chequeando cobertura y estilos restrictivos (prohibidos imports con wildcards como `com.recred.*`).

### 4.2 Despliegue en Servidor AWS EC2 (CD)
El despliegue productivo solo se gatilla tras un push o merge a la rama `main`. El flujo de acciones es el siguiente:
1. Construcción de la Imagen Docker del backend utilizando el Dockerfile multi-stage.
2. Etiquetado de la imagen con el SHA del commit actual (`recred-backend:${{ github.sha }}`).
3. Compresión en formato `.tar.gz` (`recred-backend.tar.gz`).
4. Transferencia de la imagen comprimida y el archivo `docker-compose.yml` al servidor EC2 en la ruta: `/home/ubuntu/recred-app`.
5. Ejecución en EC2 mediante comandos SSH para cargar la imagen (`docker load`), detener los contenedores previos de forma controlada y levantar la aplicación inyectando el tag exacto de la imagen, utilizando la bandera `--no-build` para evitar compilaciones secundarias.

### 4.3 Requisitos y Configuración de la Instancia EC2
Para que el Pipeline finalice el aprovisionamiento, el servidor AWS EC2 destino debe contar con:
* Docker y Docker Compose instalados y configurados para arrancar con el OS.
* Existencia del directorio: `/home/ubuntu/recred-app`
* El archivo `.env` productivo alojado y configurado en dicho directorio (con conexiones reales a Cognito y PostgreSQL Supabase).
* Regla en el Security Group de AWS habilitando la entrada TCP sobre el puerto 8080.

Comandos ejecutados dinámicamente por el CD:
```bash
sudo systemctl stop recred.service || true
sudo docker rm -f recred-backend || true
sudo env BACKEND_IMAGE=recred-backend:${{ github.sha }} docker compose up -d --no-build
sudo docker image prune -f
```

---

## 5. Soporte y Recuperación (Troubleshooting)
Acciones rápidas frente a contingencias en producción o desarrollo local:

* **Corrupción de la DB local:** Si PostgreSQL rechaza credenciales en entorno local, limpiar el volumen persistido y reconstruir:
  ```bash
  docker compose down -v
  docker compose up --build
  ```
* **Fallo de arranque de Spring Boot:** En caso de que el Actuator no retorne UP, revisar los registros aislados de la aplicación del backend:
  ```bash
  docker logs recred-backend
  ```
