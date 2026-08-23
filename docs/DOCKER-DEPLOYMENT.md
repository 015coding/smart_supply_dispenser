# Docker deployment หลัง NAT และ Nginx Proxy Manager

Deployment นี้รัน Next.js production standalone server ใน container เดียว และ publish port 3000 ให้ Nginx Proxy Manager (NPM) ที่มีอยู่แล้ว reverse proxy เข้ามา

Public URL:

```text
https://smart_supply_dispenser.kubits.org
```

Flow:

```text
Internet → NAT/router → Nginx Proxy Manager → Docker host:3000 → Next.js
```

## 1. สิ่งที่ต้องมี

- Docker Engine พร้อม Docker Compose plugin
- Nginx Proxy Manager ที่ใช้งานได้อยู่แล้ว
- DNS ของ `smart_supply_dispenser.kubits.org` ชี้มาที่ public IP
- NAT/router forward port 80/443 ไปยัง Nginx Proxy Manager
- NPM เข้าถึง private IP และ port 3000 ของ Docker host ได้

## 2. สร้าง production environment

```bash
cp .env.compose.example .env.compose
```

สร้าง secret:

```bash
openssl rand -base64 32
openssl rand -hex 32
node -e "console.log(require('bcryptjs').hashSync('replace-with-admin-password', 12))"
```

นำค่าไปใส่ใน `.env.compose`:

- `AUTH_SECRET` — random secret สำหรับ Auth.js
- `ADMIN_PASSWORD_HASH` — bcrypt hash; ต้องครอบด้วย single quotes เพื่อรักษา `$`
- `DEVICE_SHARED_SECRET` — secret ที่ provision ให้ Device API clients
- `PII_ENCRYPTION_KEY` — secret สำหรับเข้ารหัสเลขประจำตัว
- `PII_LOOKUP_KEY` — secret คนละค่ากับ encryption key สำหรับ keyed lookup
- `APP_DOMAIN` — public hostname ที่ NPM ให้บริการ
- `BIND_ADDRESS` และ `APP_PORT` — address/port บน Docker host ที่ NPM จะชี้มา

`.env.compose` ถูก ignore โดย Git ห้าม commit หรือส่งไฟล์นี้ผ่านช่องทางสาธารณะ

### Bind address

ค่าเริ่มต้น:

```dotenv
BIND_ADDRESS=0.0.0.0
APP_PORT=3000
```

หมายถึงเปิด port 3000 ทุก network interface ของ host หาก NPM อยู่บนเครื่องเดียวกันและเข้าถึง host loopback ได้ สามารถจำกัดเป็น:

```dotenv
BIND_ADDRESS=127.0.0.1
```

หาก NPM อยู่คนละเครื่อง ให้ใช้ private/LAN IP ของ Docker host เช่น:

```dotenv
BIND_ADDRESS=192.168.1.19
```

ควรใช้ firewall ปิด port 3000 จาก internet และอนุญาตเฉพาะ NPM/LAN ที่จำเป็น

## 3. Build และ start

ตรวจ Compose config:

```bash
docker compose --env-file .env.compose config --quiet
```

Build และ start:

```bash
docker compose --env-file .env.compose up -d --build
```

ตรวจสถานะ:

```bash
docker compose --env-file .env.compose ps
docker compose --env-file .env.compose logs --tail=100 web
```

ทดสอบ origin จาก Docker host:

```bash
curl --fail http://127.0.0.1:3000/api/openapi.json >/dev/null
```

หาก `BIND_ADDRESS` เป็น LAN IP ให้เปลี่ยน `127.0.0.1` ในคำสั่งทดสอบเป็น IP นั้น

## 4. ตั้งค่า Nginx Proxy Manager

สร้าง **Proxy Host** ด้วยค่าต่อไปนี้:

| Setting | Value |
|---|---|
| Domain Names | `smart_supply_dispenser.kubits.org` |
| Scheme | `http` |
| Forward Hostname / IP | private IP ของ Docker host เช่น `192.168.1.19` |
| Forward Port | `3000` หรือค่าจาก `APP_PORT` |
| Cache Assets | ปิด |
| Block Common Exploits | เปิด |
| Websockets Support | เปิด |

หาก NPM รันเป็น container อย่าใช้ `127.0.0.1` หรือ `localhost` เป็น Forward Host เพราะจะหมายถึง NPM container เอง ให้ใช้ private IP ของ Docker host หรือเชื่อมทั้งสอง Compose project เข้า external Docker network เดียวกัน

ในแท็บ SSL:

1. เลือกหรือขอ certificate สำหรับ domain
2. เปิด Force SSL
3. เปิด HTTP/2 Support
4. ทดสอบเว็บและ API ให้ครบก่อนเปิด HSTS

NPM ต้องส่ง forwarded headers ตามปกติ โดยเฉพาะ:

