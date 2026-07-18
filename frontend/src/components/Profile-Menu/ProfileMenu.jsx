import {
  AccountBalanceOutlined as AccountBalanceOutlinedIcon,
  AccountCircleOutlined as AccountCircleOutlinedIcon,
  DescriptionOutlined as DescriptionOutlinedIcon,
  LocationOnOutlined as LocationOnOutlinedIcon,
  LockOutlined as LockOutlinedIcon,
  NotificationsNoneOutlined as NotificationsNoneOutlinedIcon,
  PaymentOutlined as PaymentOutlinedIcon,
  PersonOutline as PersonOutlineIcon,
  ShieldOutlined as ShieldOutlinedIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ProfileMenu = ({ activePage, user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isAccountSection =
    activePage === t("profile.profile") ||
    activePage === t("profile.address") ||
    activePage === t("profile.changePassword");

  return (
    <Paper elevation={0} sx={{ height: "100%", borderRadius: 0, borderRight: { xs: "none", md: "1px solid #e0e0e0" } }}>
      <List sx={{ p: 1 }}>
        <ListItem
          sx={{ flexDirection: "column", alignItems: "flex-start", py: 2 }}
        >
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: "#673ab7", mr: 2 }}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </Avatar>
            <div>
              <Typography variant="subtitle1" fontWeight="bold">
                {user?.name || "User"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("profile.editProfile")}
              </Typography>
            </div>
          </div>
        </ListItem>

        <Divider sx={{ my: 1 }} />

        <ListItem disablePadding>
          <ListItemButton selected={activePage === t("profile.notifications")}>
            <ListItemIcon sx={{ minWidth: 40, color: "#ff6f61" }}>
              <NotificationsNoneOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary={t("profile.notifications")} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={isAccountSection}
            onClick={() => navigate("/profile")}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "#42a5f5" }}>
              <AccountCircleOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary={t("profile.myAccount")} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={activePage === t("profile.profile")}
            onClick={() => navigate("/profile")}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "#4caf50" }}>
              <PersonOutlineIcon />
            </ListItemIcon>
            <ListItemText
              primary={t("profile.profile")}
              sx={{ color: activePage === t("profile.profile") ? "#ee4d2d" : "inherit" }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton selected={activePage === t("profile.bank")}>
            <ListItemIcon sx={{ minWidth: 40, color: "#e91e63" }}>
              <AccountBalanceOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary={t("profile.bank")} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={activePage === t("profile.address")}
            onClick={() => navigate("/profile/address")}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "#ff5722" }}>
              <LocationOnOutlinedIcon />
            </ListItemIcon>
            <ListItemText
              primary={t("profile.address")}
              sx={{ color: activePage === t("profile.address") ? "#ee4d2d" : "inherit" }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={activePage === t("profile.changePassword")}
            onClick={() => navigate("/profile/password")}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "#607d8b" }}>
              <LockOutlinedIcon />
            </ListItemIcon>
            <ListItemText
              primary={t("profile.changePassword")}
              sx={{ color: activePage === t("profile.changePassword") ? "#ee4d2d" : "inherit" }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={activePage === t("profile.orders")}
            onClick={() => navigate("/user/orders")}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "#42a5f5" }}>
              <DescriptionOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary={t("profile.orders")} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={activePage === t("profile.warranty")}
            onClick={() => navigate("/user/warranty")}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "#7c3aed" }}>
              <ShieldOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary={t("profile.warranty")} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton selected={activePage === t("profile.vouchers")}>
            <ListItemIcon sx={{ minWidth: 40, color: "#ff9800" }}>
              <PaymentOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary={t("profile.vouchers")} />
          </ListItemButton>
        </ListItem>
      </List>
    </Paper>
  );
};

export default ProfileMenu;
