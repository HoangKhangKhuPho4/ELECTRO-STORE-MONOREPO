/**
 * Màn 1 — Danh sách yêu cầu hoàn tiền (/admin/refunds)
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Chip, CircularProgress, FormControl, IconButton, InputLabel,
  MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography,
} from "@mui/material";
import { Payments as RefundIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import AdminLayout from "../../components/Admin-Layout/AdminLayout";
import {
  fetchRefunds, paymentMethodChipColor, paymentMethodTag,
} from "../../services/refundService";
import { isApiSuccess } from "../../utils/apiResponse";
import { toast } from "react-toastify";

const STATUS_COLOR = {
  PENDING_APPROVAL: "warning",
  AWAITING_MANUAL_TRANSFER: "info",
  PROCESSING: "info",
  COMPLETED: "success",
  REJECTED: "default",
  FAILED: "error",
};

const formatMoney = (v) => (v != null ? `${Number(v).toLocaleString("vi-VN")} ₫` : "—");

const RefundListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [paymentFilter, setPaymentFilter] = useState("");

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRefunds(statusFilter || null, paymentFilter || null);
      if (isApiSuccess(res)) setRefunds(res.data || []);
    } catch {
      toast.error("Không tải được danh sách hoàn tiền.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter]);

  useEffect(() => { loadList(); }, [loadList]);

  const pendingCount = useMemo(
    () => refunds.filter((r) => r.status === "PENDING_APPROVAL").length,
    [refunds],
  );

  return (
    <AdminLayout currentPage="Quản lý hoàn tiền">
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <RefundIcon sx={{ color: "#dc2626", fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">Quản lý hoàn tiền</Typography>
          <IconButton onClick={loadList} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Các đơn đã được Kho xác nhận hoàn hàng (RT-...) chờ Kế toán xử lý trả tiền.
          {pendingCount > 0 && ` · ${pendingCount} yêu cầu chờ duyệt`}
        </Typography>

        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select label="Trạng thái" value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="PENDING">Chờ duyệt</MenuItem>
              <MenuItem value="COMPLETED">Đã hoàn tiền</MenuItem>
              <MenuItem value="REJECTED">Đã từ chối</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Phương thức gốc</InputLabel>
            <Select label="Phương thức gốc" value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}>
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="VNPAY">VNPay</MenuItem>
              <MenuItem value="MOMO">MoMo</MenuItem>
              <MenuItem value="ZALOPAY">ZaloPay</MenuItem>
              <MenuItem value="COD">Tiền mặt / COD</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          {loading ? (
            <Box sx={{ textAlign: "center", py: 8 }}><CircularProgress /></Box>
          ) : refunds.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>Không có yêu cầu hoàn tiền phù hợp bộ lọc.</Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell><strong>Mã phiếu hoàn</strong></TableCell>
                  <TableCell><strong>Mã phiếu kho</strong></TableCell>
                  <TableCell><strong>Khách hàng</strong></TableCell>
                  <TableCell align="right"><strong>Số tiền hoàn</strong></TableCell>
                  <TableCell><strong>Phương thức</strong></TableCell>
                  <TableCell><strong>Trạng thái</strong></TableCell>
                  <TableCell align="center"><strong>Hành động</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {refunds.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 600 }}>{r.refundCode}</TableCell>
                    <TableCell>{r.returnSlipCode || "—"}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{r.customerName || "—"}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.orderCode}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#dc2626" }}>
                      {formatMoney(r.refundAmount)}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={paymentMethodTag(r.paymentMethod)}
                        color={paymentMethodChipColor(r.paymentMethod)} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={r.statusLabel}
                        color={STATUS_COLOR[r.status] || "default"} />
                    </TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="contained"
                        onClick={() => navigate(`/admin/refunds/${r.id}`)}>
                        Xử lý hoàn tiền
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Box>
    </AdminLayout>
  );
};

export default RefundListPage;
