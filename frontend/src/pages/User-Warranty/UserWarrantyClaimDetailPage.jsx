import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  LocalShipping as ShipIcon,
} from "@mui/icons-material";
import ProfileMenu from "../../components/Profile-Menu/ProfileMenu";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/appSlice";
import { getMyWarrantyClaimDetail } from "../../services/warrantyService";
import { CLAIM_STATUS_COLORS } from "../../utils/warrantyClaimStatus";
import { isApiSuccess } from "../../utils/apiResponse";

const TRACKING_STATUSES = ["APPROVED", "RECEIVED", "INSPECTING", "REPAIRING", "COMPLETED"];

const UserWarrantyClaimDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyWarrantyClaimDetail(id);
        if (isApiSuccess(res)) setClaim(res.data);
      } catch {
        setClaim(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const showTracking = claim && TRACKING_STATUSES.includes(claim.status);

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, bgcolor: "#f9f9f9", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <Box sx={{ width: "100%", maxWidth: 1200, display: "flex", flexDirection: { xs: "column", md: "row" }, border: "1px solid #e0e0e0", borderRadius: 2, bgcolor: "#fff", overflow: "hidden" }}>
        <Box sx={{ width: { xs: "100%", md: 260 } }}>
          <ProfileMenu activePage={t("profile.warranty")} user={user} />
        </Box>
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate("/user/warranty")} sx={{ mb: 2 }}>
            {t("userWarranty.claimList")}
          </Button>

          {loading ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : !claim ? (
            <Typography>{t("userWarranty.notFound")}</Typography>
          ) : (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                <Typography variant="h5" fontWeight="bold">
                  #{claim.claimNumber}
                </Typography>
                <Chip
                  size="small"
                  label={t(`userWarranty.status.${claim.status}`, { defaultValue: claim.statusDisplay || claim.status })}
                  sx={{ bgcolor: CLAIM_STATUS_COLORS[claim.status] || "#94a3b8", color: "#fff" }}
                />
              </Box>

              <Typography variant="body2" gutterBottom>
                <strong>{t("userWarranty.product")}</strong> {claim.productName}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>{t("userWarranty.imei")}</strong> {claim.submittedImei}
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
                <strong>{t("userWarranty.issueDesc")}</strong> {claim.issueDescription}
              </Typography>

              {showTracking && (
                <Paper sx={{ p: 2.5, mb: 2, border: "2px solid #3b82f6", bgcolor: "#eff6ff" }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <ShipIcon color="primary" />
                    {t("userWarranty.returnPickup")}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>{t("userWarranty.carrier")}</strong> {claim.returnCarrier || "—"}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, fontFamily: "monospace" }}>
                    <strong>{t("userWarranty.trackingCode")}</strong>{" "}
                    {claim.returnTrackingCode ? `#${claim.returnTrackingCode.replace(/^#/, "")}` : "—"}
                  </Typography>
                  {claim.returnInstruction && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      {claim.returnInstruction}
                    </Alert>
                  )}
                </Paper>
              )}

              {claim.status === "PENDING" && (
                <Alert severity="warning">
                  {t("userWarranty.pendingAlert")}
                </Alert>
              )}
              {claim.status === "REJECTED" && (
                <Alert severity="error">
                  {t("userWarranty.rejectedAlert")}{" "}
                  {claim.staffNotes ? t("userWarranty.rejectedReason", { reason: claim.staffNotes }) : ""}
                </Alert>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default UserWarrantyClaimDetailPage;
