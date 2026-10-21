const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { MongoClient } = require("mongodb");

// La URI permanece en back/.env; nunca se envía al navegador.
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Falta configurar MONGODB_URI en el archivo .env");
}

const client = new MongoClient(uri);
let connectionPromise;

async function conectarDB() {
  // Comparte la misma conexión si varias solicitudes la necesitan a la vez.
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