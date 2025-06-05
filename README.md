# CETMAR-Backend

Backend para el sistema de control escolar CETMAR.

## Descripción

Este proyecto es el backend del sistema de control escolar CETMAR, desarrollado con Node.js y PostgreSQL. Su objetivo es gestionar usuarios, docentes, alumnos, asistencias y notificaciones para la administración y operación eficiente de un plantel educativo.

La autenticación y autorización de usuarios se maneja mediante JWT (JSON Web Tokens), asegurando que solo usuarios autenticados y con los permisos adecuados puedan acceder a los diferentes recursos del sistema.

## Tecnologías principales

- Node.js
- Express.js
- PostgreSQL
- JWT para autenticación
- Socket.IO para notificaciones en tiempo real
- Multer para carga de archivos (importación de alumnos)
- Bcryptjs para encriptación de contraseñas

## Funcionalidades principales desarrolladas

### Usuarios

- Registro y gestión de usuarios con roles (superadmin, docente, tutor, administrativo, directivo, etc.)
- Autenticación con JWT y login seguro
- Consulta de datos de usuario y perfil
- Actualización de datos y roles de usuario
- Verificación de sesión activa

### Docentes

- Registro, consulta y actualización de docentes
- Búsqueda por ID

### Alumnos

- (Rutas preparadas para integración de funcionalidades de alumnos)
- Importación masiva de alumnos mediante archivos

### Asistencias

- Registro de asistencias masivas por clase/alumno
- Consulta de asistencias por alumno, clase y fecha
- Actualización masiva de estados de asistencias

### Notificaciones

- Notificaciones en tiempo real mediante Socket.IO
- Consulta de notificaciones no leídas
- Envío de notificaciones personalizadas a usuarios específicos
- Marcar notificaciones como leídas

## Seguridad

- Uso de JWT para autenticación y protección de rutas.
- Los roles de usuario definen los permisos para cada recurso.
- Contraseñas almacenadas con hash seguro (bcrypt).
- Middleware para autorización según rol requerido en endpoints críticos.

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/UNIVA-Proyectos/CETMAR-Backend.git
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno (`.env`), incluyendo:

   - `PORT`
   - `JWT_SECRET`
   - Parámetros de conexión a la base de datos PostgreSQL

4. Ejecuta el servidor:
   ```bash
   node server.js
   ```

## Uso

El backend expone endpoints RESTful bajo `/api/` para usuarios, docentes, alumnos, asistencias y notificaciones. La documentación de endpoints puede ampliarse según se desarrollen más funcionalidades.

- **Usuarios:** `/api/users/...`
- **Docentes:** `/api/docentes/...` y `/api/docente/...`
- **Alumnos:** `/api/alumno/...` (en desarrollo)
- **Asistencias:** `/api/asistencia/...`
- **Notificaciones:** `/api/notificaciones/...`

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o un pull request para sugerencias o mejoras.

---

**Desarrollado por UNIVA-Proyectos**
