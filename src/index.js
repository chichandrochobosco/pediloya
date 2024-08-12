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


// Middleware de autenticación y verificación de rol
function verificarAdmin(req, res, next) {
   const token = req.headers['authorization'];
 
   if (!token) {
     return res.status(403).send({ message: 'Token no proporcionado.' });
   }
 
   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
     if (err) {
       return res.status(500).send({ message: 'Error al verificar el token.' });
     }
 
     if (decoded.role !== 'admin') {
       return res.status(403).send({ message: 'No autorizado. Solo los administradores pueden realizar esta acción.' });
     }
 
     req.userId = decoded.id;
     next();
   });
 }


//rutas


//PRODUCTOS

app.get("/menu", async (req, res) =>{
   const connection = await database.getconnection();
   const result = await connection.query("SELECT * from producto");
   console.log(result); 
} )

/*app.get("/producto/:id", async (req, res) =>{
   const productId = req.params.id;
   const connection = await database.getconnection();
   const result = await connection.query("SELECT * from producto where id=;");
   console.log(result); 
} )*/

app.get('/producto/:id', (req, res) => {
   const productId = req.params.id;
 
   connection.query('SELECT * FROM productos WHERE id = ?', [productId], (error, results) => {
     if (error) {
       return res.status(500).send({ message: 'Error al obtener el producto' });
     }
     if (results.length === 0) {
       return res.status(404).send({ message: 'Producto no encontrado' });
     }
     res.send(results[0]);
   });
 });

 app.delete('/producto/:id', verificarAdmin, (req, res) => {
   const productId = req.params.id;
 
   connection.query('DELETE FROM productos WHERE id = ?', [productId], (error, results) => {
     if (error) {
       return res.status(500).send({ message: 'Error al eliminar el producto.' });
     }
 
     if (results.affectedRows === 0) {
       return res.status(404).send({ message: 'Producto no encontrado.' });
     }
 
     res.send({ message: 'Producto eliminado correctamente.' });
   });
 });

 app.put('/producto/:id', verificarAdmin, (req, res) => {
   const productId = req.params.id;
   const { nombre, descripcion, precio, stock } = req.body;
 
   // Consulta para actualizar el producto
   const query = `UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id = ?`;
 
   connection.query(query, [nombre, descripcion, precio, stock, productId], (error, results) => {
     if (error) {
       return res.status(500).send({ message: 'Error al actualizar el producto.' });
     }
 
     if (results.affectedRows === 0) {
       return res.status(404).send({ message: 'Producto no encontrado.' });
     }
 
     res.send({ message: 'Producto actualizado correctamente.' });
   });
 });
 
 app.post('/producto', verificarAdmin, (req, res) => {
   const { nombre, fecha_ingreso, categoria, cantidad, precio, descripcion, imagen } = req.body;
 
   // Validar que todos los campos requeridos estén presentes
   if (!nombre || !fecha_ingreso || !categoria || !cantidad || !precio || !descripcion || !imagen) {
     return res.status(400).send({ message: 'Todos los campos son obligatorios.' });
   }
 
   // Consulta para insertar el nuevo producto
   const query = `INSERT INTO productos (nombre, fecha_ingreso, categoria, cantidad, precio, descripcion, imagen)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`;
 
   connection.query(query, [nombre, fecha_ingreso, categoria, cantidad, precio, descripcion, imagen], (error, results) => {
     if (error) {
       return res.status(500).send({ message: 'Error al agregar el producto.' });
     }
 
     res.status(201).send({ message: 'Producto agregado exitosamente.', productoId: results.insertId });
   });
 });

//PERFIL

app.post('/usuario', async (req, res) => {
   const { nombre, email, contrasena, direccion, telefono } = req.body;
 
   // Validar que los campos requeridos estén presentes
   if (!nombre || !email || !contrasena) {
     return res.status(400).send({ message: 'Nombre, email y contraseña son obligatorios.' });
   }
 
   // Hash de la contraseña
   try {
     const hashedPassword = await bcrypt.hash(contrasena, 10);
 
     // Fecha de registro
     const fechaRegistro = new Date().toISOString().slice(0, 10);
 
     // Consulta para insertar el nuevo usuario
     const query = `INSERT INTO usuarios (nombre, email, contrasena, direccion, telefono, fecha_registro)
                    VALUES (?, ?, ?, ?, ?, ?)`;
 
     connection.query(query, [nombre, email, hashedPassword, direccion, telefono, fechaRegistro], (error, results) => {
       if (error) {
         // Si el email ya existe, enviamos un error
         if (error.code === 'ER_DUP_ENTRY') {
           return res.status(409).send({ message: 'El email ya está registrado.' });
         }
         return res.status(500).send({ message: 'Error al crear el usuario.' });
       }
 
       res.status(201).send({ message: 'Usuario creado exitosamente.', usuarioId: results.insertId });
     });
   } catch (error) {
     res.status(500).send({ message: 'Error al procesar la contraseña.' });
   }
 });

 app.get('/usuario/:id', (req, res) => {
   const usuarioId = req.params.id;
 
   // Consulta para seleccionar el usuario por su ID
   const query = 'SELECT * FROM usuarios WHERE id = ?';
 
   connection.query(query, [usuarioId], (error, results) => {
     if (error) {
       return res.status(500).send({ message: 'Error al recuperar el perfil del usuario.' });
     }
 
     if (results.length === 0) {
       return res.status(404).send({ message: 'Usuario no encontrado.' });
     }
 
     // Retornar la información del usuario
     res.status(200).send(results[0]);
   });
 });


 //CARRITO

 app.post('/carrito', (req, res) => {
  const { usuario_id } = req.body;

  // Validar que se haya proporcionado el ID del usuario
  if (!usuario_id) {
    return res.status(400).send({ message: 'El ID del usuario es obligatorio.' });
  }

  // Fecha de creación del carrito
  const fechaCreacion = new Date().toISOString().slice(0, 10);

  // Consulta para crear el carrito
  const query = `INSERT INTO carritos (usuario_id, fecha_creacion) VALUES (?, ?)`;

  connection.query(query, [usuario_id, fechaCreacion], (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al crear el carrito.' });
    }

    res.status(201).send({ message: 'Carrito creado exitosamente.', carritoId: results.insertId });
  });
});

