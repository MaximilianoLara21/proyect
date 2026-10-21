
const { conectarDB } = require("./db");

async function probarConexion() {
  try {
    const db = await conectarDB();
    console.log("Base de datos disponible:", db.databaseName);
  } catch (error) {
    console.error("Error de conexión:", error.message);
  } finally {
    process.exit();
  }
}

probarConexion();
