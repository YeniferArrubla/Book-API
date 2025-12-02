// const net = require('net');
// const readline = require('readline');

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });

// const client = new net.Socket();

// client.connect(8080, 'localhost', () => {
//     console.log('Conectado al servidor TCP (localhost:8080)');
//     showMenu();
// });

// client.on('data', (data) => {
//     console.log('\n--- RESPUESTA DEL SERVIDOR ---\n');
//     console.log(data.toString());
//     console.log('--- FIN RESPUESTA ---\n');
//     // Mostrar de nuevo el menú
//     showMenu();
// });

// client.on('close', () => {
//     console.log('Conexión cerrada por el servidor.');
//     rl.close();
// });

// client.on('error', (err) => {
//     console.error('Error de conexión:', err.message);
//     rl.close();
// });

// function showMenu() {
//     console.log('Comandos: GET BOOKS | ADD BOOK (comando interactivo) | GET AUTHORS | ADD AUTHOR {json} | GET PUBLISHERS | ADD PUBLISHER {json} | EXIT');
//     rl.question('Escribe comando: ', (answer) => {
//         const cmd = answer.trim();
//         if (!cmd) return showMenu();
//         client.write(cmd);
//         // Nota: la respuesta llega por el evento 'data'
//         if (cmd === 'EXIT') {
//             // cerramos el cliente después de enviar exit
//             // el servidor enviará el mensaje y cerrará la conexión
//         }
//     });
// };
const net = require('net');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const client = new net.Socket();

let isInInteractiveMode = false;

client.connect(8080, 'localhost', () => {
    console.log('Conectado al servidor TCP (localhost:8080)');
    showMenu();
});

client.on('data', (data) => {
    const message = data.toString();

    console.log('\n--- RESPUESTA DEL SERVIDOR ---\n');
    console.log(message);

    // detectar si estamos en flujo interactivo
    if (
        message.startsWith('ADD BOOK') ||
        message.startsWith('Paso') ||
        message.includes('¿Deseas') ||
        message.includes('Ingresa') ||
        message.includes('Escribe el nombre') ||
        message.includes('crear') ||
        message.includes('no encontrada')
    ) {
        isInInteractiveMode = true;
        rl.question('', (userInput) => {
            client.write(userInput);
        });
        return;
    }

    // si el servidor terminó el flujo...
    if (isInInteractiveMode) {
        // si vemos ✔️ normalmente significa fin del flujo
        if (message.includes('✔️') || message.includes('correctamente')) {
            isInInteractiveMode = false;
            showMenu();
            return;
        }
    }

    // modo normal
    if (!isInInteractiveMode) {
        showMenu();
    }
});

client.on('close', () => {
    console.log('Conexión cerrada por el servidor.');
    rl.close();
});

client.on('error', (err) => {
    console.error('Error de conexión:', err.message);
    rl.close();
});

function showMenu() {
    console.log('Comandos: GET BOOKS | ADD BOOK | GET AUTHORS | ADD AUTHOR | GET PUBLISHERS | ADD PUBLISHER | EXIT');
    rl.question('Escribe comando: ', (answer) => {
        const cmd = answer.trim();
        if (!cmd) return showMenu();
        client.write(cmd);
    });
}
