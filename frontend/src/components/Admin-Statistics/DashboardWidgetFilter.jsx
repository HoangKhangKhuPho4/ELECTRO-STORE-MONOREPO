import { FilterList, RestartAlt } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useState } from "react";

export const DASHBOARD_WIDGETS = [
  { id: "actionKpis", label: "Cần xử lý" },
  { id: "kpiCards", label: "KPI tổng quan" },
  { id: "mainCharts", label: "Doanh thu & Trạng thái đơn" },
  { id: "insights", label: "Sản phẩm & Thanh toán" },
  { id: "behavior", label: "Tỉ lệ chuyển đổi & Phân khúc KH" },
  { id: "tables", label: "Đơn hàng gần đây & Tồn kho" },
];

export const buildDefaultWidgetState = () =>
  Object.fromEntries(DASHBOARD_WIDGETS.map((w) => [w.id, true]));

export const loadWidgetState = () => {
  try {
    const saved = localStorage.getItem("dashboardWidgets");
    if (!saved) return buildDefaultWidgetState();
    return { ...buildDefaultWidgetState(), ...JSON.parse(saved) };
  } catch {
    return buildDefaultWidgetState();
  }
};

const DashboardWidgetFilter = ({ visibleWidgets, onToggle, onReset }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const hiddenCount = DASHBOARD_WIDGETS.filter((w) => !visibleWidgets[w.id]).length;

  return (
    <Box>
      <Button
        startIcon={<FilterList />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          borderRadius: 2,
          px: 2.5,
          py: 1.1,
          fontWeight: 700,
          textTransform: "none",
          bgcolor: "background.paper",
          color: "text.primary",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        Tùy chỉnh widget{hiddenCount > 0 ? ` (${hiddenCount} ẩn)` : ""}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { borderRadius: 2.5, mt: 1, minWidth: 280, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" },
        }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary">
            Hiển thị khối báo cáo
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            Ẩn bớt widget để giảm tải thông tin trên màn hình
          </Typography>
        </Box>
        <Divider />
        {DASHBOARD_WIDGETS.map((widget) => (
          <MenuItem
            key={widget.id}
            dense
            onClick={() => onToggle(widget.id)}
            sx={{ py: 0.75 }}
          >
            <Checkbox
              edge="start"
              checked={Boolean(visibleWidgets[widget.id])}
              tabIndex={-1}
              disableRipple
              size="small"
            />
            <ListItemText
              primary={widget.label}
              primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 600, color: "text.primary" }}
            />
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            onReset();
            setAnchorEl(null);
          }}
          sx={{ gap: 1, color: "primary.main", fontWeight: 700 }}
        >
          <RestartAlt fontSize="small" />
          Hiện tất cả widget
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DashboardWidgetFilter;
