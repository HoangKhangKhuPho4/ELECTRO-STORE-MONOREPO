import { Box, IconButton, Typography } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import YouTubeIcon from "@mui/icons-material/YouTube";
import InstagramIcon from "@mui/icons-material/Instagram";
import { useTranslation } from "react-i18next";
import { FOOTER_COLS, FOOTER_SECTION_PX } from "./footerLayout";

const BRAND = "#ff7a00";
const BRAND_DEEP = "#e86a00";

const SOCIAL_LINKS = [
  { labelKey: "footer.socialFacebook", href: "https://www.facebook.com/", Icon: FacebookIcon },
  { labelKey: "footer.socialYoutube", href: "https://www.youtube.com/", Icon: YouTubeIcon },
  { labelKey: "footer.socialInstagram", href: "https://www.instagram.com/", Icon: InstagramIcon },
];

/** Logo thương hiệu từ frontend/public/images/footer */
const PAYMENT_BRANDS = [
  { name: "Visa", src: "/images/footer/visa.png" },
  { name: "Mastercard", src: "/images/footer/mastercard.png" },
  { name: "JCB", src: "/images/footer/jcb.jpeg" },
  { name: "MoMo", src: "/images/footer/momo.jpg" },
  { name: "ZaloPay", src: "/images/footer/zalopay.jpg" },
  { name: "COD", src: "/images/footer/cod.jpeg" },
];

const SHIPPING_BRANDS = [
  { name: "Giao Hàng Nhanh", src: "/images/footer/ghn.jpg" },
  { name: "Giao Hàng Tiết Kiệm", src: "/images/footer/ghtk.jpg" },
  { name: "Viettel Post", src: "/images/footer/viettel-post.jpg" },
  { name: "J&T Express", src: "/images/footer/jt-express.png" },
  { name: "GrabExpress", src: "/images/footer/grab-express.jpg" },
];

/** Khung cố định — mọi logo cùng footprint, ảnh contain bên trong. */
const BRAND_SLOT = {
  width: { xs: 108, md: 120 },
  height: { xs: 56, md: 60 },
  imgMax: { xs: 88, md: 96 },
};

const BrandLogo = ({ name, src }) => (
  <Box
    component="span"
    title={name}
    aria-label={name}
    sx={{
      width: BRAND_SLOT.width,
      height: BRAND_SLOT.height,
      px: 1.25,
      py: 1,
      borderRadius: 1.5,
      bgcolor: "#fff",
      border: "1px solid #e2e8f0",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
      flexShrink: 0,
      boxSizing: "border-box",
      overflow: "hidden",
    }}
  >
    <Box
      component="img"
      src={src}
      alt={name}
      loading="lazy"
      sx={{
        width: BRAND_SLOT.imgMax,
        height: { xs: 36, md: 40 },
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain",
        objectPosition: "center",
        display: "block",
      }}
    />
  </Box>
);

const SectionLabel = ({ children }) => (
  <Typography
    sx={{
      fontWeight: 700,
      color: "#0f172a",
      fontSize: 13,
      mb: 1.5,
      letterSpacing: 0.2,
    }}
  >
    {children}
  </Typography>
);

const MinistryBadge = ({ title, desc }) => (
  <Box
    component="a"
    href="https://www.thongkecongthuong.gov.vn/"
    target="_blank"
    rel="noopener noreferrer"
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      textDecoration: "none",
      bgcolor: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 1.5,
      px: 2,
      py: 1.5,
      width: "100%",
      height: "100%",
      minHeight: 88,
      boxSizing: "border-box",
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
      "&:hover": {
        borderColor: BRAND,
        boxShadow: "0 2px 8px rgba(255, 122, 0, 0.12)",
      },
    }}
  >
    <Box
      component="img"
      src="/images/footer/bo-cong-thuong.png"
      alt={title}
      loading="lazy"
      sx={{
        width: { xs: 64, md: 72 },
        height: { xs: 64, md: 72 },
        objectFit: "contain",
        flexShrink: 0,
        display: "block",
      }}
    />
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 13, lineHeight: 1.3 }}>
        {title}
      </Typography>
      <Typography sx={{ color: "#334155", fontSize: 12, mt: 0.25, lineHeight: 1.35 }}>
        {desc}
      </Typography>
    </Box>
  </Box>
);

/**
 * Cùng FOOTER_COLS (4 cột) với newsletter phía trên:
 * col1 → Thanh toán + Vận chuyển | col2 → MXH | col3–4 → Bộ Công Thương
 */
const TrustSignals = () => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        bgcolor: "transparent",
        py: { xs: 3, md: 3.5 },
        px: FOOTER_SECTION_PX,
      }}
    >
      <Box sx={FOOTER_COLS}>
        <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <SectionLabel>{t("footer.paymentMethods")}</SectionLabel>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              {PAYMENT_BRANDS.map((brand) => (
                <BrandLogo key={brand.name} name={brand.name} src={brand.src} />
              ))}
            </Box>
          </Box>
          <Box>
            <SectionLabel>{t("footer.shippingPartners")}</SectionLabel>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              {SHIPPING_BRANDS.map((brand) => (
                <BrandLogo key={brand.name} name={brand.name} src={brand.src} />
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <SectionLabel>{t("footer.followUs")}</SectionLabel>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {SOCIAL_LINKS.map(({ labelKey, href, Icon }) => (
              <IconButton
                key={labelKey}
                component="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(labelKey)}
                sx={{
                  width: { xs: 52, md: 56 },
                  height: { xs: 52, md: 56 },
                  bgcolor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#0f172a",
                  "&:hover": { bgcolor: "rgba(255, 122, 0, 0.1)", color: BRAND_DEEP },
                  "& .MuiSvgIcon-root": { fontSize: { xs: 28, md: 30 } },
                }}
              >
                <Icon fontSize="small" />
              </IconButton>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            minWidth: 0,
            gridColumn: { xs: "1 / -1", sm: "1 / -1", md: "span 2" },
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          <MinistryBadge title={t("footer.ministryBadge")} desc={t("footer.ministryBadgeDesc")} />
          <MinistryBadge title={t("footer.ministryBadge")} desc={t("footer.ministryBadgeDesc")} />
        </Box>
      </Box>
    </Box>
  );
};

export default TrustSignals;
