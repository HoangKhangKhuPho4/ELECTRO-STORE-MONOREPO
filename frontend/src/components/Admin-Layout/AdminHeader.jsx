import {
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import {
  AppBar,
  Box,
  IconButton,
  InputAdornment, // <-- Thêm InputAdornment
  ListItemIcon,
  Menu,
  MenuItem,
  TextField, // <-- Thêm TextField
  Toolbar,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, logout } from "../../redux/appSlice";
import { clearAuthSession } from "../../utils/authSession";
import { getDisplayName, getPrimaryRoleInfo } from "../../utils/adminUserDisplay";
import AdminUserAvatar from "./AdminUserAvatar";

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 80;

const AdminHeader = ({
  currentPage,
  onDrawerToggle,
  onSidebarToggle,
  sidebarCollapsed,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const displayName = getDisplayName(currentUser);
  const roleInfo = getPrimaryRoleInfo(currentUser);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    clearAuthSession();
    dispatch(logout());
    navigate("/login");
  };

  const handleSettings = () => {
    handleProfileMenuClose();
    navigate("/admin/settings");
  };

  // 🔥 SỬA CHÍNH: Đảm bảo drawerWidth đồng bộ với AdminLayout
  const drawerWidth = sidebarCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <AppBar
      position="fixed"
      sx={{
        // 🔥 KHẮC PHỤC: Loại bỏ margin-left để tránh khoảng trống
        width: "100%",
        left: 0,
        right: 0,
        top: 0,
        background: "#FFFFFF",
        color: "#555",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Toolbar sx={{ minHeight: "64px !important", px: 2 }}>
        {" "}
        {/* 🔥 Giảm padding từ 3 xuống 2 */}
        {/* Nút Menu mobile - Custom hiệu ứng */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          disableRipple // 🔥 TẮT ripple effect
          sx={{
            mr: 2,
            display: { xs: "block", md: "none" },
            // 🔥 CUSTOM EFFECTS tương tự desktop
            borderRadius: 2,
            padding: 1.5,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            backgroundColor: "transparent",

            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
              transform: "scale(1.05)",
            },

            "&:active": {
              backgroundColor: "rgba(0, 0, 0, 0.08)",
              transform: "scale(0.95)",
            },

            "&:focus": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
              outline: "2px solid rgba(255, 159, 26, 0.3)",
              outlineOffset: "2px",
            },
          }}
        >
          <MenuIcon sx={{ fontSize: 20 }} />
        </IconButton>
        {/* Nút toggle sidebar desktop - Custom hiệu ứng */}
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          edge="start"
          onClick={onSidebarToggle}
          disableRipple // 🔥 TẮT ripple effect mặc định
          sx={{
            mr: 2,
            display: { xs: "none", md: "block" },
            // 🔥 CUSTOM EFFECTS: Hiệu ứng thân thiện hơn
            borderRadius: 2, // Bo góc mềm mại
            padding: 1.5,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            backgroundColor: "transparent",

            // Hiệu ứng hover
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)", // Nền nhẹ khi hover
              transform: "scale(1.05)", // Phóng to nhẹ
            },

            // Hiệu ứng khi active (đang click)
            "&:active": {
              backgroundColor: "rgba(0, 0, 0, 0.08)",
              transform: "scale(0.95)", // Thu nhỏ khi click
            },

            // Hiệu ứng focus (dành cho keyboard navigation)
            "&:focus": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
              outline: "2px solid rgba(255, 159, 26, 0.3)", // Viền màu cam nhẹ
              outlineOffset: "2px",
            },
          }}
        >
          <MenuIcon
            sx={{
              fontSize: 20,
              transition: "transform 0.2s ease",
              // 🔥 Xoay icon khi sidebar collapsed/expanded
              transform: sidebarCollapsed ? "rotate(0deg)" : "rotate(90deg)",
            }}
          />
        </IconButton>
        {/* 🔥 SỬA: Thanh tìm kiếm responsive */}
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search or type command..."
          sx={{
            width: { xs: 200, sm: 300, md: sidebarCollapsed ? 400 : 300 }, // 🔥 Dynamic width dựa trên sidebar state
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              backgroundColor: "#f5f5f5",
              "& fieldset": { border: "none" },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18 }} /> {/* 🔥 Giảm icon size */}
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          onClick={handleProfileMenuOpen}
          disableRipple
          sx={{
            p: 1,
            borderRadius: 2,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",

            "&:hover": {
              backgroundColor: "rgba(255, 159, 26, 0.08)", // Màu cam nhẹ cho avatar
              transform: "scale(1.05)",
            },

            "&:active": {
              transform: "scale(0.95)",
            },
          }}
        >
          <AdminUserAvatar user={currentUser} size={36} />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ sx: { minWidth: 220, mt: 1 } }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #f0f0f0" }}>
            <Typography variant="subtitle2" fontWeight={800} color="#1e293b">
              {displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {roleInfo.label}
            </Typography>
          </Box>
          <MenuItem onClick={handleSettings}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Cài đặt tài khoản
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Đăng xuất
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default AdminHeader;
