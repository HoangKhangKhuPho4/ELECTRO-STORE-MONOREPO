import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Build as RepairIcon } from "@mui/icons-material";
import { selectUser } from "../../redux/appSlice";
import { checkWarranty, submitWarrantyClaim } from "../../services/warrantyService";
import { isApiSuccess } from "../../utils/apiResponse";
import { formatDate } from "../../utils/formatters";
import { useGHNShipping } from "../../hooks/useGHNShipping";
import { resolveGhnFromOrderContext } from "../../utils/warrantyFromOrder";

const ISSUE_TYPES = ["NOT_WORKING", "DEFECTIVE", "DAMAGED", "MISSING_PARTS", "OTHER"];
const REQUEST_TYPES = ["REPAIR", "REPLACE", "REFUND"];

/**
 * Gửi yêu cầu BH từ Đơn hàng của tôi — tự tra cứu BH, điền liên hệ & địa chỉ lấy hàng GHN.
 */
const WarrantyClaimFromOrderDialog = ({ open, onClose, context }) => {
  const { t } = useTranslation();
  const user = useSelector(selectUser);
  const {
    provinces,
    districts,
    wards,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    loadingDistricts,
    loadingWards,
    onProvinceChange,
    onDistrictChange,
    onWardChange,
    resetShipping,
  } = useGHNShipping(0);

  const [form, setForm] = useState({
    submittedImei: "",
    issueDescription: "",
    issueType: "NOT_WORKING",
    customerRequest: "REPAIR",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactAddress: "",
    imageUrl1: "",
    videoUrl: "",
  });
  const [warrantyInfo, setWarrantyInfo] = useState(null);
  const [warrantyLoading, setWarrantyLoading] = useState(false);
  const [warrantyError, setWarrantyError] = useState("");
  const [addressPrefillNote, setAddressPrefillNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successClaim, setSuccessClaim] = useState(null);
  const prefillDoneRef = useRef(false);

  useEffect(() => {
    if (!open) {
      prefillDoneRef.current = false;
      return;
    }
    if (!context) return;

    setError("");
    setSuccessClaim(null);
    setWarrantyInfo(null);
    setWarrantyError("");
    setAddressPrefillNote("");
    resetShipping();
    prefillDoneRef.current = false;

    setForm({
      submittedImei: context.imei || "",
      issueDescription: "",
      issueType: "NOT_WORKING",
      customerRequest: "REPAIR",
      contactName: context.shippingName || user?.name || user?.fullName || "",
      contactPhone: context.shippingPhone || user?.phone || "",
      contactEmail: user?.email || "",
      contactAddress: context.shippingAddress || "",
      imageUrl1: "",
      videoUrl: "",
    });

    const imei = (context.imei || "").trim();
    if (!imei) return;

    let cancelled = false;
    setWarrantyLoading(true);
    checkWarranty(imei)
      .then((json) => {
        if (cancelled) return;
        if (json.success && json.data) {
          setWarrantyInfo(json.data);
        } else {
          setWarrantyError(json.message || t("warranty.claim.lookupFail"));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setWarrantyError(
            err.response?.data?.message || t("warranty.claim.lookupFail")
          );
        }
      })
      .finally(() => {
        if (!cancelled) setWarrantyLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, context, user]);

  useEffect(() => {
    if (!open || !context || prefillDoneRef.current || provinces.length === 0) return;

    let cancelled = false;
    prefillDoneRef.current = true;

    (async () => {
      try {
        const ghn = await resolveGhnFromOrderContext(context, provinces);
        if (cancelled) return;
        if (ghn.province) {
          await onProvinceChange(ghn.province.id, ghn.province.name);
          if (ghn.district) {
            await onDistrictChange(ghn.district.id, ghn.district.name);
            if (ghn.ward) {
              await onWardChange(ghn.ward.code, ghn.ward.name);
            } else {
              setAddressPrefillNote(t("warranty.claim.prefillWard"));
            }
          } else {
            setAddressPrefillNote(t("warranty.claim.prefillDistrict"));
          }
        } else if (context.shippingProvince) {
          setAddressPrefillNote(t("warranty.claim.prefillProvince"));
        }
      } catch {
        if (!cancelled) {
          setAddressPrefillNote(t("warranty.claim.prefillGhnFail"));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, context, provinces.length]);

  const validatePickup = () => {
    if (!form.submittedImei?.trim()) return t("warranty.claim.errImei");
    if (!form.issueDescription?.trim()) return t("warranty.claim.errIssue");
    if (!form.contactName?.trim()) return t("warranty.claim.errName");
    if (!form.contactPhone?.trim()) return t("warranty.claim.errPhone");
    if (!selectedProvince) return t("warranty.claim.errProvince");
    if (!selectedDistrict) return t("warranty.claim.errDistrict");
    if (!selectedWard) return t("warranty.claim.errWard");
    if (!form.contactAddress?.trim()) return t("warranty.claim.errStreet");
    return null;
  };

  const formatPickupPreview = () => {
    if (!selectedProvince) return null;
    return [
      form.contactAddress.trim(),
      selectedWard?.name,
      selectedDistrict?.name,
      selectedProvince?.name,
    ]
      .filter(Boolean)
      .join(", ");
  };

  const handleSubmit = async () => {
    const validationError = validatePickup();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await submitWarrantyClaim({
        submittedImei: form.submittedImei.trim(),
        orderId: context.orderId,
        orderDetailId: context.orderDetailId,
        issueDescription: form.issueDescription.trim(),
        issueType: form.issueType,
        customerRequest: form.customerRequest,
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail,
        contactAddress: form.contactAddress.trim(),
        contactProvince: selectedProvince.name,
        contactDistrict: selectedDistrict.name,
        contactWard: selectedWard.name,
        pickupToDistrictId: selectedDistrict.id,
        pickupToWardCode: String(selectedWard.code),
        imageUrl1: form.imageUrl1 || undefined,
        videoUrl: form.videoUrl || undefined,
      });
      if (isApiSuccess(res)) {
        setSuccessClaim(res.data?.claimNumber || "OK");
      } else {
        setError(res.message || t("warranty.claim.submitFail"));
      }
    } catch (err) {
      setError(err.response?.data?.message || t("warranty.claim.submitError"));
    } finally {
      setLoading(false);
    }
  };

  const renderWarrantyBadge = () => {
    if (!warrantyInfo) return null;
    if (
      warrantyInfo.warrantyStartDate === null &&
      warrantyInfo.warrantyEndDate === null &&
      warrantyInfo.valid
    ) {
      return <Chip size="small" label={t("warranty.claim.badgeNotActivated")} color="warning" />;
    }
    return (
      <Chip
        size="small"
        label={warrantyInfo.valid ? t("warranty.claim.badgeValid") : t("warranty.claim.badgeExpired")}
        color={warrantyInfo.valid ? "success" : "error"}
      />
    );
  };

  if (!context) return null;

  const productSuffix = context.variantName
    ? ` · ${context.variantName}`
    : ` · ${context.productName}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <RepairIcon color="primary" />
        {t("order.warrantyRequest")}
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("warranty.claim.orderAlert", {
            code: context.orderCode,
            product: productSuffix,
          })}
        </Alert>

        {successClaim ? (
          <Alert severity="success">
            {t("warranty.claim.success", { number: successClaim })}
          </Alert>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: warrantyInfo?.valid ? "success.light" : "divider",
                bgcolor: "grey.50",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {t("warranty.claim.warrantyInfoTitle")}
              </Typography>
              {warrantyLoading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2">{t("warranty.claim.lookingUpImei")}</Typography>
                </Box>
              )}
              {!warrantyLoading && warrantyError && (
                <Alert severity="warning" sx={{ py: 0.5 }}>
                  {warrantyError}
                </Alert>
              )}
              {!warrantyLoading && warrantyInfo && (
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {warrantyInfo.imageUrl ? (
                    <Avatar
                      src={warrantyInfo.imageUrl}
                      variant="rounded"
                      sx={{ width: 64, height: 64 }}
                    />
                  ) : (
                    <Avatar variant="rounded" sx={{ width: 64, height: 64, bgcolor: "grey.300" }}>
                      📱
                    </Avatar>
                  )}
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {warrantyInfo.productName}
                    </Typography>
                    {warrantyInfo.variantName && (
                      <Typography variant="body2" color="text.secondary">
                        {warrantyInfo.variantName}
                      </Typography>
                    )}
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                      {renderWarrantyBadge()}
                      <Chip
                        size="small"
                        variant="outlined"
                        label={
                          t(`warranty.status.${warrantyInfo.status}`, {
                            defaultValue: warrantyInfo.status,
                          })
                        }
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {t("order.imeiSerial")} <strong>{warrantyInfo.imei || form.submittedImei}</strong>
                    </Typography>
                    {warrantyInfo.warrantyStartDate ? (
                      <Typography variant="body2" color="text.secondary">
                        {t("warranty.claim.warrantyPeriodRange", {
                          start: formatDate(warrantyInfo.warrantyStartDate),
                          end: warrantyInfo.warrantyEndDate
                            ? formatDate(warrantyInfo.warrantyEndDate)
                            : "N/A",
                          months: warrantyInfo.warrantyMonths,
                        })}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t("warranty.claim.warrantyNotActivatedPeriod", {
                          months: warrantyInfo.warrantyMonths,
                        })}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t("warranty.claim.sectionDevice")}
            </Typography>
            <TextField
              label={t("warranty.claim.imeiOrderLabel")}
              required
              fullWidth
              size="small"
              value={form.submittedImei}
              onChange={(e) => setForm({ ...form, submittedImei: e.target.value })}
              helperText={t("warranty.claim.imeiHelper")}
            />
            <TextField
              label={t("warranty.claim.issueLabel")}
              required
              fullWidth
              multiline
              rows={3}
              value={form.issueDescription}
              onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
              placeholder={t("warranty.claim.issuePlaceholder")}
            />
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                select
                label={t("warranty.claim.issueTypeLabel")}
                size="small"
                sx={{ flex: 1, minWidth: 180 }}
                value={form.issueType}
                onChange={(e) => setForm({ ...form, issueType: e.target.value })}
              >
                {ISSUE_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {t(`warranty.claim.issueType.${type}`)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={t("warranty.claim.requestTypeLabel")}
                size="small"
                sx={{ flex: 1, minWidth: 180 }}
                value={form.customerRequest}
                onChange={(e) => setForm({ ...form, customerRequest: e.target.value })}
              >
                {REQUEST_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {t(`warranty.claim.requestType.${type}`)}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t("warranty.claim.sectionContact")}
            </Typography>
            {addressPrefillNote && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                {addressPrefillNote}
              </Alert>
            )}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label={t("warranty.claim.nameLabel")}
                required
                fullWidth
                size="small"
                sx={{ flex: 1, minWidth: 200 }}
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              />
              <TextField
                label={t("warranty.claim.phoneLabel")}
                required
                fullWidth
                size="small"
                sx={{ flex: 1, minWidth: 160 }}
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="0901234567"
              />
            </Box>
            <TextField
              label={t("warranty.claim.emailLabel")}
              fullWidth
              size="small"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
            <TextField
              select
              label={t("warranty.claim.provinceLabel")}
              required
              fullWidth
              size="small"
              value={selectedProvince?.id || ""}
              onChange={(e) => {
                const prov = provinces.find((p) => String(p.provinceId) === e.target.value);
                onProvinceChange(prov?.provinceId || null, prov?.provinceName || "");
              }}
            >
              <MenuItem value="">{t("warranty.claim.selectProvince")}</MenuItem>
              {provinces.map((p) => (
                <MenuItem key={p.provinceId} value={p.provinceId}>
                  {p.provinceName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t("warranty.claim.districtLabel")}
              required
              fullWidth
              size="small"
              disabled={!selectedProvince || loadingDistricts}
              value={selectedDistrict?.id || ""}
              onChange={(e) => {
                const dist = districts.find((d) => String(d.districtId) === e.target.value);
                onDistrictChange(dist?.districtId || null, dist?.districtName || "");
              }}
            >
              <MenuItem value="">
                {loadingDistricts ? t("common.loading") : t("warranty.claim.selectDistrict")}
              </MenuItem>
              {districts.map((d) => (
                <MenuItem key={d.districtId} value={d.districtId}>
                  {d.districtName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t("warranty.claim.wardLabel")}
              required
              fullWidth
              size="small"
              disabled={!selectedDistrict || loadingWards}
              value={selectedWard?.code || ""}
              onChange={(e) => {
                const ward = wards.find((w) => String(w.wardCode) === e.target.value);
                onWardChange(ward?.wardCode || null, ward?.wardName || "");
              }}
            >
              <MenuItem value="">
                {loadingWards ? t("common.loading") : t("warranty.claim.selectWard")}
              </MenuItem>
              {wards.map((w) => (
                <MenuItem key={w.wardCode} value={w.wardCode}>
                  {w.wardName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("warranty.claim.streetLabel")}
              required
              fullWidth
              size="small"
              value={form.contactAddress}
              onChange={(e) => setForm({ ...form, contactAddress: e.target.value })}
              placeholder={t("warranty.claim.streetPlaceholder")}
            />
            {formatPickupPreview() && (
              <Typography variant="body2" color="text.secondary">
                <strong>{t("warranty.claim.pickupPreview")}</strong> {formatPickupPreview()}
              </Typography>
            )}

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t("warranty.claim.sectionProof")}
            </Typography>
            <TextField
              label={t("warranty.claim.imageLabel")}
              fullWidth
              size="small"
              value={form.imageUrl1}
              onChange={(e) => setForm({ ...form, imageUrl1: e.target.value })}
              placeholder={t("warranty.claim.imagePlaceholder")}
            />
            <TextField
              label={t("warranty.claim.videoIssueLabel")}
              fullWidth
              size="small"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder={t("warranty.claim.videoPlaceholder")}
            />

            {error && (
              <Alert severity="error" sx={{ py: 0.5 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {successClaim ? t("order.close") : t("profile.cancel")}
        </Button>
        {!successClaim && (
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? t("warranty.claim.submitting") : t("warranty.claim.submit")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WarrantyClaimFromOrderDialog;
