import {
  Box,
  Button, // Đã thêm Button
  Card, // Đã thêm FormControlLabel
  TextField,
  Typography,
} from "@mui/material";
import httpClient from "../../services/httpClient";
import { API_PREFIX } from "../../config/api";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom"; // Giả định bạn sẽ cần Link để quay về Login

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });

  const navigate = useNavigate();

  // Một hàm xử lý thay đổi cho tất cả các ô input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra xem các trường có trống không
    for (const key in formData) {
      if (formData[key] === "") {
        alert(t("auth.fillAllFields"));
        return;
      }
    }

    try {
      // Gửi yêu cầu POST đến backend 🚀
      const response = await httpClient.post(`${API_PREFIX}/auth/register`, formData);

      // Nếu thành công ✅
      console.log("Phản hồi từ server:", response.data);
      alert(response.data?.message || t("auth.registerTitle"));
      navigate("/login");
    } catch (error) {
      // Nếu có lỗi ❌
      console.error("Lỗi khi đăng ký:", error);

      // Hiển thị thông báo lỗi từ backend (nếu có)
      if (error.response && error.response.data) {
        alert(`${t("auth.serverError")}: ${error.response.data.message}`);
      } else {
        alert(t("auth.serverError"));
      }
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#eee",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1100 }}>
        <Card sx={{ borderRadius: 6, overflow: "hidden", p: 0 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "stretch",
            }}
          >
            {/* Flash Sale — cột trái, lấp đầy chiều cao form */}
            <Box
              sx={{
                position: "relative",
                flex: { md: "0 0 48%" },
                width: { xs: "100%", md: "48%" },
                minHeight: { xs: 240, md: "auto" },
                alignSelf: "stretch",
              }}
            >
              <Box
                component="img"
                src="/images/register/flash-sale.jpg"
                alt="Flash Sale"
                sx={{
                  position: { xs: "relative", md: "absolute" },
                  inset: { md: 0 },
                  width: "100%",
                  height: { xs: 240, md: "100%" },
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </Box>

            {/* Form — cột phải */}
            <Box
              sx={{
                flex: 1,
                width: { xs: "100%", md: "52%" },
                p: { xs: 3, md: 5 },
              }}
            >
              <Typography
                variant="h4"
                align="center"
                sx={{ mb: 5, mt: { xs: 1, md: 2 }, fontWeight: "bold" }}
              >
                {t("auth.registerTitle")}
              </Typography>

              <form onSubmit={handleSubmit}>
                <TextField
                  label={t("profile.fullName")}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 4 }}
                />
                <TextField
                  label={t("profile.username")}
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 4 }}
                />
                <TextField
                  label={t("auth.email")}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 4 }}
                />
                <TextField
                  label={t("profile.phone")}
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 4 }}
                />
                <TextField
                  label={t("profile.addressLabel")}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 4 }}
                />
                <TextField
                  label={t("auth.password")}
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 4 }}
                />

                <Box sx={{ mb: 3 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                  >
                    {t("auth.registerTitle")}
                  </Button>
                </Box>

                <Box sx={{ textAlign: "center", mt: 3 }}>
                  <Typography variant="body2">
                    {t("auth.hasAccount")}{" "}
                    <Link to="/login" style={{ textDecoration: "none" }}>
                      {t("auth.loginNow")}
                    </Link>
                  </Typography>
                </Box>
              </form>
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default Register;
