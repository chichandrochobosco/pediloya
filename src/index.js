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

 //obtener perfil
 app.get('/perfil/:id', (req, res) => {
  const usuarioId = req.params.id;

  // Consulta para obtener los detalles del perfil
  const query = `SELECT id, nombre, email, fecha_registro, direccion, telefono FROM usuarios WHERE id = ?`;

  connection.query(query, [usuarioId], (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al obtener el perfil del usuario.' });
    }

    if (results.length === 0) {
      return res.status(404).send({ message: 'Usuario no encontrado.' });
    }

    // Devolver el perfil del usuario
    res.status(200).send(results[0]);
  });
});

//


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


//PEDIDO


//Método Obtener pedidos
app.get('/pedidos', (req, res) => {
  const cantidad = req.query.cantidad ? parseInt(req.query.cantidad) : 10; // Por defecto 10
  const estado = req.query.estado; // Opcional, para filtrar por estado
  const fecha = req.query.fecha; // Opcional, para filtrar por fecha
  
  // Construcción de la consulta SQL con los filtros opcionales
  let query = `SELECT id, usuario_id, estado, fecha, precio FROM pedidos`;
  const queryParams = [];

  if (estado || fecha) {
    query += ` WHERE`;
    if (estado) {
      query += ` estado = ?`;
      queryParams.push(estado);
    }
    if (fecha) {
      if (estado) query += ` AND`;
      query += ` fecha = ?`;
      queryParams.push(fecha);
    }
  }

  query += ` LIMIT ?`;
  queryParams.push(cantidad);

  connection.query(query, queryParams, (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al obtener los pedidos.' });
    }

    res.status(200).send(results);
  });
});

//Método obtener productos de un pedido

app.get('/pedido/:id/productos', (req, res) => {
  const pedidoId = req.params.id;

  // Consulta para obtener los productos de un pedido
  const query = `
    SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen, pp.cantidad 
    FROM pedido_productos pp
    JOIN productos p ON pp.producto_id = p.id
    WHERE pp.pedido_id = ?`;

  connection.query(query, [pedidoId], (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al obtener los productos del pedido.' });
    }

    if (results.length === 0) {
      return res.status(404).send({ message: 'No se encontraron productos para este pedido.' });
    }

    // Retornar la lista de productos
    res.status(200).send(results);
  });
});

//obtener pedido por id

app.get('/pedido/:id', (req, res) => {
  const pedidoId = req.params.id;

  // Consulta para obtener el pedido por su ID
  const query = `
    SELECT id, usuario_id, estado, fecha, precio
    FROM pedidos
    WHERE id = ?`;

  connection.query(query, [pedidoId], (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al obtener el pedido.' });
    }

    if (results.length === 0) {
      return res.status(404).send({ message: 'Pedido no encontrado.' });
    }

    // Retornar el objeto pedido
    res.status(200).send(results[0]);
  });
});

//actualizar estado de un pedido

app.put('/pedido/:id/estado', (req, res) => {
  const pedidoId = req.params.id;
  const { estado } = req.body;

  // Verificar si el estado es válido
  const estadosValidos = ['pendiente', 'completado', 'cancelado'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).send({ message: 'Estado no válido' });
  }

  // Consulta para actualizar el estado del pedido
  const query = `
    UPDATE pedidos
    SET estado = ?
    WHERE id = ?`;

  connection.query(query, [estado, pedidoId], (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al actualizar el estado del pedido.' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).send({ message: 'Pedido no encontrado.' });
    }

    // Retornar éxito de la operación
    res.status(200).send({ success: true });
  });
});

//eliminar un pedido
app.delete('/pedido/:id', (req, res) => {
  const pedidoId = req.params.id;

  // Consulta para eliminar el pedido (productos relacionados se eliminan automáticamente gracias a ON DELETE CASCADE)
  const query = `DELETE FROM pedidos WHERE id = ?`;

  connection.query(query, [pedidoId], (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al eliminar el pedido.' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).send({ message: 'Pedido no encontrado.' });
    }

    // Retornar éxito de la operación
    res.status(200).send({ success: true });
  });
});

