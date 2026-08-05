# Cài đặt dịch vụ AI gợi ý (reco-service)

> Tài liệu chuẩn cho team. Quy trình được kiểm chứng cô lập bởi GitHub Actions:  
> **Actions → `Verify AI Reco Install`** (`.github/workflows/verify-ai-reco-install.yml`).

## 1. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | **Python 3.10+** |
| API | **FastAPI** + **Uvicorn** |
| ML | **scikit-learn**, **scikit-surprise** (Item-based **KNNBaseline**) |
| Data | **Pandas**, NumPy, SciPy |
| DB | SQLAlchemy + PyMySQL (`electro_review_db`, `electro_order_db`) |
| Discovery | Đăng ký Eureka (`py_eureka_client`) — khi Eureka đang chạy |
| Port mặc định | **5003** |

> **Lưu ý:** Chatbot RAG (`chatbot-service`) là **Java + Spring AI + Pinecone + NVIDIA NIM**, **không** nằm trong `requirements.txt` của reco. Xem `docs/CHATBOT_PINECONE.md`.

## 2. Chuẩn bị môi trường

- [ ] Python **3.10+**
- [ ] MySQL đã có DB review/order (thường sau `Import-Databases.ps1`)
- [ ] (Tuỳ chọn) Eureka `:8761` nếu muốn đăng ký service discovery
- [ ] Clone repo; làm việc trong `reco-service/`

## 3. Các bước thực hiện

### Bước 1 — Vào thư mục & tạo venv

```powershell
cd reco-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Bước 2 — Cài thư viện

```powershell
pip install -r requirements.txt
```

Thư viện chính: FastAPI, Uvicorn, Pandas, scikit-learn, scikit-surprise, SQLAlchemy, …  
(**Không** dùng PyTorch trong stack hiện tại.)

### Bước 3 — Cấu hình `.env`

```powershell
copy .env.example .env
```

Đồng bộ với backend (host/user/password MySQL). Khi chạy qua `START.ps1`, script cũng nạp `.env` gốc rồi start reco.

### Bước 4 — Chạy service

**Cách A — thủ công (dev):**

```powershell
uvicorn main:app --host 0.0.0.0 --port 5003 --reload
```

**Cách B — cùng toàn hệ thống:**

```powershell
# Thư mục gốc
.\START.ps1
# START.ps1 tự tạo .venv + pip install nếu thiếu, rồi start reco :5003
```

### Kiểm tra

| Kiểm tra | URL / lệnh |
|---|---|
| Health | http://localhost:5003/health |
| Swagger | http://localhost:5003/docs |
| Root | http://localhost:5003/ |

Ví dụ gợi ý: `GET /recommend/{user_id}?top_k=10`

## 4. CI — bằng chứng môi trường AI

Job **Verify AI Reco Install** khi đổi `reco-service/**`:

1. Kiểm tra layout (`main.py`, `requirements.txt`, `app/models.py`, …)  
2. Python 3.10 + `python -m venv` + `pip install -r requirements.txt`  
3. Tạo `.env` từ `.env.example`  
4. MySQL + import schema review (và order nếu có)  
5. `from main import app`  
6. Chạy **uvicorn** thật và gọi **`/health`**, **`/docs`**

## 5. Quy tắc team

1. Mọi thay đổi thuật toán/API reco → CI AI phải xanh.  
2. Không commit `.venv/` hay model `.pkl` lớn nếu repo không quy định.  
3. Thiếu `app.models` / import lỗi → fail CI (đã từng xảy ra) — sửa trước khi bảo “chạy được máy tôi”.  
4. Tài liệu team **không** ghi chatbot như Python Flask/Gemini nếu code thực tế khác.
