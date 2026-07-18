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
    // THAY THẾ <section> VÀ CÁC <div> CONTAINER BẰNG BOX CỦA MUI
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
        <Card sx={{ borderRadius: 6, p: { xs: 2, md: 5 } }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {/* Vùng Form */}
            <Box
              sx={{
                width: { md: "45%", xs: "100%" },
                order: { xs: 2, lg: 1 },
                pr: { md: 3 },
              }}
            >
              <Typography
                variant="h4"
                align="center"
                sx={{ mb: 5, mt: 4, fontWeight: "bold" }}
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

                {/* Nút Đăng Ký */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mx: 4,
                    mb: 3,
                  }}
                >
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

                {/* Quay lại Login */}
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

            {/* Vùng Hình ảnh */}
            <Box
              sx={{
                width: { md: "45%", xs: "100%" },
                order: { xs: 1, lg: 2 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: { xs: 3, md: 0 },
              }}
            >
              <img
                src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-registration/draw1.webp"
                alt="Sample image"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default Register;
