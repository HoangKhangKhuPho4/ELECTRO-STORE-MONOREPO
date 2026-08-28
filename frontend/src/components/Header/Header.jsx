import {
  ShoppingCart as CartIcon,
  FavoriteBorder as FavoriteIcon,
  Logout as LogoutIcon,
  ReceiptLongOutlined as OrderIcon,
  Search as SearchIcon,
  NotificationsNoneOutlined as NotificationsIcon,
  ShieldOutlined as ShieldOutlinedIcon,
} from "@mui/icons-material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  Menu,
  MenuItem,
  Select,
  Toolbar,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  logout,
  selectCartItemCount,
  selectIsLoggedIn,
  selectUser,
  selectWishlistCount,
} from "../../redux/appSlice";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import Logo from "../UI/Logo";
import ProductSearchAutocomplete from "../Search/ProductSearchAutocomplete";
import "./Header.css";

const CATEGORY_OPTIONS = [
  { key: "all", id: null },
  { key: "accessories", id: 10 },
  { key: "pcParts", id: 11 },
  { key: "mobileTablet", id: 13 },
  { key: "laptopDesktop", id: 12 },
  { key: "smartTv", id: 14 },
];

const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [anchorEl, setAnchorEl] = useState(null);

  const cartItemCount = useSelector(selectCartItemCount);
  const wishlistCount = useSelector(selectWishlistCount);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);

  const categories = useMemo(
    () =>
      CATEGORY_OPTIONS.map((opt) => ({
        ...opt,
        label: t(`categories.${opt.key}`),
      })),
    [t, i18n.language],
  );

  const selectedCategoryId =
    CATEGORY_OPTIONS.find((c) => c.key === selectedCategory)?.id ?? null;

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.set("keyword", searchTerm.trim());
    }
    if (selectedCategoryId) {
      params.set("category", selectedCategoryId.toString());
    }
    navigate(`/shop?${params.toString()}`);
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    setAnchorEl(null);
    navigate("/");
  };

  return (
    <AppBar
      position="sticky"
      className="header"
      sx={{
        backgroundColor: "white",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        borderBottom: "1px solid #e8e9ea",
      }}
    >
      <Toolbar
        className="header-container"
        sx={{
          minHeight: "90px !important",
          padding: "0 2rem",
          display: "grid",
          gridTemplateColumns:
            "minmax(200px, 1fr) minmax(500px, 3fr) minmax(320px, 1fr)",
          alignItems: "center",
          gap: "2rem",
          maxWidth: "100%",
          margin: 0,
          width: "100%",
        }}
      >
        <Box
          className="header-logo"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <Logo />
        </Box>

        <Box
          className="header-search"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <Box
            component="form"
            className="header-search-form"
            onSubmit={handleSearch}
            sx={{
              display: "flex",
              width: "100%",
              maxWidth: "600px",
              backgroundColor: "white",
              border: "2px solid #FF7A00",
              borderRadius: "25px",
              overflow: "visible",
            }}
          >
            <FormControl
              className="header-search-category"
              sx={{
                minWidth: 140,
                height: "100%",
                "& .MuiOutlinedInput-root": {
                  height: "100%",
                  borderRadius: 0,
                  borderTopLeftRadius: "23px",
                  borderBottomLeftRadius: "23px",
                },
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  height: "100%",
                  boxSizing: "border-box",
                  padding: "0 32px 0 16px",
                  borderRadius: 0,
                  border: "none",
                  lineHeight: "20px",
                  "&:focus": {
                    backgroundColor: "transparent",
                  },
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
              }}
            >
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                displayEmpty
                sx={{
                  height: "100%",
                  color: "#666",
                  fontSize: "14px",
                  lineHeight: "20px",
                  "& .MuiSelect-icon": {
                    color: "#999",
                    right: 10,
                  },
                }}
              >
                {categories.map((category) => (
                  <MenuItem
                    key={category.key}
                    value={category.key}
                    sx={{ fontSize: "14px" }}
                  >
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <ProductSearchAutocomplete
              value={searchTerm}
              onChange={setSearchTerm}
              categoryId={selectedCategoryId}
              onSubmit={handleSearch}
              placeholder={t("header.searchPlaceholder")}
              className="header-search-input"
              sx={{
                flex: 1,
                height: "100%",
                "& .MuiOutlinedInput-root": {
                  height: "100%",
                  minHeight: "unset",
                  padding: "0 8px 0 0",
                  alignItems: "center",
                  overflow: "visible",
                  "& fieldset": {
                    border: "none",
                    borderLeft: "1px solid #e0e0e0",
                  },
                  "&:hover fieldset": {
                    border: "none",
                    borderLeft: "1px solid #e0e0e0",
                  },
                  "&.Mui-focused fieldset": {
                    border: "none",
                    borderLeft: "1px solid #e0e0e0",
                  },
                },
                "& .MuiInputBase-input": {
                  padding: "0 16px",
                  height: "100%",
                  lineHeight: "20px",
                  fontSize: "14px",
                  color: "#333",
                  boxSizing: "border-box",
                  "&::placeholder": { color: "#999", opacity: 1 },
                },
              }}
            />

            <IconButton
              type="submit"
              className="header-search-submit"
              sx={{
                backgroundColor: "#FF7A00",
                alignSelf: "stretch",
                px: 2.5,
                "&:hover": {
                  backgroundColor: "#e66900",
                },
              }}
            >
              <SearchIcon sx={{ color: "white", fontSize: "20px" }} />
            </IconButton>
          </Box>
        </Box>

        <Box className="header-actions">
          <Box className="header-action-item">
            <IconButton sx={{ color: "#666" }} title={t("header.notifications")}>
              <NotificationsIcon />
            </IconButton>
          </Box>

          <Box className="header-action-item">
            <Link
              to="/wishlist"
              className="header-action-link"
            >
              <IconButton sx={{ color: "#666" }} title={t("header.wishlist")}>
                <Badge badgeContent={wishlistCount} color="error">
                  <FavoriteIcon />
                </Badge>
              </IconButton>
            </Link>
          </Box>

          <Box className="header-action-item">
            <Link
              to="/cart"
              className="header-action-link"
            >
              <IconButton sx={{ color: "#666" }} title={t("header.cart")}>
                <Badge badgeContent={cartItemCount} color="error">
                  <CartIcon />
                </Badge>
              </IconButton>
            </Link>
          </Box>

          <Box className="header-action-item">
            <LanguageSwitcher />
          </Box>

          <Box className="header-action-item">
            {isLoggedIn ? (
              <>
                <Button
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  startIcon={
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: "#D32F2F",
                        fontSize: "14px",
                      }}
                    >
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </Avatar>
                  }
                  sx={{
                    textTransform: "none",
                    color: "#333",
                    fontWeight: "bold",
                    borderRadius: "20px",
                    px: 1.5,
                    minWidth: 0,
                    maxWidth: 200,
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user?.name || "User"}
                  </Box>
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  PaperProps={{
                    sx: { minWidth: 200, mt: 1 },
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      navigate("/profile");
                      setAnchorEl(null);
                    }}
                  >
                    <PersonOutlineIcon sx={{ mr: 1, fontSize: 20 }} />
                    {t("header.myAccount")}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      navigate("/user/orders");
                      setAnchorEl(null);
                    }}
                  >
                    <OrderIcon sx={{ mr: 1, fontSize: 20 }} />
                    {t("header.myOrders")}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      navigate("/user/warranty");
                      setAnchorEl(null);
                    }}
                  >
                    <ShieldOutlinedIcon sx={{ mr: 1, fontSize: 20 }} />
                    {t("header.warrantyRepair")}
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: "#D32F2F" }}>
                    <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
                    {t("header.logout")}
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Link to="/login" className="header-action-link">
                <Button
                  variant="contained"
                  startIcon={<PersonOutlineIcon />}
                  sx={{
                    backgroundColor: "#D32F2F",
                    borderRadius: "20px",
                    textTransform: "none",
                    fontWeight: "bold",
                    "&:hover": {
                      backgroundColor: "#B71C1C",
                    },
                  }}
                >
                  {t("header.login")}
                </Button>
              </Link>
            )}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