//obtener carrito
app.get('/carrito/:id', (req, res) => {
  const carritoId = req.params.id;

  // Consulta para obtener los detalles del carrito, incluyendo los productos
  const query = `
    SELECT p.id, p.nombre, p.categoria, p.precio, cp.cantidad, p.descripcion, p.imagen 
    FROM carrito_productos cp
    JOIN productos p ON cp.producto_id = p.id
    WHERE cp.carrito_id = ?`;

  connection.query(query, [carritoId], (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al recuperar el carrito de compras.' });
    }

    if (results.length === 0) {
      return res.status(404).send({ message: 'El carrito está vacío o no existe.' });
    }

    // Retornar los productos del carrito
    res.status(200).send(results);
  });
});

// carrito por ID
app.get('/carrito/:id', (req, res) => {
  const carritoId = req.params.id;

  // Consulta para obtener los detalles del carrito específico
  const query = `
    SELECT c.id AS carrito_id, c.fecha_creacion, p.id AS producto_id, p.nombre, p.categoria, p.precio, cp.cantidad, p.descripcion, p.imagen 
    FROM carritos c
    JOIN carrito_productos cp ON c.id = cp.carrito_id
    JOIN productos p ON cp.producto_id = p.id
    WHERE c.id = ?`;

  connection.query(query, [carritoId], (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al recuperar el carrito de compras.' });
    }

    if (results.length === 0) {
      return res.status(404).send({ message: 'Carrito no encontrado o está vacío.' });
    }

    // Retornar los detalles del carrito y sus productos
    res.status(200).send(results);
  });
});

//agregar producto
app.post('/carrito/:id/producto', (req, res) => {
  const carritoId = req.params.id;
  const { productoId, cantidad } = req.body;

  // Primero, verifica si el producto ya está en el carrito
  const checkQuery = `
    SELECT cantidad FROM carrito_productos 
    WHERE carrito_id = ? AND producto_id = ?`;

  connection.query(checkQuery, [carritoId, productoId], (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al verificar el producto en el carrito.' });
    }

    if (results.length > 0) {
      // Si el producto ya está en el carrito, incrementa su cantidad
      const newCantidad = results[0].cantidad + cantidad;
      const updateQuery = `
        UPDATE carrito_productos 
        SET cantidad = ? 
        WHERE carrito_id = ? AND producto_id = ?`;

      connection.query(updateQuery, [newCantidad, carritoId, productoId], (error) => {
        if (error) {
          return res.status(500).send({ message: 'Error al actualizar la cantidad del producto.' });
        }
        return res.status(200).send({ message: 'Producto actualizado en el carrito.' });
      });
    } else {
      // Si el producto no está en el carrito, agrégalo
      const insertQuery = `
        INSERT INTO carrito_productos (carrito_id, producto_id, cantidad) 
        VALUES (?, ?, ?)`;

      connection.query(insertQuery, [carritoId, productoId, cantidad], (error) => {
        if (error) {
          return res.status(500).send({ message: 'Error al agregar el producto al carrito.' });
        }
        return res.status(200).send({ message: 'Producto agregado al carrito.' });
      });
    }
  });
});

//eliminar producto
app.delete('/carrito/:id/producto/:productoId', (req, res) => {
  const carritoId = req.params.id;
  const productoId = req.params.productoId;

  // Consulta para eliminar el producto del carrito
  const deleteQuery = `
    DELETE FROM carrito_productos 
    WHERE carrito_id = ? AND producto_id = ?`;

  connection.query(deleteQuery, [carritoId, productoId], (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al eliminar el producto del carrito.' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).send({ message: 'Producto no encontrado en el carrito.' });
    }

    res.status(200).send({ message: 'Producto eliminado del carrito.' });
  });
});