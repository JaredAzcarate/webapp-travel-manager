# 📚 Wiki de Desarrollo - Temple Caravan Management System

Esta wiki explica cómo está estructurado y cómo se trabaja en el proyecto.

- **[Implementación actual](./current-implementation.md)** — Auth, colecciones Firestore, rutas y modelos **tal como están en el código** (fuente de verdad técnica).
- **[project.md](./project.md)** — Especificación funcional del producto (puede describir comportamiento objetivo aún no implementado).

La documentación está organizada por temas en archivos separados para facilitar la navegación y el mantenimiento.

---

## 📋 Índice de Temas

1. [📌 Implementación actual](./current-implementation.md)
   - Auth (NextAuth), Firestore, rutas y datos reales del repositorio

2. [🛠 Stack Tecnológico](./01-stack-tecnologico.md)
   - Frontend, Backend y Utilidades

3. [🏗 Arquitectura y Principios](./02-arquitectura.md)
   - Principios SOLID y Patrones de Diseño

4. [📁 Estructura de Carpetas](./03-estructura-carpetas.md)
   - Organización del proyecto

5. [📝 Convenciones de Código](./04-convenciones-codigo.md)
   - Nombres de archivos, variables, imports y tipos

6. [🔄 Manejo de Estado y Datos](./05-estado-datos.md)
   - React Query, Context API y estado local

7. [📋 Formularios](./06-formularios.md)
   - Ant Design Form (NO react-hook-form)

8. [🧭 Routing y Navegación](./07-routing.md)
   - Next.js App Router, protección de rutas y filtros

9. [🎨 UI y Estilos](./08-ui-estilos.md)
   - Ant Design, Tailwind CSS y responsive design

10. [💬 Feedback al Usuario](./09-feedback-usuario.md)
    - **Notification de Ant Design (OBLIGATORIO)**

11. [🔌 API Routes](./10-api-routes.md)
    - Estructura, convenciones y autenticación

12. [🔥 Firebase y Firestore](./11-firebase.md)
    - Configuración, Repository Pattern y tipos

13. [✅ Testing y Validación](./12-testing.md)
    - Validación de datos y manejo de errores

14. [📦 Dependencias Clave](./13-dependencias.md)
    - Librerías principales del proyecto

15. [🔒 Firestore Security Rules](./14-firestore-rules.md)
    - Reglas de seguridad y permisos

16. [⚙️ Configuración Firebase Admin](./15-configuracion-firebase-admin.md)
    - Configurar credenciales del Admin SDK

---

## 🚀 Guía Rápida

Cuando implementes nuevas features:

1. **Seguir la estructura de carpetas** establecida
2. **Usar Repository Pattern** para Firestore
3. **React Query** para todas las operaciones de datos
4. **Ant Design Form** para formularios
5. **Notification de Ant Design** para todo el feedback al usuario
6. **Filtros por URL params**
7. **Tipos TypeScript** para todo
8. **Principios SOLID** en el diseño

---

## 📚 Referencias

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Ant Design Docs](https://ant.design/components/overview)
- [Firebase Docs](https://firebase.google.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Última actualización**: Marzo 2026
