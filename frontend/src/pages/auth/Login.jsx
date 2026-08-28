import {
  Box,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
} from "@mui/material";
import httpClient from "../../services/httpClient";
import { API_PREFIX } from "../../config/api";
import { applyLoginResponse, isCustomerUser } from "../../utils/authSession";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeCanvas } from "qrcode.react";
import { useForm } from "../../hooks/useForm";
import { loginSuccess, setCart } from "../../redux/appSlice";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import FacebookLogin from "@greatsumini/react-facebook-login";
import FacebookIcon from "@mui/icons-material/Facebook";
import { fetchCart } from "../../services/cartService";
import "./Login.css";

const GOOGLE_CLIENT_ID = "805948950640-eaq86ak8dt5qngqks1knbmpvpua77n78.apps.googleusercontent.com";
const FACEBOOK_APP_ID = "1295828555747879";

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

const Login = () => {
  const { t } = useTranslation();
  const { values, handleChange } = useForm({
    email: "",
    password: "",
  });

  const [loginMethod, setLoginMethod] = useState("password"); // "password" or "qr"
  const [qrToken, setQrToken] = useState("");
  const [qrStatus, setQrStatus] = useState("PENDING");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [isFbLoading, setIsFbLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ----- Logic sinh QR Token -----
  const fetchQrToken = async () => {
    setQrLoading(true);
    setQrError("");
    try {
      const response = await httpClient.get(`${API_PREFIX}/auth/qr/generate`);
      if (response.data.success) {
        setQrToken(response.data.data.qrToken);
        setQrStatus("PENDING");
      } else {
        setQrError(response.data.message || t("auth.qrGenerateFail"));
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        t("auth.qrServiceFail");
      setQrError(msg);
      console.error("Lỗi khi tạo mã QR:", err);
    } finally {
      setQrLoading(false);
    }
  };

  // ----- Logic Polling (Ngồi chờ Điện thoại quét) -----
  useEffect(() => {
    let intervalId;

    if (loginMethod === "qr" && qrToken && qrStatus === "PENDING") {
      intervalId = setInterval(async () => {
        try {
          const res = await httpClient.get(`${API_PREFIX}/auth/qr/status/${qrToken}`);
          if (res.data.success) {
            const status = res.data.data.status;
            setQrStatus(status);

            // NẾU Điện thoại đã CHỐT (VERIFIED)
            if (status === "VERIFIED") {
              clearInterval(intervalId);

              const jwt = res.data.data.accessToken;
              const loginData = res.data.data;
              const { user: userData } = applyLoginResponse({
                accessToken: jwt,
                refreshToken: loginData.refreshToken,
                user: loginData.user,
                roles: loginData.roles,
                permissions: loginData.permissions,
              });
              dispatch(loginSuccess(userData));

              // 3. Tải Giỏ hàng
              try {
                const cart = await fetchCart();
                dispatch(setCart(cart?.items || []));
              } catch (cartErr) {
                console.warn("Lỗi tải giỏ hàng:", cartErr);
              }

              // 4. Kiểm tra quyền và điều hướng
              // Nếu mảng roles chứa ROLE_CUSTOMER thì vứt ra trang chủ. Còn nhân viên (ADMIN, STAFF...) thì vào /admin
              const isCustomer = isCustomerUser(userData);
              if (isCustomer) {
                navigate("/");
              } else {
                navigate("/admin");
              }
            }
          }
        } catch (err) {
          console.error("Lỗi khi Polling check trạng thái QR:", err);
        }
      }, 2000); // 2000ms đếm nhịp 1 lần
    }

    // Dọn dẹp Interval nếu chuyển Tab hoặc rời trang
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loginMethod, qrToken, qrStatus, dispatch, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (values.email === "" || values.password === "") {
      alert(t("auth.fillAllFields"));
      return;
    }

    try {
      const response = await httpClient.post(`${API_PREFIX}/auth/login`, {
        username: values.email.trim(),
        password: values.password,
      });

      const loginData = response?.data?.data;
      const { user: userData } = applyLoginResponse(loginData);
      dispatch(loginSuccess(userData));

      try {
        const cart = await fetchCart();
        dispatch(setCart(cart?.items || []));
      } catch (cartErr) {
        console.warn("Could not fetch cart after login:", cartErr);
      }

      // Kiểm tra quyền để điều hướng
      // Nếu mảng roles chứa ROLE_CUSTOMER thì vứt ra trang chủ. Còn nhân viên (ADMIN, STAFF...) thì vào /admin
      const isCustomer = isCustomerUser(userData);
      if (isCustomer) {
        navigate("/");
      } else {
        navigate("/admin");
      }
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert(t("auth.serverError"));
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await httpClient.post(`${API_PREFIX}/auth/google`, {
        idToken: credentialResponse.credential,
      });

      const loginData = response.data.data;
      const { user: userData } = applyLoginResponse(loginData);
      dispatch(loginSuccess(userData));

      try {
        const cart = await fetchCart();
        dispatch(setCart(cart?.items || []));
      } catch (cartErr) {
        console.warn("Could not fetch cart after google login:", cartErr);
      }

      const isCustomer = isCustomerUser(userData);
      if (isCustomer) {
        navigate("/");
      } else {
        navigate("/admin");
      }

    } catch (error) {
      if (error.response) {
        alert(t("auth.googleFail") + ": " + (error.response.data.message || "Unknown error"));
      } else {
        alert(t("auth.googleConnectFail"));
      }
    }
  };

  const handleGoogleError = () => {
    alert(t("auth.googleFail"));
  };

  const handleFacebookSuccess = async (response) => {
    const accessToken = response.accessToken || response.authResponse?.accessToken;
    if (accessToken) {
      setIsFbLoading(true);
      try {
        const res = await httpClient.post(`${API_PREFIX}/auth/facebook`, {
          accessToken,
        });

        if (res.data.success) {
          const loginData = res.data.data;
          const { user: userData } = applyLoginResponse(loginData);
          dispatch(loginSuccess(userData));

          try {
            const cart = await fetchCart();
            dispatch(setCart(cart?.items || []));
          } catch (cartErr) {
            console.warn("Could not fetch cart after facebook login:", cartErr);
          }

          const isCustomer = isCustomerUser(userData);
          if (isCustomer) {
            navigate("/");
          } else {
            navigate("/admin");
          }
        }
      } catch (error) {
        if (error.response) {
          alert(t("auth.facebookFail") + ": " + (error.response.data.message || "Unknown error"));
        } else {
          alert(t("auth.facebookConnectFail"));
        }
      } finally {
        setIsFbLoading(false);
      }
    }
  };

  // Dùng hostname hiện tại (IP mạng LAN) thay vì localhost
  // Để điện thoại có thể truy cập qua cùng mạng WiFi
  const qrUrl = `http://${window.location.hostname}:${window.location.port}/scan-qr?token=${qrToken}`;

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

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Box className="login-page">
        {/* Trái — nền cam brand Electro (kiểu Shopee) */}
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

        {/* Phải — form đăng nhập */}
        <main className="login-form-panel">
          <Card elevation={0} className="login-form-card">
            <Typography className="login-form-title" component="h2">
              {t("auth.loginTitle")}
            </Typography>
            <Typography className="login-form-subtitle">
              {t("auth.loginSubtitle")}
            </Typography>

            <Tabs
              className="login-tabs"
              value={loginMethod}
              onChange={(e, newValue) => {
                setLoginMethod(newValue);
                if (newValue === "qr") {
                  fetchQrToken();
                }
              }}
              centered
              sx={{ mb: 3 }}
            >
              <Tab value="password" label={t("auth.tabPassword")} />
              <Tab value="qr" label={t("auth.tabQr")} />
            </Tabs>

            {loginMethod === "password" && (
              <>
                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  noValidate
                  sx={{ display: "flex", flexDirection: "column" }}
                >
                  <TextField
                    label={t("auth.email")}
                    name="email"
                    type="text"
                    autoComplete="username"
                    variant="outlined"
                    fullWidth
                    sx={fieldSx}
                    value={values.email}
                    onChange={handleChange}
                  />
                  <TextField
                    label={t("auth.password")}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    variant="outlined"
                    fullWidth
                    sx={fieldSx}
                    value={values.password}
                    onChange={handleChange}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        value="remember"
                        sx={{ color: "#94a3b8", "&.Mui-checked": { color: PRIMARY } }}
                      />
                    }
                    label={<Typography variant="body2" color="text.secondary">{t("auth.rememberMe")}</Typography>}
                  />

                  <Button type="submit" variant="contained" fullWidth className="login-submit-btn">
                    {t("auth.loginNow")}
                  </Button>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", my: 2 }}>
                  <Divider sx={{ flex: 1 }} />
                  <Typography variant="body2" sx={{ mx: 2, color: "#94a3b8" }}>
                    {t("chatbot.or")}
                  </Typography>
                  <Divider sx={{ flex: 1 }} />
                </Box>

                <Box className="login-social-grid">
                  <Box className="login-social-cell">
                    <Button
                      type="button"
                      variant="outlined"
                      fullWidth
                      className="login-social-btn login-social-btn--google"
                      tabIndex={-1}
                      aria-hidden
                      startIcon={
                        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.083 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                          <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.048 0-9.416-3.054-11.283-7.362l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                        </svg>
                      }
                    >
                      Google
                    </Button>
                    <Box className="login-social-overlay" aria-label="Đăng nhập Google">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        width="100%"
                        theme="outline"
                        text="signin_with"
                        shape="rectangular"
                        size="large"
                      />
                    </Box>
                  </Box>

                  <Box className="login-social-cell">
                    <FacebookLogin
                      appId={FACEBOOK_APP_ID}
                      onSuccess={handleFacebookSuccess}
                      onFail={(error) => console.log("Facebook Login Fail:", error)}
                      render={({ onClick }) => (
                        <Button
                          onClick={onClick}
                          variant="outlined"
                          fullWidth
                          disabled={isFbLoading}
                          className="login-social-btn login-social-btn--facebook"
                          startIcon={
                            isFbLoading ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <FacebookIcon sx={{ color: "#1877F2" }} />
                            )
                          }
                        >
                          {isFbLoading ? "..." : "Facebook"}
                        </Button>
                      )}
                    />
                  </Box>
                </Box>
              </>
            )}

            {loginMethod === "qr" && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Typography
                  variant="body2"
                  sx={{ mb: 2, textAlign: "center", color: "#64748b" }}
                >
                  {t("auth.qrScanHint")}
                </Typography>

                <Box
                  sx={{
                    p: 2,
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 2,
                    minWidth: 180,
                    minHeight: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {qrLoading ? (
                    <CircularProgress size={48} sx={{ color: PRIMARY }} />
                  ) : qrToken ? (
                    <QRCodeCanvas value={qrUrl} size={180} />
                  ) : qrError ? (
                    <Typography
                      sx={{ color: "#d32f2f", width: 180, textAlign: "center", fontSize: 13, px: 1 }}
                    >
                      {qrError}
                    </Typography>
                  ) : (
                    <Typography sx={{ color: "#64748b", width: 180, textAlign: "center" }}>
                      {t("auth.qrGenerating")}
                    </Typography>
                  )}
                </Box>

                <Button variant="text" sx={{ mt: 2, color: PRIMARY }} onClick={fetchQrToken}>
                  {t("auth.refreshQr")}
                </Button>
              </Box>
            )}

            <Box className="login-footer-links">
              <Typography variant="body2" color="text.secondary">
                {t("auth.noAccount")}{" "}
                <Link to="/register">{t("auth.registerNow")}</Link>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <Link to="/forgot-password" className="login-muted-link">
                  {t("auth.forgotPassword")}
                </Link>
              </Typography>
            </Box>
          </Card>
        </main>
      </Box>
    </GoogleOAuthProvider>
  );
};

export default Login;