//MENU DEL DIA

//agregar plato al menu del dia
app.post('/menu-dia', (req, res) => {
  const { nombre, descripcion, precio, fecha } = req.body;

  // Consulta para insertar un nuevo plato en la tabla de platos
  const queryPlato = `INSERT INTO platos (nombre, descripcion, precio) VALUES (?, ?, ?)`;

  connection.query(queryPlato, [nombre, descripcion, precio], (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al agregar el plato.' });
    }

    const platoId = results.insertId;

    // Consulta para agregar el plato al menú del día para la fecha especificada
    const queryMenuDia = `INSERT INTO menu_dia (fecha, plato_id) VALUES (?, ?)`;

    connection.query(queryMenuDia, [fecha, platoId], (error, results) => {
      if (error) {
        return res.status(500).send({ message: 'Error al agregar el plato al menú del día.' });
      }

      // Retornar éxito de la operación
      res.status(200).send({ success: true, message: 'Plato agregado al menú del día correctamente.' });
    });
  });
});

// Ruta para obtener los platos del menú del día basados en ventas o reseñas
app.get('/menu-dia', (req, res) => {
  const { fecha, ordenarPor } = req.query; // "ventas" o "reseñas"

  let query = `
    SELECT p.id, p.nombre, p.descripcion, p.precio, 
    SUM(v.cantidad) AS total_ventas, AVG(r.calificacion) AS promedio_reseñas
    FROM platos p
    JOIN menu_dia m ON p.id = m.plato_id
    LEFT JOIN ventas v ON p.id = v.plato_id
    LEFT JOIN reseñas r ON p.id = r.plato_id
    WHERE m.fecha = ?
    GROUP BY p.id
  `;

  // Ordenar por cantidad de ventas o calificaciones de reseñas
  if (ordenarPor === 'ventas') {
    query += ` ORDER BY total_ventas DESC`;
  } else if (ordenarPor === 'reseñas') {
    query += ` ORDER BY promedio_reseñas DESC`;
  }

  connection.query(query, [fecha], (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al obtener los platos del menú del día.' });
    }

    // Devolver los platos del menú del día
    res.status(200).send(results);
  });
});

// Ruta para eliminar un plato específico del menú del día
app.delete('/menu-dia/:fecha/:plato_id', (req, res) => {
  const { fecha, plato_id } = req.params;

  // Consulta para eliminar el plato del menú del día para la fecha específica
  const query = `DELETE FROM menu_dia WHERE fecha = ? AND plato_id = ?`;

  connection.query(query, [fecha, plato_id], (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al eliminar el plato del menú del día.' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).send({ message: 'No se encontró el plato para la fecha especificada.' });
    }

    // Retornar éxito si se eliminó correctamente
    res.status(200).send({ success: true, message: 'Plato eliminado del menú del día correctamente.' });
  });
});

// Ruta para obtener el menú semanal
app.get('/menu-semanal', (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query; // Fechas de inicio y fin de la semana

  // Consulta SQL para obtener los platos del menú para la semana
  const query = `
    SELECT m.fecha, p.nombre, p.descripcion, p.precio
    FROM menu_dia m
    JOIN platos p ON m.plato_id = p.id
    WHERE m.fecha BETWEEN ? AND ?
    ORDER BY m.fecha
  `;

  connection.query(query, [fecha_inicio, fecha_fin], (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Error al obtener el menú semanal.' });
    }

    // Agrupar los platos por fecha para generar una vista del menú semanal
    const menuSemanal = results.reduce((acc, plato) => {
      const fecha = plato.fecha.toISOString().split('T')[0]; // Formatear la fecha
      if (!acc[fecha]) {
        acc[fecha] = [];
      }
      acc[fecha].push({
        nombre: plato.nombre,
        descripcion: plato.descripcion,
        precio: plato.precio
      });
      return acc;
    }, {});

    // Devolver el menú semanal agrupado por fecha
    res.status(200).send(menuSemanal);
  });
});
