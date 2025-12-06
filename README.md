# 📚 Book API – TCP Server

Este proyecto es una **API de gestión de biblioteca básica**, construida usando **Node.js** y comunicación mediante **sockets TCP** (módulo `net`).

Con los comandos:
```
GET BOOKS | GET AUTHORS | GET PUBLISHERS | SEARCH BOOK | SEARCH AUTHOR
ADD BOOK  | ADD AUTHOR  | ADD PUBLISHER  | EXIT
```
El objetivo del proyecto es practicar:

- Manejo de sockets TCP  
- Arquitectura MVC (Model – View – Controller)  
- Manejo básico de errores  
- Validación de datos (evitar duplicados)  
- Procesos interactivos desde consola  
- Persistencia usando archivos JSON  
- Node.js nativo para principiantes

## 📁 Estructura del Proyecto
```
book-api/
├── controllers/
│ ├── authorController.js
│ ├── bookController.js
│ └── publisherController.js
├── models/
│ ├── authorModel.js
│ ├── booksModel.js
│ └── publisherModel.js
├── views/
│ └── responseFormatter.js
├── data/
│ ├── authors.json
│ ├── books.json
│ └── publishers.json
├── server.js
└── client.js
```
## ⚙️ Requisitos / Dependencias

- Node.js
- Paquete `uuid` (para generar IDs automáticos)

Instalar `uuid` (si aún no está en tu `node_modules`):

npm install uuid
readline y net son módulos nativos de Node.js, no requieren instalación.

## ▶️ Cómo ejecutar
En una terminal, iniciar el servidor:

node server.js

En otra terminal, iniciar el cliente:

node client.js


## 🧭 Comandos disponibles

GET BOOKS — Lista todos los libros.

GET AUTHORS — Lista todos los autores.

GET PUBLISHERS — Lista todas las editoriales.

ADD BOOK — Proceso interactivo (título → año → autor → editorial).

El servidor crea autor/editorial automáticamente si no existen.

ADD AUTHOR — Proceso interactivo para crear autor.

ADD PUBLISHER — Proceso interactivo para crear editorial.

SEARCH BOOK — Busca libros por término (coincide en título o autor; interactivo).

SEARCH AUTHOR — Busca autor por nombre completo y exacto (interactivo).

EXIT — Cierra la conexión del cliente.

Los comandos se aceptan en mayúsculas o minúsculas (el servidor normaliza).


### 🔎 Funcionalidad de BÚSQUEDA

SEARCH BOOK
Inicia un modo interactivo que pide un término.

Busca en títulos y nombres de autores (búsqueda parcial, case-insensitive).

Devuelve una lista de libros que contengan el término en el título o en el autor.

Ejemplo de uso:

> SEARCH BOOK
🔎 Escribe término para buscar libro (título o autor):

Cien

Lista de libros:
1. Cien años de soledad (1967) — Gabriel García Márquez — Sudamericana

SEARCH AUTHOR
Inicia modo interactivo que pide un nombre

Busca autores por coincidencia exacta (case-insensitive).

Devuelve una lista de autores.

Ejemplo de uso:

> SEARCH AUTHOR
🔎 Escribe nombre o término para buscar autor:

Gabriel García Márquez

Lista de autores:
1. Gabriel García Márquez.

#### 🧱 Cómo están implementadas las búsquedas

controllers/bookController.js → función searchBooks(term) que llama a models/booksModel.searchBooksByTerm(term) y devuelve array de coincidencias.

controllers/authorController.js → función searchAuthorByName(term) que usa models/authorModel.findAuthorByName(name) y devuelve un array (vacío si no hay coincidencias).

views/responseFormatter.js formatea el resultado en listas amigables para enviar al cliente.

## 🛡️ Validaciones implementadas

No se permiten duplicados de autores (por nombre exacto, case-insensitive).

No se permiten duplicados de editoriales (por nombre exacto).

No se permiten duplicados de libros (mismo título y mismo autor).

Manejo de errores en modelos y controladores con mensajes claros.

IDs generados automáticamente con uuid (no visibles en la salida del cliente).

#### 📝 Consejo
Mantén una terminal con server.js y otra para client.js.

## ✅ Ejemplo rápido de sesión (resumen)

```
Cliente> ADD AUTHOR
✍️ Escribe el nombre del autor:
> Gabriel García Márquez
✔️ Autor creado: Gabriel García Márquez

Cliente> ADD BOOK
📚 Escribe el título del libro:
> Cien años de soledad
🗓️ Escribe el año de publicación:
> 1967
👤 Escribe el nombre del autor
> Gabriel García Márquez
🏢 Escribe el nombre de la editorial:
> Sudamericana
✔️ Libro agregado correctamente:
📚 Título: Cien años de soledad
🗓️ Año: 1967
👤 Autor: Gabriel García Márquez
🏢 Editorial: Sudamericana

Cliente> SEARCH BOOK
🔎 Escribe término para buscar libro (título o autor):
> cien
Lista de libros:
1. Cien años de soledad (1967) — Gabriel García Márquez — Sudamericana

Cliente> EXIT
🔌 Conexión cerrada por el servidor. ¡Adiós!
```