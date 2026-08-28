# Tài liệu Cài đặt Hệ thống — Electro Store Microservices

Tài liệu mô tả **toàn bộ quy trình cài đặt và chạy hệ thống** Electro Store trên môi trường phát triển (local), gồm Backend (microservices), Frontend (React), và dịch vụ AI gợi ý (`reco-service`).

> Chi tiết từng phần (công nghệ, CI cô lập):  
> [INSTALL_BACKEND.md](INSTALL_BACKEND.md) · [INSTALL_FRONTEND.md](INSTALL_FRONTEND.md) · [INSTALL_AI.md](INSTALL_AI.md) · [ENV_AND_REDIS.md](ENV_AND_REDIS.md)

---

## 1. Tổng quan hệ thống cần cài

| Lớp | Thành phần | Cổng chính |
|-----|------------|------------|
| Hạ tầng | MySQL 8, Redis auth, Redis statistics | `3306`, `6379`, `6380` |
| Nền tảng | Eureka, Config Server, API Gateway | `8761`, `8888`, `8080` |
| Nghiệp vụ | auth, user, catalog, cart, order, review, statistics, chatbot | qua Gateway `8080` |
| AI gợi ý | `reco-service` (Python FastAPI) | `5003` |
| Giao diện | `frontend` (React + Vite) | `5173` |

Thứ tự khuyến nghị khi cài lần đầu:

1. Cài công cụ (JDK, Maven, Node, Docker, Python)  
2. Clone mã nguồn + cấu hình `.env`  
3. Khởi động hạ tầng (MySQL, Redis) + import database  
4. Build & chạy Backend (+ reco nếu dùng `START` full)  
5. Chạy Frontend  
6. Kiểm tra nhanh các URL  

---

## 2. Cấu hình hệ thống yêu cầu

Mục này liệt kê **điều kiện phần cứng, phần mềm và tài nguyên** cần có trước khi cài đặt hệ thống Electro Store (Backend microservices, Frontend, dịch vụ AI gợi ý).

### 2.1. Phần cứng

- **CPU:** khuyến nghị từ 4 nhân trở lên (chạy đồng thời nhiều JVM service)
- **RAM:** tối thiểu **≥ 8 GB**; khuyến nghị **≥ 16 GB** khi chạy full microservices + Docker + Frontend + reco
- **Ổ cứng trống:** khuyến nghị **≥ 20 GB** (JDK, Maven dependencies, Node modules, Docker images, database)
- **Kết nối mạng:** cần thiết khi tải dependency (Maven/npm/pip) và kéo image Docker lần đầu

> Máy RAM thấp: dùng `START.ps1 -Minimal` (Windows) hoặc `./start.sh --minimal` (Linux/macOS).

### 2.2. Hệ điều hành

- **Windows** 10 / 11 (PowerShell: `START.ps1`, `STOP.ps1`, …)
- **Linux** — khuyến nghị **Ubuntu 20.04+** (Bash: `./start.sh`, `./stop.sh`, …)
- **macOS** (Bash tương tự Linux)

### 2.3. Phần mềm bắt buộc

| Thành phần | Phiên bản | Mục đích |
|------------|-----------|----------|
| **Java JDK** | **17** (`JAVA_HOME` đã cấu hình) | Backend Spring Boot / microservices |
| **Apache Maven** | **3.8+** | Build module `shared` và các service Java |
| **Node.js** + **npm** | **v18+** (khuyến nghị 18 LTS hoặc 20 LTS) | Frontend React + Vite |
| **Python** | **3.10+** | Dịch vụ AI gợi ý `reco-service` |
| **MySQL Server** | **8.0+** | Database-per-service (hoặc chạy qua Docker) |
| **Redis** | **6+** / tương đương | Auth (`:6379`) và Statistics (`:6380`) — khuyến nghị qua Docker |
| **Docker Desktop** *(hoặc Docker Engine trên Linux)* | Bản ổn định gần nhất | Khuyến nghị để chạy MySQL + 2 Redis local |
| **Git** | Bản ổn định | Clone mã nguồn |

### 2.4. Công cụ khuyến nghị (không bắt buộc)

- **IntelliJ IDEA** — mở / debug Backend
- **Visual Studio Code** — Frontend / Python
- **Postman** hoặc trình duyệt — gọi API / Swagger

### 2.5. Cổng mạng cần trống

| Cổng | Thành phần |
|------|------------|
| `3306` | MySQL |
| `6379` | Redis (auth-service) |
| `6380` | Redis (statistics-service) |
| `8761` | Eureka (Discovery) |
| `8888` | Config Server |
| `8080` | API Gateway |
| `5003` | reco-service (AI) |
| `5173` | Frontend (Vite dev) |

Các service nghiệp vụ (auth, user, catalog, …) dùng cổng riêng phía sau Gateway; khi chạy local cần đủ tài nguyên cho nhiều process JVM.

