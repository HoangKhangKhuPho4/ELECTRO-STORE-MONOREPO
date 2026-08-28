import { useState, useEffect, useCallback } from "react";
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, Tooltip, CircularProgress, Chip, Avatar, Stack, Switch,
  MenuItem, Select, FormControl, TablePagination, InputAdornment, FormControlLabel,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon,
  ConfirmationNumber as CouponIcon, Search as SearchIcon,
  AccessTime as TimeIcon, MonetizationOn as MoneyIcon, Percent as PercentIcon,
  CheckCircle as ActiveIcon, Block as InactiveIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import AdminLayout from "../../components/Admin-Layout/AdminLayout";
import {
  adminGetCoupons, adminGetCouponById, adminGetCouponStats,
  adminCreateCoupon, adminUpdateCoupon,
  adminDeleteCoupon, adminToggleCouponStatus,
} from "../../services/couponService";

const pad = (n) => n.toString().padStart(2, "0");

const fmtDT = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const toDatetimeLocal = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDisplayDate = (value) => {
  if (!value) return "—";
  const formatted = fmtDT(value);
  return formatted || value;
};

const emptyForm = () => ({
  code: "", name: "", description: "", discountType: "PERCENT", discountValue: "",
  minOrderValue: 0, maxDiscountAmount: 0, usageLimit: "",
  dateStart: toDatetimeLocal(new Date()),
  dateEnd: toDatetimeLocal(new Date(Date.now() + 7 * 86400000)),
  isActive: true,
});

const toCouponPayload = (data) => ({
  code: data.code?.trim(),
  name: data.name?.trim() || undefined,
  description: data.description?.trim() || undefined,
  discountType: data.discountType,
  discountValue: Number(data.discountValue),
  minOrderValue: Number(data.minOrderValue) || 0,
  maxDiscountAmount: Number(data.maxDiscountAmount) || 0,
  usageLimit: data.usageLimit === "" || data.usageLimit == null ? null : Number(data.usageLimit),
  dateStart: fmtDT(new Date(data.dateStart)),
  dateEnd: fmtDT(new Date(data.dateEnd)),
  isActive: data.isActive,
});

const validateForm = (data) => {
  if (!data.code?.trim()) return "Vui lòng nhập mã coupon";
  if (!data.discountValue || Number(data.discountValue) <= 0) return "Giá trị giảm phải lớn hơn 0";
  if (data.discountType === "PERCENT" && Number(data.discountValue) > 100) return "Giảm theo % không được vượt quá 100%";
  if (!data.dateStart || !data.dateEnd) return "Vui lòng chọn ngày bắt đầu và kết thúc";
  if (new Date(data.dateStart) >= new Date(data.dateEnd)) return "Ngày bắt đầu phải nhỏ hơn ngày kết thúc";
  if (data.usageLimit !== "" && data.usageLimit != null && Number(data.usageLimit) <= 0) {
    return "Giới hạn sử dụng phải lớn hơn 0";
  }
  return null;
};

const CouponManagementPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [stats, setStats] = useState({ total: 0, activeCount: 0, inactiveCount: 0, percentCount: 0 });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await adminGetCouponStats();
      setStats(data || { total: 0, activeCount: 0, inactiveCount: 0, percentCount: 0 });
    } catch {
      /* stats optional */
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetCoupons({
        page,
        size,
        keyword: searchQuery || undefined,
        isActive: isActiveFilter === "all" ? undefined : isActiveFilter === "true",
        sortBy,
        sortDir,
      });
      setCoupons(res.content || []);
      setTotalElements(res.totalElements || 0);
    } catch {
      toast.error("Lỗi khi tải danh sách mã giảm giá");
    } finally {
      setLoading(false);
    }
  }, [page, size, searchQuery, isActiveFilter, sortBy, sortDir]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const refreshAll = () => {
    fetchCoupons();
    fetchStats();
  };

  const handleSearch = () => {
    setPage(0);
    setSearchQuery(searchInput.trim());
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const loadCouponForm = async (id) => {
    const fresh = await adminGetCouponById(id);
    return {
      ...fresh,
      discountValue: fresh.discountValue ?? "",
      minOrderValue: fresh.minOrderValue ?? 0,
      maxDiscountAmount: fresh.maxDiscountAmount ?? 0,
      usageLimit: fresh.usageLimit ?? "",
      dateStart: toDatetimeLocal(fresh.dateStart),
      dateEnd: toDatetimeLocal(fresh.dateEnd),
    };
  };

  const handleOpenModal = async (mode, data = null) => {
    setModalMode(mode);
    if (mode === "edit" && data?.id) {
      try {
        setSaving(true);
        setFormData(await loadCouponForm(data.id));
      } catch {
        toast.error("Không tải được chi tiết mã giảm giá");
        return;
      } finally {
        setSaving(false);
      }
    } else {
      setFormData(emptyForm());
    }
    setModalOpen(true);
  };

  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      setDetailData(await adminGetCouponById(id));
    } catch {
      toast.error("Không tải được chi tiết mã giảm giá");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    let nextValue = type === "checkbox" ? checked : value;

    if (name === "code") nextValue = value.toUpperCase();
    if (["discountValue", "minOrderValue", "maxDiscountAmount", "usageLimit"].includes(name)) {
      nextValue = value === "" ? "" : value;
    }

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSave = async () => {
    const error = validateForm(formData);
    if (error) return toast.warning(error);

    try {
      setSaving(true);
      const payload = toCouponPayload(formData);
      if (modalMode === "add") {
        await adminCreateCoupon(payload);
        toast.success("Tạo mã giảm giá thành công");
      } else {
        await adminUpdateCoupon(formData.id, payload);
        toast.success("Cập nhật thành công");
      }
      setModalOpen(false);
      refreshAll();
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi khi lưu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon) => {
    if (coupon.usedCount > 0) {
      return toast.warning("Mã đã được sử dụng — hãy tắt mã thay vì xóa");
    }
    if (!window.confirm(`Bạn có chắc muốn xóa mã "${coupon.code}"?`)) return;

    try {
      await adminDeleteCoupon(coupon.id);
      toast.success("Đã xóa mã giảm giá");
      refreshAll();
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi khi xóa");
    }
  };

  const handleToggle = async (id) => {
    try {
      await adminToggleCouponStatus(id);
      toast.success("Đã thay đổi trạng thái");
      refreshAll();
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi khi thay đổi trạng thái");
    }
  };

  const statCards = [
    { label: "Tổng mã", value: stats.total, gradient: "linear-gradient(135deg,#667eea,#764ba2)", shadow: "rgba(102,126,234,.3)", Icon: CouponIcon },
    { label: "Đang kích hoạt", value: stats.activeCount, gradient: "linear-gradient(135deg,#11998e,#38ef7d)", shadow: "rgba(17,153,142,.3)", Icon: ActiveIcon },
    { label: "Đã tắt", value: stats.inactiveCount, gradient: "linear-gradient(135deg,#f093fb,#f5576c)", shadow: "rgba(245,87,108,.3)", Icon: InactiveIcon },
    { label: "Giảm theo %", value: stats.percentCount, gradient: "linear-gradient(135deg,#f59e0b,#d97706)", shadow: "rgba(245,158,11,.3)", Icon: PercentIcon },
  ];

  const renderDetailRow = (label, value) => (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, gap: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight="600" textAlign="right">{value ?? "—"}</Typography>
    </Box>
  );

  return (
    <AdminLayout currentPage="Marketing / Mã giảm giá">
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Quản Lý Mã Giảm Giá</Typography>
            <Typography variant="body1" color="text.secondary">Quản lý các chương trình khuyến mãi và mã ưu đãi</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal("add")}
            sx={{ bgcolor: "#ff9f1a", "&:hover": { bgcolor: "#e68a00" }, px: 3, py: 1.2, borderRadius: "10px", fontWeight: "bold", textTransform: "none", fontSize: "1rem", boxShadow: "0 4px 12px rgba(255,159,26,0.3)" }}>
            Tạo Mã Giảm Giá
          </Button>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 3, mb: 3 }}>
          {statCards.map(({ label, value, gradient, shadow, Icon }) => (
            <Card key={label} sx={{ borderRadius: "16px", background: gradient, color: "white", boxShadow: `0 8px 32px ${shadow}`, transition: "transform .2s", "&:hover": { transform: "translateY(-4px)" } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: .85, letterSpacing: 1 }}>{label}</Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {loading || statsLoading ? <CircularProgress size={36} color="inherit" /> : value}
                    </Typography>
                  </Box>
                  <Icon sx={{ fontSize: 56, opacity: .3 }} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Card sx={{ mb: 3, borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
              <TextField
                fullWidth
                placeholder="Tìm theo mã hoặc tên..."
                size="small"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#94a3b8" }} /></InputAdornment>,
                  sx: { borderRadius: 2, bgcolor: "white" },
                }}
              />
              <Button variant="outlined" onClick={handleSearch} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>Tìm kiếm</Button>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select value={isActiveFilter} onChange={(e) => { setIsActiveFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2, bgcolor: "white" }}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="true">Đang bật</MenuItem>
                  <MenuItem value="false">Đã tắt</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={{ borderRadius: 2, bgcolor: "white" }}>
                  <MenuItem value="createdAt">Ngày tạo</MenuItem>
                  <MenuItem value="code">Mã Code</MenuItem>
                  <MenuItem value="discountValue">Giá trị</MenuItem>
                  <MenuItem value="usedCount">Đã dùng</MenuItem>
                  <MenuItem value="dateEnd">Hết hạn</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <Select value={sortDir} onChange={(e) => setSortDir(e.target.value)} sx={{ borderRadius: 2, bgcolor: "white" }}>
                  <MenuItem value="desc">Giảm dần</MenuItem>
                  <MenuItem value="asc">Tăng dần</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,.06)", overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {["Mã / Tên", "Giá trị giảm", "Thời hạn", "Lượt sử dụng", "Trạng thái", "Thao tác"].map((h, i) => (
                    <TableCell key={h} align={i >= 4 ? "center" : "left"} sx={{ bgcolor: "#f8fafc", fontWeight: "bold", color: "#64748b", py: 2, ...(i === 0 && { px: 3 }), ...(i === 5 && { px: 3 }) }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10, border: 0 }}><CircularProgress color="warning" /><Typography sx={{ mt: 2, color: "#64748b", fontWeight: 600 }}>Đang tải...</Typography></TableCell></TableRow>
                ) : coupons.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10, border: 0 }}><CouponIcon sx={{ fontSize: 56, color: "#cbd5e0", mb: 1 }} /><Typography variant="h6" fontWeight="700" color="text.secondary">Chưa có mã giảm giá nào</Typography></TableCell></TableRow>
                ) : coupons.map((c, idx) => (
                  <TableRow key={c.id} hover sx={{ bgcolor: idx % 2 === 0 ? "white" : "#fafbfc", "&:hover": { bgcolor: "#f5f3ff" } }}>
                    <TableCell sx={{ py: 2, px: 3 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: "#fff3e0", color: "#ff9f1a", fontWeight: "bold", width: 36, height: 36, fontSize: ".9rem" }}>{c.code?.charAt(0)}</Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="800" color="#1e293b" sx={{ fontFamily: "monospace" }}>{c.code}</Typography>
                          <Typography variant="caption" color="text.secondary">{c.name || "Không có tên"}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Chip icon={c.discountType === "PERCENT" ? <PercentIcon sx={{ fontSize: ".9rem !important" }} /> : <MoneyIcon sx={{ fontSize: ".9rem !important" }} />}
                        label={`${c.discountValue}${c.discountType === "PERCENT" ? "%" : " đ"}`} size="small"
                        sx={{ fontWeight: "bold", bgcolor: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }} />
                      {c.minOrderValue > 0 && <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: .5 }}>Tối thiểu: {Number(c.minOrderValue).toLocaleString("vi-VN")} đ</Typography>}
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Stack spacing={.3}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: .8 }}><TimeIcon sx={{ fontSize: 13, color: "#16a34a" }} /><Typography variant="caption" fontWeight="600">Bắt đầu: {formatDisplayDate(c.dateStart)}</Typography></Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: .8 }}><TimeIcon sx={{ fontSize: 13, color: "#dc2626" }} /><Typography variant="caption" fontWeight="600">Kết thúc: {formatDisplayDate(c.dateEnd)}</Typography></Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body2" fontWeight="800">{c.usedCount ?? 0} / {c.usageLimit || "∞"}</Typography>
                      {c.usageLimit > 0 && (
                        <Box sx={{ width: "100%", height: 5, bgcolor: "#f1f5f9", borderRadius: 3, overflow: "hidden", mt: .5 }}>
                          <Box sx={{ width: `${Math.min(((c.usedCount ?? 0) / c.usageLimit) * 100, 100)}%`, height: "100%", bgcolor: "#ff9f1a", borderRadius: 3 }} />
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Chip label={c.isActive ? "Đang bật" : "Đã tắt"} size="small" onClick={() => handleToggle(c.id)}
                        sx={{ cursor: "pointer", fontWeight: "700", bgcolor: c.isActive ? "#f0fdf4" : "#fef2f2", color: c.isActive ? "#16a34a" : "#dc2626", border: `1px solid ${c.isActive ? "#bbf7d0" : "#fecaca"}`, "&:hover": { opacity: .8 } }} />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2, px: 3 }}>
                      <Stack direction="row" spacing={.5} justifyContent="center">
                        <Tooltip title="Xem chi tiết"><IconButton size="small" color="primary" onClick={() => handleViewDetail(c.id)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Chỉnh sửa"><IconButton size="small" onClick={() => handleOpenModal("edit", c)} color="warning"><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title={c.usedCount > 0 ? "Mã đã dùng — không thể xóa" : "Xóa"}>
                          <span>
                            <IconButton size="small" color="error" disabled={c.usedCount > 0} onClick={() => handleDelete(c)}><DeleteIcon fontSize="small" /></IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={totalElements} rowsPerPage={size} page={page}
            onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Số dòng:" sx={{ borderTop: "1px solid #f1f5f9" }} />
        </Card>
      </Box>

      {/* CREATE / EDIT MODAL */}
      <Dialog open={modalOpen} onClose={() => !saving && setModalOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 4, boxShadow: "0 25px 50px -12px rgba(0,0,0,.2)" } }}>
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.25rem", pb: .5 }}>
          {modalMode === "add" ? "Tạo Mã Giảm Giá Mới" : "Chỉnh Sửa Mã Giảm Giá"}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
            <Box>
              <TextField fullWidth required label="Mã Coupon" name="code" value={formData.code} onChange={handleChange}
                placeholder="VD: SUMMER2024" disabled={modalMode === "edit"} helperText={modalMode === "edit" ? "Mã coupon không thể thay đổi sau khi tạo" : ""}
                sx={{ mb: 2.5 }} InputProps={{ sx: { borderRadius: 2, fontFamily: "monospace" } }} />
              <TextField fullWidth label="Tên hiển thị" name="name" value={formData.name || ""} onChange={handleChange} placeholder="VD: Sale Hè 20%" sx={{ mb: 2.5 }} />
              <TextField fullWidth label="Mô tả / Điều kiện" name="description" multiline rows={3} value={formData.description || ""} onChange={handleChange} sx={{ mb: 2.5 }} />
              <FormControl fullWidth sx={{ mb: 2.5 }}>
                <Select name="discountType" value={formData.discountType} onChange={handleChange} sx={{ borderRadius: 2 }}>
                  <MenuItem value="PERCENT">Giảm theo % (Phần trăm)</MenuItem>
                  <MenuItem value="FIXED">Giảm cố định (VNĐ)</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <TextField fullWidth required label="Giá trị giảm" name="discountValue" type="number" inputProps={{ min: 0, max: formData.discountType === "PERCENT" ? 100 : undefined }}
                value={formData.discountValue} onChange={handleChange} sx={{ mb: 2.5 }}
                InputProps={{ endAdornment: <InputAdornment position="end">{formData.discountType === "PERCENT" ? "%" : "đ"}</InputAdornment>, sx: { borderRadius: 2 } }} />
              <TextField fullWidth label="Đơn hàng tối thiểu" name="minOrderValue" type="number" inputProps={{ min: 0 }}
                value={formData.minOrderValue} onChange={handleChange} sx={{ mb: 2.5 }}
                InputProps={{ endAdornment: <InputAdornment position="end">đ</InputAdornment>, sx: { borderRadius: 2 } }} />
              {formData.discountType === "PERCENT" && (
                <TextField fullWidth label="Giảm tối đa (đ)" name="maxDiscountAmount" type="number" inputProps={{ min: 0 }}
                  value={formData.maxDiscountAmount} onChange={handleChange} sx={{ mb: 2.5 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">đ</InputAdornment>, sx: { borderRadius: 2 } }} />
              )}
              <TextField fullWidth label="Giới hạn sử dụng" name="usageLimit" type="number" inputProps={{ min: 1 }}
                value={formData.usageLimit} onChange={handleChange} helperText="Bỏ trống = không giới hạn" sx={{ mb: 2.5 }} />
              <Box sx={{ display: "flex", gap: 2, mb: 2.5 }}>
                <TextField fullWidth required label="Ngày bắt đầu" name="dateStart" type="datetime-local"
                  value={formData.dateStart} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                <TextField fullWidth required label="Ngày kết thúc" name="dateEnd" type="datetime-local"
                  value={formData.dateEnd} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Box>
              <FormControlLabel control={<Switch checked={!!formData.isActive} onChange={handleChange} name="isActive" color="success" />}
                label={<Typography fontWeight="bold" color={formData.isActive ? "#16a34a" : "#64748b"}>{formData.isActive ? "Kích hoạt ngay" : "Lưu bản nháp (tắt)"}</Typography>} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5, gap: 1 }}>
          <Button onClick={() => setModalOpen(false)} disabled={saving} sx={{ fontWeight: "600", textTransform: "none", color: "#64748b" }}>Huỷ bỏ</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ borderRadius: 2, bgcolor: "#ff9f1a", fontWeight: "bold", px: 3, textTransform: "none", "&:hover": { bgcolor: "#e68a00" }, boxShadow: "0 4px 12px rgba(255,159,26,.3)" }}>
            {saving ? "Đang lưu..." : modalMode === "add" ? "Tạo mã giảm giá" : "Lưu thay đổi"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DETAIL MODAL */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: "bold" }}>Chi tiết mã giảm giá</DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress color="warning" /></Box>
          ) : detailData ? (
            <Box>
              <Typography variant="h6" fontFamily="monospace" fontWeight="800" gutterBottom>{detailData.code}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{detailData.name || "Không có tên hiển thị"}</Typography>
              <Divider sx={{ mb: 1 }} />
              {renderDetailRow("Loại giảm", detailData.discountType === "PERCENT" ? "Phần trăm (%)" : "Cố định (VNĐ)")}
              {renderDetailRow("Giá trị", `${detailData.discountValue}${detailData.discountType === "PERCENT" ? "%" : " đ"}`)}
              {renderDetailRow("Đơn tối thiểu", detailData.minOrderValue ? `${Number(detailData.minOrderValue).toLocaleString("vi-VN")} đ` : "Không")}
              {renderDetailRow("Giảm tối đa", detailData.maxDiscountAmount ? `${Number(detailData.maxDiscountAmount).toLocaleString("vi-VN")} đ` : "Không")}
              {renderDetailRow("Đã sử dụng", `${detailData.usedCount ?? 0} / ${detailData.usageLimit || "∞"}`)}
              {renderDetailRow("Bắt đầu", formatDisplayDate(detailData.dateStart))}
              {renderDetailRow("Kết thúc", formatDisplayDate(detailData.dateEnd))}
              {renderDetailRow("Trạng thái", detailData.isActive ? "Đang bật" : "Đã tắt")}
              {renderDetailRow("Ngày tạo", formatDisplayDate(detailData.createdAt))}
              {renderDetailRow("Cập nhật lần cuối", formatDisplayDate(detailData.updatedAt))}
              {detailData.description && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>Mô tả</Typography>
                  <Typography variant="body2">{detailData.description}</Typography>
                </>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)} sx={{ textTransform: "none" }}>Đóng</Button>
          {detailData && (
            <Button variant="contained" onClick={() => { setDetailOpen(false); handleOpenModal("edit", detailData); }}
              sx={{ bgcolor: "#ff9f1a", textTransform: "none", "&:hover": { bgcolor: "#e68a00" } }}>
              Chỉnh sửa
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default CouponManagementPage;
