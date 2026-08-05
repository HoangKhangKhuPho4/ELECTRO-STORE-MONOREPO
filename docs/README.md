# Tài liệu Electro Store Microservices

## Bắt đầu nhanh

| Việc | Tài liệu |
|------|----------|
| **Cài Backend (chuẩn team)** | [INSTALL_BACKEND.md](INSTALL_BACKEND.md) |
| **Cài Frontend (chuẩn team)** | [INSTALL_FRONTEND.md](INSTALL_FRONTEND.md) |
| **Cài AI reco-service (chuẩn team)** | [INSTALL_AI.md](INSTALL_AI.md) |
| Chạy hệ thống | `START.ps1`, `STOP.ps1`, `check-all-services.ps1` (thư mục gốc) |
| Cấu hình `.env`, Redis, MySQL | [ENV_AND_REDIS.md](ENV_AND_REDIS.md) |
| Chatbot / Pinecone | [CHATBOT_PINECONE.md](CHATBOT_PINECONE.md) |
| Reco-service (AI gợi ý) | [INSTALL_AI.md](INSTALL_AI.md) |

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
