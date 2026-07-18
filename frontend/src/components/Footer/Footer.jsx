import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneIcon from "@mui/icons-material/Phone";
import PlaceIcon from "@mui/icons-material/Place";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SecurityIcon from "@mui/icons-material/Security";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PaymentIcon from "@mui/icons-material/Payment";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import TrustSignals from "./TrustSignals";
import { FOOTER_COLS, FOOTER_SECTION_PX } from "./footerLayout";

const BRAND = "#ff7a00";
const BRAND_DEEP = "#e86a00";

const QuickItem = ({ icon, title, subtitle }) => (
  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", justifyContent: "flex-start" }}>
    <Box
      sx={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(255, 122, 0, 0.12)",
        color: BRAND,
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography
        sx={{
          fontWeight: 700,
          color: "#0f172a",
          fontSize: { xs: 14, md: 13 },
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          color: "#334155",
          fontSize: { xs: 13, md: 12 },
          whiteSpace: "nowrap",
        }}
      >
        {subtitle}
      </Typography>
    </Box>
  </Box>
);

const LinkItem = ({ label, href = "#" }) => (
  <Typography
    component="a"
    href={href}
    sx={{
      color: "#1e293b",
      textDecoration: "none",
      fontSize: { xs: 16, md: 15 },
      lineHeight: 1.5,
      display: "block",
      position: "relative",
      pl: "14px",
      py: { xs: 0.75, md: 0.25 },
      transition: "color 0.15s ease",
      "&:hover": { color: "#c2410c" },
      "&:focus-visible": {
        outline: `2px solid ${BRAND}`,
        outlineOffset: 2,
        borderRadius: 1,
      },
      "&::before": {
        content: '"›"',
        position: "absolute",
        left: 0,
        color: BRAND,
      },
    }}
  >
    {label}
  </Typography>
);

const LinkColumn = ({ title, links }) => (
  <Box sx={{ display: "flex", flexDirection: "column" }}>
    <Typography sx={{ fontWeight: 800, mb: 2, color: "#9a3412", fontSize: 18 }}>
      {title}
    </Typography>
    <Box sx={{ display: "grid", gap: { xs: 0.5, md: 1.5 } }}>
      {links.map((link) => {
        if (typeof link === "string") {
          return <LinkItem key={link} label={link} />;
        }
        return <LinkItem key={link.label} label={link.label} href={link.href || "#"} />;
      })}
    </Box>
  </Box>
);

const Footer = () => {
  const { t, i18n } = useTranslation();

  const customerCareLinks = useMemo(
    () => [
      t("footer.contactLink"),
      t("footer.returns"),
      t("footer.sitemap"),
      t("footer.reviews"),
      t("footer.myAccountLink"),
      t("footer.supportCenter"),
    ],
    [t, i18n.language],
  );

  const infoLinks = useMemo(
    () => [
      { label: t("nav.about"), href: "/about" },
      { label: t("footer.shippingInfo") },
      { label: t("footer.privacy") },
      { label: t("footer.termsConditions") },
      { label: t("nav.warrantyCheck"), href: "/warranty-check" },
      { label: t("nav.liveChat"), href: "/chat-nhan-vien" },
      { label: t("nav.faq"), href: "/faq" },
    ],
    [t, i18n.language],
  );

  const utilityLinks = useMemo(
    () => [
      t("footer.brands"),
      t("footer.giftCard"),
      t("footer.affiliate"),
      t("footer.orderHistory"),
      t("footer.trackOrder"),
    ],
    [t, i18n.language],
  );

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#f8fafc",
        borderTop: "2px solid #e2e8f0",
        boxShadow: "0 -6px 24px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* Thanh dịch vụ — nền trung tính để chữ đạt contrast AA */}
      <Box
        sx={{
          bgcolor: "transparent",
          py: 3.5,
          px: FOOTER_SECTION_PX,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(1, 1fr)",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
              lg: "repeat(8, 1fr)",
            },
            gap: 2,
          }}
        >
          <QuickItem
            icon={<PlaceIcon fontSize="small" />}
            title={t("footer.address")}
            subtitle={t("footer.addressValue")}
          />
          <QuickItem
            icon={<MailOutlineIcon fontSize="small" />}
            title={t("footer.email")}
            subtitle="hotro@electro.vn"
          />
          <QuickItem
            icon={<PhoneIcon fontSize="small" />}
            title={t("footer.phone")}
            subtitle="1900 1234 5678"
          />
          <QuickItem
            icon={<SupportAgentIcon fontSize="small" />}
            title={t("footer.support")}
            subtitle="0909 123 456"
          />
          <QuickItem
            icon={<AccessTimeIcon fontSize="small" />}
            title={t("footer.hours")}
            subtitle={t("footer.hoursValue")}
          />
          <QuickItem
            icon={<SecurityIcon fontSize="small" />}
            title={t("footer.warranty")}
            subtitle={t("footer.warrantyValue")}
          />
          <QuickItem
            icon={<LocalShippingIcon fontSize="small" />}
            title={t("footer.shipping")}
            subtitle={t("footer.shippingValue")}
          />
          <QuickItem
            icon={<PaymentIcon fontSize="small" />}
            title={t("footer.payment")}
            subtitle={t("footer.paymentValue")}
          />
        </Box>
      </Box>

      {/* Cột link + newsletter — cùng FOOTER_COLS với TrustSignals */}
      <Box sx={{ bgcolor: "transparent", py: 7, px: FOOTER_SECTION_PX }}>
        <Box sx={FOOTER_COLS}>
          <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" }, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, mb: 2, color: "#9a3412", fontSize: 18 }}>
              {t("footer.newsletter")}
            </Typography>
            <Typography
              sx={{
                color: "#334155",
                mb: 3,
                fontSize: { xs: 14, md: 13 },
                maxWidth: "100%",
              }}
            >
              {t("footer.newsletterDesc")}
            </Typography>
            <Box
              component="form"
              sx={{
                display: "flex",
                alignItems: "center",
                background: "#fff",
                borderRadius: "999px",
                p: "4px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                maxWidth: "100%",
                overflow: "hidden",
                "&:focus-within": {
                  borderColor: BRAND,
                  boxShadow: "0 0 0 3px rgba(255, 122, 0, 0.15)",
                },
              }}
            >
              <TextField
                variant="standard"
                placeholder={t("footer.emailPlaceholder")}
                sx={{
                  flex: 1,
                  "& .MuiInput-underline:before": { borderBottom: "none" },
                  "& .MuiInput-underline:after": { borderBottom: "none" },
                  "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                    borderBottom: "none",
                  },
                  "& .MuiInputBase-input": { p: "8px 16px", color: "#1e293b" },
                }}
              />
              <Button
                sx={{
                  bgcolor: BRAND,
                  color: "#fff",
                  fontWeight: "bold",
                  borderRadius: "999px",
                  px: 2.5,
                  py: 1,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  "&:hover": { bgcolor: BRAND_DEEP },
                  ml: "auto",
                }}
              >
                {t("footer.subscribe")}
              </Button>
            </Box>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <LinkColumn title={t("footer.customerCare")} links={customerCareLinks} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <LinkColumn title={t("footer.infoSection")} links={infoLinks} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <LinkColumn title={t("footer.utilities")} links={utilityLinks} />
          </Box>
        </Box>
      </Box>

      <TrustSignals />

      {/* Thanh copyright */}
      <Box
        sx={{
          bgcolor: "transparent",
          py: 2.25,
          px: FOOTER_SECTION_PX,
          textAlign: "center",
        }}
      >
        <Typography sx={{ color: "#475569", fontSize: { xs: 14, md: 13 } }}>
          © {new Date().getFullYear()} Electro Store. {t("footer.allRights")}
        </Typography>
        <Typography
          sx={{
            color: "#64748b",
            fontSize: { xs: 13, md: 12 },
            mt: 0.75,
            lineHeight: 1.6,
          }}
        >
          {t("footer.copyrightAddress")}
        </Typography>
        <Typography sx={{ color: "#64748b", fontSize: { xs: 13, md: 12 }, mt: 0.25 }}>
          {t("footer.copyrightContact")}
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer;
