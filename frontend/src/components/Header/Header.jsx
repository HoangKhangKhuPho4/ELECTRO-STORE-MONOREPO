import {
  ShoppingCart as CartIcon,
  FavoriteBorder as FavoriteIcon,
  Logout as LogoutIcon,
  ReceiptLongOutlined as OrderIcon,
  Search as SearchIcon,
  Shuffle as ShuffleIcon,
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
            onSubmit={handleSearch}
            sx={{
              display: "flex",
              width: "100%",
              maxWidth: "600px",
              backgroundColor: "white",
              border: "2px solid #FF7A00",
              borderRadius: "25px",
              overflow: "hidden",
            }}
          >
            <FormControl
              sx={{
                minWidth: 140,
                "& .MuiSelect-select": {
                  padding: "12px 16px",
                  borderRadius: 0,
                  border: "none",
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
                  color: "#666",
                  fontSize: "14px",
                  "& .MuiSelect-icon": {
                    color: "#999",
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
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
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
                  padding: "12px 16px",
                  fontSize: "14px",
                  color: "#333",
                  "&::placeholder": { color: "#999", opacity: 1 },
                },
              }}
            />

            <IconButton
              type="submit"
              sx={{
                backgroundColor: "#FF7A00",
                borderRadius: 0,
                padding: "12px 20px",
                "&:hover": {
                  backgroundColor: "#e66900",
                },
              }}
            >
              <SearchIcon sx={{ color: "white", fontSize: "20px" }} />
            </IconButton>
          </Box>
        </Box>

        <Box
          className="header-actions"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <IconButton sx={{ color: "#666" }} title={t("header.randomProduct")}>
            <ShuffleIcon />
          </IconButton>

          <Link
            to="/wishlist"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <IconButton sx={{ color: "#666" }} title={t("header.wishlist")}>
              <Badge badgeContent={wishlistCount} color="error">
                <FavoriteIcon />
              </Badge>
            </IconButton>
          </Link>

          <Link
            to="/cart"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <IconButton sx={{ color: "#666" }} title={t("header.cart")}>
              <Badge badgeContent={cartItemCount} color="error">
                <CartIcon />
              </Badge>
            </IconButton>
          </Link>

          <LanguageSwitcher />

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
                  px: 2,
                }}
              >
                {user?.name || "User"}
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
            <Link to="/login" style={{ textDecoration: "none" }}>
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
      </Toolbar>
    </AppBar>
  );
};

export default Header;
