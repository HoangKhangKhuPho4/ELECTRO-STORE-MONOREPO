import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/appSlice";
import { submitWarrantyClaim } from "../../services/warrantyService";
import { isApiSuccess } from "../../utils/apiResponse";
import { useGHNShipping } from "../../hooks/useGHNShipping";

const WarrantyClaimSubmitForm = ({ defaultImei = "" }) => {
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
  } = useGHNShipping(0);

  const [form, setForm] = useState({
    submittedImei: defaultImei,
    issueDescription: "",
    contactName: user?.name || user?.fullName || "",
    contactPhone: user?.phone || "",
    contactEmail: user?.email || "",
    contactAddress: "",
    imageUrl1: "",
    videoUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="warranty-claim-submit-login-hint">
        <p style={{ fontWeight: 600, color: "#111827" }}>
          {t("warranty.claim.loginTitle")}
        </p>
        <p>
          <Trans
            i18nKey="warranty.claim.loginHint"
            components={{ 1: <Link to="/login" /> }}
          />
        </p>
      </div>
    );
  }

  const validatePickup = () => {
    if (!form.contactName.trim()) return t("warranty.claim.errName");
    if (!form.contactPhone.trim()) return t("warranty.claim.errPhone");
    if (!selectedProvince) return t("warranty.claim.errProvince");
    if (!selectedDistrict) return t("warranty.claim.errDistrict");
    if (!selectedWard) return t("warranty.claim.errWard");
    if (!form.contactAddress.trim()) return t("warranty.claim.errStreet");
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pickupErr = validatePickup();
    if (pickupErr) {
      setError(pickupErr);
      return;
    }
    setLoading(true);
    setError("");
    setSuccess(null);
    try {
      const res = await submitWarrantyClaim({
        submittedImei: form.submittedImei.trim(),
        issueDescription: form.issueDescription.trim(),
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
        issueType: "NOT_WORKING",
        customerRequest: "REPAIR",
      });
      if (isApiSuccess(res)) {
        setSuccess(res.data?.claimNumber || t("warranty.claim.submitted"));
      } else {
        setError(res.message || t("warranty.claim.submitFail"));
      }
    } catch (err) {
      setError(err.response?.data?.message || t("warranty.claim.submitError"));
    } finally {
      setLoading(false);
    }
  };

  const formatPickupPreview = () => {
    if (!selectedProvince) return null;
    const parts = [
      form.contactAddress.trim(),
      selectedWard?.name,
      selectedDistrict?.name,
      selectedProvince?.name,
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <div className="warranty-claim-submit-wrap">
      <div className="warranty-claim-submit">
        <h3>{t("warranty.claim.title")}</h3>
        <p>{t("warranty.claim.desc")}</p>
        {success && (
          <div className="warranty-alert warranty-alert--success" role="status">
            {t("warranty.claim.success", { number: success })}
          </div>
        )}
        {error && (
          <div className="warranty-alert warranty-alert--error" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <p className="warranty-form-section-title">{t("warranty.claim.sectionDevice")}</p>
          <label htmlFor="warranty-claim-imei">{t("warranty.claim.imeiLabel")}</label>
          <input
            id="warranty-claim-imei"
            className="warranty-detail-value--code"
            required
            value={form.submittedImei}
            onChange={(e) => setForm({ ...form, submittedImei: e.target.value })}
          />
          <label htmlFor="warranty-claim-issue">{t("warranty.claim.issueLabel")}</label>
          <textarea
            id="warranty-claim-issue"
            required
            rows={3}
            value={form.issueDescription}
            onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
            placeholder={t("warranty.claim.issuePlaceholder")}
          />

          <p className="warranty-form-section-title">{t("warranty.claim.sectionContact")}</p>
          <label htmlFor="warranty-claim-name">{t("warranty.claim.nameLabel")}</label>
          <input
            id="warranty-claim-name"
            required
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          />
          <label htmlFor="warranty-claim-phone">{t("warranty.claim.phoneLabel")}</label>
          <input
            id="warranty-claim-phone"
            required
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            placeholder="0901234567"
          />
          <label htmlFor="warranty-claim-province">{t("warranty.claim.provinceLabel")}</label>
          <select
            id="warranty-claim-province"
            required
            value={selectedProvince?.id || ""}
            onChange={(e) => {
              const prov = provinces.find((p) => String(p.provinceId) === e.target.value);
              onProvinceChange(prov?.provinceId || null, prov?.provinceName || "");
            }}
          >
            <option value="">{t("warranty.claim.selectProvince")}</option>
            {provinces.map((p) => (
              <option key={p.provinceId} value={p.provinceId}>
                {p.provinceName}
              </option>
            ))}
          </select>
          <label htmlFor="warranty-claim-district">{t("warranty.claim.districtLabel")}</label>
          <select
            id="warranty-claim-district"
            required
            disabled={!selectedProvince || loadingDistricts}
            value={selectedDistrict?.id || ""}
            onChange={(e) => {
              const dist = districts.find((d) => String(d.districtId) === e.target.value);
              onDistrictChange(dist?.districtId || null, dist?.districtName || "");
            }}
          >
            <option value="">
              {loadingDistricts ? t("common.loading") : t("warranty.claim.selectDistrict")}
            </option>
            {districts.map((d) => (
              <option key={d.districtId} value={d.districtId}>
                {d.districtName}
              </option>
            ))}
          </select>
          <label htmlFor="warranty-claim-ward">{t("warranty.claim.wardLabel")}</label>
          <select
            id="warranty-claim-ward"
            required
            disabled={!selectedDistrict || loadingWards}
            value={selectedWard?.code || ""}
            onChange={(e) => {
              const ward = wards.find((w) => String(w.wardCode) === e.target.value);
              onWardChange(ward?.wardCode || null, ward?.wardName || "");
            }}
          >
            <option value="">
              {loadingWards ? t("common.loading") : t("warranty.claim.selectWard")}
            </option>
            {wards.map((w) => (
              <option key={w.wardCode} value={w.wardCode}>
                {w.wardName}
              </option>
            ))}
          </select>
          <label htmlFor="warranty-claim-street">{t("warranty.claim.streetLabel")}</label>
          <input
            id="warranty-claim-street"
            required
            value={form.contactAddress}
            onChange={(e) => setForm({ ...form, contactAddress: e.target.value })}
            placeholder={t("warranty.claim.streetPlaceholder")}
          />
          {formatPickupPreview() && (
            <p className="warranty-pickup-preview">
              <strong>{t("warranty.claim.pickupPreview")}</strong> {formatPickupPreview()}
            </p>
          )}

          <p className="warranty-form-section-title">{t("warranty.claim.sectionProof")}</p>
          <label htmlFor="warranty-claim-image">{t("warranty.claim.imageLabel")}</label>
          <input
            id="warranty-claim-image"
            type="url"
            value={form.imageUrl1}
            onChange={(e) => setForm({ ...form, imageUrl1: e.target.value })}
            placeholder={t("warranty.claim.imagePlaceholder")}
          />
          <label htmlFor="warranty-claim-video">{t("warranty.claim.videoLabel")}</label>
          <input
            id="warranty-claim-video"
            type="url"
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            placeholder={t("warranty.claim.videoPlaceholder")}
          />
          <button type="submit" className="warranty-btn-primary" disabled={loading}>
            {loading ? t("warranty.claim.submitting") : t("warranty.claim.submit")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WarrantyClaimSubmitForm;
