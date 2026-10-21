const express = require('express');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');
const app = express();
const PORT = process.env.PORT || 3000;

const authTokens = new Map();

const PRODUCT_CATEGORIES = [
  'alimentación y lactancia',
  'aseo e higiene',
  'ropa y textiles',
  'habitación y organización',
  'transporte y paseo',
  'pañales y artículos de uso diario',
  'cositas para mamá',
];

const FALLBACK_PRODUCTS = [
  { id: 1, name: 'Biberón de vidrio 260 ml', category: 'alimentación y lactancia', quantity: 2, reserved_quantity: 0, alternative_group: 'alimentación y lactancia', image_url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80', description: 'Biberón de vidrio resistente y fácil de limpiar' },
  { id: 2, name: 'Leche de fórmula 800 g', category: 'alimentación y lactancia', quantity: 4, reserved_quantity: 0, alternative_group: 'alimentación y lactancia', image_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80', description: 'Leche para lactancia mixta o complemento' },
  { id: 3, name: 'Tetero eléctrico', category: 'alimentación y lactancia', quantity: 1, reserved_quantity: 0, alternative_group: 'alimentación y lactancia', image_url: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=900&q=80', description: 'Para calentar biberones con temperatura segura' },
  { id: 4, name: 'Pañitos de bambú', category: 'aseo e higiene', quantity: 6, reserved_quantity: 0, alternative_group: 'aseo e higiene', image_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80', description: 'Pañitos suaves para uso diario' },
  { id: 5, name: 'Crema hidratante', category: 'aseo e higiene', quantity: 3, reserved_quantity: 0, alternative_group: 'aseo e higiene', image_url: 'https://images.unsplash.com/photo-1542272607-5f5d4a2685d8?auto=format&fit=crop&w=900&q=80', description: 'Crema para piel sensible del bebé' },
  { id: 6, name: 'Toalla de baño', category: 'aseo e higiene', quantity: 2, reserved_quantity: 0, alternative_group: 'aseo e higiene', image_url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80', description: 'Toalla grande y absorbente' },
  { id: 7, name: 'Body de algodón', category: 'ropa y textiles', quantity: 5, reserved_quantity: 0, alternative_group: 'ropa y textiles', image_url: 'https://images.unsplash.com/photo-1542272607-5f5d4a2685d8?auto=format&fit=crop&w=900&q=80', description: 'Body cómodo para primeros meses' },
  { id: 8, name: 'Manta de algodón', category: 'ropa y textiles', quantity: 4, reserved_quantity: 0, alternative_group: 'ropa y textiles', image_url: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=900&q=80', description: 'Manta suave para dormir' },
  { id: 9, name: 'Pijama de manga corta', category: 'ropa y textiles', quantity: 3, reserved_quantity: 0, alternative_group: 'ropa y textiles', image_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80', description: 'Pijama de algodón para noches frescas' },
  { id: 10, name: 'Cuna portatil', category: 'habitación y organización', quantity: 1, reserved_quantity: 0, alternative_group: 'habitación y organización', image_url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80', description: 'Cuna portátil para espacios reducidos' },
  { id: 11, name: 'Cajón organizador', category: 'habitación y organización', quantity: 2, reserved_quantity: 0, alternative_group: 'habitación y organización', image_url: 'https://images.unsplash.com/photo-1542272607-5f5d4a2685d8?auto=format&fit=crop&w=900&q=80', description: 'Caja para guardar ropita y accesorios' },
  { id: 12, name: 'Lámpara de noche', category: 'habitación y organización', quantity: 2, reserved_quantity: 0, alternative_group: 'habitación y organización', image_url: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=900&q=80', description: 'Luz suave y decorativa para la habitación' },
  { id: 13, name: 'Saco de paseo', category: 'transporte y paseo', quantity: 2, reserved_quantity: 0, alternative_group: 'transporte y paseo', image_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80', description: 'Saco para llevar al bebé en el coche' },
  { id: 14, name: 'Cochecito de paseo', category: 'transporte y paseo', quantity: 1, reserved_quantity: 0, alternative_group: 'transporte y paseo', image_url: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=900&q=80', description: 'Cochecito para desplazamientos cómodos' },
  { id: 15, name: 'Portabebés', category: 'transporte y paseo', quantity: 1, reserved_quantity: 0, alternative_group: 'transporte y paseo', image_url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80', description: 'Portabebés con soporte ergonómico' },
  { id: 16, name: 'Pañales talla 1', category: 'pañales y artículos de uso diario', quantity: 10, reserved_quantity: 0, alternative_group: 'pañales y artículos de uso diario', image_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80', description: 'Caja de pañales para uso diario' },
  { id: 17, name: 'Toallitas húmedas', category: 'pañales y artículos de uso diario', quantity: 8, reserved_quantity: 0, alternative_group: 'pañales y artículos de uso diario', image_url: 'https://images.unsplash.com/photo-1542272607-5f5d4a2685d8?auto=format&fit=crop&w=900&q=80', description: 'Toallitas suaves para limpieza' },
  { id: 18, name: 'Bolsas de basura', category: 'pañales y artículos de uso diario', quantity: 5, reserved_quantity: 0, alternative_group: 'pañales y artículos de uso diario', image_url: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=900&q=80', description: 'Bolsas para residuos del pañal' },
  { id: 19, name: 'Set de lactancia', category: 'cositas para mamá', quantity: 2, reserved_quantity: 0, alternative_group: 'cositas para mamá', image_url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80', description: 'Kit para la etapa de lactancia' },
  { id: 20, name: 'Almohadilla de lactancia', category: 'cositas para mamá', quantity: 3, reserved_quantity: 0, alternative_group: 'cositas para mamá', image_url: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=900&q=80', description: 'Comodidad extra durante la lactancia' },
  { id: 21, name: 'Pañuelo de pecho', category: 'cositas para mamá', quantity: 4, reserved_quantity: 0, alternative_group: 'cositas para mamá', image_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80', description: 'Pañuelo cómodo para regalar' },
];

function openDatabase(filePath = DB_PATH) {
  return new sqlite3.Database(filePath);
}

function initSchema(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 0,
          reserved_quantity INTEGER NOT NULL DEFAULT 0,
          alternative_group TEXT NOT NULL DEFAULT '',
          image_url TEXT,
          description TEXT,
          is_active INTEGER NOT NULL DEFAULT 1
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS reservations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          guest_name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          message TEXT,
          status TEXT NOT NULL DEFAULT 'reserved',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(product_id) REFERENCES products(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL
        )
      `);

      db.run(`
        INSERT OR IGNORE INTO admin_users (username, password_hash)
        VALUES ('admin', ?)
      `, [bcrypt.hashSync('kiam2026', 10)], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

async function initializeDatabase(filePath = DB_PATH) {
  const db = openDatabase(filePath);
  await initSchema(db);
  if (!filePath || filePath === ':memory:') {
    return db;
  }
  await seedProducts(db);
  return db;
}

function seedProducts(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) AS count FROM products', [], (err, row) => {
      if (err) return reject(err);
      if (row.count > 0) return resolve();

      const insertStatements = FALLBACK_PRODUCTS.map((product) => {
        const values = [
          product.id,
          product.name,
          product.category,
          product.quantity,
          product.reserved_quantity,
          product.alternative_group,
          product.image_url,
          product.description,
          1,
        ];

        return new Promise((resolveInsert, rejectInsert) => {
          db.run(
            `INSERT INTO products (id, name, category, quantity, reserved_quantity, alternative_group, image_url, description, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            values,
            (insertErr) => (insertErr ? rejectInsert(insertErr) : resolveInsert())
          );
        });
      });

      Promise.all(insertStatements)
        .then(() => resolve())
        .catch(reject);
    });
  });
}

function getProducts(db, includeInactive = false) {
  return new Promise((resolve, reject) => {
    const sql = includeInactive
      ? 'SELECT * FROM products ORDER BY category, name'
      : 'SELECT * FROM products WHERE is_active = 1 ORDER BY category, name';

    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map((product) => ({
        ...product,
        reserved: Number(product.reserved_quantity || 0),
        available: Number(product.quantity - product.reserved_quantity),
        status: Number(product.quantity - product.reserved_quantity) <= 0 ? 'agotado' : 'disponible',
      })));
    });
  });
}

function getReservations(db) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT r.*, p.name AS product_name, p.category AS product_category
       FROM reservations r
       JOIN products p ON p.id = r.product_id
       ORDER BY r.created_at DESC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

async function reserveProducts({ productId, quantity, guestName, message = '', db = null }) {
  const activeDb = db || (await initializeDatabase());
  const qty = Number(quantity || 0);
  if (!productId || qty <= 0 || !guestName || !String(guestName).trim()) {
    return { ok: false, message: 'Datos de reserva incompletos.' };
  }

  return new Promise((resolve) => {
    activeDb.serialize(() => {
      activeDb.run('BEGIN IMMEDIATE');
      activeDb.get(
        'SELECT * FROM products WHERE id = ? AND is_active = 1',
        [productId],
        (err, product) => {
          if (err) {
            activeDb.run('ROLLBACK');
            return resolve({ ok: false, message: 'Error revisando stock.' });
          }

          if (!product) {
            activeDb.run('ROLLBACK');
            return resolve({ ok: false, message: 'Producto no disponible.' });
          }

          const available = Number(product.quantity) - Number(product.reserved_quantity);
          if (qty > available) {
            activeDb.run('ROLLBACK');
            return resolve({ ok: false, message: 'No hay suficiente stock para esa cantidad.', available });
          }

          activeDb.run(
            `UPDATE products
             SET reserved_quantity = reserved_quantity + ?
             WHERE id = ? AND is_active = 1`,
            [qty, productId],
            (updateErr) => {
              if (updateErr) {
                activeDb.run('ROLLBACK');
                return resolve({ ok: false, message: 'No se pudo reservar el producto.' });
              }

              activeDb.run(
                `INSERT INTO reservations (product_id, guest_name, quantity, message, status)
                 VALUES (?, ?, ?, ?, 'reserved')`,
                [productId, guestName.trim(), qty, message?.trim() || ''],
                function (insertErr) {
                  if (insertErr) {
                    activeDb.run('ROLLBACK');
                    return resolve({ ok: false, message: 'La reserva no pudo registrarse.' });
                  }

                  activeDb.run('COMMIT', (commitErr) => {
                    if (commitErr) {
                      activeDb.run('ROLLBACK');
                      return resolve({ ok: false, message: 'Error al confirmar la reserva.' });
                    }

                    resolve({
                      ok: true,
                      reservation: {
                        id: this.lastID,
                        product_id: productId,
                        guest_name: guestName.trim(),
                        quantity: qty,
                        message: message?.trim() || '',
                        status: 'reserved',
                        remainingAfter: Number(product.quantity) - Number(product.reserved_quantity) - qty,
                      },
                    });
                  });
                }
              );
            }
          );
        }
      );
    });
  });
}

function cancelReservation({ reservationId, db }) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN IMMEDIATE');
      db.get('SELECT * FROM reservations WHERE id = ?', [reservationId], (err, reservation) => {
        if (err) {
          db.run('ROLLBACK');
          return reject(err);
        }

        if (!reservation || reservation.status === 'cancelled') {
          db.run('ROLLBACK');
          return resolve({ ok: false, message: 'Reserva inexistente o ya cancelada.' });
        }

        db.run(
          'UPDATE products SET reserved_quantity = reserved_quantity - ? WHERE id = ? AND reserved_quantity >= ?',
          [reservation.quantity, reservation.product_id, reservation.quantity],
          function (updateErr) {
            if (updateErr || this.changes === 0) {
              db.run('ROLLBACK');
              return reject(updateErr || new Error('No se pudo devolver el stock.'));
            }

            db.run(
              'UPDATE reservations SET status = ? WHERE id = ?',
              ['cancelled', reservationId],
              function (writeErr) {
                if (writeErr) {
                  db.run('ROLLBACK');
                  return reject(writeErr);
                }
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    db.run('ROLLBACK');
                    return reject(commitErr);
                  }
                  resolve({ ok: true, updatedReserved: 0, reservationId });
                });
              }
            );
          }
        );
      });
    });
  });
}

