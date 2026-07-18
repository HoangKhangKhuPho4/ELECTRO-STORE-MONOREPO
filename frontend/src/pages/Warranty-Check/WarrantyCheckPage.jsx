/**
 * WARRANTY CHECK PAGE — Trang Tra Cứu Bảo Hành Công Khai (Enterprise Retail)
 *
 * PUBLIC ENDPOINT — Không cần đăng nhập.
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import SmartphoneOutlinedIcon from "@mui/icons-material/SmartphoneOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { checkWarranty } from "../../services/warrantyService";
import { formatDate } from "../../utils/formatters";
import WarrantyClaimSubmitForm from "./WarrantyClaimSubmitForm";
import "./WarrantyCheckPage.css";

const STATUS_KEYS = {
    AVAILABLE: "warranty.status.AVAILABLE",
    RESERVED: "warranty.status.RESERVED",
    SOLD: "warranty.status.SOLD",
    IN_REPAIR: "warranty.status.IN_REPAIR",
    RETURNED: "warranty.status.RETURNED",
    DEFECTIVE: "warranty.status.DEFECTIVE",
};

const STATUS_ICONS = {
    AVAILABLE: Inventory2OutlinedIcon,
    RESERVED: LocalShippingOutlinedIcon,
    SOLD: CheckCircleOutlineIcon,
    IN_REPAIR: BuildOutlinedIcon,
    RETURNED: AssignmentReturnOutlinedIcon,
    DEFECTIVE: ErrorOutlineIcon,
};

const isPendingActivation = (data) =>
    data?.warrantyStartDate === null && data?.warrantyEndDate === null && data?.valid;

const CopyButton = ({ value, label }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard unavailable */
        }
    };

    return (
        <button
            type="button"
            className="warranty-btn-secondary warranty-btn-icon"
            onClick={handleCopy}
            aria-label={label || t("warranty.copy")}
            title={copied ? t("warranty.copied") : t("warranty.copy")}
        >
            <ContentCopyOutlinedIcon fontSize="small" />
        </button>
    );
};

