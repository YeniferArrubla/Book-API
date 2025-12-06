const net = require('net');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
});

const client = new net.Socket();
const PROMPT_END = '__PROMPT_END__';

// modes: MENU (comandos) o INTERACTIVE (preguntas del servidor)
let mode = 'MENU';

// ======================================================
// Conexión
// ======================================================
client.connect(8080, 'localhost', () => {
    console.log('🔌 Conectado al servidor TCP (localhost:8080)');
});

// ======================================================
// Manejo de mensajes desde el servidor
// ======================================================
client.on('data', (data) => {
    const rawMsg = data.toString();

    // Detectar cierre explícito del servidor
    if (rawMsg.toLowerCase().includes('conexión cerrada')) {
        console.log('\n📨 **RESPUESTA DEL SERVIDOR**');

        console.log(rawMsg.trim());

        // Cerrar conexión
        try { rl.close(); } catch {}
        client.destroy(); 
        return;
    }

    // Si incluye la marca PROMPT_END → respuesta final
    if (rawMsg.includes(PROMPT_END)) {
        const cleanMsg = rawMsg.replace(PROMPT_END, '').trim();

        console.log('\n📨 **RESPUESTA DEL SERVIDOR**');

        console.log(cleanMsg);

        // Volvemos a modo MENU
        mode = 'MENU';

        // Mostrar prompt
        console.log("👉 Escribe un comando:");
        return;
    }

    // Si no contiene PROMPT_END → es un mensaje parcial
    console.log('\n📨 **RESPUESTA PARCIAL DEL SERVIDOR**');
    console.log(rawMsg);

    // Pasamos a modo interactivo
    mode = 'INTERACTIVE';
});

// ======================================================
// Eventos del socket
// ======================================================
client.on('close', () => {
    try { rl.close(); } catch {}
});

client.on('error', (err) => {
    console.error('❌ Error de conexión:', err.message);
    try { rl.close(); } catch {}
});

// ======================================================
// Lectura de comandos por consola
// ======================================================
rl.on('line', (input) => {
    const line = input.trim();
    if (!line) return;

    // --- COMANDO OCULTO:
    if (line.toLowerCase() === 'alicia') {
        console.log(`
        ╔═════════════════════════════════════╗
        ║      🌸 Gracias Profe Alicia 🌸     ║
        ║     Por guiarnos y apoyarnos        ║
        ║        en este camino ❤️             ║
        ╚═════════════════════════════════════╝
        `);
        console.log(`🎮     **COMANDOS DISPONIBLES**      🎮
    GET BOOKS | GET AUTHORS | GET PUBLISHERS | SEARCH BOOK | SEARCH AUTHOR
    ADD BOOK  | ADD AUTHOR  | ADD PUBLISHER  | EXIT
        `);
        console.log("👉 Escribe un comando:");
        return; // No enviamos nada al servidor
    }

    // Si estamos en modo menú → es un comando normal
    if (mode === 'MENU') {
        client.write(line);
        return;
    }

    // Si estamos en modo interactivo → respuesta a pregunta del servidor
    if (mode === 'INTERACTIVE') {
        client.write(line);
        return;
    }

    // Seguridad: cualquier otro caso
    client.write(line);
});
