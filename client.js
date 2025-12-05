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

    // Si incluye la marca PROMPT_END → respuesta final
    if (rawMsg.includes(PROMPT_END)) {
        const cleanMsg = rawMsg.replace(PROMPT_END, '').trim();

        console.log('\n     📨      **RESPUESTA DEL SERVIDOR**      ');
        console.log(cleanMsg);

        // Si el servidor anuncia cierre, terminar cliente
        if (cleanMsg.toLowerCase().includes('conexión cerrada')) {
            try { rl.close(); } catch {}
            return;
        }

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
    console.log("🔌 Conexión cerrada.");
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

    if (mode === 'MENU') {
        client.write(line);
        return;
    }

    if (mode === 'INTERACTIVE') {
        client.write(line);
        return;
    }

    client.write(line);
});
