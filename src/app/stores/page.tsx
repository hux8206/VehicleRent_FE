"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api, Store } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProvinceCombobox } from "@/components/common/province-combobox";
import { useLanguage } from "@/context/language-context";
import {
  Store as StoreIcon,
  MapPin,
  Phone,
  Search,
  CheckCircle2,
  ArrowRight,
  Star,
  SlidersHorizontal,
  Clock,
} from "lucide-react";

export default function StoresPage() {
  const { t } = useLanguage();
  const [stores, setStores] = useState<Store[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStores() {
      setIsLoading(true);
      try {
        const data = await api.customer.getStores();
        setStores(data);
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadStores();
  }, []);

  const cleanSelected = selectedProvince.toLowerCase().replace(/^tp\.\s*/i, "").trim();

  const filteredStores = stores.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.storeName.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      (s.province && s.province.toLowerCase().includes(q));

    const matchesProvince =
      selectedProvince === "all" ||
      !selectedProvince ||
      (s.province &&
        (s.province.toLowerCase().includes(cleanSelected) ||
          cleanSelected.includes(s.province.toLowerCase().replace(/^tp\.\s*/i, "")))) ||
      (s.address && s.address.toLowerCase().includes(cleanSelected));

    return matchesSearch && matchesProvince;
  });

  return (
    <div className="py-10 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
      <div className="container max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {t("stores_title", "Hệ Thống Cửa Hàng & Nhà Xe Đối Tác")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              {t("stores_subtitle", "Mạng lưới đối tác cho thuê xe tự lái được kiểm định giấy phép, niêm yết chính sách cọc minh bạch và có đánh giá thực tế từ khách thuê.")}
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Province Combobox Filter */}
            <div className="w-full sm:w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl px-3 py-1">
              <ProvinceCombobox
                value={selectedProvince}
                onChange={(val) => setSelectedProvince(val)}
                includeAllOption={true}
                allOptionLabel={t("stores_filter_province", "Toàn quốc (34 tỉnh/thành)")}
                placeholder={t("stores_filter_ph", "Lọc theo tỉnh/thành...")}
              />
            </div>

            {/* Keyword Search */}
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
              <Input
                placeholder={t("stores_search", "Tìm theo tên nhà xe, địa chỉ...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-xs h-10 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Results Counter & Active Filter Badge */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            {t("admin_tx_display_count", "Hiển thị")} <span className="font-bold text-slate-900 dark:text-slate-100">{filteredStores.length}</span> {t("stores_partner_stores_label", "nhà xe đối tác")}
            {selectedProvince !== "all" && selectedProvince && (
              <span className="ml-2 inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 font-semibold text-[11px]">
                <MapPin className="h-3 w-3" /> {selectedProvince}
                <button
                  type="button"
                  onClick={() => setSelectedProvince("all")}
                  className="ml-1 hover:text-blue-900 dark:hover:text-blue-200 font-bold cursor-pointer"
                  title={t("stores_clear_filter", "Bỏ lọc")}
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Store Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">
            <StoreIcon className="h-10 w-10 animate-pulse mx-auto text-blue-600 dark:text-blue-400 mb-2 opacity-70" />
            <p className="text-xs font-semibold">{t("stores_loading", "Đang tải danh sách nhà xe đối tác...")}</p>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
            <StoreIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t("stores_empty_title", "Không tìm thấy nhà xe phù hợp")}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {t("stores_empty_desc", "Không có nhà xe nào tại khu vực hoặc khớp với từ khóa tìm kiếm của bạn. Hãy thử chọn \"Toàn quốc\" hoặc tìm từ khóa khác.")}
            </p>
            {(selectedProvince !== "all" || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProvince("all");
                  setSearchQuery("");
                }}
                className="mt-4 text-xs rounded-xl border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                {t("bookings_btn_reset_filter", "Đặt lại bộ lọc")}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => {
              const depositPercent = store.rentalPolicy?.depositPercent || 30;
              const vehicleCount = store._count?.vehicleModels ?? (store.vehicleModels?.length || 0);
              const rating = store.avgRating ? Number(store.avgRating).toFixed(1) : "5.0";
              const countReviews = store.reviewCount ?? (store.reviews?.length || 0);

              return (
                <div
                  key={store.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Store Facade Image */}
                    <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={
                          store.storeImage ||
                          "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
                        }
                        alt={`Cửa hàng cho thuê xe ${store.storeName} tại ${store.province || store.address || "Đà Nẵng"}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {t("stores_verified_badge", "Đã kiểm định")}
                        </span>
                      </div>

                      {/* Store Star Rating Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 font-bold text-[11px] px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                          <span>{rating}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            ({countReviews})
                          </span>
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3">
                        {store.province && (
                          <span className="bg-slate-900/90 text-white font-semibold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-blue-300" />
                            {store.province}
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 right-3">
                        <span className="bg-slate-900/90 text-white font-semibold text-[10px] px-2.5 py-1 rounded-full">
                          {vehicleCount} {t("stores_total_vehicles", "dòng xe có sẵn")}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {store.storeName}
                          </h3>
                        </div>

                        <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{store.address}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        {store.description || t("stores_default_desc", "Nhà xe chuyên nghiệp, dịch vụ chu đáo, hỗ trợ giao xe tận nơi nhanh chóng.")}
                      </p>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{store.phoneContact}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-[11px]">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>{store.openTime || "07:00"} - {store.closeTime || "21:00"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-5 pt-0">
                    <Link href={`/stores/${store.id}`} className="block w-full">
                      <Button
                        variant="outline"
                        className="w-full text-xs font-bold h-10 rounded-xl border-slate-200 dark:border-slate-800 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 dark:group-hover:bg-blue-600 dark:group-hover:text-white transition-all gap-1.5 shadow-xs cursor-pointer"
                      >
                        <span>{t("stores_view_store", "Xem chi nhánh & dàn xe")}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
