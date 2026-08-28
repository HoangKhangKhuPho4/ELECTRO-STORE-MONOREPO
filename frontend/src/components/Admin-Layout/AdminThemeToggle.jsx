import { DarkMode, WbSunny } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { selectTheme, toggleTheme } from "../../redux/appSlice";

const AdminThemeToggle = ({ size = "small", sx = {} }) => {
  const dispatch = useDispatch();
  const themeMode = useSelector(selectTheme);
  const isDark = themeMode === "dark";

  return (
    <Tooltip title={isDark ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"}>
      <IconButton
        size={size}
        onClick={() => dispatch(toggleTheme())}
        aria-label={isDark ? "Bật Light mode" : "Bật Dark mode"}
        sx={{
          color: isDark ? "#818cf8" : "#f59e0b",
          p: 0.5,
          transition: "transform 0.2s ease, background-color 0.2s ease",
          "&:hover": {
            bgcolor: isDark ? "rgba(129, 140, 248, 0.12)" : "rgba(245, 158, 11, 0.12)",
            transform: "rotate(-12deg) scale(1.08)",
          },
          ...sx,
        }}
      >
        {isDark ? <DarkMode sx={{ fontSize: 20 }} /> : <WbSunny sx={{ fontSize: 20 }} />}
      </IconButton>
    </Tooltip>
  );
};

export default AdminThemeToggle;
