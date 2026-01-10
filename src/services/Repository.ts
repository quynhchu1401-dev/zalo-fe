// src/services/Repository.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import store from "../store";
import router from "../router";

// Base API: can be configured via VUE_APP_API_BASE_URL env var (e.g. https://api.example.com)
const baseDomain = process.env.VUE_APP_API_BASE_URL || "";
const baseAPI = baseDomain ? `${baseDomain.replace(/\/$/, '')}/api` : "/api";

const instance = axios.create({
  baseURL: baseAPI,
});

/** ================= REQUEST: gắn token ================= */
instance.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  const url = request.url || "";
  const method = (request.method || "").toLowerCase();

  // ✅ token theo store mới
  const token = (store as any).state?.accessToken || (store as any).state?.token || "";

  const isLogin = url.startsWith("/auth/login") && method === "post";

  request.headers = request.headers || {};

  if (token && !isLogin) {
    request.headers["Authorization"] = `Bearer ${token}`;
  } else {
    // xoá header nếu login hoặc không có token
    delete (request.headers as any)["Authorization"];
  }

  return request;
});

/** ================= RESPONSE: xử lý lỗi 401 ================= */
instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      // ✅ DEV bypass: don't force relogin when developing with DEV token
      const token = (store as any).state?.token || (store as any).state?.accessToken;
      if (token === "DEV") {
        return Promise.reject(error);
      }

      store.dispatch("clearToken");
      store.dispatch("clearPermission");
      router.push({ name: "relogin" }); // hoặc router.push("/relogin")
    }

    // In development, convert 404 errors for missing backend endpoints into safe mock responses
    const isDev = process.env.NODE_ENV === "development";
    if (status === 404 && isDev) {
      const req = error.config as InternalAxiosRequestConfig;
      const method = (req.method || "get").toLowerCase();
      const url = req.url || "";

      // Heuristic mock data based on URL and method
      let mockData: any = {};
      if (method === "get") {
        if (/list|List|listCustomer|listProvince|listImage|getListSubclinicalResult/.test(url)) {
          mockData = [];
        } else if (/export|download|DownloadResult|Export/i.test(url)) {
          mockData = "";
        } else {
          mockData = {};
        }
      } else if (method === "post") {
        mockData = { success: true };
      } else {
        mockData = {};
      }

      // Log to console so devs know a mock was returned
      // eslint-disable-next-line no-console
      console.warn("[DEV MOCK] 404 intercepted for", method.toUpperCase(), url, "→ returning mock data");

      // Build an Axios-like response to resolve the original Promise chain
      const mockResponse = {
        data: mockData,
        status: 200,
        statusText: "OK (mock)",
        headers: {},
        config: req,
      } as any;

      return Promise.resolve(mockResponse);
    }

    return Promise.reject(error);
  }
);

export default instance;
