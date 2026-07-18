import httpClient from "./httpClient";
import { API_PREFIX } from "../config/api";

const ADMIN_API = `${API_PREFIX}/admin/banners`;
const PUBLIC_API = `${API_PREFIX}/banners`;

/** Banner active cho trang chủ (không cần đăng nhập). */
export const getPublicBanners = async (position) => {
  const res = await httpClient.get(PUBLIC_API, {
    params: position ? { position } : {},
  });
  return res.data?.data ?? [];
};

export const getBanners = async () => {
  const res = await httpClient.get(ADMIN_API);
  return res.data?.data ?? [];
};

export const createBanner = async (data) => {
  const res = await httpClient.post(ADMIN_API, data);
  return res.data;
};

export const updateBanner = async (id, data) => {
  const res = await httpClient.put(`${ADMIN_API}/${id}`, data);
  return res.data;
};

export const toggleBannerStatus = async (id) => {
  const res = await httpClient.patch(`${ADMIN_API}/${id}/toggle-status`);
  return res.data;
};

export const deleteBanner = async (id) => {
  const res = await httpClient.delete(`${ADMIN_API}/${id}`);
  return res.data;
};
