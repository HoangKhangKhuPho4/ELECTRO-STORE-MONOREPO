/**
 * Màn 2 — Chi tiết xử lý hoàn tiền (/admin/refunds/:id)
 * VNPay: một nút hoàn qua API | COD: nhập TK + upload biên lai
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, Grid, Paper,
  TextField, Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon, AccountBalance as BankIcon, CloudUpload as UploadIcon,
  Payments as VnpayIcon, Print as PrintIcon, Replay as RetryIcon,
} from "@mui/icons-material";
import AdminLayout from "../../components/Admin-Layout/AdminLayout";
import { API_BASE_URL } from "../../config/api";
import {
  approveRefundGateway, confirmCodRefund, fetchRefundDetail,
  paymentMethodTag, retryRefundGateway,
} from "../../services/refundService";
import { getApiErrorMessage, isApiSuccess } from "../../utils/apiResponse";
import { toast } from "react-toastify";

const formatMoney = (v) => (v != null ? `${Number(v).toLocaleString("vi-VN")} ₫` : "—");

const RefundProcessPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchRefundDetail(id);
      if (isApiSuccess(res)) {
        setDetail(res.data);
        setBankName(res.data.customerBankName || "");
        setBankAccount(res.data.customerBankAccount || "");
        setBankAccountName(res.data.customerBankAccountName || "");
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không tải được chi tiết."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const isGateway = detail?.refundChannel === "GATEWAY";
  const isCod = detail?.refundChannel === "COD_MANUAL"
    || detail?.refundChannel === "BANK_TRANSFER_MANUAL";
  const canProcess = detail?.status === "PENDING_APPROVAL";
  const isVnpay = detail?.paymentMethod === "VNPAY";

  const handleGatewayRefund = async () => {
    setActing(true);
    try {
      const res = await approveRefundGateway(id, {});
      if (isApiSuccess(res)) {
        if (res.data.status === "COMPLETED") {
          toast.success("Hoàn tiền cổng thành công — đơn đã REFUNDED.");
        } else {
          toast.error(res.data.failureReason || "Hoàn tiền thất bại.");
        }
        setDetail(res.data);
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Gọi API hoàn tiền thất bại."));
    } finally {
      setActing(false);
    }
  };

  const handleCodConfirm = async () => {
    if (!receiptFile) {
      toast.warning("Vui lòng tải lên ảnh biên lai chuyển khoản.");
      return;
    }
    setActing(true);
    try {
      const fd = new FormData();
      fd.append("customerBankName", bankName.trim());
      fd.append("customerBankAccount", bankAccount.trim());
      fd.append("customerBankAccountName", bankAccountName.trim());
      if (transferRef.trim()) fd.append("transferReference", transferRef.trim());
      fd.append("receipt", receiptFile);
      const res = await confirmCodRefund(id, fd);
      if (isApiSuccess(res)) {
        toast.success(`Đã chuyển khoản & sinh phiếu chi ${res.data.voucherCode}`);
        setDetail(res.data);
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Xác nhận COD thất bại."));
    } finally {
      setActing(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setReceiptFile(f);
    setReceiptPreview(URL.createObjectURL(f));
  };

  if (loading) {
    return (
      <AdminLayout currentPage="Quản lý hoàn tiền">
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (!detail) {
    return (
      <AdminLayout currentPage="Quản lý hoàn tiền">
        <Alert severity="error" sx={{ m: 3 }}>Không tìm thấy yêu cầu hoàn tiền.</Alert>
      </AdminLayout>
    );
  }

  const gatewayButtonLabel = isVnpay
    ? "Bấm để hoàn tiền qua VNPay"
    : `Bấm để hoàn tiền qua ${detail.paymentMethodLabel}`;

  return (
    <AdminLayout currentPage="Quản lý hoàn tiền">
      <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate("/admin/refunds")} sx={{ mb: 2 }}>
          Danh sách hoàn tiền
        </Button>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">{detail.refundCode}</Typography>
          <Chip label={detail.statusLabel} color={detail.status === "COMPLETED" ? "success" : "warning"} />
          <Chip label={paymentMethodTag(detail.paymentMethod)} variant="outlined" />
        </Box>

        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Thông tin chung</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <Typography variant="caption" color="text.secondary">Phiếu kho</Typography>
              <Typography fontWeight={600}>{detail.returnSlipCode || "—"}</Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="caption" color="text.secondary">Đơn hàng</Typography>
              <Typography fontWeight={600}>{detail.orderCode}</Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="caption" color="text.secondary">Khách hàng</Typography>
              <Typography fontWeight={600}>{detail.customerName}</Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="caption" color="text.secondary">Số tiền hoàn</Typography>
              <Typography fontWeight={700} color="error.main">{formatMoney(detail.refundAmount)}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* TRƯỜNG HỢP A: VNPay / cổng */}
        {isGateway && (
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: "2px solid #3b82f6" }}>
            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <VnpayIcon color="primary" /> Hoàn tiền tự động qua cổng thanh toán
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Mã GD gốc ({detail.paymentMethodLabel})</Typography>
                <Typography fontWeight={600} sx={{ fontFamily: "monospace" }}>
                  {detail.originalGatewayTransactionId || "—"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Số tiền thanh toán ban đầu</Typography>
                <Typography fontWeight={600}>{formatMoney(detail.originalPaymentAmount)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Số tiền hoàn lại</Typography>
                <Typography fontWeight={700} color="error.main">{formatMoney(detail.refundAmount)}</Typography>
              </Grid>
            </Grid>

            {canProcess && (
              <Button variant="contained" color="primary" size="large" fullWidth
                disabled={acting} onClick={handleGatewayRefund} sx={{ py: 1.5, fontWeight: 700 }}>
                {acting ? <CircularProgress size={24} color="inherit" /> : gatewayButtonLabel}
              </Button>
            )}
            {detail.status === "FAILED" && (
              <Button variant="contained" color="warning" startIcon={<RetryIcon />}
                disabled={acting} onClick={async () => {
                  setActing(true);
                  try {
                    const res = await retryRefundGateway(id);
                    if (isApiSuccess(res)) setDetail(res.data);
                  } finally { setActing(false); }
                }}>
                Thử lại
              </Button>
            )}
            {detail.failureReason && <Alert severity="error" sx={{ mt: 2 }}>{detail.failureReason}</Alert>}
          </Paper>
        )}

        {/* TRƯỜNG HỢP B: COD */}
        {isCod && canProcess && (
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: "2px solid #f59e0b" }}>
            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <BankIcon color="warning" /> Chuyển khoản thủ công (COD)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Kế toán mở app ngân hàng chuyển tiền cho khách theo thông tin bên dưới, sau đó tải biên lai lên.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Tên ngân hàng" placeholder="Vietcombank"
                  value={bankName} onChange={(e) => setBankName(e.target.value)} required />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Số tài khoản" placeholder="1023456789"
                  value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} required />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Tên chủ tài khoản" placeholder="NGUYEN VAN A"
                  value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Mã giao dịch ngân hàng (tùy chọn)"
                  value={transferRef} onChange={(e) => setTransferRef(e.target.value)} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
            <Box sx={{ mb: 2 }}>
              <Button variant="outlined" startIcon={<UploadIcon />}
                onClick={() => fileRef.current?.click()}>
                Tải lên biên lai chuyển khoản
              </Button>
              {receiptFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>Đã chọn: {receiptFile.name}</Typography>
              )}
              {receiptPreview && (
                <Box component="img" src={receiptPreview} alt="Biên lai"
                  sx={{ mt: 2, maxWidth: 280, maxHeight: 200, borderRadius: 2, border: "1px solid #e2e8f0" }} />
              )}
            </Box>

            <Button variant="contained" color="success" size="large" fullWidth
              disabled={acting} onClick={handleCodConfirm} sx={{ py: 1.5, fontWeight: 700 }}>
              {acting ? <CircularProgress size={24} color="inherit" />
                : "Xác nhận đã chuyển khoản & Sinh phiếu chi"}
            </Button>
          </Paper>
        )}

        {detail.status === "COMPLETED" && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Đã hoàn tiền thành công
            {detail.completedAt && ` — ${new Date(detail.completedAt).toLocaleString("vi-VN")}`}.
            {detail.voucherCode && (
              <> Phiếu chi: <strong>{detail.voucherCode}</strong></>
            )}
          </Alert>
        )}

        {detail.voucherCode && (
          <Button variant="outlined" startIcon={<PrintIcon />}
            onClick={() => navigate(`/admin/refunds/${id}/voucher`)}>
            Xem / In phiếu chi
          </Button>
        )}

        {detail.receiptImageUrl && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Biên lai đính kèm</Typography>
            <Box component="img"
              src={`${API_BASE_URL}${detail.receiptImageUrl}`}
              alt="Biên lai"
              sx={{ maxWidth: 320, borderRadius: 2, border: "1px solid #e2e8f0" }} />
          </Box>
        )}
      </Box>
    </AdminLayout>
  );
};

export default RefundProcessPage;
