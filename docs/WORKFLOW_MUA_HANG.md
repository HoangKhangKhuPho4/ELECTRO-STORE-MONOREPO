# Luồng hoạt động (Workflow) — Use Case Mua hàng

Tài liệu mô tả luồng xử lý chức năng **Mua hàng** của hệ thống thương mại điện tử **Electro Store** (mô hình B2C), từ lúc khách chọn sản phẩm đến khi đơn hàng được tạo và thanh toán (COD / VNPay).

---

## 1. Thông tin tổng quan

| Mục | Nội dung |
|-----|----------|
| **Tên use case** | Mua hàng |
| **Tác nhân chính** | Customer (người dùng đã đăng nhập khi thực hiện checkout) |
| **Mục tiêu** | Cho phép khách hàng chọn sản phẩm, thêm vào giỏ, nhập thông tin giao hàng, chọn phương thức thanh toán và tạo đơn hàng trên hệ thống |
| **Đầu vào** | Sản phẩm, giỏ hàng, địa chỉ giao hàng, phương thức thanh toán, (tuỳ chọn) mã giảm giá |
| **Đầu ra** | Đơn hàng được tạo; với COD đơn chờ xử lý; với VNPay đơn được cập nhật theo kết quả thanh toán |
| **Thành phần liên quan** | Frontend (React), API Gateway, Cart Service, Catalog Service, Order Service, GHN, VNPay |

---

## 2. Tiền điều kiện và hậu điều kiện

### Tiền điều kiện

- Người dùng đã đăng nhập khi checkout.
- Sản phẩm còn đủ điều kiện đặt hàng / còn hàng (theo kiểm tra phía Order Service).
- Các dịch vụ Catalog, Cart, Order và API Gateway đang hoạt động.
- Với vận chuyển / thanh toán online: GHN và VNPay khả dụng (hoặc có phương án dự phòng phí ship).

### Hậu điều kiện

- **Thành công (COD):** Đơn hàng được tạo; khách nhận thông báo đặt hàng thành công; đơn chờ xử lý phía vận hành.
- **Thành công (VNPay):** Đơn hàng được tạo và thanh toán thành công; trạng thái thanh toán được cập nhật.
- **Thất bại thanh toán VNPay:** Đơn có thể tồn tại ở trạng thái chờ thanh toán; khách được thông báo chưa hoàn tất thanh toán.
- Giỏ hàng được xử lý theo quy trình đặt hàng của hệ thống; khách có thể theo dõi trạng thái đơn (khi đơn đã tạo thành công).

---

## 3. Luồng sự kiện chính (Workflow đầy đủ)

### Giai đoạn A — Chuẩn bị giỏ hàng

1. Customer chọn sản phẩm và thêm vào giỏ hàng.
2. Customer truy cập giỏ hàng, kiểm tra danh sách sản phẩm và chọn **Thanh toán**.

### Giai đoạn B — Kiểm tra điều kiện checkout

3. Hệ thống kiểm tra trạng thái đăng nhập.
   - **Chưa đăng nhập:** yêu cầu đăng nhập → kết thúc workflow (chuyển sang Use Case Đăng nhập).
   - **Đã đăng nhập:** tiếp tục.
4. Hệ thống kiểm tra giỏ hàng có sản phẩm hay không.
   - **Giỏ trống:** thông báo “Giỏ hàng trống” → kết thúc thất bại.
   - **Có sản phẩm:** hiển thị trang Checkout.

### Giai đoạn C — Thông tin giao hàng và phí vận chuyển

5. Customer nhập thông tin giao hàng (họ tên, số điện thoại, địa chỉ, tỉnh/quận/phường).
6. Hệ thống validate form giao hàng.
   - **Không hợp lệ:** thông báo lỗi → Customer quay lại sửa form cho đến khi hợp lệ.
   - **Hợp lệ:** tiếp tục.
