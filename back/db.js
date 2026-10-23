const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { MongoClient } = require("mongodb");

// La dirección y la clave de la base viven en back/.env, fuera de lo que ve el cliente.
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Falta configurar MONGODB_URI en el archivo .env");
}

const client = new MongoClient(uri);
let connectionPromise;

async function conectarDB() {
  // Reutilizamos la conexión para que las distintas partes del servidor trabajen con la misma base.
  if (!connectionPromise) {
    connectionPromise = client.connect().catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  await connectionPromise;
  return client.db();
}

module.exports = { conectarDB, cerrarDB: () => client.close() };