```http
Host: smart_supply_dispenser.kubits.org
X-Forwarded-Host: smart_supply_dispenser.kubits.org
X-Forwarded-Proto: https
X-Forwarded-For: <client-ip>
```

ไม่ต้องเพิ่ม CORS header สำหรับหน้าเว็บหรือ Admin API ที่เรียกแบบ same-origin

เพื่อรองรับการอัปโหลดรูปเครื่องขนาดสูงสุด 10 MB ให้เพิ่มในช่อง **Advanced** ของ Proxy Host:

```nginx
client_max_body_size 12m;
```

## 5. ทดสอบ public endpoint

```bash
curl --fail --head https://smart_supply_dispenser.kubits.org
curl --fail https://smart_supply_dispenser.kubits.org/api/openapi.json >/dev/null
```

หน้าใช้งาน:

- Public: `https://smart_supply_dispenser.kubits.org/`
- Admin login: `https://smart_supply_dispenser.kubits.org/admin/login`
- API docs: `https://smart_supply_dispenser.kubits.org/api-docs`
- OpenAPI: `https://smart_supply_dispenser.kubits.org/api/openapi.json`

## 6. Auth.js หลัง reverse proxy

Compose กำหนดค่าตาม `APP_DOMAIN`:

```text
AUTH_URL=https://smart_supply_dispenser.kubits.org
AUTH_TRUST_HOST=true
```

ค่านี้ทำให้ Auth.js สร้าง secure session cookie และ callback URL สำหรับ public HTTPS origin แม้ Next.js container รับ traffic ภายในผ่าน HTTP

ผู้ใช้ควรเปิดเว็บผ่าน public domain เดียวกันเสมอ ไม่ควรสลับระหว่าง domain, IP และ localhost ใน session เดียว เพราะ cookie เป็น host-scoped

หลังเปลี่ยน domain ต้อง rebuild เนื่องจาก `NEXT_PUBLIC_*` variables ถูกฝังตอน build:

```bash
docker compose --env-file .env.compose up -d --build
```

## 7. Update application

```bash
git pull --ff-only
docker compose --env-file .env.compose up -d --build
docker image prune -f
```

คำสั่ง `docker image prune -f` ลบเฉพาะ dangling image ที่ไม่ถูกใช้งาน ไม่ลบ named volume

## 8. Stop และ restart

```bash
docker compose --env-file .env.compose restart web
docker compose --env-file .env.compose down
```

อย่าใช้ `docker compose down -v` หากไม่ต้องการลบ named volume `next_cache` และ `image_uploads`

## 9. Health check และ logs

Container ตรวจ `GET /api/openapi.json` ทุก 30 วินาที:

```bash
docker compose --env-file .env.compose ps
docker compose --env-file .env.compose logs -f --tail=100 web
```

Logs จำกัดขนาดไฟล์ละ 10 MB จำนวน 3 ไฟล์

หาก NPM ตอบ `502 Bad Gateway` ให้ตรวจตามลำดับ:

1. `docker compose ps` แสดง web เป็น healthy หรือไม่
2. `curl http://<docker-host-ip>:3000/api/openapi.json` จากเครื่อง NPM ได้หรือไม่
3. Forward Host/IP ห้ามเป็น `localhost` เมื่อ NPM อยู่ใน container
4. Host firewall อนุญาต traffic จาก NPM มายัง `APP_PORT` หรือไม่
5. NPM ใช้ scheme `http` ไปหา origin ไม่ใช่ `https`

## 10. ข้อจำกัดด้าน persistence

แม้ repository มี Drizzle/PostgreSQL schema แต่ application routes ปัจจุบันใช้ `MemoryStore` โดยตรง ดังนั้นข้อมูลเครื่อง, stock, recipient, report idempotency และ activity จะหายเมื่อ `web` container restart/redeploy Named volume `image_uploads` เก็บไฟล์รูปเครื่องไว้ได้ และ `next_cache` เก็บเฉพาะ Next.js cache แต่ทั้งสองส่วนไม่ได้เก็บ application records

ก่อนใช้กับข้อมูลจริง ต้องเปลี่ยน store implementation ให้ใช้ PostgreSQL แบบ durable แล้วจึงเพิ่ม database service หรือชี้ `DATABASE_URL` ไปฐานข้อมูลภายนอก การตั้ง `SEED_DEMO_DATA=true` เหมาะเฉพาะ demo และจะสร้างข้อมูลตัวอย่างใหม่หลัง restart

## 11. Backup

deployment ปัจจุบันไม่มี application-data backup เพราะข้อมูลอยู่ใน memory ส่วนไฟล์รูปใช้ named volume `image_uploads` เป็นค่าเริ่มต้น หรือใช้ Vercel Blob เมื่อกำหนด `BLOB_READ_WRITE_TOKEN` จึงควร backup volume ด้วยหากใช้ local image storage

หลังย้าย store ไป PostgreSQL ต้องเพิ่มทั้ง scheduled database backup และ restore test ก่อนถือว่า deploy พร้อม production
