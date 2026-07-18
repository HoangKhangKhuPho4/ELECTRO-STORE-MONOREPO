import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Pagination,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import ProfileMenu from "../../components/Profile-Menu/ProfileMenu.jsx";
import { selectUser } from "../../redux/appSlice";
import {
  cancelOrder,
  getMyOrders,
  getOrderDetail,
  createRetryPayment,
} from "../../services/orderService";
import { formatDateTime, formatMoney } from "../../utils/formatters";
import PaymentIcon from "@mui/icons-material/Payment";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import TrackingTimeline from "../../components/TrackingTimeline/TrackingTimeline";
import WarrantyClaimFromOrderDialog from "../../components/Warranty/WarrantyClaimFromOrderDialog";
import ReturnRequestFromOrderDialog from "../../components/Return/ReturnRequestFromOrderDialog";
import { canRequestWarrantyForItem, buildWarrantyClaimContext } from "../../utils/warrantyFromOrder";
import { canRequestReturnForItem, buildReturnRequestContext, canShowReturnActionForOrder, collectReturnableItems } from "../../utils/returnFromOrder";
import { fetchMyReturnRequests, fetchMyReturnRequestDetail } from "../../services/customerReturnRequestService";

// ─── Màu Chip theo trạng thái ────────────────────────────────────────────────
const getStatusChipColor = (status) => {
  const map = {
    PENDING: "warning",
    CONFIRMED: "info",
    PROCESSING: "info",
    SHIPPING: "primary",
    DELIVERED: "success",
    COMPLETED: "success",
    CANCELLED: "error",
    REFUNDED: "default",
  };
  return map[status] || "default";
};

const PAGE_SIZE = 5;

const ORDER_STATUS_KEYS = {
  PENDING: "order.tabPending",
  CONFIRMED: "order.tabConfirmed",
  PROCESSING: "order.tabProcessing",
  SHIPPING: "order.tabShipping",
  DELIVERED: "order.tabDelivered",
  COMPLETED: "order.tabCompleted",
  CANCELLED: "order.tabCancelled",
};

