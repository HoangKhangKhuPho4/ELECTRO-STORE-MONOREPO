import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const TRACKING_STATUSES = ["APPROVED", "RECEIVED", "INSPECTING", "REPAIRING"];
import { useSelector } from "react-redux";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import { LocalShipping as ShipIcon } from "@mui/icons-material";
import {
  Build as RepairIcon,
  Search as SearchIcon,
  ShoppingBag as OrderIcon,
  Shield as ShieldIcon,
} from "@mui/icons-material";
import ProfileMenu from "../../components/Profile-Menu/ProfileMenu";
import { selectUser } from "../../redux/appSlice";
import { getMyWarrantyClaims } from "../../services/warrantyService";
import { CLAIM_STATUS_COLORS } from "../../utils/warrantyClaimStatus";
import { isApiSuccess } from "../../utils/apiResponse";

const UserWarrantyPage = () => {
  const { t } = useTranslation();
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyWarrantyClaims({ page: 0, size: 20 });
        if (isApiSuccess(res) && res.data?.content) {
          setClaims(res.data.content);
        }
      } catch {
        setClaims([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: { xs: 2, md: 3 },
        backgroundColor: "#f9f9f9",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1200,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          border: "1px solid #e0e0e0",
          borderRadius: 2,
          backgroundColor: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ width: { xs: "100%", md: 260 }, minWidth: { md: 260 } }}>
          <ProfileMenu activePage={t("profile.warranty")} user={user} />
        </Box>

        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShieldIcon color="primary" />
            {t("userWarranty.title")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {t("userWarranty.subtitle")}
          </Typography>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ height: "100%", borderColor: "#3b82f6" }}>
                <CardContent>
                  <SearchIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                  <Typography fontWeight="bold" gutterBottom>
                    {t("userWarranty.lookupTitle")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t("userWarranty.lookupDesc")}
                  </Typography>
                  <Button variant="outlined" fullWidth onClick={() => navigate("/warranty-check")}>
                    {t("userWarranty.openLookup")}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ height: "100%", borderColor: "#f59e0b" }}>
                <CardContent>
                  <OrderIcon sx={{ fontSize: 36, mb: 1, color: "#f59e0b" }} />
                  <Typography fontWeight="bold" gutterBottom>
                    {t("userWarranty.fromOrderTitle")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t("userWarranty.fromOrderDesc")}
                  </Typography>
                  <Button variant="contained" color="warning" fullWidth onClick={() => navigate("/user/orders")}>
                    {t("userWarranty.myOrdersBtn")}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ height: "100%", borderColor: "#16a34a" }}>
                <CardContent>
                  <RepairIcon sx={{ fontSize: 36, mb: 1, color: "#16a34a" }} />
                  <Typography fontWeight="bold" gutterBottom>
                    {t("userWarranty.byImeiTitle")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t("userWarranty.byImeiDesc")}
                  </Typography>
                  <Button variant="contained" color="success" fullWidth onClick={() => navigate("/warranty-check")}>
                    {t("userWarranty.submitOnline")}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {t("userWarranty.myClaims")}
          </Typography>

          {loading ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <CircularProgress size={32} />
            </Box>
          ) : claims.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: "center", bgcolor: "#fafafa" }}>
              <Typography color="text.secondary">
                {t("userWarranty.emptyClaims")}
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {claims.map((c) => (
                <Paper
                  key={c.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#f8fafc" },
                  }}
                  onClick={() => navigate(`/user/warranty/${c.id}`)}
                >
                  <Box>
                    <Typography fontWeight="bold">#{c.claimNumber}</Typography>
                    <Typography variant="body2">{c.productName}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                    </Typography>
                    {TRACKING_STATUSES.includes(c.status) && c.returnTrackingCode && (
                      <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5, color: "#1d4ed8" }}>
                        <ShipIcon sx={{ fontSize: 14 }} />
                        {c.returnCarrier}: #{String(c.returnTrackingCode).replace(/^#/, "")}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    size="small"
                    label={t(`userWarranty.status.${c.status}`, { defaultValue: c.statusDisplay || c.status })}
                    sx={{ bgcolor: CLAIM_STATUS_COLORS[c.status] || "#94a3b8", color: "#fff" }}
                  />
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default UserWarrantyPage;
