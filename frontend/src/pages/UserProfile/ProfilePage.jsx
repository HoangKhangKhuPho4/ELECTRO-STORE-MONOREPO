import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import ProfileMenu from "../../components/Profile-Menu/ProfileMenu.jsx";
import { loginSuccess, selectUser } from "../../redux/appSlice.js";
import { getMyProfile, updateMyProfile } from "../../services/userService.js";

// --- Component 2: Form ở giữa ---
const ProfileForm = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    gender: "",
    address: "",
    day: "",
    month: "",
    year: "",
  });

  // Username & email (chỉ hiển thị, không sửa được)
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // Tạo danh sách ngày, tháng, năm
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Fetch profile từ API khi component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyProfile();
        const user = res.data;

        setUsername(user.username || "");
        setEmail(user.email || "");

        // Parse birth date (assuming ISO format yyyy-MM-dd)
        let day = "", month = "", year = "";
        if (user.birthAt || user.birth) {
          const birthDate = new Date(user.birthAt || user.birth);
          day = birthDate.getDate();
          month = birthDate.getMonth() + 1;
          year = birthDate.getFullYear();
        }

        setFormData({
          fullName: user.fullName || user.name || "",
          phone: user.phone || "",
          gender: user.gender || "Khác",
          address: user.address || "",
          day,
          month,
          year,
        });
      } catch (error) {
        console.error("Lỗi khi lấy profile:", error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || t("profile.loadFail"),
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build birth date string (yyyy-MM-dd)
      let birthAt = null;
      if (formData.day && formData.month && formData.year) {
        const m = String(formData.month).padStart(2, "0");
        const d = String(formData.day).padStart(2, "0");
        birthAt = `${formData.year}-${m}-${d}`;
      }

      const updatePayload = {
        fullName: formData.fullName,
        phone: formData.phone,
        gender: formData.gender,
        address: formData.address,
        birthAt,
      };

      const res = await updateMyProfile(updatePayload);
      const updatedUser = res.data;

      // Cập nhật Redux & localStorage
      dispatch(loginSuccess(updatedUser));
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setSnackbar({
        open: true,
        message: res.message || t("profile.saveSuccess"),
        severity: "success",
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật profile:", error);
      const msg = error.response?.data?.message || t("profile.saveFail");
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Paper
        sx={{
          p: 4,
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  // Mask email: ho********@gmail.com
  const maskEmail = (em) => {
    if (!em) return "";
    const [local, domain] = em.split("@");
    if (local.length <= 2) return em;
    return local.slice(0, 2) + "********@" + domain;
  };

  return (
    <Paper sx={{ p: 4, height: "100%" }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {t("profile.myProfile")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        {t("profile.profileDesc")}
      </Typography>

      <TextField
        label={t("profile.username")}
        value={username}
        disabled
        helperText={t("profile.usernameHint")}
        fullWidth
        margin="normal"
      />

      <TextField
        label={t("profile.fullName")}
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />

      {/* Email - chỉ hiển thị masked */}
      <Box sx={{ display: "flex", alignItems: "center", my: "16px" }}>
        <Typography sx={{ flexGrow: 1 }}>{t("profile.emailLabel")} {maskEmail(email)}</Typography>
      </Box>

      <TextField
        label={t("profile.phone")}
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />

      <TextField
        label={t("profile.addressLabel")}
        name="address"
        value={formData.address}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />

      <FormControl margin="normal">
        <FormLabel>{t("profile.gender")}</FormLabel>
        <RadioGroup
          row
          name="gender"
          value={formData.gender}
          onChange={handleChange}
        >
          <FormControlLabel value="Nam" control={<Radio />} label={t("profile.male")} />
          <FormControlLabel value="Nữ" control={<Radio />} label={t("profile.female")} />
          <FormControlLabel value="Khác" control={<Radio />} label={t("profile.other")} />
        </RadioGroup>
      </FormControl>

      <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 4 }}>
        <FormControl fullWidth>
          <InputLabel>{t("profile.day")}</InputLabel>
          <Select
            label={t("profile.day")}
            name="day"
            value={formData.day}
            onChange={handleChange}
          >
            {days.map((day) => (
              <MenuItem key={day} value={day}>
                {day}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>{t("profile.month")}</InputLabel>
          <Select
            label={t("profile.month")}
            name="month"
            value={formData.month}
            onChange={handleChange}
          >
            {months.map((month) => (
              <MenuItem key={month} value={month}>
                {t("profile.monthOption", { month })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>{t("profile.year")}</InputLabel>
          <Select
            label={t("profile.year")}
            name="year"
            value={formData.year}
            onChange={handleChange}
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Nút lưu */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{
            backgroundColor: "#ee4d2d",
            "&:hover": { backgroundColor: "#d73112" },
            px: 5,
          }}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : t("profile.save")}
        </Button>
      </Box>

      {/* Snackbar thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Paper>
  );
};

// --- Component chính: Sắp xếp 3 component vào Grid ---
const ProfilePage = () => {
  const { t } = useTranslation();
  const user = useSelector(selectUser);

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: 3,
        backgroundColor: "#f9f9f9",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Grid container spacing={0} sx={{ maxWidth: 1200 }}>
        {/* Cột 1: Menu */}
        <Grid item xs={12} md={3}>
          <ProfileMenu activePage={t("profile.profile")} user={user} />
        </Grid>
        {/* Cột 2: Form */}
        <Grid item xs={12} md={9}>
          <ProfileForm />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
