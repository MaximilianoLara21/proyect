const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { conectarDB, cerrarDB } = require("./back/db");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
// Esta es la carta inicial: sirve para preparar la base la primera vez que se inicia el sitio.
const productosIniciales = [
    {
        _id: "mora",
        name: "Mora",
        description: "Un delicioso bolo de mora, refrescante y lleno de sabor.",
        price: 0.5,
        image: "/assets/img/mora.jpg",
        order: 1,
        active: true
    },
    {
        _id: "maracuya",
        name: "Maracuyá",
        description: "El sabor tropical del maracuyá convertido en un refrescante bolo.",
        price: 0.5,
        image: "/assets/img/maracuya.jpg",
        order: 2,
        active: true
    },
    {
        _id: "coco",
        name: "Coco",
        description: "Un sabor suave y tropical perfecto para disfrutar en un día caluroso.",
        price: 0.5,
        image: "/assets/img/coco.jpg",
        order: 3,
        active: true
    },
    {
        _id: "fresa",
        name: "Fresa",
        description: "Delicioso sabor a fresa para disfrutar en cualquier momento.",
        price: 0.5,
        image: "/assets/img/fresa.jpg",
        order: 4,
        active: true
    },
    {
        _id: "mango",
        name: "Mango",
        description: "El sabor dulce y tropical del mango en un delicioso bolo.",
        price: 0.5,
        image: "/assets/img/mango.jpg",
        order: 5,
        active: true
    },
    {
        _id: "tamarindo",
        name: "Tamarindo",
        description: "Una opción refrescante con el característico sabor del tamarindo.",
        price: 0.5,
        image: "/assets/img/tamarindo.jpg",
        order: 6,
        active: true
    }
];

const tiposContenido = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png"
};
// El sitio solo entrega estas páginas y sus imágenes; otros archivos del proyecto no son públicos.
const rutasPublicas = new Set([
    "/",
    "/index.html",
    "/script.js",
    "/style.css",
    "/pedido.html",
    "/pedido.js"
]);

async function prepararCatalogo(db) {
    const catalogo = db.collection("productos");

    // Si un sabor ya existe, respetamos sus cambios; solo agregamos los que todavía faltan.
    await Promise.all(
        productosIniciales.map((producto) =>
            catalogo.updateOne(
                { _id: producto._id },
                { $setOnInsert: producto },
                { upsert: true }
            )
        )
    );
}

function responderJson(response, statusCode, data) {
    response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
    });
    response.end(JSON.stringify(data));
}

async function manejarSolicitud(request, response, db) {
    let requestUrl;
    try {
        requestUrl = new URL(request.url, "http://localhost");
    } catch (error) {
        responderJson(response, 400, { error: "La dirección solicitada no es válida." });
        return;
    }

    if (requestUrl.pathname === "/api/productos") {
        if (request.method !== "GET") {
            responderJson(response, 405, { error: "Método no permitido." });
            return;
        }

        // La página recibe únicamente los sabores disponibles, en el orden pensado para mostrarlos.
        const productos = await db.collection("productos")
            .find({ active: true })
            .project({ name: 1, description: 1, price: 1, image: 1, order: 1 })
            .sort({ order: 1 })
            .toArray();
        responderJson(response, 200, productos);
        return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
        responderJson(response, 405, { error: "Método no permitido." });
        return;
    }

    const esImagenPublica = /^\/assets\/img\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png)$/.test(requestUrl.pathname);
    if (!rutasPublicas.has(requestUrl.pathname) && !esImagenPublica) {
        responderJson(response, 404, { error: "No se encontró el recurso solicitado." });
        return;
    }

    let pathname;
    try {
        pathname = decodeURIComponent(requestUrl.pathname);
    } catch (error) {
        responderJson(response, 400, { error: "La dirección solicitada no es válida." });
        return;
    }

    const requestedFile = pathname === "/" ? "index.html" : pathname.slice(1);
    const filePath = path.resolve(ROOT, requestedFile);
    // Nos aseguramos de que una dirección no permita salir de la carpeta del sitio.
    if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
        responderJson(response, 403, { error: "Acceso denegado." });
        return;
    }

    try {
        const content = await fs.promises.readFile(filePath);
        response.writeHead(200, {
            "Content-Type": tiposContenido[path.extname(filePath).toLowerCase()] || "application/octet-stream",
            "X-Content-Type-Options": "nosniff"
        });
        response.end(request.method === "HEAD" ? undefined : content);
    } catch (error) {
        if (error.code === "ENOENT" || error.code === "EISDIR") {
            responderJson(response, 404, { error: "No se encontró el recurso solicitado." });
            return;
        }
        throw error;
    }
}

async function iniciarServidor() {
    // Primero preparamos la base y el catálogo; después ponemos el sitio a disposición.
    const db = await conectarDB();
    await prepararCatalogo(db);

    const server = http.createServer((request, response) => {
        manejarSolicitud(request, response, db).catch((error) => {
            console.error("Error procesando la solicitud:", error);
            if (!response.headersSent) {
                responderJson(response, 500, { error: "Ocurrió un error interno del servidor." });
            } else {
                response.destroy(error);
            }
        });
    });

    server.listen(PORT, () => {
        console.log(`Boloyaco está disponible en http://localhost:${PORT}`);
    });

    const detenerServidor = () => {
        // Al cerrar la aplicación, también cerramos la conexión con la base de datos.
        server.close(async (error) => {
            if (error) {
                console.error("Error al cerrar el servidor:", error);
                process.exitCode = 1;
            }
            await cerrarDB();
        });
    };
    process.once("SIGINT", detenerServidor);
    process.once("SIGTERM", detenerServidor);
}

iniciarServidor().catch(async (error) => {
    console.error("No se pudo iniciar el servidor:", error.message);
    await cerrarDB();
    process.exitCode = 1;
});