7. Hệ thống gọi API **GHN** để tính phí vận chuyển.
   - **Thành công:** hiển thị phí ship cho Customer.
   - **Thất bại:** sử dụng **phí dự phòng (fallback)** theo cấu hình, vẫn hiển thị cho Customer.

### Giai đoạn D — Phương thức thanh toán và mã giảm giá

8. Customer xem phí ship và chọn phương thức thanh toán (**COD** hoặc **VNPay**).
9. (Tuỳ chọn) Customer nhập mã giảm giá (coupon).
10. Hệ thống kiểm tra mã giảm giá:
    - **Hợp lệ:** áp dụng giảm giá.
    - **Không hợp lệ hoặc không nhập:** không áp dụng giảm giá, **vẫn cho phép đặt hàng**.

### Giai đoạn E — Tạo đơn hàng

11. Customer nhấn **Xác nhận đặt hàng**.
12. Frontend gửi yêu cầu tạo đơn `POST /api/orders` qua **API Gateway**.
13. **Order Service** kiểm tra thông tin đơn và tạo đơn hàng (bao gồm kiểm tra điều kiện đặt / tồn kho theo logic nghiệp vụ).
14. Kết quả tạo đơn:
    - **Thất bại** (hết hàng, lỗi máy chủ, không đủ điều kiện…): thông báo “Đặt hàng thất bại” → kết thúc thất bại.
    - **Thành công:** chuyển sang giai đoạn F theo **phương thức thanh toán đã chọn**.

### Giai đoạn F — Xử lý theo phương thức thanh toán

#### F1. Nhánh COD

15. Hệ thống ghi nhận đơn hàng với phương thức COD.
16. Hệ thống thông báo **“Đặt hàng thành công”**.
17. Kết thúc thành công — đơn chờ xử lý phía vận hành (Sales/Kho…).

#### F2. Nhánh VNPay

15. Hệ thống tạo URL thanh toán VNPay và **redirect** Customer sang cổng VNPay.
16. Customer thực hiện thanh toán trên cổng VNPay.
17. Hệ thống nhận kết quả qua **Return URL** và/hoặc **IPN**.
18. Hệ thống kiểm tra kết quả thanh toán:
    - **Không thành công / Hủy:** thông báo đơn chưa hoàn tất thanh toán; giữ trạng thái chờ thanh toán → kết thúc thất bại thanh toán (Customer có thể thanh toán lại nếu hệ thống hỗ trợ).
    - **Thành công:** cập nhật trạng thái đã thanh toán → thông báo **“Thanh toán thành công”** → kết thúc thành công — đã thanh toán.

---

## 4. Sơ đồ workflow (tóm tắt)

```text
Bắt đầu
  → Chọn SP, thêm vào giỏ
  → Vào giỏ, chọn Thanh toán
  → ◆ Đã đăng nhập?
        ├─ [Không] → Yêu cầu Login → Kết thúc
        └─ [Có]
  → ◆ Giỏ hàng có sản phẩm?
        ├─ [Không] → Báo giỏ trống → Kết thúc thất bại
        └─ [Có] → Hiển thị trang Checkout
  → Nhập thông tin giao hàng
  → ◆ Thông tin hợp lệ?
        ├─ [Không] → Báo lỗi → Quay lại nhập địa chỉ
        └─ [Có]
  → Gọi GHN tính phí ship
  → ◆ Tính phí GHN OK?
        ├─ [Không] → Dùng phí dự phòng (fallback)
        └─ [Có] → Hiển thị phí ship
  → Chọn PTTT (COD / VNPay)
  → (Tuỳ chọn) Nhập coupon
  → ◆ Coupon hợp lệ?
        ├─ [Không] → Báo lỗi, không giảm giá (vẫn tiếp tục)
        └─ [Có / Không nhập] → Tiếp tục
  → Xác nhận đặt hàng
  → POST /api/orders (qua API Gateway)
  → Order Service tạo đơn
  → ◆ Tạo đơn thành công?
        ├─ [Không] → Báo đặt hàng thất bại → Kết thúc thất bại
        └─ [Có]
  → ◆ Phương thức thanh toán ĐÃ CHỌN?
        ├─ [COD]
        │     → Thông báo đặt hàng thành công
        │     → Kết thúc thành công (chờ xử lý)
        └─ [VNPay]
              → Tạo URL VNPay & Redirect
              → Customer thanh toán trên cổng VNPay
              → Hệ thống nhận Return / IPN
              → ◆ Thanh toán thành công?
                    ├─ [Không / Hủy] → Đơn chờ TT → Kết thúc (TT thất bại)
                    └─ [Có] → Thông báo thanh toán thành công
                          → Kết thúc thành công (đã thanh toán)
```

