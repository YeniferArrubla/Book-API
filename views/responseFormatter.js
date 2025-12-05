module.exports = {

        // MENÚ PRINCIPAL
    formatMenu() {
        return (
            "📘 **COMANDOS DISPONIBLES**\n" +
            "GET BOOKS | GET AUTHORS | GET PUBLISHERS | SEARCH BOOK | SEARCH AUTHOR\n" +
            "ADD BOOK | ADD AUTHOR | ADD PUBLISHER | EXIT\n"
        );
    },

    // Listas no en formato json
    formatList(items, label) {
        if (!items || items.length === 0) {
            return `No hay ${label} registrados.\n`;
        }

        let output = `Lista de ${label}:\n`;

        items.forEach((item, index) => {
            if (label === 'libros') {
                // Mostrar título (año) - autor - editorial
                output += `${index + 1}. 📚  ${item.title} (${item.year}) — 👤  ${item.authorName} — 🏢  ${item.publisherName}\n`;
            } else if (label === 'autores') {
                // Mostrar nombre
                output += `${index + 1}. 👤 ${item.name}\n`;
            } else if (label === 'editoriales') {
                output += `${index + 1}. 🏢 ${item.name}\n`;
            }
        });

        return output;
    },

    // Para confirmar creación de autor/editorial/libro
    formatCreated(label, item) {
        if (label === 'autor') {
            return `✔️ Autor creado: ${item.name}\n`;
        }
        if (label === 'editorial') {
            return `✔️ Editorial creada: ${item.name}\n`;
        }
        if (label === 'libro') {
            return (
                `\n   ✔️    Libro agregado correctamente:\n` +
                `   📚  Título: ${item.title}\n` +
                `   🗓️  Año: ${item.year}\n` +
                `   ✍️  Autor: ${item.authorName}\n` +
                `   🏢  Editorial: ${item.publisherName}\n\n`
            );
        }

        return 'Elemento creado correctamente.\n';
    }
};
