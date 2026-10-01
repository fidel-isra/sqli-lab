// =============================================================
//  app.js  ·  Servidor Express con rutas VULNERABLES A SQLi
//  ⚠️  USO EXCLUSIVAMENTE EDUCATIVO — NO DESPLEGAR EN PRODUCCIÓN
// =============================================================

require('dotenv').config();
const express = require('express');
const mysql   = require('mysql2');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Banner de advertencia en cada respuesta
app.use((req, res, next) => {
  res.setHeader('X-Warning', 'VULNERABLE - Solo entorno educativo');
  next();
});

// ── Conexión MySQL ─────────────────────────────────────────────
const db = mysql.createPool({
  host    : process.env.DB_HOST     || 'localhost',
  port    : parseInt(process.env.DB_PORT) || 3306,
  user    : process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'practica',
  waitForConnections: true,
  connectionLimit   : 10,
});

// Helper: ejecuta query y retorna promesa
function query(sql) {
  return new Promise((resolve, reject) => {
    db.query(sql, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

// =============================================================
//  RUTA 1 — POST /login
//  Vulnerabilidad: Authentication Bypass con ' OR '1'='1' --
//  Payload de prueba:
//      username: admin' OR '1'='1' --
//      password: cualquiera
// =============================================================
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // ❌ VULNERABLE: interpolación directa de inputs del usuario
  const sql = `SELECT * FROM usuarios WHERE username = '${username}' AND password = '${password}'`;

  console.log('[/login] Query ejecutada:', sql);

  try {
    const rows = await query(sql);
    if (rows.length > 0) {
      res.json({
        status : 'ok',
        mensaje: '✅ Login exitoso',
        usuario: rows[0],
        sql_ejecutado: sql,   // ← expuesto intencionalmente para fines didácticos
      });
    } else {
      res.status(401).json({ status: 'error', mensaje: '❌ Credenciales incorrectas', sql_ejecutado: sql });
    }
  } catch (err) {
    // Muestra el error de MySQL al cliente (error-based disclosure)
    res.status(500).json({ status: 'error', error: err.message, sql_ejecutado: sql });
  }
});

// =============================================================
//  RUTA 2 — GET /noticias?id=1
//  Vulnerabilidad: UNION-based SQLi
//  Payloads de prueba:
//      /noticias?id=1 UNION SELECT 1,username,password,email,5,6 FROM usuarios --
//      /noticias?id=-1 UNION SELECT 1,table_name,3,4,5,6 FROM information_schema.tables WHERE table_schema='practica' --
// =============================================================
app.get('/noticias', async (req, res) => {
  const { id } = req.query;

  // ❌ VULNERABLE
  const sql = `SELECT * FROM noticias WHERE id = ${id}`;

  console.log('[/noticias] Query ejecutada:', sql);

  try {
    const rows = await query(sql);
    res.json({ total: rows.length, data: rows, sql_ejecutado: sql });
  } catch (err) {
    res.status(500).json({ error: err.message, sql_ejecutado: sql });
  }
});

// =============================================================
//  RUTA 3 — GET /productos?categoria=electronica
//  Vulnerabilidad: Error-based SQLi (extrae datos via errores MySQL)
//  Payloads de prueba:
//      /productos?categoria=electronica' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT version()))) --
//      /productos?categoria=electronica' AND (SELECT 1 FROM(SELECT COUNT(*),CONCAT((SELECT password FROM usuarios WHERE username='admin'),0x3a,FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a) --
// =============================================================
app.get('/productos', async (req, res) => {
  const { categoria } = req.query;

  // ❌ VULNERABLE
  const sql = `SELECT * FROM productos WHERE categoria = '${categoria}'`;

  console.log('[/productos] Query ejecutada:', sql);

  try {
    const rows = await query(sql);
    res.json({ total: rows.length, data: rows, sql_ejecutado: sql });
  } catch (err) {
    // Error completo de MySQL expuesto → error-based extraction
    res.status(500).json({ error: err.message, sqlState: err.sqlState, sql_ejecutado: sql });
  }
});

// =============================================================
//  RUTA 4 — GET /buscar?q=laptop
//  Vulnerabilidad: Blind Boolean-based SQLi
//  Payloads de prueba:
//      /buscar?q=laptop' AND 1=1 --          → devuelve resultados
//      /buscar?q=laptop' AND 1=2 --          → devuelve vacío
//      /buscar?q=laptop' AND SLEEP(5) --     → Blind time-based
//      sqlmap lo explota automáticamente
// =============================================================
app.get('/buscar', async (req, res) => {
  const { q } = req.query;

  // ❌ VULNERABLE
  const sql = `SELECT id, nombre, precio FROM productos WHERE nombre LIKE '%${q}%'`;

  console.log('[/buscar] Query ejecutada:', sql);

  try {
    const rows = await query(sql);
    // Respuesta binaria (sin datos) → ideal para blind boolean
    res.json({
      encontrados: rows.length > 0,
      total      : rows.length,
      resultados : rows,
      sql_ejecutado: sql,
    });
  } catch (err) {
    res.status(500).json({ encontrados: false, error: err.message, sql_ejecutado: sql });
  }
});

// =============================================================
//  RUTA 5 — GET /perfil?user=admin
//  Vulnerabilidad: Datos sensibles expuestos sin sanitización
//  Payloads de prueba:
//      /perfil?user=admin
//      /perfil?user=admin' UNION SELECT id,username,password,email,5 FROM usuarios --
//      /perfil?user=' OR 1=1 LIMIT 1 --
// =============================================================
app.get('/perfil', async (req, res) => {
  const { user } = req.query;

  // ❌ VULNERABLE — también expone token_secreto
  const sql = `
    SELECT u.id, u.username, u.email, u.rol, p.nombre_completo, p.bio, p.telefono, p.direccion, p.token_secreto
    FROM usuarios u
    LEFT JOIN perfiles p ON u.id = p.user_id
    WHERE u.username = '${user}'
  `;

  console.log('[/perfil] Query ejecutada:', sql);

  try {
    const rows = await query(sql);
    if (rows.length > 0) {
      res.json({ data: rows, sql_ejecutado: sql });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado', sql_ejecutado: sql });
    }
  } catch (err) {
    res.status(500).json({ error: err.message, sql_ejecutado: sql });
  }
});

// =============================================================
//  RUTA EXTRA — GET /
//  Índice de rutas disponibles
// =============================================================
app.get('/', (req, res) => {
  res.json({
    advertencia: '⚠️  ENTORNO VULNERABLE — Solo uso educativo local',
    rutas: [
      { metodo: 'POST', ruta: '/login',              vulnerabilidad: 'Authentication Bypass' },
      { metodo: 'GET',  ruta: '/noticias?id=1',      vulnerabilidad: 'UNION-based SQLi' },
      { metodo: 'GET',  ruta: '/productos?categoria=electronica', vulnerabilidad: 'Error-based SQLi' },
      { metodo: 'GET',  ruta: '/buscar?q=laptop',    vulnerabilidad: 'Blind Boolean / Time-based SQLi' },
      { metodo: 'GET',  ruta: '/perfil?user=admin',  vulnerabilidad: 'Data Exposure + SQLi' },
    ],
  });
});

// ── Iniciar servidor ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  ⚠️   SERVIDOR VULNERABLE — SOLO USO EDUCATIVO  ⚠️    ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  URL: http://localhost:${PORT}                           ║`);
  console.log('║  Rutas: /login  /noticias  /productos  /buscar  /perfil ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
});
