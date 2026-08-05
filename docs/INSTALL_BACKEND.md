# Cài đặt Backend (Spring Boot / Microservices)

> Tài liệu chuẩn cho team. Quy trình này được kiểm chứng cô lập bởi GitHub Actions:  
> **Actions → `Verify Backend Install`** (`.github/workflows/verify-backend-install.yml`).

## 1. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | Java **17** |
| Framework | Spring Boot & Spring Cloud |
| Build | Apache Maven **3.8+** |
| API | RESTful qua **API Gateway :8080** |
| DB | MySQL **8.0+** (Database-per-service) |
| Cache / session | Redis **:6379** (auth), **:6380** (statistics) |
| Discovery | Eureka **:8761** |
| Config | Spring Cloud Config **:8888** |
| Giao tiếp service | OpenFeign |
| Hạ tầng local | Docker (khuyến nghị) + PowerShell scripts |

**Module chính:** `discovery-server`, `config-server`, `api-gateway`, `auth-service`, `user-service`, `catalog-service`, `cart-service`, `order-service`, `review-service`, `statistics-service`, `chatbot-service`, `shared`.

## 2. Chuẩn bị môi trường

- [ ] JDK 17 + `JAVA_HOME`
- [ ] Maven 3.8+
- [ ] Docker Desktop (khuyến nghị) **hoặc** MySQL 8 + Redis tương đương
- [ ] Python 3.10+ *(nếu dùng `START.ps1` full — có start `reco-service`)*
- [ ] Clone repo; thư mục gốc có `START.ps1`, `docker-compose.yml`, `.env.example`, `scripts/`, `shared/`
- [ ] IDE: **IntelliJ IDEA** (khuyến nghị) để xem mã; lệnh chạy bằng **PowerShell**
- [ ] RAM khuyến nghị ≥ 16 GB (`START.ps1 -Minimal` nếu máy yếu)
- [ ] Cổng trống: `8080`, `8761`, `8888`, `3306`, `6379`, `6380`, …

## 3. Các bước thực hiện

### Bước 1 — Mở dự án

1. Clone / giải nén mã nguồn.
2. Mở **thư mục gốc** trong IntelliJ IDEA.
3. Đảm bảo nhận diện các module Maven (đặc biệt `shared`).

### Bước 2 — Cấu hình & hạ tầng

**Windows (PowerShell):**

```powershell
copy .env.example .env
# Điền MYSQL_*, AUTH_REDIS_*, STATISTICS_REDIS_*, JWT_SECRET (≥32 ký tự)

docker compose up -d
.\scripts\Start-Redis.ps1
.\scripts\Import-Databases.ps1
```

**macOS / Linux (Bash):**

```bash
cp .env.example .env
# Điền MYSQL_*, AUTH_REDIS_*, STATISTICS_REDIS_*, JWT_SECRET (≥32 ký tự)

docker compose up -d
chmod +x start.sh stop.sh check-all-services.sh scripts/*.sh
./scripts/start-redis.sh
./scripts/import-databases.sh
# Nếu MySQL Docker dùng password root:
# ./scripts/import-databases.sh --password root
```

### Bước 3 — Build & chạy

**Windows:**

```powershell
mvn -f shared\pom.xml install -DskipTests
.\START.ps1
# hoặc: .\START.ps1 -SkipDocker | -Minimal | -SkipBuild
```

**macOS / Linux:**

```bash
mvn -f shared/pom.xml install -DskipTests
./start.sh
# hoặc:
./start.sh --skip-docker
./start.sh --minimal
./start.sh --skip-docker --skip-build
```

### Kiểm tra

| OS | Lệnh kiểm tra | Dừng hệ thống |
|---|---|---|
| Windows | `.\check-all-services.ps1` | `.\STOP.ps1` |
| macOS / Linux | `./check-all-services.sh` | `./stop.sh` / `./stop.sh --keep-infra` |

| Thành phần | URL |
|---|---|
| API Gateway | http://localhost:8080 |
| Eureka | http://localhost:8761 |
| Swagger | http://localhost:8080/swagger-ui.html |
| Log | `.run/*.log` |

## 4. CI — bằng chứng “không chỉ chạy trên máy tôi”

Mỗi PR/push đụng backend sẽ chạy job **Verify Backend Install**:

1. Checkout + kiểm tra cấu trúc thư mục  
2. Java 17 / Maven  
3. Tạo `.env` từ `.env.example`  
4. MySQL + import `electro_*_db`  
5. Redis `:6379` / `:6380`  
6. `mvn -f shared/pom.xml install`  
7. `mvn package` các service Java chính  

> CI **không** chạy `START.ps1` / `start.sh` (full JVM). Chạy full stack trên máy local theo mục 3 (Windows hoặc macOS/Linux).

## Phụ lục — Script đa nền tảng

| Việc | Windows | macOS / Linux |
|---|---|---|
| Start all | `START.ps1` | `./start.sh` |
| Stop all | `STOP.ps1` | `./stop.sh` |
| Health check | `check-all-services.ps1` | `./check-all-services.sh` |
| Redis | `scripts/Start-Redis.ps1` | `./scripts/start-redis.sh` |
| Import DB | `scripts/Import-Databases.ps1` | `./scripts/import-databases.sh` |

## 5. Quy tắc team

1. Không commit file `.env` (đã gitignore).  
2. Thay đổi bước cài đặt → cập nhật **file này** + workflow `verify-backend-install.yml`.  
3. PR đỏ ở Actions → sửa trước khi merge.  
4. “Chạy được trên máy tôi” **không đủ** nếu CI Backend fail.
