const express = require("express");
const morgan = require("morgan");
const database = require("./database");


//config inicial
const app = express();
app.set("port", 4000);
app.listen(app.get("port"));
console.log("escuchando al puerto :) "+app.get("port"));

//middlewares
app.use(morgan("dev"));

//rutas
app.get("/menu", async (req, res) =>{
   const connection = await database.getconnection();
   const result = await connection.query("SELECT * from producto");
   console.log(result); 
} )