// ═════════════════════════════════════════════════════════════════════════════
// ORDER LIST COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const OrderList = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const STATUS_TABS = useMemo(
    () => [
      { label: t("order.tabAll"), value: null },
      { label: t("order.tabPending"), value: "PENDING" },
      { label: t("order.tabConfirmed"), value: "CONFIRMED" },
      { label: t("order.tabProcessing"), value: "PROCESSING" },
      { label: t("order.tabShipping"), value: "SHIPPING" },
      { label: t("order.tabDelivered"), value: "DELIVERED" },
      { label: t("order.tabCompleted"), value: "COMPLETED" },
      { label: t("order.tabCancelled"), value: "CANCELLED" },
    ],
    [t, i18n.language],
  );

  const getOrderStatusLabel = useCallback(
    (status, statusDisplay) => {
      const key = ORDER_STATUS_KEYS[status];
      return key ? t(key) : statusDisplay || status;
    },
    [t, i18n.language],
  );

  const getPaymentStatusLabel = useCallback(
    (ps) => {
      const map = {
        PENDING: t("order.payPending"),
        PAID: t("order.payPaid"),
        FAILED: t("order.payFailed"),
        REFUNDED: t("order.payRefunded"),
      };
      return map[ps] || ps;
    },
    [t, i18n.language],
  );

  const getPaymentMethodLabel = useCallback(
    (pm) => {
      const map = {
        COD: t("checkout.cod"),
        BANK_TRANSFER: t("checkout.bankTransfer"),
        MOMO: t("checkout.momo"),
        VNPAY: t("checkout.vnpay"),
        ZALOPAY: t("checkout.zalopay"),
      };
      return map[pm] || pm;
    },
    [t, i18n.language],
  );
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Chi tiết đơn hàng (accordion mở rộng)
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Hủy đơn hàng dialog
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    orderId: null,
    orderCode: "",
  });
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Thanh toán lại
  const [retryLoading, setRetryLoading] = useState(false);

  // Yêu cầu bảo hành từ dòng sản phẩm
  const [claimDialog, setClaimDialog] = useState({ open: false, context: null });

  // Yêu cầu trả hàng
  const [returnDialog, setReturnDialog] = useState({ open: false, context: null, existing: null });
  const [returnBySerial, setReturnBySerial] = useState({});
  const [serialPicker, setSerialPicker] = useState({ open: false, options: [], orderDetail: null });

  const loadMyReturnRequests = useCallback(async () => {
    try {
      const res = await fetchMyReturnRequests();
      const list = res?.data || [];
      const map = {};
      list.forEach((r) => {
        if (r.serialNumber && !["CANCELLED", "REJECTED", "EXPIRED"].includes(r.status)) {
          map[r.serialNumber] = r;
        }
      });
      setReturnBySerial(map);
    } catch {
      setReturnBySerial({});
    }
  }, []);

  useEffect(() => {
    loadMyReturnRequests();
  }, [loadMyReturnRequests]);

  // ─── Fetch danh sách đơn hàng ───
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const status = STATUS_TABS[activeTab].value;
      const data = await getMyOrders(page - 1, PAGE_SIZE, status);
      setOrders(data?.content || []);
      setTotalPages(data?.totalPages || 0);
    } catch (err) {
      console.error("Lỗi load đơn hàng:", err);
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 503) {
        setError(t("order.error503"));
      } else if (status === 502 || status === 500) {
        setError(msg || t("order.error502"));
      } else {
        setError(msg || t("order.loadFail"));
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ─── Tab change → reset page ───
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setPage(1);
    setExpandedOrderId(null);
    setOrderDetail(null);
  };

  // ─── Mở rộng xem chi tiết ───
  const handleAccordionToggle = async (order) => {
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null);
      setOrderDetail(null);
      return;
    }
    setExpandedOrderId(order.id);
    setDetailLoading(true);
    try {
      const detail = await getOrderDetail(order.orderCode);
      setOrderDetail(detail);
    } catch (err) {
      console.error("Lỗi load chi tiết:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Hủy đơn hàng ───
  const openCancelDialog = (order) => {
    setCancelDialog({
      open: true,
      orderId: order.id,
      orderCode: order.orderCode,
    });
    setCancelReason("");
  };

  const handleCancelOrder = async () => {
    setCancelLoading(true);
    try {
      const updated = await cancelOrder(cancelDialog.orderId, cancelReason.trim() || null);
      const refundMsg = updated?.cancellationRefund?.message;
      if (refundMsg) {
        toast.success(refundMsg);
      } else {
        toast.success(t("order.cancelSuccess"));
      }
      setCancelDialog({ open: false, orderId: null, orderCode: "" });
      fetchOrders();
    } catch (err) {
      console.error("Lỗi hủy đơn:", err);
      toast.error(err.response?.data?.message || t("order.cancelFail"));
    } finally {
      setCancelLoading(false);
    }
  };

  // ─── Thanh toán lại ───
  const handleRetryPayment = async (orderCode) => {
    setRetryLoading(true);
    try {
      const resp = await createRetryPayment({ orderCode, bankCode: "", language: "vn" });
      if (resp?.paymentUrl) {
        window.location.href = resp.paymentUrl;
      } else {
        setError(t("order.retryPayLinkFail"));
      }
    } catch (err) {
      console.error("Lỗi retry payment:", err);
      setError(t("order.retryPayFail"));
    } finally {
      setRetryLoading(false);
    }
  };

  const openReturnForRow = async (orderDetail, row) => {
    if (row.existing?.id) {
      try {
        const res = await fetchMyReturnRequestDetail(row.existing.id);
        setReturnDialog({
          open: true,
          context: buildReturnRequestContext(orderDetail, row.item, row.imei),
          existing: res?.data || row.existing,
        });
      } catch {
        setReturnDialog({
          open: true,
          context: buildReturnRequestContext(orderDetail, row.item, row.imei),
          existing: row.existing,
        });
      }
    } else {
      setReturnDialog({
        open: true,
        context: buildReturnRequestContext(orderDetail, row.item, row.imei),
        existing: null,
      });
    }
  };

  const handleReturnFlow = async (order, e) => {
    e?.stopPropagation?.();
    let detail = orderDetail?.id === order.id ? orderDetail : null;
    if (!detail) {
      setExpandedOrderId(order.id);
      setDetailLoading(true);
      try {
        detail = await getOrderDetail(order.orderCode);
        setOrderDetail(detail);
      } catch (err) {
        toast.error(t("order.loadDetailFail"));
        return;
      } finally {
        setDetailLoading(false);
      }
    }
    const returnables = collectReturnableItems(detail, returnBySerial);
    if (returnables.length === 0) {
      toast.warning(t("order.returnNotAvailable"), { autoClose: 7000 });
      return;
    }
    if (returnables.length === 1) {
      await openReturnForRow(detail, returnables[0]);
      return;
    }
    setSerialPicker({ open: true, options: returnables, orderDetail: detail });
  };

  const renderOrderActionBar = (order, detail) => {
    if (!detail || detail.id !== order.id) return null;
    const showReturn = canShowReturnActionForOrder(order);
    if (!showReturn) return null;

    return (
      <Box
        sx={{
          mt: 2,
          pt: 2,
          borderTop: "1px solid #eee",
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr" },
          gap: 1.5,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ChatBubbleOutlineIcon />}
          onClick={() => navigate("/contact")}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, py: 1.2, color: "#333", borderColor: "#ccc" }}
        >
          {t("order.contact")}
        </Button>
        <Button
          variant="outlined"
          startIcon={<StorefrontOutlinedIcon />}
          onClick={() => navigate("/shop")}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, py: 1.2, color: "#333", borderColor: "#ccc" }}
        >
          {t("order.visitShop")}
        </Button>
        <Button
          variant="outlined"
          startIcon={<AssignmentReturnOutlinedIcon />}
          onClick={(e) => handleReturnFlow(order, e)}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            py: 1.2,
            color: "#c2410c",
            borderColor: "#c2410c",
            bgcolor: "#fff7ed",
            "&:hover": { bgcolor: "#ffedd5", borderColor: "#9a3412" },
          }}
        >
          {t("order.returnRefund")}
        </Button>
        <Button
          variant="contained"
          disabled
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            py: 1.2,
            bgcolor: "#f28900",
            "&.Mui-disabled": { bgcolor: "#fdba74", color: "#fff" },
          }}
        >
          {detail.status === "COMPLETED" ? t("order.received") : t("order.waitingDelivery")}
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <InventoryOutlinedIcon sx={{ color: "#f28900", fontSize: 28 }} />
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          {t("order.title")}
        </Typography>
      </Box>

      {/* Tabs trạng thái */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        {STATUS_TABS.map((tab) => (
          <Tab label={tab.label} key={tab.label} />
        ))}
      </Tabs>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#f28900" }} />
        </Box>
      )}

      {/* Error */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Danh sách đơn hàng */}
      {!loading && !error && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {orders.length > 0 ? (
            orders.map((order) => (
              <Accordion
                key={order.id}
                expanded={expandedOrderId === order.id}
                onChange={() => handleAccordionToggle(order)}
                variant="outlined"
                disableGutters
                sx={{
                  borderRadius: 3,
                  "&:before": { display: "none" },
                  border: expandedOrderId === order.id ? "1px solid #f28900" : "1px solid #e0e0e0",
                  boxShadow: expandedOrderId === order.id ? "0 6px 16px rgba(242, 137, 0, 0.12)" : "none",
                  transition: "all 0.3s ease",
                  overflow: "hidden"
                }}
              >
                {/* ── Header đơn hàng ── */}
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ px: 2.5, py: 1 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Ảnh sản phẩm đầu tiên */}
                    <Avatar
                      src={order.firstItemImage}
                      variant="rounded"
                      sx={{ width: 56, height: 56, border: "1px solid #eee" }}
                    />

                    {/* Thông tin chính */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {order.firstItemName}
                        {order.totalItems > 1 && (
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{ color: "#888", ml: 1 }}
                          >
                            {t("order.moreProducts", { count: order.totalItems - 1 })}
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        #{order.orderCode} &middot;{" "}
                        {formatDateTime(order.orderDate)}
                      </Typography>
                    </Box>

                    {/* Tổng tiền */}
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: "#f28900",
                        minWidth: 120,
                        textAlign: "right",
                      }}
                    >
                      {formatMoney(order.totalAmount)}
                    </Typography>

                    {/* Chip trạng thái */}
                    <Chip
                      label={getOrderStatusLabel(order.status, order.statusDisplay)}
                      color={getStatusChipColor(order.status)}
                      size="small"
                      sx={{ fontWeight: 600, minWidth: 90 }}
                    />

                    {/* Nút hủy (chỉ hiện cho PENDING hoặc CONFIRMED) */}
                    {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<CancelOutlinedIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openCancelDialog(order);
                        }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: 2,
                        }}
                      >
                        {t("order.cancelOrder")}
                      </Button>
                    )}

                    {/* Trả hàng — hiện ngay trên header đơn (Đã giao / Hoàn thành) */}
                    {canShowReturnActionForOrder(order) && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        startIcon={<AssignmentReturnOutlinedIcon />}
                        onClick={(e) => handleReturnFlow(order, e)}
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          borderRadius: 2,
                          borderColor: "#c2410c",
                          color: "#c2410c",
                          bgcolor: "#fff7ed",
                        }}
                      >
                        {t("order.returnRefund")}
                      </Button>
                    )}
                  </Box>
                </AccordionSummary>

                {/* ── Chi tiết đơn hàng (khi mở rộng) ── */}
                <AccordionDetails sx={{ px: 2.5, pt: 0, pb: 2.5 }}>
                  <Divider sx={{ mb: 2 }} />

                  {detailLoading ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        py: 3,
                      }}
                    >
                      <CircularProgress size={28} sx={{ color: "#f28900" }} />
                    </Box>
                  ) : orderDetail ? (
                    <>
                      {/* Danh sách sản phẩm */}
                      {orderDetail.items?.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            py: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Avatar
                              src={item.imageUrl}
                              variant="rounded"
                              sx={{
                                width: 52,
                                height: 52,
                                border: "1px solid #eee",
                              }}
                            />
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {item.productName}
                              </Typography>
                              {item.variantName && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {t("order.variantLabel")} {item.variantName}
                                </Typography>
                              )}
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {formatMoney(item.unitPrice)} x {item.quantity}
                              </Typography>

                              {/* Hiển thị Mã máy đã giao (IMEI) */}
                              {['SHIPPING', 'DELIVERED', 'COMPLETED'].includes(orderDetail.status) && item.assignedImeis && item.assignedImeis.length > 0 && (
                                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "#f5f5fa", borderRadius: 2, border: "1px dashed #cdd" }}>
                                  <Typography variant="caption" fontWeight="bold" color="primary.main" display="block" gutterBottom>
                                    {t("order.deliveredImeis")}
                                  </Typography>
                                  {item.assignedImeis.map((imei, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: "#333" }}>
                                        • {t("order.imeiSerial")} {imei}
                                      </Typography>
                                      <Button 
                                        size="small" 
                                        sx={{ minWidth: "auto", px: 1, py: 0.2, fontSize: "0.7rem", borderRadius: 1 }} 
                                        variant="outlined"
                                        onClick={() => { 
                                          navigator.clipboard.writeText(imei); 
                                          toast.success(t("order.copySuccess", { imei })); 
                                        }}
                                      >
                                        📋 {t("order.copy")}
                                      </Button>
                                      <Button 
                                        size="small" 
                                        sx={{ minWidth: "auto", px: 1, py: 0.2, fontSize: "0.7rem", borderRadius: 1 }} 
                                        variant="outlined"
                                        onClick={() => window.open(`/warranty-check?code=${imei}`, '_blank')}
                                      >
                                        🔍 {t("order.lookupWarranty")}
                                      </Button>
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatMoney(item.totalPrice)}
                            </Typography>
                            {canRequestReturnForItem(
                              orderDetail.status,
                              item.assignedImeis,
                              orderDetail.paymentStatus,
                            ) && item.assignedImeis?.map((imei) => {
                              const existing = returnBySerial[imei];
                              return (
                                <Button
                                  key={`ret-${imei}`}
                                  size="small"
                                  variant={existing ? "outlined" : "contained"}
                                  color="error"
                                  startIcon={<AssignmentReturnOutlinedIcon />}
                                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, whiteSpace: "nowrap" }}
                                  onClick={async () => {
                                    if (existing?.id) {
                                      try {
                                        const res = await fetchMyReturnRequestDetail(existing.id);
                                        setReturnDialog({
                                          open: true,
                                          context: buildReturnRequestContext(orderDetail, item, imei),
                                          existing: res?.data || existing,
                                        });
                                      } catch {
                                        setReturnDialog({
                                          open: true,
                                          context: buildReturnRequestContext(orderDetail, item, imei),
                                          existing,
                                        });
                                      }
                                    } else {
                                      setReturnDialog({
                                        open: true,
                                        context: buildReturnRequestContext(orderDetail, item, imei),
                                        existing: null,
                                      });
                                    }
                                  }}
                                >
                                  {existing ? t("order.returnWithStatus", { status: existing.statusLabel }) : t("order.returnRefund")}
                                </Button>
                              );
                            })}
                            {canRequestWarrantyForItem(orderDetail.status, item.assignedImeis) && (
                              <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                startIcon={<BuildOutlinedIcon />}
                                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, whiteSpace: "nowrap" }}
                                onClick={() =>
                                  setClaimDialog({
                                    open: true,
                                    context: buildWarrantyClaimContext(orderDetail, item),
                                  })
                                }
                              >
                                {t("order.warrantyRequest")}
                              </Button>
                            )}
                            {["DELIVERED", "COMPLETED", "SHIPPING"].includes(orderDetail.status) &&
                              (!item.assignedImeis || item.assignedImeis.length === 0) && (
                              <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 160 }}>
                                {t("order.noImeiYet")}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}

                      <Divider sx={{ my: 2 }} />

                      {/* Thông tin tóm tắt */}
                      <Grid container spacing={2}>
                        {/* Cột trái: Thông tin giao hàng */}
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, mb: 1 }}
                          >
                            {t("order.shippingInfo")}
                          </Typography>
                          <Typography variant="body2">
                            {orderDetail.shippingName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {orderDetail.shippingPhone}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {[
                              orderDetail.shippingAddress,
                              orderDetail.shippingWard,
                              orderDetail.shippingDistrict,
                              orderDetail.shippingProvince,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </Typography>

                          {/* Tracking Timeline */}
                          {['SHIPPING', 'DELIVERED', 'COMPLETED'].includes(orderDetail.status) && orderDetail.trackingCode && (
                            <Box sx={{ mt: 2 }}>
                              <TrackingTimeline trackingCode={orderDetail.trackingCode} />
                            </Box>
                          )}

                          {orderDetail.note && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5, fontStyle: "italic" }}
                            >
                              {t("order.noteLabel")} {orderDetail.note}
                            </Typography>
                          )}
                          {orderDetail.cancelReason && (
                            <Typography
                              variant="body2"
                              color="error"
                              sx={{ mt: 0.5 }}
                            >
                              {t("order.cancelReasonLabel")} {orderDetail.cancelReason}
                            </Typography>
                          )}
                        </Grid>

                        {/* Cột phải: Thanh toán + Tổng tiền */}
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, mb: 1 }}
                          >
                            {t("checkout.paymentMethod")}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t("order.paymentMethodLabel")}{" "}
                            {getPaymentMethodLabel(orderDetail.paymentMethod)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t("order.paymentStatusLabel")}{" "}
                            {getPaymentStatusLabel(orderDetail.paymentStatus)}
                          </Typography>

                          <Box sx={{ mt: 2 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {t("order.subtotal")}
                              </Typography>
                              <Typography variant="body2">
                                {formatMoney(orderDetail.subtotal)}
                              </Typography>
                            </Box>
                            {orderDetail.discountAmount > 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: "#2e7d32" }}
                                >
                                  {t("order.discount")}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: "#2e7d32" }}
                                >
                                  -{formatMoney(orderDetail.discountAmount)}
                                </Typography>
                              </Box>
                            )}
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {t("order.shippingFee")}
                              </Typography>
                              <Typography variant="body2">
                                {orderDetail.shippingFee > 0
                                  ? formatMoney(orderDetail.shippingFee)
                                  : t("order.free")}
                              </Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 700 }}
                              >
                                {t("order.total")}
                              </Typography>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 700, color: "#f28900" }}
                              >
                                {formatMoney(orderDetail.totalAmount)}
                              </Typography>
                            </Box>

                            {/* Nút Retry Payment nếu chưa thanh toán (và là đơn ONLINE) */}
                            {orderDetail.status !== "CANCELLED" && orderDetail.paymentStatus === "PENDING" && orderDetail.paymentMethod !== "COD" && (
                              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="large"
                                  startIcon={<PaymentIcon />}
                                  onClick={() => handleRetryPayment(orderDetail.orderCode)}
                                  disabled={retryLoading}
                                  sx={{ fontWeight: "bold", textTransform: "none", width: "100%", py: 1.5, borderRadius: 2 }}
                                >
                                  {retryLoading ? <CircularProgress size={24} color="inherit" /> : t("order.payNow")}
                                </Button>
                              </Box>
                            )}

                          </Box>
                        </Grid>
                      </Grid>

                      {renderOrderActionBar(order, orderDetail)}
                    </>
                  ) : null}
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <InventoryOutlinedIcon
                sx={{ fontSize: 60, color: "#ccc", mb: 1 }}
              />
              <Typography color="text.secondary">
                {t("order.emptyTab")}
              </Typography>
            </Box>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Box>
      )}

      {/* ── Dialog hủy đơn hàng ── */}
      <Dialog
        open={cancelDialog.open}
        onClose={() =>
          setCancelDialog({ open: false, orderId: null, orderCode: "" })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("order.cancelDialogTitle", { code: cancelDialog.orderCode })}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("order.cancelDialogDesc")}
          </Typography>
          <TextField
            label={t("order.cancelReasonOptional")}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() =>
              setCancelDialog({ open: false, orderId: null, orderCode: "" })
            }
            sx={{ textTransform: "none" }}
          >
            {t("order.close")}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelOrder}
            disabled={cancelLoading}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {cancelLoading ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : (
              t("order.confirmCancel")
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <WarrantyClaimFromOrderDialog
        open={claimDialog.open}
        context={claimDialog.context}
        onClose={() => setClaimDialog({ open: false, context: null })}
      />
      <ReturnRequestFromOrderDialog
        open={returnDialog.open}
        onClose={() => setReturnDialog({ open: false, context: null, existing: null })}
        context={returnDialog.context}
        existingRequest={returnDialog.existing}
        onSuccess={() => loadMyReturnRequests()}
      />

      <Dialog
        open={serialPicker.open}
        onClose={() => setSerialPicker({ open: false, options: [], orderDetail: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle component="div">
          <Typography component="span" variant="h6" fontWeight={700}>
            {t("order.selectReturnProduct")}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("order.selectReturnDesc")}
          </Typography>
          {serialPicker.options.map((row) => (
            <Button
              key={row.imei}
              fullWidth
              variant="outlined"
              sx={{ mb: 1, justifyContent: "flex-start", textTransform: "none", py: 1.2 }}
              onClick={async () => {
                const detail = serialPicker.orderDetail;
                setSerialPicker({ open: false, options: [], orderDetail: null });
                await openReturnForRow(detail, row);
              }}
            >
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="body2" fontWeight={600}>{row.item.productName}</Typography>
                <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{row.imei}</Typography>
                {row.existing && (
                  <Typography variant="caption" display="block" color="warning.main">
                    {row.existing.statusLabel}
                  </Typography>
                )}
              </Box>
            </Button>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSerialPicker({ open: false, options: [], orderDetail: null })}>
            {t("order.close")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
const OrderHistoryPage = () => {
  const { t } = useTranslation();
  const user = useSelector(selectUser);

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: { xs: 2, md: 3 },
        backgroundColor: "#f9f9f9",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1200,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "stretch",
          gap: 0,
          border: "1px solid #e0e0e0",
          borderRadius: 2,
          backgroundColor: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Cột trái: Menu User */}
        <Box
          sx={{
            width: { xs: "100%", md: 260 },
            minWidth: { md: 260 },
          }}
        >
          <ProfileMenu activePage={t("profile.orders")} user={user} />
        </Box>

        {/* Cột phải: Đơn hàng */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            width: { xs: "100%", md: "auto" },
            maxHeight: { md: "80vh" },
            overflowY: { md: "auto" },
            /* Custom scrollbar nhỏ gọn */
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f0f0f0",
              borderRadius: 3,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#c0c0c0",
              borderRadius: 3,
              "&:hover": {
                backgroundColor: "#a0a0a0",
              },
            },
          }}
        >
          <OrderList />
        </Box>
      </Box>
    </Box>
  );
};

export default OrderHistoryPage;
