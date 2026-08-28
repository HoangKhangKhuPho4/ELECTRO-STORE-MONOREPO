import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Button,
    Menu,
    MenuItem,
    CircularProgress,
    Fade,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    IconButton,
    Tooltip as MuiTooltip,
    Snackbar,
    Alert,
    TablePagination,
} from "@mui/material";
import {
    TrendingUp,
    TrendingDown,
    CalendarToday,
    AttachMoney,
    Receipt,
    Group,
    ShoppingCart,
    Visibility,
    Warning,
    ErrorOutline,
    Payments,
    Inventory,
} from "@mui/icons-material";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from "recharts";
import CountUp from "react-countup";
import {
    getOverviewStats,
    getRevenueChart,
    getOrderStatusStats,
    getTopProductStats,
    getRecentOrdersStats,
    getPaymentMethodStats,
    getConversionRates,
    getCustomerSegments,
    getActionKpis,
    getCategoryRevenueChart,
} from "../../services/statisticsService";
import StatCard from "./StatCard";
import RevenueChart from "./RevenueChart";
import OrderStatusChart from "./OrderStatusChart";
import TopProductsCard from "./TopProductsCard";
import PaymentMethodsBar from "./PaymentMethodsBar";
import ConversionRateTable from "./ConversionRateTable";
import CustomerSegmentsChart from "./CustomerSegmentsChart";
import ActionKpiCards from "./ActionKpiCards";
import CategoryRevenueChart from "./CategoryRevenueChart";
import DashboardWidgetFilter, {
    buildDefaultWidgetState,
    loadWidgetState,
} from "./DashboardWidgetFilter";
import {
    DASHBOARD_CARD_CONTENT,
    DASHBOARD_SECTION_GAP,
    DASHBOARD_TABLE_CELL,
    DASHBOARD_TABLE_CELL_STRONG,
    DASHBOARD_TABLE_HEAD,
} from "./dashboardStyles";
import { PLACEHOLDER_IMG } from "../../services/masterService";

const resolveImageSrc = (url) => {
    if (!url) return PLACEHOLDER_IMG;
    if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("/")) return url;
    return `/${url}`;
};

/**
 * Premium Statistics Dashboard Component
 * Integrates all statistics APIs and visualizes data using Recharts and MUI.
 */
