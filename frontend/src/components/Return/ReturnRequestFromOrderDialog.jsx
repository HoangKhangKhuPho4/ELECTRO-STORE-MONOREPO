import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { AssignmentReturn as ReturnIcon } from "@mui/icons-material";
import {
  RETURN_REASON_OPTIONS,
  createReturnRequest,
  markReturnRequestShipped,
  cancelReturnRequest,
} from "../../services/customerReturnRequestService";
import { getApiErrorMessage, isApiSuccess } from "../../utils/apiResponse";

const SHIP_DEADLINE_DAYS = 7;

const REASON_I18N_KEYS = {
  CHANGE_OF_MIND: "return.reason.changeOfMind",
  COLOR_ISSUE: "return.reason.colorIssue",
  WRONG_PRODUCT: "return.reason.wrongProduct",
  MINOR_DAMAGE: "return.reason.minorDamage",
  MISSING_ACCESSORY: "return.reason.missingAccessory",
  OTHER: "return.reason.other",
};

const ReturnRequestFromOrderDialog = ({ open, onClose, context, existingRequest, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const [reasonType, setReasonType] = useState("CHANGE_OF_MIND");
  const [reasonDetail, setReasonDetail] = useState("");
  const [returnTracking, setReturnTracking] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(existingRequest || null);

  const dateLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";

  const reasonOptions = useMemo(
    () =>
      RETURN_REASON_OPTIONS.map((o) => ({
        value: o.value,
        label: t(REASON_I18N_KEYS[o.value] || o.value),
      })),
    [t, i18n.language]
  );

  useEffect(() => {
    if (open) {
      setDetail(existingRequest || null);
      setError("");
    }
  }, [open, existingRequest]);

  const isViewMode = Boolean(detail);
  const canShip = detail?.canCustomerShip;
  const canCancel = detail?.canCustomerCancel;

  const handleClose = () => {
    setError("");
    setReasonType("CHANGE_OF_MIND");
    setReasonDetail("");
    setReturnTracking("");
    setDetail(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!context?.orderCode || !context?.serialNumber) {
      setError(t("return.missingInfo"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await createReturnRequest({
        orderCode: context.orderCode,
        serialNumber: context.serialNumber,
        reasonType,
        reasonDetail: reasonDetail.trim() || undefined,
      });
      if (isApiSuccess(res)) {
        setDetail(res.data);
        onSuccess?.(res.data);
      } else {
        setError(res?.message || t("return.submitFail"));
      }
    } catch (e) {
      setError(getApiErrorMessage(e, t("return.submitReturnFail")));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkShipped = async () => {
    if (!detail?.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await markReturnRequestShipped(detail.id, returnTracking.trim());
      if (isApiSuccess(res)) {
        setDetail(res.data);
        onSuccess?.(res.data);
      }
    } catch (e) {
      setError(getApiErrorMessage(e, t("return.updateFail")));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!detail?.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await cancelReturnRequest(detail.id);
      if (isApiSuccess(res)) {
        setDetail(res.data);
        onSuccess?.(res.data);
      }
    } catch (e) {
      setError(getApiErrorMessage(e, t("return.cancelFail")));
    } finally {
      setLoading(false);
    }
  };

  if (!context && !detail) return null;

  const shipDeadlineText =
    detail?.shipDeadline
      ? t("return.deadlineSuffix", {
          date: new Date(detail.shipDeadline).toLocaleDateString(dateLocale),
        })
      : "";

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle component="div">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ReturnIcon color="error" />
          <Typography component="span" variant="h6" fontWeight={700}>
            {isViewMode
              ? t("return.titleView", { code: detail.requestCode })
              : t("return.title")}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ mb: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">{t("return.orderLabel")}</Typography>
          <Typography fontWeight={700}>{context?.orderCode || detail?.orderCode}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {context?.productName || detail?.productName}
            {(context?.variantName || detail?.variantName) && ` — ${context?.variantName || detail?.variantName}`}
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: "monospace", display: "block", mt: 0.5 }}>
            {t("return.serialLabel")} {context?.serialNumber || detail?.serialNumber}
          </Typography>
        </Box>

        {isViewMode ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Chip label={detail.statusLabel} color="primary" sx={{ alignSelf: "flex-start" }} />
            <Typography variant="body2">
              <strong>{t("return.reasonLabel")}</strong> {detail.reasonTypeLabel}
              {detail.reasonDetail ? ` — ${detail.reasonDetail}` : ""}
            </Typography>
            {detail.status === "PENDING_SALES_REVIEW" && (
              <Alert severity="info">
                <span dangerouslySetInnerHTML={{ __html: t("return.pendingReview") }} />
              </Alert>
            )}
            {detail.status === "APPROVED" && (
              <Alert severity="success">
                <span
                  dangerouslySetInnerHTML={{
                    __html: t("return.approved", {
                      days: detail.daysLeftToShip ?? SHIP_DEADLINE_DAYS,
                      deadline: shipDeadlineText,
                    }),
                  }}
                />
                {detail.salesResponseNote && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {t("return.salesNote", { note: detail.salesResponseNote })}
                  </Typography>
                )}
              </Alert>
            )}
            {detail.status === "REJECTED" && (
              <Alert severity="error">
                {t("return.rejected", { reason: detail.rejectionReason })}
              </Alert>
            )}
            {detail.status === "SHIPPED_BY_CUSTOMER" && (
              <Alert severity="info">
                {t("return.shipped")}
                {detail.customerReturnTracking && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {t("return.returnTracking", { code: detail.customerReturnTracking })}
                  </Typography>
                )}
              </Alert>
            )}
            {canShip && (
              <TextField
                label={t("return.trackingFieldLabel")}
                fullWidth
                size="small"
                value={returnTracking}
                onChange={(e) => setReturnTracking(e.target.value)}
                placeholder={t("return.trackingPlaceholder")}
              />
            )}
          </Box>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              <span
                dangerouslySetInnerHTML={{
                  __html: t("return.infoBanner", { days: SHIP_DEADLINE_DAYS }),
                }}
              />
            </Alert>
            <TextField
              select
              fullWidth
              label={t("return.reasonFieldLabel")}
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value)}
              sx={{ mb: 2 }}
            >
              {reasonOptions.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={t("return.reasonDetailLabel")}
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder={t("return.reasonDetailPlaceholder")}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>{t("return.close")}</Button>
        {canCancel && (
          <Button color="error" onClick={handleCancel} disabled={loading}>
            {t("return.cancelRequest")}
          </Button>
        )}
        {canShip && (
          <Button variant="contained" onClick={handleMarkShipped} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : t("return.markShipped")}
          </Button>
        )}
        {!isViewMode && (
          <Button variant="contained" color="error" onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : t("return.submit")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReturnRequestFromOrderDialog;
