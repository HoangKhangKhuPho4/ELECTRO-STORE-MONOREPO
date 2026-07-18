/** Lưới 4 cột dùng chung — newsletter/links và trust signals căn thẳng hàng dọc. */
export const FOOTER_COLS = {
  display: "grid",
  width: "100%",
  alignItems: "start",
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
    md: "repeat(4, minmax(0, 1fr))",
  },
  columnGap: { xs: 3, md: 4 },
  rowGap: { xs: 4, md: 4 },
};

export const FOOTER_SECTION_PX = { xs: 2, md: 6, lg: 10 };