const WarrantyCheckPage = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [imeiInput, setImeiInput] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const codeParam = searchParams.get("code");
        if (codeParam) {
            setImeiInput(codeParam);
            performSearch(codeParam);
        }
    }, [searchParams]);

    const performSearch = async (code) => {
        if (!code) return;

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const json = await checkWarranty(code);
            if (json.success && json.data) {
                setResult(json.data);
            } else {
                setError(json.message || t("warranty.notFoundDefault"));
            }
        } catch (err) {
            if (err.response) {
                const serverMsg = err.response.data?.message;
                setError(serverMsg || t("warranty.notFoundCheck"));
            } else {
                setError(t("warranty.connectionError"));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        performSearch(imeiInput.trim());
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const getCardBorderClass = () => {
        if (!result) return "";
        if (isPendingActivation(result)) return "border-yellow";
        return result.valid ? "border-green" : "border-red";
    };

    const getMessageClass = () => {
        if (!result) return "";
        if (isPendingActivation(result)) return "text-yellow";
        return result.valid ? "text-green" : "text-red";
    };

    const MessageIcon = () => {
        if (!result) return null;
        if (isPendingActivation(result)) {
            return <WarningAmberOutlinedIcon aria-hidden />;
        }
        return result.valid ? (
            <CheckCircleOutlineIcon aria-hidden />
        ) : (
            <CancelOutlinedIcon aria-hidden />
        );
    };

    const StatusBadge = ({ status }) => {
        const Icon = STATUS_ICONS[status];
        const labelKey = STATUS_KEYS[status];
        return (
            <span className={`warranty-status-badge badge-${status?.toLowerCase()}`}>
                {Icon && <Icon className="warranty-status-badge-icon" aria-hidden />}
                {labelKey ? t(labelKey) : status}
            </span>
        );
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="warranty-check-page">
            <div className="warranty-page-inner">
                <section className="warranty-hero" aria-labelledby="warranty-page-title">
                    <div className="warranty-hero-icon" aria-hidden>
                        <VerifiedUserOutlinedIcon />
                    </div>
                    <h1 id="warranty-page-title">{t("warranty.title")}</h1>
                    <p>{t("warranty.subtitle")}</p>
                </section>

                <section className="warranty-search-container" aria-label={t("warranty.searchAria")}>
                    <div className="warranty-search-box">
                        <input
                            id="warranty-search-input"
                            type="text"
                            className="warranty-search-input"
                            placeholder={t("warranty.searchPlaceholder")}
                            value={imeiInput}
                            onChange={(e) => setImeiInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            autoComplete="off"
                            aria-label={t("warranty.imeiAria")}
                        />
                        <button
                            id="warranty-search-btn"
                            type="button"
                            className="warranty-btn-primary warranty-search-btn"
                            onClick={handleSearch}
                            disabled={loading || !imeiInput.trim()}
                        >
                            {loading ? (
                                <span className="btn-spinner" aria-label={t("warranty.searching")} />
                            ) : (
                                <>
                                    <SearchIcon fontSize="small" aria-hidden />
                                    {t("warranty.search")}
                                </>
                            )}
                        </button>
                    </div>
                </section>

                {result && (
                    <section
                        className="warranty-result-container"
                        aria-live="polite"
                        aria-atomic="true"
                        id="warranty-print-area"
                    >
                        <div className={`warranty-card ${getCardBorderClass()}`}>
                            <div className="warranty-card-actions">
                                <button
                                    type="button"
                                    className="warranty-btn-secondary"
                                    onClick={handlePrint}
                                >
                                    <PrintOutlinedIcon fontSize="small" aria-hidden />
                                    {t("warranty.printCard")}
                                </button>
                            </div>

                            <div className="warranty-card-header">
                                {result.imageUrl ? (
                                    <img
                                        src={result.imageUrl}
                                        alt={result.productName}
                                        className="warranty-product-image"
                                    />
                                ) : (
                                    <div className="warranty-product-image-placeholder" aria-hidden>
                                        <SmartphoneOutlinedIcon />
                                    </div>
                                )}
                                <div className="warranty-product-info">
                                    <h2 className="warranty-product-name">{result.productName}</h2>
                                    <p className="warranty-variant-name">{result.variantName}</p>
                                    <StatusBadge status={result.status} />
                                </div>
                            </div>

                            <div className="warranty-details">
                                {result.imei && (
                                    <div className="warranty-detail-item">
                                        <div className="warranty-detail-label">IMEI</div>
                                        <div className="warranty-detail-value-row">
                                            <div className="warranty-detail-value warranty-detail-value--code">
                                                {result.imei}
                                            </div>
                                            <CopyButton value={result.imei} label={t("warranty.copyImei")} />
                                        </div>
                                    </div>
                                )}
                                {result.serialNumber && (
                                    <div className="warranty-detail-item">
                                        <div className="warranty-detail-label">Serial Number</div>
                                        <div className="warranty-detail-value-row">
                                            <div className="warranty-detail-value warranty-detail-value--code">
                                                {result.serialNumber}
                                            </div>
                                            <CopyButton value={result.serialNumber} label={t("warranty.copySerial")} />
                                        </div>
                                    </div>
                                )}
                                <div className="warranty-detail-item">
                                    <div className="warranty-detail-label">{t("warranty.warrantyPeriod")}</div>
                                    <div className="warranty-detail-value">
                                        {result.warrantyMonths} {t("common.months")}
                                    </div>
                                </div>

                                {result.warrantyStartDate ? (
                                    <div className="warranty-detail-item full-width">
                                        <div className="warranty-detail-label">{t("warranty.warrantyTime")}</div>
                                        <div className="warranty-period">
                                            <div className="warranty-detail-value">
                                                {formatDate(result.warrantyStartDate)}
                                            </div>
                                            <span className="warranty-period-arrow" aria-hidden>
                                                →
                                            </span>
                                            <div className="warranty-detail-value">
                                                {result.warrantyEndDate
                                                    ? formatDate(result.warrantyEndDate)
                                                    : "N/A"}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="warranty-detail-item full-width">
                                        <div className="warranty-detail-label">{t("warranty.warrantyStatus")}</div>
                                        <div className="warranty-detail-value" style={{ color: "#b45309" }}>
                                            {t("warranty.notActivated")}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={`warranty-message ${getMessageClass()}`} role="status">
                                <MessageIcon />
                                <span>{result.message}</span>
                            </div>
                        </div>
                    </section>
                )}

                {error && (
                    <section className="warranty-error" aria-live="assertive">
                        <div className="warranty-error-card">
                            <div className="warranty-error-icon" aria-hidden>
                                <BlockOutlinedIcon />
                            </div>
                            <h3 className="warranty-error-title">{t("warranty.notFound")}</h3>
                            <p className="warranty-error-message">{error}</p>
                        </div>
                    </section>
                )}

                <WarrantyClaimSubmitForm defaultImei={imeiInput} />

                <aside className="warranty-hint-card">
                    <h3>
                        <LightbulbOutlinedIcon aria-hidden />
                        {t("warranty.hintTitle")}
                    </h3>
                    <ul>
                        <li>{t("warranty.hint1")}</li>
                        <li>{t("warranty.hint2")}</li>
                        <li>{t("warranty.hint3")}</li>
                    </ul>
                </aside>
            </div>
        </div>
    );
};

export default WarrantyCheckPage;