### 2.6. Cấu hình môi trường (biến `.env`)

Trước khi chạy hệ thống, copy `.env.example` → `.env` tại thư mục gốc và cấu hình tối thiểu:

| Nhóm | Biến / nội dung chính |
|------|------------------------|
| MySQL | `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_USE_SSL` |
| Redis auth | `AUTH_REDIS_HOST`, `AUTH_REDIS_PORT` (mặc định `localhost:6379`) |
| Redis statistics | `STATISTICS_REDIS_HOST`, `STATISTICS_REDIS_PORT` (mặc định `localhost:6380`) |
| Bảo mật | `JWT_SECRET` (chuỗi ký ≥ 32 ký tự) |

**Tuỳ chọn theo chức năng demo:**

- Chatbot RAG: `NVIDIA_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`
- Quên mật khẩu email: `MAIL_*`, `APP_FRONTEND_URL`
- Đăng nhập Google: `GOOGLE_CLIENT_ID`
- Thanh toán VNPay: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`

File `.env` **không được commit** lên GitHub (đã gitignore). Chi tiết: [ENV_AND_REDIS.md](ENV_AND_REDIS.md).

### 2.7. Tóm tắt checklist (dạng báo cáo)

Có thể chép nguyên khối sau vào luận văn / tài liệu hướng dẫn:

- Hệ điều hành: Windows 10/11, Linux (Ubuntu 20.04+), hoặc macOS  
- Bộ nhớ RAM: ≥ 8 GB (tối thiểu); khuyến nghị ≥ 16 GB  
- Ổ cứng trống: ≥ 20 GB  
- Java JDK 17  
- Maven 3.8+  
- Node.js v18+  
- Python 3.10+  
- MySQL Server 8+ (hoặc qua Docker)  
- Redis (cổng 6379 và 6380 — khuyến nghị qua Docker)  
- Docker Desktop / Docker Engine (khuyến nghị)  
- Git  
- Cổng trống: 3306, 6379, 6380, 8080, 8761, 8888, 5003, 5173  

---


## 3. Lấy mã nguồn

```text
git clone <URL-repo>
cd ELECTRO-STORE-MONOREPO   # hoặc thư mục gốc monorepo
```

Kiểm tra thư mục gốc có: `START.ps1` / `start.sh`, `docker-compose.yml`, `.env.example`, `frontend/`, `reco-service/`, `shared/`, `docs/`.

---

## 4. Cấu hình môi trường (`.env`)

**Windows:**

```powershell
copy .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Chỉnh tối thiểu trong `.env`:

- `MYSQL_*` — khớp Docker MySQL local  
- `AUTH_REDIS_*` → `localhost:6379`  
- `STATISTICS_REDIS_*` → `localhost:6380`  
- `JWT_SECRET` — chuỗi ≥ 32 ký tự  

**Không commit** file `.env` (đã gitignore). Chi tiết biến: [ENV_AND_REDIS.md](ENV_AND_REDIS.md).

---

## 5. Cài đặt và chạy Backend

### 5.1. Hạ tầng + database

**Windows (PowerShell):**

```powershell
docker compose up -d
.\scripts\Start-Redis.ps1
.\scripts\Import-Databases.ps1
```

**macOS / Linux:**

```bash
docker compose up -d
chmod +x start.sh stop.sh check-all-services.sh scripts/*.sh
./scripts/start-redis.sh
./scripts/import-databases.sh
# Nếu cần: ./scripts/import-databases.sh --password root
```

### 5.2. Build module dùng chung & khởi động services

**Windows:**

```powershell
mvn -f shared\pom.xml install -DskipTests
.\START.ps1
# Máy yếu: .\START.ps1 -Minimal
# Đã có Docker: .\START.ps1 -SkipDocker
```

**macOS / Linux:**

```bash
mvn -f shared/pom.xml install -DskipTests
./start.sh
# ./start.sh --minimal
# ./start.sh --skip-docker
```

`START.ps1` / `start.sh` khởi động các service Java và (mặc định) cả `reco-service` nếu có Python.

### 5.3. Kiểm tra Backend

| Thành phần | URL |
|------------|-----|
| API Gateway | http://localhost:8080 |
| Eureka | http://localhost:8761 |
| Swagger | http://localhost:8080/swagger-ui.html |

| OS | Health check | Dừng |
|----|--------------|------|
| Windows | `.\check-all-services.ps1` | `.\STOP.ps1` |
| macOS/Linux | `./check-all-services.sh` | `./stop.sh` |

Log: thư mục `.run/*.log`.

---

## 6. Cài đặt và chạy Frontend

Frontend **không** được start bởi `START.ps1` / `start.sh` — chạy riêng.

```bash
cd frontend
```

**Windows:** `copy .env.example .env`  
**macOS/Linux:** `cp .env.example .env`