function markDelivered({ reservationId, db }) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM reservations WHERE id = ?', [reservationId], (err, reservation) => {
      if (err) return reject(err);
      if (!reservation) return resolve({ ok: false, message: 'Reserva no encontrada.' });

      db.run(
        'UPDATE reservations SET status = ? WHERE id = ?',
        ['delivered', reservationId],
        function (writeErr) {
          if (writeErr) return reject(writeErr);
          resolve({ ok: true, reservation: { ...reservation, status: 'delivered' } });
        }
      );
    });
  });
}

function checkAdminCredentials(username, password) {
  return new Promise((resolve, reject) => {
    const db = openDatabase(DB_PATH);
    db.get('SELECT password_hash FROM admin_users WHERE username = ?', [username], (err, row) => {
      db.close();
      if (err) return reject(err);
      if (!row || !bcrypt.compareSync(password, row.password_hash)) {
        return resolve(false);
      }
      resolve(true);
    });
  });
}

function adminLoginRequired(req, res, next) {
  const token = req.headers.authorization || '';
  const userToken = token.replace('Bearer ', '').trim();
  if (authTokens.has(userToken)) {
    req.adminUser = authTokens.get(userToken);
    return next();
  }
  res.status(401).json({ ok: false, message: 'No autorizado' });
}