const StatisticsDashboard = ({ isAdmin = true, isSales = true }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [overview, setOverview] = useState(null);
    const [revenueData, setRevenueData] = useState(null);
    const [orderStatusData, setOrderStatusData] = useState(null);
    const [bestSellingData, setBestSellingData] = useState(null);
    const [lowStockData, setLowStockData] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [paymentStats, setPaymentStats] = useState(null);
    const [conversionRateData, setConversionRateData] = useState(null);
    const [customerSegmentsData, setCustomerSegmentsData] = useState(null);
    const [actionKpis, setActionKpis] = useState(null);
    const [categoryRevenueData, setCategoryRevenueData] = useState(null);

    const [period, setPeriod] = useState("month");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [appliedCustomRange, setAppliedCustomRange] = useState({ start: "", end: "" });
    const [anchorEl, setAnchorEl] = useState(null);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [visibleWidgets, setVisibleWidgets] = useState(loadWidgetState);

    const toggleWidget = (widgetId) => {
        setVisibleWidgets((prev) => {
            const next = { ...prev, [widgetId]: !prev[widgetId] };
            localStorage.setItem("dashboardWidgets", JSON.stringify(next));
            return next;
        });
    };

    const resetWidgets = () => {
        const next = buildDefaultWidgetState();
        setVisibleWidgets(next);
        localStorage.setItem("dashboardWidgets", JSON.stringify(next));
    };

    const show = (id) => visibleWidgets[id] !== false;
    const formatCurrency = (val) =>
        val?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || "0 ₫";

    const safeStat = (fn) =>
        fn().catch((err) => {
            console.warn("Dashboard partial API failure:", err?.response?.status, err?.config?.url);
            return null;
        });

    const resolveChartDateRange = () => {
        if (period === "custom" && appliedCustomRange.start && appliedCustomRange.end) {
            return { startDate: appliedCustomRange.start, endDate: appliedCustomRange.end };
        }
        const end = new Date();
        const start = new Date();
        if (period === "day") {
            start.setDate(end.getDate() - 30);
        } else if (period === "year") {
            start.setFullYear(end.getFullYear() - 5);
        } else {
            start.setMonth(end.getMonth() - 12);
        }
        return {
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10),
        };
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        const chartPeriod = period === "custom" ? "custom" : period;
        const { startDate, endDate } = resolveChartDateRange();
        const revenueStart = period === "custom" ? appliedCustomRange.start : undefined;
        const revenueEnd = period === "custom" ? appliedCustomRange.end : undefined;

        try {
            const tasks = [
                safeStat(() => getOrderStatusStats()),
                safeStat(() => getTopProductStats("best-selling", 50)),
                safeStat(() => getRecentOrdersStats(50)),
                safeStat(() => getActionKpis()),
                isAdmin || isSales ? safeStat(() => getOverviewStats()) : Promise.resolve(null),
                isAdmin ? safeStat(() => getRevenueChart(chartPeriod, revenueStart, revenueEnd)) : Promise.resolve(null),
                isAdmin ? safeStat(() => getCategoryRevenueChart(startDate, endDate)) : Promise.resolve(null),
                isAdmin ? safeStat(() => getPaymentMethodStats()) : Promise.resolve(null),
                isAdmin ? safeStat(() => getConversionRates()) : Promise.resolve(null),
                isAdmin ? safeStat(() => getCustomerSegments()) : Promise.resolve(null),
                safeStat(() => getTopProductStats("low-stock", 50)),
            ];

            const results = await Promise.all(tasks);
            const [
                statusRes,
                bestSellingRes,
                recentOrdersRes,
                actionKpisRes,
                overviewRes,
                revenueRes,
                categoryRes,
                paymentRes,
                convRes,
                segRes,
                lowStockRes,
            ] = results;

            setOrderStatusData(statusRes);
            setBestSellingData(bestSellingRes);
            setRecentOrders(recentOrdersRes?.recentOrders || []);
            setActionKpis(actionKpisRes);
            setOverview(overviewRes);
            setRevenueData(revenueRes);
            setCategoryRevenueData(categoryRes);
            setPaymentStats(paymentRes);
            setConversionRateData(convRes);
            setCustomerSegmentsData(segRes);
            setLowStockData(lowStockRes);

            const coreMissing = !statusRes && !overviewRes && !revenueRes;
            if (coreMissing) {
                setError("Không tải được số liệu. Kiểm tra statistics-service (8088), order-service (8086) và MySQL.");
                setToastMessage("Một số API thống kê lỗi — xem Console (F12) để biết endpoint cụ thể.");
                setToastOpen(true);
            }
        } catch (err) {
            console.error("Dashboard data fetch error:", err);
            const status = err.response?.status;
            if (status === 401) {
                window.location.href = "/login";
            } else if (status === 403) {
                setToastMessage("Bạn không có quyền xem báo cáo tài chính");
                setToastOpen(true);
                setError("Không có quyền truy cập");
            } else {
                setError("Hệ thống đang bảo trì số liệu");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period, appliedCustomRange, isAdmin, isSales]);

    const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
    const handleCloseMenu = () => setAnchorEl(null);
    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        handleCloseMenu();
    };

    const handleApplyCustomRange = () => {
        if (customStart && customEnd) {
            setAppliedCustomRange({ start: customStart, end: customEnd });
            setPeriod("custom");
        }
    };

    const periodLabel = {
        day: "7 ngày qua",
        month: "30 ngày qua",
        year: "12 tháng qua",
        custom: appliedCustomRange.start && appliedCustomRange.end
            ? `${appliedCustomRange.start} → ${appliedCustomRange.end}`
            : "Tùy chỉnh",
    }[period];

    if (error) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "400px",
                    textAlign: "center",
                    gap: 2,
                }}
            >
                <ErrorOutline sx={{ fontSize: 64, color: "error.main", opacity: 0.5 }} />
                <Typography variant="h5" fontWeight={700} color="text.secondary">
                    {error}
                </Typography>
                <Button
                    variant="outlined"
                    onClick={fetchData}
                    sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700 }}
                >
                    Thử lại
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header with Period Selector */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                    flexWrap: "wrap",
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Báo cáo Thống kê
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Dữ liệu kinh doanh thời gian thực
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <DashboardWidgetFilter
                        visibleWidgets={visibleWidgets}
                        onToggle={toggleWidget}
                        onReset={resetWidgets}
                    />
                    {isAdmin && (
                        <Button
                            variant="outlined"
                            size="small"
                            href="/admin/finance"
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                        >
                            Sổ cái →
                        </Button>
                    )}
                    <Button
                        startIcon={<CalendarToday />}
                        onClick={handleOpenMenu}
                        sx={{
                            bgcolor: "white",
                            color: "#1e293b",
                            borderRadius: 2,
                            px: 3,
                            py: 1.2,
                            fontWeight: 700,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            border: "1px solid rgba(0,0,0,0.08)",
                            textTransform: "none",
                            "&:hover": { bgcolor: "#f8fafc" },
                        }}
                    >
                        {periodLabel}
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleCloseMenu}
                        PaperProps={{
                            sx: { borderRadius: 3, mt: 1, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" },
                        }}
                    >
                        <MenuItem onClick={() => handlePeriodChange("day")}>7 ngày qua</MenuItem>
                        <MenuItem onClick={() => handlePeriodChange("month")}>30 ngày qua</MenuItem>
                        <MenuItem onClick={() => handlePeriodChange("year")}>12 tháng qua</MenuItem>
                        <MenuItem onClick={() => { setPeriod("custom"); handleCloseMenu(); }}>Tùy chỉnh ngày</MenuItem>
                    </Menu>
                    {period === "custom" && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontFamily: "inherit" }}
                            />
                            <Typography color="text.secondary">→</Typography>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontFamily: "inherit" }}
                            />
                            <Button
                                variant="contained"
                                size="small"
                                disabled={!customStart || !customEnd}
                                onClick={handleApplyCustomRange}
                                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                            >
                                Lọc
                            </Button>
                        </Box>
                    )}
                </Box>
            </Box>

            {show("actionKpis") && (
            <Box sx={{ mb: DASHBOARD_SECTION_GAP }}>
                <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 1.5 }}>
                    Cần xử lý
                </Typography>
                <ActionKpiCards data={actionKpis} loading={loading} />
            </Box>
            )}

            {show("kpiCards") && (
            <Box sx={{ 
                display: "grid", 
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                gap: 2.5, 
                mb: DASHBOARD_SECTION_GAP 
            }}>
                <StatCard
                    title="Tổng doanh thu"
                    value={overview?.totalRevenue || 0}
                    growth={overview?.revenueGrowthPercent || 0}
                    unit="VND"
                    icon={AttachMoney}
                    color="#3b82f6"
                    gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                    loading={loading}
                />
                <StatCard
                    title="Tổng đơn hàng"
                    value={overview?.totalOrders || 0}
                    growth={overview?.orderGrowthPercent || 0}
                    icon={Receipt}
                    color="#8b5cf6"
                    gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                    loading={loading}
                />
                <StatCard
                    title="Tổng khách hàng"
                    value={overview?.totalCustomers || 0}
                    growth={overview?.customerGrowthPercent || 0}
                    icon={Group}
                    color="#ec4899"
                    gradient="linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
                    loading={loading}
                />
                <StatCard
                    title="Đơn đang chờ"
                    value={overview?.pendingOrders || 0}
                    growth={0}
                    icon={ShoppingCart}
                    color="#f59e0b"
                    gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    loading={loading}
                />
            </Box>
            )}

            {show("mainCharts") && (
            <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 2.5, mb: DASHBOARD_SECTION_GAP, alignItems: "stretch" }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <RevenueChart data={revenueData} loading={loading} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <OrderStatusChart data={orderStatusData} loading={loading} />
                </Box>
            </Box>
            )}

            {show("insights") && (
            <Box sx={{ display: "flex", gap: 2.5, mb: DASHBOARD_SECTION_GAP, alignItems: "stretch", flexWrap: "wrap" }}>
                <Box sx={{ flex: { xs: "1 1 100%", lg: "1" }, minWidth: 0 }}>
                    <TopProductsCard data={bestSellingData} loading={loading} />
                </Box>
                {isAdmin && (
                    <Box sx={{ flex: { xs: "1 1 100%", lg: "1" }, minWidth: 0 }}>
                        <CategoryRevenueChart data={categoryRevenueData} loading={loading} />
                    </Box>
                )}
                <Box sx={{ flex: { xs: "1 1 100%", lg: "1" }, minWidth: 0 }}>
                    <PaymentMethodsBar data={paymentStats} loading={loading} />
                </Box>
            </Box>
            )}

            {isAdmin && show("behavior") && (
            <Box sx={{ display: "flex", flexWrap: { xs: "wrap", md: "nowrap" }, gap: 2.5, mb: DASHBOARD_SECTION_GAP, alignItems: "stretch" }}>
                    <Box sx={{ flex: { xs: "1 1 100%", md: "2" }, minWidth: 0 }}>
                        <ConversionRateTable data={conversionRateData} loading={loading} />
                    </Box>
                    <Box sx={{ flex: { xs: "1 1 100%", md: "1" }, minWidth: 0 }}>
                        <CustomerSegmentsChart data={customerSegmentsData} loading={loading} />
                    </Box>
                </Box>
            )}

            {show("tables") && (
            <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 2.5, alignItems: "stretch" }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <RecentOrdersTable orders={recentOrders} loading={loading} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <LowStockAlerts data={lowStockData} loading={loading} />
                </Box>
            </Box>
            )}

            {/* Error Toast */}
            <Snackbar
                open={toastOpen}
                autoHideDuration={4000}
                onClose={() => setToastOpen(false)}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert
                    onClose={() => setToastOpen(false)}
                    severity="error"
                    sx={{ width: "100%", borderRadius: 2, fontWeight: 700 }}
                >
                    {toastMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

// --- Sub-components for better organization ---

const RecentOrdersTable = ({ orders, loading }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedOrders = (orders || []).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const formatCurrency = (val) =>
        val?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || "0 ₫";

    const getStatusChip = (status) => {
        const map = {
            DELIVERED: { label: "Đã giao", color: "success" },
            CANCELLED: { label: "Đã hủy", color: "error" },
            PENDING: { label: "Chờ xử lý", color: "warning" },
            SHIPPING: { label: "Đang giao", color: "info" },
            PROCESSING: { label: "Đang xử lý", color: "secondary" },
        };
        const config = map[status] || { label: status, color: "default" };
        return (
            <Chip
                label={config.label}
                color={config.color}
                size="small"
                sx={{ fontWeight: 800, borderRadius: 2, fontSize: "0.8125rem", height: 26 }}
            />
        );
    };

    return (
        <Card
            sx={{
                borderRadius: 5,
                boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
                height: "100%", // Đảm bảo chiều cao bằng card bên cạnh
                display: "flex",
                flexDirection: "column"
            }}
        >
            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", ...DASHBOARD_CARD_CONTENT }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h6" fontWeight={900} color="text.primary">
                        Đơn hàng gần đây
                    </Typography>
                    <Button
                        size="small"
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                        startIcon={<Visibility />}
                    >
                        Tất cả
                    </Button>
                </Box>

                <TableContainer sx={{ minHeight: 360, overflowY: "auto", flexGrow: 1 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={DASHBOARD_TABLE_HEAD}>Mã đơn</TableCell>
                                <TableCell sx={DASHBOARD_TABLE_HEAD}>Khách hàng</TableCell>
                                <TableCell sx={DASHBOARD_TABLE_HEAD}>Tổng tiền</TableCell>
                                <TableCell sx={DASHBOARD_TABLE_HEAD}>Trạng thái</TableCell>
                                <TableCell sx={DASHBOARD_TABLE_HEAD}>Ngày đặt</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading
                                ? Array.from(new Array(5)).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5} sx={{ py: 2.5 }} align="center">
                                            <CircularProgress size={20} />
                                        </TableCell>
                                    </TableRow>
                                ))
                                : paginatedOrders.map((order, index) => (
                                    <TableRow key={order.orderId ? `${order.orderId}-${index}` : index} hover>
                                        <TableCell sx={{ ...DASHBOARD_TABLE_CELL, ...DASHBOARD_TABLE_CELL_STRONG }}>
                                            #{order.orderCode}
                                        </TableCell>
                                        <TableCell sx={DASHBOARD_TABLE_CELL}>
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.5 }}>
                                                {order.customerName}
                                            </Typography>
                                            <Typography sx={{ fontSize: "0.8125rem", color: "#475569", lineHeight: 1.5, mt: 0.25 }}>
                                                {order.customerEmail}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ ...DASHBOARD_TABLE_CELL, fontWeight: 800, color: "primary.main" }}>
                                            {formatCurrency(order.totalAmount)}
                                        </TableCell>
                                        <TableCell sx={DASHBOARD_TABLE_CELL}>{getStatusChip(order.status)}</TableCell>
                                        <TableCell sx={{ ...DASHBOARD_TABLE_CELL, color: "#475569" }}>
                                            {new Date(order.orderDate).toLocaleDateString("vi-VN")}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {!loading && orders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary" fontWeight={600}>
                                            Chưa có dữ liệu cho giai đoạn này
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {orders.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        sx={{ mt: "auto", borderTop: "1px solid rgba(0,0,0,0.05)", "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.875rem" } }}
                        count={orders.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Số dòng:"
                        labelDisplayedRows={({ from, to, count }) => `${from} - ${to} trong ${count}`}
                    />
                )}
            </CardContent>
        </Card>
    );
};

const LowStockAlerts = ({ data, loading }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const products = data?.products || [];
    const paginatedProducts = products.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Card
            sx={{
                borderRadius: 5,
                boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
                height: "100%",
                display: "flex",
                flexDirection: "column"
            }}
        >
            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", ...DASHBOARD_CARD_CONTENT }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <Inventory sx={{ color: "warning.main" }} />
                    <Typography variant="h6" fontWeight={900} color="text.primary">
                        Cảnh báo tồn kho
                    </Typography>
                </Box>

                <Box sx={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: 1.25, 
                    minHeight: 360, 
                    flexGrow: 1,
                    overflowY: "auto", 
                    pr: 1,
                    "&::-webkit-scrollbar": { width: "5px" },
                    "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(0,0,0,0.1)", borderRadius: "10px" }
                }}>
                    {loading ? (
                        <CircularProgress sx={{ alignSelf: "center", my: 4 }} />
                    ) : products.length > 0 ? (
                        paginatedProducts.map((product, index) => (
                            <Box
                                key={`${product.productId}-${product.variantName}-${index}`}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    p: 1.75,
                                    borderRadius: 3,
                                    bgcolor:
                                        product.status === "CRITICAL"
                                            ? "rgba(239, 68, 68, 0.1)"
                                            : product.status === "OUT_OF_STOCK"
                                                ? "rgba(100, 116, 139, 0.1)"
                                                : "rgba(245, 158, 11, 0.1)",
                                    border: "1px solid rgba(0,0,0,0.03)",
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <Avatar
                                        src={resolveImageSrc(product.imageUrl)}
                                        variant="rounded"
                                        imgProps={{
                                            onError: (e) => {
                                                e.currentTarget.src = PLACEHOLDER_IMG;
                                            },
                                        }}
                                        sx={{ width: 40, height: 40, bgcolor: "white" }}
                                    />
                                    <Box>
                                        <Typography
                                            sx={{
                                                fontSize: "0.875rem",
                                                fontWeight: 800,
                                                color: "#0f172a",
                                                lineHeight: 1.55,
                                                maxWidth: 180,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {product.productName}
                                        </Typography>
                                        <Typography sx={{ fontSize: "0.8125rem", color: "#475569", lineHeight: 1.5 }}>
                                            {product.variantName}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ textAlign: "right" }}>
                                    <Typography
                                        sx={{
                                            fontSize: "0.875rem",
                                            fontWeight: 900,
                                            lineHeight: 1.5,
                                            color:
                                                product.status === "CRITICAL"
                                                    ? "error.main"
                                                    : product.status === "OUT_OF_STOCK"
                                                        ? "text.disabled"
                                                        : "warning.main",
                                        }}
                                    >
                                        Tồn: {product.currentStock}
                                    </Typography>
                                    <Chip
                                        label={
                                            product.status === "CRITICAL"
                                                ? "Sắp hết"
                                                : product.status === "OUT_OF_STOCK"
                                                    ? "Hết hàng"
                                                    : "Cảnh báo"
                                        }
                                        size="small"
                                        sx={{
                                            height: 22,
                                            fontSize: "0.75rem",
                                            fontWeight: 800,
                                        }}
                                    />
                                </Box>
                            </Box>
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                            Không có sản phẩm nào cần chú ý
                        </Typography>
                    )}
                </Box>
                {products.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        sx={{ mt: "auto", borderTop: "1px solid rgba(0,0,0,0.05)", pt: 1, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.875rem" } }}
                        count={products.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Số dòng:"
                        labelDisplayedRows={({ from, to, count }) => `${from} - ${to} trong ${count}`}
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default StatisticsDashboard;
