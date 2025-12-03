const net = require('net');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const client = new net.Socket();

// ======================================================
// Conexión al servidor
// ======================================================
client.connect(8080, 'localhost', () => {
    console.log('🔌 Conectado al servidor TCP (localhost:8080)');
});

client.on('data', (data) => {
    const msg = data.toString();

    console.log('\n📨 **RESPUESTA DEL SERVIDOR**');
    console.log(msg);

    // Si el servidor anuncia que va a cerrar, no mostramos menú
    if (msg.includes("Conexión cerrada")) {
        return;
    }

    // Mostrar menú de nuevo SOLO cuando el servidor termina de responder
    showMenu();
});

client.on('close', () => {
    console.log('🔌 Conexión cerrada por el servidor.');
    rl.close();
});

client.on('error', (err) => {
    console.error('❌ Error de conexión:', err.message);
    rl.close();
});

// ======================================================
// MENÚ DEL CLIENTE
// ======================================================
function showMenu() {
    console.log('\n📘 **COMANDOS DISPONIBLES**');
    console.log(
        "GET BOOKS | GET AUTHORS | GET PUBLISHERS\n" +
        "ADD BOOK | ADD AUTHOR | ADD PUBLISHER | EXIT\n"
    );

    rl.question('👉 Escribe un comando: ', (answer) => {
        const cmd = answer.trim();
        if (!cmd) return showMenu();

        client.write(cmd);

        if (cmd.toUpperCase() === 'EXIT') {
            // Dejamos que el servidor cierre la conexión con su mensaje
        }
    });
}