function ensureServerReady() {
  return initializeDatabase(DB_PATH).then((db) => {
    global.__db = db;
    return db;
  });
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/products', async (req, res) => {
  try {
    const db = global.__db || (await initializeDatabase(DB_PATH));
    const products = await getProducts(db);
    res.json({ ok: true, products });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error cargando productos.' });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const { productId, quantity, guestName, message } = req.body || {};
    const db = global.__db || (await initializeDatabase(DB_PATH));
    const result = await reserveProducts({ productId, quantity, guestName, message, db });
    res.status(result.ok ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ ok: false, message: 'No se pudo completar la reserva.' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const valid = await checkAdminCredentials(username, password);
    if (!valid) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas' });
    }

    const token = Buffer.from(`${Date.now()}:${username}`).toString('base64');
    authTokens.set(token, { username });
    res.json({ ok: true, token, username });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error en autenticación.' });
  }
});

app.get('/api/admin/products', adminLoginRequired, async (req, res) => {
  try {
    const db = global.__db || (await initializeDatabase(DB_PATH));
    const products = await getProducts(db, true);
    res.json({ ok: true, products });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error cargando catálogo.' });
  }
});

app.post('/api/admin/products', adminLoginRequired, async (req, res) => {
  try {
    const db = global.__db || (await initializeDatabase(DB_PATH));
    const item = req.body || {};
    if (!item.name || !item.category) {
      return res.status(400).json({ ok: false, message: 'Faltan datos del producto.' });
    }

    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO products (name, category, quantity, reserved_quantity, alternative_group, image_url, description, is_active)
         VALUES (?, ?, ?, 0, ?, ?, ?, 1)`,
        [item.name, item.category, Number(item.quantity || 0), item.alternative_group || '', item.image_url || '', item.description || ''],
        function (err) {
          if (err) return reject(err);
          resolve({ ok: true, id: this.lastID });
        }
      );
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ ok: false, message: 'No se pudo crear el producto.' });
  }
});

app.put('/api/admin/products/:id', adminLoginRequired, async (req, res) => {
  try {
    const db = global.__db || (await initializeDatabase(DB_PATH));
    const item = req.body || {};
    db.run(
      `UPDATE products SET name = ?, category = ?, quantity = ?, alternative_group = ?, image_url = ?, description = ?, is_active = ? WHERE id = ?`,
      [item.name, item.category, Number(item.quantity || 0), item.alternative_group || '', item.image_url || '', item.description || '', item.is_active === false ? 0 : 1, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ ok: false, message: 'Error actualizando producto.' });
        res.json({ ok: true, changes: this.changes });
      }
    );
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error actualizando producto.' });
  }
});

app.get('/api/admin/reservations', adminLoginRequired, async (req, res) => {
  try {
    const db = global.__db || (await initializeDatabase(DB_PATH));
    const reservations = await getReservations(db);
    res.json({ ok: true, reservations });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error cargando reservas.' });
  }
});

app.post('/api/admin/reservations/:id/cancel', adminLoginRequired, async (req, res) => {
  try {
    const db = global.__db || (await initializeDatabase(DB_PATH));
    const result = await cancelReservation({ reservationId: Number(req.params.id), db });
    res.json(result);
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error cancelando reserva.' });
  }
});

app.post('/api/admin/reservations/:id/delivered', adminLoginRequired, async (req, res) => {
  try {
    const db = global.__db || (await initializeDatabase(DB_PATH));
    const result = await markDelivered({ reservationId: Number(req.params.id), db });
    res.json(result);
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error marcando regalo entregado.' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

async function startServer() {
  await ensureServerReady();
  app.listen(PORT, () => {
    console.log(`Kiam escuchando en http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  initializeDatabase,
  reserveProducts,
  cancelReservation,
  markDelivered,
  getProducts,
  getReservations,
  PRODUCT_CATEGORIES,
  FALLBACK_PRODUCTS,
};
