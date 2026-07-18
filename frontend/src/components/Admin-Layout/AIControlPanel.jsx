import { useState, useEffect, useCallback } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Typography,
} from "@mui/material";
import RecommendOutlinedIcon from "@mui/icons-material/RecommendOutlined";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StorageIcon from "@mui/icons-material/Storage";
import GroupIcon from "@mui/icons-material/Group";
import InventoryIcon from "@mui/icons-material/Inventory";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import axios from "axios";
import { usePermissions } from "../../hooks/usePermissions";
import { AI_SERVICE_URL } from "../../config/api";

const AIControlPanel = () => {
    const [modelStatus, setModelStatus] = useState(null);
    const [isRetraining, setIsRetraining] = useState(false);
    const [retrainMessage, setRetrainMessage] = useState("");
    const [retrainSuccess, setRetrainSuccess] = useState(null);

    const { hasPermission } = usePermissions();
    const canManageAI = hasPermission("ROLE_PERM_EDIT");

    const fetchModelStatus = useCallback(async () => {
        if (!canManageAI) return;
        try {
            const res = await axios.get(`${AI_SERVICE_URL}/api/model-status`);
            setModelStatus(res.data);
        } catch {
            setModelStatus(null);
        }
    }, [canManageAI]);

    useEffect(() => {
        if (!canManageAI) return undefined;
        fetchModelStatus();
        const interval = setInterval(fetchModelStatus, 30000);
        return () => clearInterval(interval);
    }, [fetchModelStatus, canManageAI]);

    const handleRetrain = async () => {
        setIsRetraining(true);
        setRetrainMessage("");
        setRetrainSuccess(null);
        try {
            const res = await axios.post(`${AI_SERVICE_URL}/api/retrain`);
            setRetrainMessage(res.data.message);
            setRetrainSuccess(true);
            setTimeout(fetchModelStatus, 3000);
        } catch (err) {
            const msg = err.response?.data?.message || "Lỗi kết nối đến dịch vụ gợi ý!";
            setRetrainMessage(msg);
            setRetrainSuccess(false);
        } finally {
            setIsRetraining(false);
        }
    };

    const isTraining = modelStatus?.is_training || isRetraining;

    return (
        <Card
            sx={{
                borderRadius: 2,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                mb: 3,
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: { xs: "flex-start", md: "center" },
                        flexDirection: { xs: "column", md: "row" },
                        gap: 3,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                        <Box
                            sx={{
                                p: 1.5,
                                borderRadius: 2,
                                background: "#fff7ed",
                                border: "1px solid #fed7aa",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <RecommendOutlinedIcon sx={{ fontSize: 32, color: "#f28900" }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700} sx={{ color: "#111827", lineHeight: 1.2 }}>
                                Hệ thống gợi ý sản phẩm
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.3 }}>
                                Collaborative Filtering — cập nhật dữ liệu mua hàng & đánh giá
                            </Typography>
                        </Box>
                    </Box>

                    {modelStatus?.model_loaded && (
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                <GroupIcon sx={{ fontSize: 18, color: "#f28900" }} />
                                <Typography variant="body2" sx={{ color: "#4b5563" }}>
                                    <strong style={{ color: "#111827" }}>{modelStatus.total_users}</strong> người dùng
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                <InventoryIcon sx={{ fontSize: 18, color: "#f28900" }} />
                                <Typography variant="body2" sx={{ color: "#4b5563" }}>
                                    <strong style={{ color: "#111827" }}>{modelStatus.total_products}</strong> sản phẩm
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                <AccessTimeIcon sx={{ fontSize: 18, color: "#f28900" }} />
                                <Typography variant="body2" sx={{ color: "#4b5563" }}>
                                    Huấn luyện: <strong style={{ color: "#111827" }}>{modelStatus.trained_at || "N/A"}</strong>
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: { xs: "flex-start", md: "flex-end" }, gap: 1.5 }}>
                        <Chip
                            icon={
                                isTraining ? (
                                    <CircularProgress size={14} sx={{ color: "#b45309 !important" }} />
                                ) : modelStatus?.model_loaded ? (
                                    <CheckCircleIcon sx={{ fontSize: 16, color: "#15803d" }} />
                                ) : (
                                    <StorageIcon sx={{ fontSize: 16, color: "#dc2626" }} />
                                )
                            }
                            label={
                                isTraining
                                    ? "Đang cập nhật mô hình..."
                                    : modelStatus?.model_loaded
                                        ? "Mô hình sẵn sàng"
                                        : "Chưa kết nối"
                            }
                            sx={{
                                background: isTraining
                                    ? "#fffbeb"
                                    : modelStatus?.model_loaded
                                        ? "#f0fdf4"
                                        : "#fef2f2",
                                border: `1px solid ${isTraining
                                    ? "#fde68a"
                                    : modelStatus?.model_loaded
                                        ? "#bbf7d0"
                                        : "#fecaca"
                                    }`,
                                color: "#111827",
                                fontWeight: 600,
                            }}
                        />

                        {canManageAI ? (
                            <Button
                                variant="contained"
                                onClick={handleRetrain}
                                disabled={isTraining}
                                startIcon={
                                    isTraining ? (
                                        <CircularProgress size={16} sx={{ color: "#fff" }} />
                                    ) : (
                                        <SyncIcon />
                                    )
                                }
                                sx={{
                                    background: "#f28900",
                                    color: "#fff",
                                    fontWeight: 700,
                                    px: 3,
                                    py: 1,
                                    borderRadius: 1.5,
                                    textTransform: "none",
                                    fontSize: "0.95rem",
                                    boxShadow: "none",
                                    "&:hover": {
                                        background: "#e07d00",
                                        boxShadow: "0 2px 8px rgba(242,137,0,0.35)",
                                    },
                                    "&:disabled": { color: "rgba(255,255,255,0.7)", background: "#fdba74" },
                                }}
                            >
                                {isTraining ? "Đang cập nhật..." : "Cập nhật mô hình gợi ý"}
                            </Button>
                        ) : (
                            <Button
                                variant="outlined"
                                disabled
                                startIcon={<SyncIcon />}
                                sx={{
                                    borderColor: "#e5e7eb",
                                    color: "#9ca3af",
                                    fontWeight: 600,
                                    textTransform: "none",
                                }}
                            >
                                Không có quyền cập nhật
                            </Button>
                        )}
                    </Box>
                </Box>

                {retrainMessage && (
                    <Box
                        sx={{
                            mt: 2,
                            p: 1.5,
                            borderRadius: 1.5,
                            background: retrainSuccess ? "#f0fdf4" : "#fef2f2",
                            border: `1px solid ${retrainSuccess ? "#bbf7d0" : "#fecaca"}`,
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{ color: retrainSuccess ? "#15803d" : "#b91c1c" }}
                        >
                            {retrainMessage}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default AIControlPanel;
