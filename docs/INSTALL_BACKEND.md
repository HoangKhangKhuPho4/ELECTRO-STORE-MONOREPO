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

```powershell
# Tại thư mục gốc repo
copy .env.example .env
# Điền MYSQL_*, AUTH_REDIS_*, STATISTICS_REDIS_*, JWT_SECRET (≥32 ký tự)

docker compose up -d
.\scripts\Start-Redis.ps1
.\scripts\Import-Databases.ps1
```

### Bước 3 — Build & chạy

```powershell
mvn -f shared\pom.xml install -DskipTests   # START.ps1 cũng tự làm nếu không -SkipBuild
.\START.ps1
```

Chế độ khác:

```powershell
.\START.ps1 -SkipDocker
.\START.ps1 -Minimal
.\START.ps1 -SkipDocker -SkipBuild
```

### Kiểm tra

```powershell
.\check-all-services.ps1
```

| Thành phần | URL |
|---|---|
| API Gateway | http://localhost:8080 |
| Eureka | http://localhost:8761 |
| Swagger | http://localhost:8080/swagger-ui.html |
| Log | `.run\*.log` |

Dừng hệ thống: `.\STOP.ps1`

## 4. CI — bằng chứng “không chỉ chạy trên máy tôi”

Mỗi PR/push đụng backend sẽ chạy job **Verify Backend Install**:

1. Checkout + kiểm tra cấu trúc thư mục  
2. Java 17 / Maven  
3. Tạo `.env` từ `.env.example`  
4. MySQL + import `electro_*_db`  
5. Redis `:6379` / `:6380`  
6. `mvn -f shared/pom.xml install`  
7. `mvn package` các service Java chính  

> CI **không** chạy `START.ps1` (Windows). Chạy full JVM vẫn làm trên máy local theo mục 3.

## 5. Quy tắc team

1. Không commit file `.env` (đã gitignore).  
2. Thay đổi bước cài đặt → cập nhật **file này** + workflow `verify-backend-install.yml`.  
3. PR đỏ ở Actions → sửa trước khi merge.  
4. “Chạy được trên máy tôi” **không đủ** nếu CI Backend fail.
