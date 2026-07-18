/**
 * SHOP PAGE
 */
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Pagination,
  Rating,
  Select,
  Typography,
  Skeleton,
} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard/ProductCard";




import { searchProducts, getBestSellers } from "../services/productService";
import { getCategories as fetchCategoriesPublic } from "../services/masterService";
import { isApiSuccess, unwrapPageContent, unwrapPageMeta } from "../utils/apiResponse";
import { mapProductForCard } from "../utils/productMapper";
import httpClient from "../services/httpClient";
import { API_PREFIX } from "../config/api";

const PRICE_RANGE_DEFS = [
  { labelKey: "shop.priceUnder1M", value: "under1M", min: null, max: 1000000 },
  { labelKey: "shop.price1to2_5M", value: "1to2.5M", min: 1000000, max: 2500000 },
  { labelKey: "shop.priceAbove2_5M", value: "above2.5M", min: 2500000, max: null },
];

const Shop = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [layout, setLayout] = useState("grid");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);

  // Sort & categories state
  const [categories, setCategories] = useState([{ id: "", name: "" }]);
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState("asc");

  //Lọc Sản Phẩm Dựa Trên giá - chuyển sang exclusive (một giá trị duy nhất)
  const [selectedPriceRange, setSelectedPriceRange] = useState("");

  //Chức Năng Phân Trang
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Đồng bộ URL search params → state
  useEffect(() => {
    const keyword = searchParams.get("keyword") || "";
    const category = searchParams.get("category") || "";
    const type = searchParams.get("type") || "";
    const urlSortBy = searchParams.get("sort_by") || "";
    const urlSortDir = searchParams.get("sort_dir") || "asc";

    setSearchKeyword(keyword);
    setSelectedCategory(category);
    setCurrentPage(1);

    if (type === "best-sellers") {
      setSortBy("");
      setSortDir("asc");
    } else if (type === "featured") {
      setSortBy("");
      setSortDir("asc");
    } else if (urlSortBy) {
      setSortBy(urlSortBy);
      setSortDir(urlSortDir);
    }
  }, [searchParams]);

  // Fetch danh mục từ API để lấy đúng ID
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await fetchCategoriesPublic();
        if (cats) {
          const list = Array.isArray(cats) ? cats : cats.content || [];
          setCategories([{ id: "", name: t("shop.allProducts") }, ...list]);
        }
      } catch (err) {
        console.warn("Failed to load categories:", err);
      }
    };
    fetchCategories();
  }, [i18n.language, t]);

  useEffect(() => {
    setCategories((prev) => {
      if (!prev.length) return [{ id: "", name: t("shop.allProducts") }];
      if (prev[0].id === "") {
        return [{ ...prev[0], name: t("shop.allProducts") }, ...prev.slice(1)];
      }
      return prev;
    });
  }, [t, i18n.language]);

  const priceRanges = useMemo(
    () => PRICE_RANGE_DEFS.map((r) => ({ ...r, label: t(r.labelKey) })),
    [t, i18n.language]
  );

  const handlePriceChange = (event) => {
    const { value, checked } = event.target;
    // Nếu checked = true thì chọn range đó, nếu bỏ check thì reset về ""
    setSelectedPriceRange(checked ? value : "");
    setCurrentPage(1); // Reset page về 1 khi thay đổi điều kiện lọc
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Giữ lại danh sách màu sắc ổn định không bị mất khi lọc
  const [stableColors, setStableColors] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const apiPage = currentPage > 0 ? currentPage - 1 : 0;
        const shopType = searchParams.get("type") || "";

        let result;

        if (shopType === "best-sellers") {
          result = await getBestSellers(apiPage, productsPerPage);
        } else if (shopType === "featured") {
          result = await httpClient
            .get(`${API_PREFIX}/products/featured`, { params: { page: apiPage, size: productsPerPage } })
            .then((res) => res.data);
        } else {
          const params = {
            page: apiPage,
            size: productsPerPage,
          };

          if (searchKeyword) params.keyword = searchKeyword;
          if (selectedCategory) params.product_type_id = selectedCategory;
          if (selectedColor) params.color = selectedColor;
          if (selectedRating > 0) params.min_rating = selectedRating;

          if (sortBy) {
            params.sort_by = sortBy;
            params.sort_dir = sortDir;
          }

          if (selectedPriceRange) {
            const range = priceRanges.find((r) => r.value === selectedPriceRange);
            if (range) {
              if (range.min !== null) params.min_price = range.min;
              if (range.max !== null) params.max_price = range.max;
            }
          }

          result = await searchProducts(params);
        }

        if (isApiSuccess(result)) {
          const content = unwrapPageContent(result);
          const meta = unwrapPageMeta(result);

          setProducts(content.map(mapProductForCard));
          setTotalPages(meta.totalPages);
          setTotalElements(meta.totalElements);

          if (content.length > 0 && stableColors.length === 0) {
            const colorSet = new Set();
            content.forEach((p) => {
              p.variants?.forEach((v) => {
                v.attributeValues?.forEach((a) => {
                  const attrName = a.attributeName || a.name || "";
                  if (["màu sắc", "color", "màu"].includes(attrName.toLowerCase())) {
                    colorSet.add(a.value);
                  }
                });
              });
            });
            if (colorSet.size > 0) {
              setStableColors(Array.from(colorSet).map((c) => ({ name: c })));
            }
          }
        } else {
          setProducts([]);
          setTotalPages(0);
          setTotalElements(0);
        }
      } catch (error) {
        console.error("Fail to fetch Products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    window.scrollTo(0, 0);
    fetchProducts();
  }, [
    searchKeyword,
    selectedCategory,
    selectedColor,
    selectedRating,
    selectedPriceRange,
    sortBy,
    sortDir,
    currentPage,
    searchParams,
  ]);


  const currentProducts = products;

  //Tính Toán Việc Hiển thị Sản Phẩm ở Mỗi Trang
  const pageCount = totalPages;



  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", gap: 3 }}>
        {/* === SIDEBAR === */}
        <Box
          sx={{
            width: "30%",
            minWidth: 220,
            maxWidth: 350,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflowY: "auto",
          }}
        >
          {/* Products Categories List - ĐÃ CHUYỂN ĐỔI */}
          <FormControl sx={{ mb: 3 }}>
            <FormLabel
              sx={{
                fontWeight: "bold",
                fontSize: "1.5rem",
                mb: 2,
                color: "text.primary", // Dùng màu mặc định của theme
              }}
            >
              {t("shop.categories")}
            </FormLabel>
            <RadioGroup
              value={selectedCategory}
              onChange={(e) => {
                const newCat = e.target.value;
                setSelectedCategory(newCat);
                setCurrentPage(1);
                // Đồng bộ lại URL
                const newParams = new URLSearchParams(searchParams);
                if (newCat) {
                  newParams.set("category", newCat);
                } else {
                  newParams.delete("category");
                }
                setSearchParams(newParams, { replace: true });
              }}
            >
              {categories.map((cat) => (
                <FormControlLabel
                  key={cat.id}
                  value={cat.id.toString()} // Giá trị khi được chọn
                  control={<Radio />}
                  label={cat.name}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {/* Select By Color List */}
          <FormControl sx={{ mb: 3 }}>
            <FormLabel
              sx={{
                fontWeight: "bold",
                fontSize: "1.5rem",
                mb: 2,
                color: "text.primary", // Dùng màu mặc định của theme
              }}
            >
              {t("shop.filterByColor")}
            </FormLabel>
            <RadioGroup
              value={selectedColor}
              onChange={(e) => {
                const newColor = e.target.value;
                setSelectedColor(selectedColor === newColor ? "" : newColor);
                setCurrentPage(1);
              }}
            >
              <FormControlLabel
                value=""
                control={<Radio />}
                label={t("shop.allColors")}
              />
              {stableColors.map((color) => (
                <FormControlLabel
                  key={color.name}
                  value={color.name} // Giá trị khi được chọn
                  control={<Radio />}
                  label={color.name}
                />
              ))}
            </RadioGroup>
          </FormControl>


          {/* Price Filter Checkboxes */}
          <Box
            sx={{
              mb: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
              {t("shop.price")}
            </Typography>
            {priceRanges.map((range) => (
              <FormControlLabel
                label={range.label}
                key={range.value}
                control={
                  <Checkbox
                    value={range.value}
                    checked={selectedPriceRange === range.value}
                    onChange={handlePriceChange}
                  />
                }
              />
            ))}
          </Box>

          {/* Rating Filter */}
          <Box
            sx={{
              mb: 3,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "18px",
                }}
              >
                {t("shop.rating")}
              </Typography>
              <KeyboardArrowUpIcon sx={{ color: "orange" }} />
            </Box>

            <RadioGroup
              value={selectedRating}
              onChange={(e) => {
                setSelectedRating(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[4, 3, 2, 1].map((rating) => (
                <Box
                  key={rating}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <FormControlLabel
                    value={rating}
                    control={<Radio size="small" />}
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Rating
                          value={rating}
                          readOnly
                          size="small"
                          sx={{ color: "#ffb400" }}
                        />
                        <Typography sx={{ color: "#666", fontSize: "14px" }}>
                          {t("shop.ratingAndUp")}
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>
              ))}
            </RadioGroup>
          </Box>
        </Box>

        {/* === PRODUCTS === */}
        <Box sx={{ flex: 1 }}>
          {/* 1. Thanh sắp xếp */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              mb: 3,
              pr: 2,
              gap: 2,
            }}
          >
            {/* Nút hiển thị ngang/dọc với background */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mr: 0.1, // giảm khoảng cách tối đa với Sort By
                background: "#fff7e6",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(255,165,0,0.08)",
                padding: "6px 16px",
              }}
            >
              <button
                style={{
                  border: "none",
                  background: layout === "grid" ? "orange" : "transparent",
                  cursor: "pointer",
                  padding: 6,
                  borderRadius: 8,
                  transition: "background 0.2s",
                  outline: "none",
                }}
                onClick={() => setLayout("grid")}
              >
                <ViewModuleIcon
                  sx={{
                    color: layout === "grid" ? "white" : "orange",
                    fontSize: 32,
                  }}
                />
              </button>
              <button
                style={{
                  border: "none",
                  background: layout === "list" ? "orange" : "transparent",
                  cursor: "pointer",
                  padding: 6,
                  borderRadius: 8,
                  transition: "background 0.2s",
                  outline: "none",
                }}
                onClick={() => setLayout("list")}
              >
                <ViewListIcon
                  sx={{
                    color: layout === "list" ? "white" : "orange",
                    fontSize: 32,
                  }}
                />
              </button>
            </Box>
            {/* Sort By */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{t("shop.sortBy")}</InputLabel>
              <Select
                label={t("shop.sortBy")}
                value={sortBy ? `${sortBy}_${sortDir}` : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "price_asc") { setSortBy("price"); setSortDir("asc"); }
                  else if (val === "price_desc") { setSortBy("price"); setSortDir("desc"); }
                  else if (val === "name_asc") { setSortBy("name"); setSortDir("asc"); }
                  else if (val === "importDate_desc") { setSortBy("importDate"); setSortDir("desc"); }
                  else { setSortBy(""); setSortDir("asc"); }
                  setCurrentPage(1);
                }}
              >
                <MenuItem value="">{t("shop.sortDefault")}</MenuItem>
                <MenuItem value="price_asc">{t("shop.sortPriceAsc")}</MenuItem>
                <MenuItem value="price_desc">{t("shop.sortPriceDesc")}</MenuItem>
                <MenuItem value="name_asc">{t("shop.sortNameAsc")}</MenuItem>
                <MenuItem value="importDate_desc">{t("shop.sortNewest")}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Hiển thị thông tin tìm kiếm */}
          {searchKeyword && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
                ml: 1,
                p: 1.5,
                bgcolor: "#fff3e0",
                borderRadius: 2,
                border: "1px solid #ffe0b2",
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                🔍 {t("shop.searchResults")} &ldquo;{searchKeyword}&rdquo;
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#e65100",
                  cursor: "pointer",
                  ml: "auto",
                  fontWeight: 600,
                  "&:hover": { textDecoration: "underline" },
                }}
                onClick={() => {
                  setSearchParams({});
                  setSearchKeyword("");
                }}
              >
                ✕ {t("shop.clearSearch")}
              </Typography>
            </Box>
          )}

          {/* Hiển thị số lượng kết quả */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, ml: 1, fontSize: 16 }}
          >
            {t("shop.showingResults", { count: currentProducts.length })}{" "}
            {totalElements > 0 ? t("shop.showingTotal", { total: totalElements }) : ""}
          </Typography>

          {/* 2. Lưới sản phẩm -- Dùng CSS Grid giống trang chủ */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.5,
                    border: "1px solid #eee",
                    borderRadius: 2,
                    height: 350,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Skeleton variant="rectangular" height={190} sx={{ borderRadius: 1 }} />
                  <Box sx={{ pt: 2, flexGrow: 1 }}>
                    <Skeleton width="40%" height={20} />
                    <Skeleton width="80%" height={24} sx={{ mt: 1 }} />
                    <Skeleton width="30%" height={24} sx={{ mt: 1 }} />
                  </Box>
                </Box>
              ))
            ) : currentProducts.length > 0 ? (
              currentProducts.map((product) => (
                <Box key={product.id} sx={{ display: "flex", width: "100%" }}>
                  <ProductCard product={product} />
                </Box>
              ))
            ) : (
              <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  {t("shop.noProducts")}
                </Typography>
              </Box>
            )}
          </Box>

          {/* PHÂN TRANG ĐẸP VỚI MUI */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mt: 4,
            }}
          >
            <Pagination
              count={pageCount}
              page={currentPage} //Thêm props này để pagination biết ở Trang nào
              onChange={(event, newPage) => setCurrentPage(newPage)}
              shape="rounded"
              color="primary"
              size="large"
              sx={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                "& .Mui-selected": {
                  backgroundColor: "orange !important",
                  color: "white",

                  fontWeight: "bold",
                },
                "& .MuiPaginationItem-root:hover": {
                  backgroundColor: "#ffe0b2",
                },
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Shop;
