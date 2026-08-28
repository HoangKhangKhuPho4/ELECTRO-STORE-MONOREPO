import { Box, Card, CardContent, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, CircularProgress, TablePagination } from "@mui/material";
import { useState } from "react";
import {
    DASHBOARD_CARD_CONTENT,
    DASHBOARD_TABLE_CELL,
    DASHBOARD_TABLE_CELL_STRONG,
    DASHBOARD_TABLE_HEAD,
} from "./dashboardStyles";

const ConversionRateTable = ({ data = [], loading }) => {
    if (loading) {
        return (
            <Card sx={{ borderRadius: 6, boxShadow: "0 10px 50px rgba(0,0,0,0.05)", border: "1px solid rgba(255,255,255,0.2)", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <CircularProgress color="primary" />
                    <Typography color="text.secondary">Đang tải biểu đồ...</Typography>
                </CardContent>
            </Card>
        );
    }

    // Backend payload has: "productRates" array.
    const productRates = data?.productRates || data || [];

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedRates = productRates.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Card
            sx={{
                borderRadius: 6,
                boxShadow: "0 10px 50px rgba(0,0,0,0.06)",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
                display: "flex",
                flexDirection: "column",
                height: "100%"
            }}
        >
            <CardContent sx={{ ...DASHBOARD_CARD_CONTENT, display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <Typography variant="h6" fontWeight={900} color="text.primary" sx={{ mb: 0.5, letterSpacing: -0.3 }}>
                    Tỉ lệ Chuyển đổi
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 2, lineHeight: 1.6 }}>
                    Theo dõi phễu tương tác (Lượt xem → Lượt mua)
                </Typography>

                <TableContainer sx={{ flexGrow: 1, minHeight: 380, overflowY: "auto", "&::-webkit-scrollbar": { width: "6px" }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(0,0,0,0.1)", borderRadius: "10px" } }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={DASHBOARD_TABLE_HEAD}>Sản phẩm</TableCell>
                                <TableCell align="right" sx={DASHBOARD_TABLE_HEAD}>Lượt xem</TableCell>
                                <TableCell align="right" sx={DASHBOARD_TABLE_HEAD}>Lượt mua</TableCell>
                                <TableCell align="left" sx={{ ...DASHBOARD_TABLE_HEAD, width: "32%" }}>Tỉ lệ CV Rate</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {productRates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={DASHBOARD_TABLE_CELL}>
                                        <Typography sx={{ py: 4, fontSize: "0.875rem", color: "#475569", fontWeight: 600 }}>
                                            Chưa có dữ liệu theo dõi hành vi trong kỳ này.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedRates.map((row, index) => (
                                    <TableRow key={index} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                                        <TableCell sx={{ ...DASHBOARD_TABLE_CELL, ...DASHBOARD_TABLE_CELL_STRONG, maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {row.productName}
                                        </TableCell>
                                        <TableCell align="right" sx={{ ...DASHBOARD_TABLE_CELL, fontWeight: 800, color: "#0f172a" }}>{row.viewCount}</TableCell>
                                        <TableCell align="right" sx={{ ...DASHBOARD_TABLE_CELL, fontWeight: 800, color: "#059669" }}>{row.purchaseCount}</TableCell>
                                        <TableCell align="left" sx={DASHBOARD_TABLE_CELL}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Box sx={{ width: "100%" }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={Math.min(row.conversionRate, 100)}
                                                        sx={{
                                                            height: 10,
                                                            borderRadius: 5,
                                                            bgcolor: "rgba(0,0,0,0.06)",
                                                            "& .MuiLinearProgress-bar": {
                                                                borderRadius: 5,
                                                                background: `linear-gradient(90deg, #3b82f6 ${Math.max(0, row.conversionRate - 10)}%, #10b981 100%)`
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                                <Typography sx={{ minWidth: 44, fontSize: "0.875rem", fontWeight: 900, color: "#0f172a" }}>
                                                    {row.conversionRate?.toFixed(1)}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {productRates.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        sx={{ mt: "auto", borderTop: "1px solid rgba(0,0,0,0.05)" }}
                        count={productRates.length}
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

export default ConversionRateTable;