---

## 5. Luồng sự kiện thay thế (tóm tắt)

| Mã | Điều kiện | Xử lý |
|----|-----------|--------|
| 1a | Chưa đăng nhập khi checkout | Yêu cầu đăng nhập; kết thúc / chuyển UC Login |
| 2a | Giỏ hàng trống | Không cho checkout; thông báo và kết thúc |
| 4a | Thiếu / sai thông tin giao hàng | Báo lỗi; yêu cầu sửa form |
| 5a | Không tính được phí GHN | Thông báo hoặc dùng phí dự phòng |
| 6a | Mã giảm giá không hợp lệ | Không áp dụng giảm giá; vẫn cho đặt hàng |
| 9a | Hết hàng / không đủ điều kiện đặt | Thông báo đặt hàng thất bại |
| 9b | VNPay thất bại hoặc hủy | Đơn chưa hoàn tất thanh toán theo trạng thái tương ứng |
| 9c | Lỗi máy chủ khi tạo đơn | Thông báo mua hàng thất bại |

---

## 6. Các kết quả có thể xảy ra

| Kết quả | Mô tả |
|---------|--------|
| Chuyển sang Đăng nhập | Customer chưa đăng nhập tại bước checkout |
| Thất bại — giỏ trống | Không có sản phẩm trong giỏ |
| Thất bại — tạo đơn | Hết hàng, lỗi nghiệp vụ hoặc lỗi máy chủ |
| Thành công — chờ xử lý | Tạo đơn thành công với **COD** |
| Thành công — đã thanh toán | Tạo đơn thành công và **VNPay** thanh toán OK |
| Thanh toán chưa hoàn tất | **VNPay** hủy hoặc thất bại |

---

## 7. Ghi chú kỹ thuật (phục vụ bảo vệ)

- Client không gọi thẳng database; mọi tạo đơn đi qua **API Gateway** tới **Order Service**.
- Phí vận chuyển ưu tiên lấy từ **GHN**; khi lỗi có thể dùng **fallback**.
- Access token dùng cho request đã xác thực; không lưu access token trong cookie (phiên đăng nhập phía client dùng `localStorage`).
- Nhánh Activity Diagram / workflow sau khi tạo đơn dựa trên **phương thức thanh toán đã chọn**, không hỏi lại PTTT.

---

## 8. Câu mô tả ngắn (đưa vào báo cáo)

> Luồng mua hàng bắt đầu từ việc thêm sản phẩm vào giỏ và chuyển sang checkout. Hệ thống kiểm tra đăng nhập cùng tính hợp lệ của giỏ hàng và thông tin giao hàng, tính phí vận chuyển qua GHN (hoặc phí dự phòng khi cần), cho phép chọn COD hoặc VNPay và áp dụng mã giảm giá nếu hợp lệ. Sau khi khách xác nhận, Order Service tạo đơn qua API Gateway: với COD đơn hoàn tất ở trạng thái chờ xử lý; với VNPay khách được chuyển sang cổng thanh toán và trạng thái đơn được cập nhật theo kết quả Return/IPN.

---

*Tài liệu phục vụ Chương giải pháp / đặc tả Use Case Mua hàng — Electro Store Microservices.*
