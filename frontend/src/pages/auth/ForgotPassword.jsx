import {
  Box,
  Button,
  Card,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import httpClient from "../../services/httpClient";
import { API_PREFIX } from "../../config/api";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import "./Login.css";

const PRIMARY = "#2563eb";
const BRAND = "#ea580c";

const BrandMark = () => (
  <a href="/" className="login-brand-mark" aria-label="Electro">
    <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="#fff" />
      <path d="M10 15H30L28.5 27H11.5L10 15Z" fill={BRAND} />
      <path
        d="M14 12C14 10.9 14.9 10 16 10H24C25.1 10 26 10.9 26 12V15H14V12Z"
        fill="none"
        stroke={BRAND}
        strokeWidth="2"
      />
      <circle cx="16" cy="31" r="2" fill={BRAND} />
      <circle cx="24" cy="31" r="2" fill={BRAND} />
    </svg>
    <span className="login-brand-name">Electro</span>
  </a>
);

const fieldSx = {
  mb: 2.25,
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#fff",
    borderRadius: "10px",
    minHeight: 52,
    "& fieldset": {
      borderColor: "#cbd5e1",
      borderRadius: "10px",
    },
    "&:hover fieldset": {
      borderColor: "#94a3b8",
    },
    "&.Mui-focused fieldset": {
      borderColor: PRIMARY,
      borderWidth: "1.5px",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: PRIMARY },
  "& .MuiInputBase-input": {
    py: 1.75,
    px: 1.5,
    fontSize: "0.9375rem",
    lineHeight: 1.5,
  },
};

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error(t("auth.fillAllFields"));
      return;
    }

    setLoading(true);
    try {
      const response = await httpClient.post(`${API_PREFIX}/auth/forgot-password`, { email });

      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message || t("auth.serverError"));
      }
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data?.message || t("auth.serverError"));
      } else {
        toast.error(t("auth.serverError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="login-page">
      <aside className="login-brand" aria-hidden={false}>
        <div className="login-brand-content">
          <BrandMark />
          <h1 className="login-brand-title">{t("auth.loginBrandTitle")}</h1>
          <p className="login-brand-desc">{t("auth.loginBrandDesc")}</p>
        </div>
        <svg
          className="login-brand-bag"
          viewBox="0 0 200 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <rect x="30" y="70" width="140" height="130" rx="16" fill="#fff" />
          <path
            d="M70 70V52c0-16.5 13.5-30 30-30s30 13.5 30 30v18"
            stroke="#fff"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <circle cx="75" cy="175" r="10" fill="#fff" />
          <circle cx="125" cy="175" r="10" fill="#fff" />
        </svg>
      </aside>

      <main className="login-form-panel">
        <Card elevation={0} className="login-form-card">
          <Typography className="login-form-title" component="h2">
            {t("auth.forgotPasswordTitle")}
          </Typography>
          <Typography className="login-form-subtitle">
            {t("auth.forgotPasswordSubtitle")}
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ display: "flex", flexDirection: "column" }}
          >
            <TextField
              label={t("auth.email")}
              name="email"
              type="email"
              autoComplete="email"
              variant="outlined"
              fullWidth
              required
              sx={fieldSx}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              className="login-submit-btn"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {loading ? t("profile.processing") : t("auth.forgotPasswordSubmit")}
            </Button>
          </Box>

          <Box className="login-footer-links">
            <Typography variant="body2" color="text.secondary">
              {t("auth.hasAccount")}{" "}
              <Link to="/login">{t("auth.loginNow")}</Link>
            </Typography>
          </Box>
        </Card>
      </main>
    </Box>
  );
};

export default ForgotPassword;