```bash
npm ci
# hoặc lần đầu: npm install

npm run dev
# → http://localhost:5173
```

Dev: Vite proxy `/api`, `/img` → Gateway `http://localhost:8080` (không bắt buộc `VITE_API_URL`).

Build kiểm tra:

```bash
npm run build
```

| Kiểm tra | Kỳ vọng |
|----------|---------|
| UI | http://localhost:5173 |
| Gọi API | Gateway `:8080` đang chạy |

---

## 7. Cài đặt và chạy dịch vụ AI (`reco-service`)

### Cách A — cùng toàn hệ thống (khuyến nghị)

Chạy `START.ps1` / `start.sh` (mục 5): script tự tạo `.venv`, cài `requirements.txt` nếu thiếu, start cổng **5003**.

### Cách B — chạy thủ công

**Windows:**

```powershell
cd reco-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --host 0.0.0.0 --port 5003 --reload
```

**macOS / Linux:**

```bash
cd reco-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --host 0.0.0.0 --port 5003 --reload
```

| Kiểm tra | URL |
|----------|-----|
| Health | http://localhost:5003/health |
| Swagger | http://localhost:5003/docs |

> Chatbot RAG (`chatbot-service`) là Java + Pinecone + NVIDIA NIM — **không** nằm trong `reco-service`. Xem [CHATBOT_PINECONE.md](CHATBOT_PINECONE.md).

---

## 8. Kiểm tra hệ thống sau cài đặt

| # | Kiểm tra | Kết quả mong đợi |
|---|----------|------------------|
| 1 | `docker ps` | MySQL + `electro-redis-auth` + `electro-redis-statistics` |
| 2 | Eureka | Các service Java đăng ký tại `:8761` |
| 3 | Gateway | http://localhost:8080 phản hồi |
| 4 | Reco | http://localhost:5003/health → OK |
| 5 | Frontend | http://localhost:5173 mở được; thao tác cần login/API khi Backend sẵn |

---

## 9. Bảng lệnh nhanh (đa nền tảng)

| Việc | Windows | macOS / Linux |
|------|---------|---------------|
| Copy `.env` gốc | `copy .env.example .env` | `cp .env.example .env` |
| Start hạ tầng | `docker compose up -d` | `docker compose up -d` |
| Redis | `.\scripts\Start-Redis.ps1` | `./scripts/start-redis.sh` |
| Import DB | `.\scripts\Import-Databases.ps1` | `./scripts/import-databases.sh` |
| Start hệ thống | `.\START.ps1` | `./start.sh` |
| Stop | `.\STOP.ps1` | `./stop.sh` |
| Health | `.\check-all-services.ps1` | `./check-all-services.sh` |
| Frontend | `cd frontend` → `npm run dev` | giống nhau |
| Reco thủ công | `uvicorn ... --port 5003` | giống nhau |

---

## 10. Xác minh cài đặt bằng GitHub Actions

Mỗi lớp có workflow cô lập (không thay thế chạy full local):

| Workflow | Mục đích |
|----------|----------|
| Verify Backend Install | `.env`, MySQL, Redis, build Java |
| Verify Frontend Install | `npm ci`, lint *(advisory)*, **`npm run build` bắt buộc** |
| Verify AI Reco Install | venv, pip, uvicorn `/health` |

> Lint Frontend có thể đỏ do nợ kỹ thuật cũ — **không** đồng nghĩa cài đặt thất bại nếu bước build vẫn xanh.

---

## 11. Sự cố thường gặp

| Triệu chứng | Hướng xử lý |
|-------------|-------------|
| Không kết nối MySQL | `docker compose up -d`; kiểm tra `MYSQL_*` trong `.env` |
| Auth / statistics lỗi Redis | Đảm bảo 2 Redis `:6379` / `:6380`; không đặt `*_REDIS_URL` local |
| Frontend gọi API lỗi | Chạy Backend + Gateway `:8080` trước |
| Reco không start | Python 3.10+, đã `pip install -r requirements.txt`, DB review/order đã import |
| Máy chậm / hết RAM | `START.ps1 -Minimal` hoặc `./start.sh --minimal` |

---

## 12. Tài liệu liên quan

| Tài liệu | Nội dung |
|----------|----------|
| [INSTALL_BACKEND.md](INSTALL_BACKEND.md) | Chi tiết Backend + CI |
| [INSTALL_FRONTEND.md](INSTALL_FRONTEND.md) | Chi tiết Frontend + CI |
| [INSTALL_AI.md](INSTALL_AI.md) | Chi tiết reco-service + CI |
| [ENV_AND_REDIS.md](ENV_AND_REDIS.md) | Biến môi trường & Redis |
| [CHATBOT_PINECONE.md](CHATBOT_PINECONE.md) | Chatbot RAG (phụ lục) |
| [README.md](README.md) | Mục lục docs |
