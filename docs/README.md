# Tài liệu Electro Store Microservices

## Bắt đầu nhanh

| Việc | Tài liệu |
|------|----------|
| **Cài đặt hệ thống (tổng hợp)** | [INSTALL_SYSTEM.md](INSTALL_SYSTEM.md) |
| **Cài Backend (chi tiết)** | [INSTALL_BACKEND.md](INSTALL_BACKEND.md) |
| **Cài Frontend (chi tiết)** | [INSTALL_FRONTEND.md](INSTALL_FRONTEND.md) |
| **Cài AI reco-service (chi tiết)** | [INSTALL_AI.md](INSTALL_AI.md) |
| Chạy hệ thống (Windows) | `START.ps1`, `STOP.ps1`, `check-all-services.ps1` |
| Chạy hệ thống (macOS/Linux) | `./start.sh`, `./stop.sh`, `./check-all-services.sh` |
| Chạy Frontend (mọi OS) | `cd frontend` → `npm ci` → `npm run dev` — xem [INSTALL_FRONTEND.md](INSTALL_FRONTEND.md) |
| Cấu hình `.env`, Redis, MySQL | [ENV_AND_REDIS.md](ENV_AND_REDIS.md) |
| Chatbot / Pinecone | [CHATBOT_PINECONE.md](CHATBOT_PINECONE.md) |
| Reco-service (AI gợi ý) | [INSTALL_AI.md](INSTALL_AI.md) |
| **Hướng dẫn sử dụng (Khách hàng + Admin)** | [HUONG_DAN_SU_DUNG.md](HUONG_DAN_SU_DUNG.md) |
| Luồng mua hàng (workflow) | [WORKFLOW_MUA_HANG.md](WORKFLOW_MUA_HANG.md) |

## GitHub Actions (môi trường cô lập)

| Workflow | File | Mục đích |
|----------|------|----------|
| Verify Backend Install | `.github/workflows/verify-backend-install.yml` | `.env`, MySQL, Redis, `shared`, build Java services |
| Verify Frontend Install | `.github/workflows/verify-frontend-install.yml` | Node 18, `npm ci`, lint, `vite build` |
| Verify AI Reco Install | `.github/workflows/verify-ai-reco-install.yml` | venv, `requirements.txt`, uvicorn `/health` |

> PR chỉ được coi là ổn khi các workflow liên quan **xanh**. Tránh tranh luận “máy tôi chạy được”.

## Scripts vận hành

| Script | Mô tả |
|--------|--------|
| `scripts/Start-Infra.ps1` | Khởi động Docker (MySQL, Redis, …) |
| `scripts/Import-Databases.ps1` | Import schema/dữ liệu MySQL |
| `scripts/Reingest-Chatbot.ps1` | Nạp lại dữ liệu chatbot RAG |
| `scripts/Setup-PineconeHybridIndex.ps1` | Tạo Pinecone index cho chatbot |
