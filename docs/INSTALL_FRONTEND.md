# Cài đặt Frontend (React + Vite)

> Tài liệu chuẩn cho team. Quy trình được kiểm chứng cô lập bởi GitHub Actions:  
> **Actions → `Verify Frontend Install`** (`.github/workflows/verify-frontend-install.yml`).

## 1. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| UI library | **React** |
| Bundler / dev server | **Vite** |
| Component | **Material UI (MUI)** |
| State | Redux Toolkit |
| HTTP | Axios / httpClient → **API Gateway** |
| Routing | React Router |
| Charts | Recharts |
| Package manager | **npm** (có `package-lock.json`) |

Frontend chỉ là **Presentation Layer**: gọi API qua Gateway `:8080`, không chứa business logic backend.

## 2. Chuẩn bị môi trường

- [ ] **Node.js v18+** (khuyến nghị 18 LTS hoặc 20 LTS) + npm
- [ ] Backend / API Gateway đã chạy tại `http://localhost:8080` *(khi chạy `npm run dev`)*
- [ ] Clone repo; làm việc trong thư mục `frontend/`
- [ ] Có file `frontend/package.json`, `vite.config.js`, `.env.example`

## 3. Các bước thực hiện

### Bước 1 — Mở dự án Frontend

```powershell
cd frontend
```

Mở bằng VS Code / WebStorm (hoặc IntelliJ).

### Bước 2 — Cấu hình môi trường

```powershell
copy .env.example .env
```

- **Dev (`npm run dev`):** không bắt buộc `VITE_API_URL` — Vite proxy `/api` và `/img` → `http://localhost:8080`.
- **Production build:** set `VITE_API_URL` trỏ Gateway thật nếu cần.

### Bước 3 — Cài thư viện

```powershell
npm install
# hoặc (CI / team thống nhất lockfile):
npm ci
```

### Bước 4 — Chạy / build

```powershell
# Phát triển
npm run dev
# → http://localhost:5173

# Kiểm tra chất lượng (CI cũng chạy)
npm run lint

# Build production
npm run build
npm run preview
```

### Kiểm tra nhanh

| Kiểm tra | Kỳ vọng |
|---|---|
| Trang chủ | http://localhost:5173 mở được |
| Gọi API | Cần Gateway `:8080` đang chạy |
| Build | Thư mục `frontend/dist/` được tạo |

## 4. CI — bằng chứng môi trường Frontend

Job **Verify Frontend Install** chạy khi đổi `frontend/**`:

1. Kiểm tra layout (`package.json`, `vite.config.js`, `src/`)  
2. Node 18  
3. `npm ci`  
4. `npm run lint` *(advisory — hiện còn cảnh báo/error cũ; **không chặn** merge install)*  
5. `npm run build` + kiểm tra `dist/` **(bắt buộc xanh)**  

## 5. Quy tắc team

1. Commit cả `package-lock.json` khi thêm/đổi dependency.  
2. Dùng `npm ci` trên CI; local ưu tiên `npm ci` trước khi push nếu vừa đổi lockfile.  
3. PR đỏ Frontend Actions → không merge.  
4. Không hard-code URL API trong component — dùng `src/config/api.js` / biến `VITE_*`.
