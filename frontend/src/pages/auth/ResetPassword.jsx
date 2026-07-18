import {
  Box,
  Button,
  Card,
  TextField,
  Typography,
} from "@mui/material";
import httpClient from "../../services/httpClient";
import { API_PREFIX } from "../../config/api";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error(t("auth.serverError"));
      navigate("/login");
    }
  }, [token, navigate, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error(t("profile.fillRequired"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("profile.fillRequired"));
      return;
    }

    setLoading(true);
    try {
      const response = await httpClient.post(`${API_PREFIX}/auth/reset-password`, {
        token,
        newPassword: password,
        confirmPassword,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setTimeout(() => {
          navigate("/login");
        }, 2500);
      } else {
        toast.error(response.data.message || t("auth.serverError"));
      }
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || t("auth.serverError"));
      } else {
        toast.error(t("auth.serverError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundImage:
          "url('http://getwallpapers.com/wallpaper/full/a/5/d/544750.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Card
        sx={{
          p: 4,
          width: 400,
          backgroundColor: "rgba(0,0,0,0.5)",
          color: "white",
        }}
      >
        <Typography variant="h5" sx={{ mb: 2, textAlign: "center", fontWeight: "bold" }}>
          {t("profile.changePassword")}
        </Typography>

        <Typography variant="body2" sx={{ mb: 3, textAlign: "center", color: "#ccc" }}>
          {t("profile.fillRequired")}
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label={t("profile.newPassword")}
            name="password"
            type="password"
            variant="filled"
            fullWidth
            required
            sx={{
              mb: 2,
              "& .MuiFilledInput-root": {
                backgroundColor: "white",
                "&:hover": { backgroundColor: "white" },
                "&.Mui-focused": { backgroundColor: "white" },
              },
              "& .MuiInputLabel-root.Mui-focused": { color: "black" },
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <TextField
            label={t("profile.confirmPassword")}
            name="confirmPassword"
            type="password"
            variant="filled"
            fullWidth
            required
            sx={{
              mb: 3,
              "& .MuiFilledInput-root": {
                backgroundColor: "white",
                "&:hover": { backgroundColor: "white" },
                "&.Mui-focused": { backgroundColor: "white" },
              },
              "& .MuiInputLabel-root.Mui-focused": { color: "black" },
            }}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              backgroundColor: "#FFC312",
              color: "black",
              fontWeight: "bold",
              "&:hover": { backgroundColor: "white" },
              "&.Mui-disabled": { backgroundColor: "rgba(255, 195, 18, 0.5)", color: "rgba(0,0,0,0.5)" }
            }}
          >
            {loading ? t("profile.processing") : t("profile.confirm")}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2">
            <Link to="/login" style={{ color: "#FFC312", textDecoration: "none", fontWeight: "bold" }}>
              {t("auth.loginNow")}
            </Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default ResetPassword;
