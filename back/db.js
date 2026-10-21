require("dotenv").config();

const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Falta configurar MONGODB_URI en el archivo .env");
}

const client = new MongoClient(uri);

async function conectarDB() {
  await client.connect();
  console.log("MongoDB conectado correctamente");
  return client.db();
}

module.exports = { conectarDB };