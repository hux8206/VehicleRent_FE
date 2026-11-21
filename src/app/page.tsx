"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, useSpring, type Variants } from "framer-motion";
import { api, VehicleModel, Promotion } from "@/lib/api";
import { getOptimizedImageUrl, getVehicleCardImageUrl } from "@/lib/image-optimizer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  ShieldCheck,
  KeyRound,
  Bike,
  Star,
  Store,
  CheckCircle2,
  Heart,
  Compass,
  Scale,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { ProvinceCombobox } from "@/components/common/province-combobox";
import { useLanguage } from "@/context/language-context";
import {
  DateTime24hPicker,
  formatLocalIsoString,
  calculate24hReturnTime,
} from "@/components/common/datetime-24h-picker";
import {
  VehicleCompareModal,
  FloatingCompareBar,
} from "@/components/customer/vehicle-compare-modal";

// ─── Default Vehicle Image Fallback ──────────────────────────────────
const DEFAULT_VEHICLE_IMG = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80";

// ─── 3D Parallax Tilt Hero Card Component ─────────────────────────────
function HeroVehicleTiltCard() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring physics for tilt
  const mouseXSpring = useSpring(x, { stiffness: 220, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 220, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["9deg", "-9deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-9deg", "9deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: 1200 }} className="relative mx-auto max-w-md lg:max-w-none">
      {/* 3D Tilt Container */}
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative h-[360px] sm:h-[440px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl shadow-slate-950/40 bg-slate-900 cursor-pointer group"
      >
        {/* Vehicle Image */}
        <img
          src={getOptimizedImageUrl("https://images.unsplash.com/photo-1558981403-c5f9899a28bc", { width: 1000, height: 600, crop: "fill" })}
          alt="Xe tay ga"
          className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
        />

        {/* Soft bottom vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

        {/* Featured Tag (3D Pop-out) */}
        <div
          className="absolute top-4 right-4 z-10"
          style={{ transform: "translateZ(30px)" }}
        >
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sẵn sàng bàn giao hôm nay</span>
          </div>
        </div>

        {/* Bottom Content inside image (3D Pop-out) */}
        <div
          className="absolute bottom-5 left-5 right-5 text-white z-10"
          style={{ transform: "translateZ(38px)" }}
        >
          <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">
            Chất lượng
          </span>
          <div className="text-xl font-black mt-0.5 text-white">Uy tín</div>
          <div className="text-xs text-slate-200 mt-1.5 flex items-center justify-between">
            <span className="text-slate-300 font-medium">An toàn</span>
            <span className="text-cyan-300 text-base font-extrabold">150.000 đ/ngày</span>
          </div>
        </div>
      </motion.div>

      {/* Floating Badge 1: 4.95 / 5.0 (Stable & Crisp) */}
      <div
        className="absolute -top-4 -left-4 sm:-left-6 bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/60 dark:shadow-none flex items-center gap-3 z-20 pointer-events-auto"
      >
        <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
          <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
            4.95 / 5.0
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">1.250+ đánh giá xác thực</div>
        </div>
      </div>

      {/* Floating Badge 2: Bàn giao xe nhanh (Stable & Crisp) */}
      <div
        className="absolute -bottom-4 -right-4 sm:-right-6 bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/60 dark:shadow-none flex items-center gap-3 z-20 pointer-events-auto"
      >
        <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
          <KeyRound className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Bàn giao xe nhanh</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Giao tận nơi</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Home Page Component ─────────────────────────────────────────
export default function HomePage() {
  const { t } = useLanguage();
  // Search parameters (Chuẩn 24h từ 0h đến 23h)
  const now = new Date();
  const defaultStart = formatLocalIsoString(new Date(now.getTime() + 2 * 60 * 60 * 1000));
  const defaultEnd = calculate24hReturnTime(defaultStart, "07:00", "21:00");

  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [startTime, setStartTime] = useState<string>(defaultStart);
  const [endTime, setEndTime] = useState<string>(defaultEnd);
  const [vehicleType, setVehicleType] = useState<number | undefined>(undefined);
  const [brandQuery, setBrandQuery] = useState<string>("");

  // Khi chọn thời gian nhận: hệ thống tự tính toán đủ 24h cho 1 ngày và cập nhật thời gian trả tương ứng.
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const newEnd = calculate24hReturnTime(newStart, "07:00", "21:00");
    setEndTime(newEnd);
  };

  // Favorites state
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});

  // Vehicle comparison state
  const [comparedVehicles, setComparedVehicles] = useState<VehicleModel[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const toggleCompare = (vehicle: VehicleModel) => {
    setComparedVehicles((prev) => {
      const exists = prev.some((v) => v.id === vehicle.id);
      if (exists) {
        return prev.filter((v) => v.id !== vehicle.id);
      }
      if (prev.length >= 3) {
        alert("Bạn chỉ có thể so sánh tối đa 3 dòng xe cùng lúc.");
        return prev;
      }
      return [...prev, vehicle];
    });
  };

  const removeComparedVehicle = (id: number) => {
    setComparedVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const clearComparedVehicles = () => {
    setComparedVehicles([]);
  };

  // Data state: Base pool of vehicle models
  const [baseVehicles, setBaseVehicles] = useState<VehicleModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [hasLoadedPromos, setHasLoadedPromos] = useState<boolean>(false);

  useEffect(() => {
    api.promotions
      .getActive()
      .then((list) => {
        setPromotions(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setPromotions([]);
      })
      .finally(() => {
        setHasLoadedPromos(true);
      });
  }, []);

  const handleCopyPromo = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã ${code}! Bạn có thể chọn hoặc dán mã khi mở cửa sổ đặt xe.`);
  };

  const handleApplyPromoFromCard = (code: string) => {
    sessionStorage.setItem("pending_promo_code", code);
    toast.success(`Đã chọn mã ${code}! Hãy chọn chiếc xe bên dưới để nhận ưu đãi.`);
    const el = document.getElementById("vehicle-showcase-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const fetchVehicles = async (overrideProvince?: string) => {
    setIsLoading(true);
    try {
      const activeProvince = overrideProvince !== undefined ? overrideProvince : selectedProvince;
      const res = await api.customer.searchVehicles({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        brand: brandQuery || undefined,
        province: activeProvince && activeProvince !== "all" ? activeProvince : undefined,
      });
      if (res && Array.isArray(res.data)) {
        setBaseVehicles(res.data);
      } else {
        setBaseVehicles([]);
      }
    } catch {
      setBaseVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
      toast.error("Thời gian nhận/trả xe không hợp lệ! Ngày giờ trả xe phải sau thời gian nhận xe.");
      return;
    }
    fetchVehicles();
  };

  // Safe client-side filtering per user instruction:
  const displayedVehicles = baseVehicles.filter((v) => {
    if (vehicleType !== undefined && (vehicleType as any) !== "all") {
      if (Number(v.type) !== Number(vehicleType)) return false;
    }
    if (selectedProvince && selectedProvince !== "all") {
      const matchProv =
        v.store?.province?.toLowerCase().includes(selectedProvince.toLowerCase()) ||
        v.store?.address?.toLowerCase().includes(selectedProvince.toLowerCase());
      if (!matchProv) return false;
    }
    return true;
  });

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const typeLabels: Record<number, string> = {
    0: t("type_manual", "Xe số"),
    1: t("type_scooter", "Tay ga"),
    2: t("type_clutch", "Côn tay"),
    3: t("type_electric", "Xe điện"),
    4: t("type_car", "Ô tô"),
  };

  // Stagger entrance variants
  const heroContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.08,
      },
    },
  };

  const heroItemVariants: Variants = {
    hidden: { opacity: 0, y: 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/40 dark:bg-slate-950">
      {/* ─── Hero Section (Split-Screen Modern Lifestyle with Framer Motion) ─── */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pt-8 pb-16 lg:py-20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column (Stagger Entrance Animation) */}
            <motion.div
              variants={heroContainerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7 space-y-6"
            >
              <motion.h1
                variants={heroItemVariants}
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.12]"
              >
                {t("hero_title_1", "VehicleRent — ")}<br className="hidden sm:inline" />
                {t("hero_title_2", "Nền tảng cho thuê xe uy tín")}
              </motion.h1>

              <motion.p
                variants={heroItemVariants}
                className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed"
              >
                {t("hero_desc", "Dịch vụ uy tín, thủ tục nhanh gọn")}
              </motion.p>

              {/* ─── Floating Pill Search Bar (Turo & Mioto signature dock) ─── */}
              <motion.div variants={heroItemVariants} className="pt-2">
                <form
                  onSubmit={handleSearchSubmit}
                  className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xl shadow-slate-200/60 dark:shadow-none p-3 sm:p-4 space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                >
                  {/* Location field (Full-width top row) */}
                  <div className="px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-600/50 transition-colors">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      {t("search_pickup_location", "Địa điểm nhận xe")}
                    </span>
                    <ProvinceCombobox
                      value={selectedProvince}
                      onChange={(val) => {
                        setSelectedProvince(val);
                        fetchVehicles(val);
                      }}
                      includeAllOption={true}
                      allOptionLabel={t("search_all_provinces", "Toàn quốc")}
                      placeholder={t("search_pickup_location", "Chọn tỉnh / thành phố...")}
                    />
                  </div>

                  {/* Pickup & Return date fields (Side-by-side row) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Pickup date */}
                    <div className="px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-600/50 transition-colors">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                        {t("search_start_time", "Bắt đầu thuê")}
                      </span>
                      <DateTime24hPicker
                        value={startTime}
                        onChange={handleStartTimeChange}
                        variant="compact"
                        minDate={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    {/* Return date */}
                    <div className="px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-600/50 transition-colors">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                        {t("search_end_time", "Kết thúc thuê")}
                      </span>
                      <DateTime24hPicker
                        value={endTime}
                        onChange={setEndTime}
                        variant="compact"
                        minDate={startTime.split("T")[0] || new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>

                  {/* Search Button with Spring Physics */}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    disabled={isLoading}
                    className="w-full h-11 sm:h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm gap-2 shadow-md shadow-blue-600/25 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    <Search className="h-4 w-4" />
                    <span>{t("search_submit", "Tìm kiếm xe ngay")}</span>
                  </motion.button>
                </form>

                {/* Quick Vehicle Type Filter Chips with Spring Physics */}
                <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                  <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px] mr-1">{t("filter_popular_types", "Dòng xe phổ biến:")}</span>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={() => setVehicleType(undefined)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${vehicleType === undefined
                      ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                  >
                    {t("filter_all", "Tất cả")}
                  </motion.button>
                  {[
                    { type: 1, label: t("type_scooter", "Xe tay ga") },
                    { type: 0, label: t("type_manual", "Xe số") },
                    { type: 2, label: t("type_clutch", "Xe tay côn") },
                    { type: 3, label: t("type_electric", "Xe điện") },
                    { type: 4, label: t("type_car", "Ô tô") },
                  ].map((item) => (
                    <motion.button
                      key={item.type}
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      onClick={() => setVehicleType(item.type)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${vehicleType === item.type
                        ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                    >
                      {item.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Trust & Guarantee points */}
              <motion.div
                variants={heroItemVariants}
                className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t("trust_point_1", "100% Xe chính chủ đã kiểm tra")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t("trust_point_2", "Giao nhận xe tận nơi linh hoạt")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t("trust_point_3", "Giá niêm yết không phụ phí ẩn")}</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column: 3D Parallax Tilt Hero Card with Cyan Glow */}
            <div className="lg:col-span-5">
              <HeroVehicleTiltCard />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Vehicle Showcase (Scroll Reveal & Stagger Animation) ─── */}
      <section id="vehicle-showcase-section" className="py-14 sm:py-20 flex-1 scroll-mt-20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {t("showcase_title", "Phương tiện nổi bật sẵn sàng cho thuê")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t("showcase_desc", "Lựa chọn chiếc xe ưng ý cho chuyến đi tiếp theo của bạn với thông số chi tiết và giá thuê minh bạch.")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs">
                Hiển thị <strong>{displayedVehicles.length}</strong> {t("showcase_matching", "dòng xe phù hợp")}
              </span>
            </div>
          </div>

          <div id="vehicle-catalog-grid">
            {/* Cards Grid with Scroll Reveal */}
            {displayedVehicles.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
                <Bike className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {t("showcase_empty_title", "Không tìm thấy xe phù hợp trong khung giờ này")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  {t("showcase_empty_desc", "Hãy thử chọn loại xe khác hoặc điều chỉnh thời gian nhận / trả xe trên thanh tìm kiếm.")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayedVehicles.map((v) => {
                  const available = v.availableCount !== undefined ? v.availableCount : 3;
                  const isOutOfStock = available <= 0;
                  const isFav = favorites[v.id] || false;
                  const isCompared = comparedVehicles.some((item) => item.id === v.id);

                  return (
                    <Link
                      key={v.id}
                      href={`/vehicles/${v.id}`}
                      className="block h-full group outline-none"
                    >
                      <div
                        className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-card-hover hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
                      >
                        <div>
                          {/* Vehicle Image Container */}
                          <div className="relative h-52 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <img
                              src={getVehicleCardImageUrl(v.images?.[0])}
                              alt={`Dòng xe ${v.brand ? v.brand + " " : ""}${v.name || "cho thuê tự lái"} tại ${v.store?.storeName || "nhà xe đối tác"}`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getVehicleCardImageUrl(null);
                              }}
                              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />

                            {/* Category badge */}
                            <div className="absolute top-3 left-3 flex gap-1.5">
                              <span className="bg-white/95 text-slate-900 font-bold text-[11px] px-2.5 py-1 rounded-full shadow-xs">
                                {typeLabels[v.type] || "Xe máy"}
                              </span>
                              <span className="bg-slate-900/80 text-white font-semibold text-[11px] px-2.5 py-1 rounded-full">
                                {v.brand}
                              </span>
                            </div>

                            {/* Favorite button */}
                            <button
                              type="button"
                              aria-label={isFav ? "Xóa khỏi danh sách xe yêu thích" : "Lưu vào danh sách xe yêu thích"}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(v.id);
                              }}
                              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-red-500 hover:scale-110 active:scale-95 flex items-center justify-center shadow-xs transition-all z-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            >
                              <Heart
                                className={`h-4 w-4 ${isFav ? "fill-red-500 text-red-500" : ""
                                  }`}
                              />
                            </button>

                            {/* Compare toggle button */}
                            <button
                              type="button"
                              aria-label={isCompared ? "Hủy chọn so sánh dòng xe này" : "Thêm dòng xe vào bảng so sánh"}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleCompare(v);
                              }}
                              title={isCompared ? "Đang chọn so sánh (bấm để hủy)" : "Thêm vào bảng so sánh"}
                              className={`absolute top-3 right-12 h-8 w-8 rounded-full flex items-center justify-center shadow-xs transition-all z-10 cursor-pointer hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${isCompared
                                ? "bg-blue-600 text-white font-bold ring-2 ring-blue-300 shadow-xs"
                                : "bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600"
                                }`}
                            >
                              <Scale className="h-4 w-4" />
                            </button>

                            {/* Availability Pill */}
                            <div className="absolute bottom-3 left-3">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm ${isOutOfStock
                                  ? "bg-red-500 text-white"
                                  : available <= 1
                                    ? "bg-amber-500 text-white"
                                    : "bg-emerald-600 text-white"
                                  }`}
                              >
                                {isOutOfStock ? "Đã hết xe" : `Sẵn sàng bàn giao (${available} xe)`}
                              </span>
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-5 space-y-3">
                            {/* Title & Brand */}
                            <div>
                              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                {v.brand}
                              </div>
                              <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {v.name}
                              </h3>
                            </div>

                            {/* Store Info & Province Badge & Rating */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1.5 truncate pr-2">
                                <Store className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                                <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                                  {v.store?.storeName || "Nhà xe đối tác"}
                                </span>
                                {v.store?.province && (
                                  <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-900 shrink-0">
                                    {v.store.province}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold shrink-0">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                                <span>{v.avgRating || 5.0}</span>
                                <span className="text-[10px] text-slate-400 font-normal">({v.reviewCount || 0})</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Price & Direct Details Link */}
                        <div className="p-5 pt-0 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 mt-2 pt-4">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Giá thuê</div>
                            <div className="text-base font-black text-slate-900 dark:text-white">
                              {Number(v.rentPrice).toLocaleString("vi-VN")} đ
                              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{t("per_day", "/ngày")}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                            <span>{t("view_detail", "Xem chi tiết xe")}</span>
                            <span className="text-sm font-black">→</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Pricing & Promos Section (#pricing) ─── */}
      <section id="pricing" className="py-16 bg-slate-50 border-t border-slate-200/80 scroll-mt-20">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-slate-200/70">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Biểu phí niêm yết & Gói ưu đãi hành trình
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed max-w-xl">
                Giá niêm yết minh bạch theo ngày, tự động áp mã giảm giá cho lịch trình từ 3 ngày trở lên và hỗ trợ giao nhận tận nơi.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-medium shrink-0">
              Cập nhật biểu phí theo đối tác xác thực
            </div>
          </div>

          {promotions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {promotions.map((p, idx) => {
                const tagLower = (p.tag || "").toLowerCase();
                const isPopular = tagLower.includes("phổ biến") || tagLower.includes("hot");
                const isUtility = tagLower.includes("tiện ích");
                const isNewbie = tagLower.includes("tân thủ");

                return (
                  <div
                    key={p.id || idx}
                    className={`bg-white rounded-2xl p-6 border transition-all relative overflow-hidden group flex flex-col justify-between ${isPopular
                      ? "border-2 border-blue-600 shadow-lg shadow-blue-500/10"
                      : "border-slate-200/80 shadow-xs hover:shadow-md"
                      }`}
                  >
                    <div>
                      {p.tag && (
                        <div
                          className={`absolute top-0 right-0 font-extrabold text-[10px] uppercase tracking-wider py-1 px-4 rounded-bl-2xl text-white ${isUtility ? "bg-amber-500" : isPopular ? "bg-blue-600" : "bg-blue-600"
                            }`}
                        >
                          {p.tag}
                        </div>
                      )}
                      <h3 className="text-xl font-black text-slate-900 mt-1">{p.title}</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {p.description || "Ưu đãi giảm giá áp dụng trực tiếp khi đặt xe trên hệ thống VehicleRent."}
                      </p>

                      {/* Interactive Code Box */}
                      <div className="mt-5 p-3 rounded-2xl bg-blue-50/60 border border-dashed border-blue-200 flex items-center justify-between gap-2">
                        <span className="font-mono font-black text-sm text-blue-700">{p.code}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyPromo(p.code)}
                            className="text-[11px] font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            title="Sao chép mã vào bộ nhớ tạm"
                          >
                            Copy mã
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPromoFromCard(p.code)}
                            className="text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
                            title="Lưu mã và chọn xe thuê"
                          >
                            Áp dụng
                          </button>
                        </div>
                      </div>

                      {/* Bullets */}
                      {Array.isArray(p.bullets) && p.bullets.length > 0 && (
                        <ul className="mt-5 space-y-2 text-xs text-slate-600">
                          {p.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="flex items-center gap-2">
                              <CheckCircle2
                                className={`h-4 w-4 shrink-0 ${isUtility
                                  ? "text-amber-600"
                                  : isPopular
                                    ? "text-emerald-600"
                                    : "text-blue-600"
                                  }`}
                              />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Hiện chưa có mã ưu đãi công khai</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Ban Quản Trị sẽ sớm cập nhật các chương trình voucher và khuyến mãi mới cho từng hành trình tại đây.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Experience & Values Section (Asymmetric Bento Grid) ─── */}
      <section id="about" className="py-20 bg-slate-50/70 border-t border-slate-200/80 scroll-mt-20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          {/* Asymmetric Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Tiêu chuẩn vận hành minh bạch cho từng chuyến đi
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Nền tảng công nghệ kết nối trực tiếp với đối tác nhà xe uy tín, kiểm soát chất lượng từ khâu chọn biển số đến khi hoàn tất bàn giao thực tế.
              </p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0 flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Quy trình kiểm tra 6 điểm kỹ thuật số</span>
            </div>
          </div>

          {/* Asymmetric Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Bento Card 1: 7 cols - Biển số thực tế & 6 điểm kiểm tra */}
            <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-900">
                  <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Cam kết biển số thực tế</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-slate-100 tracking-tight">
                  Nhận đúng dòng xe & biển số đã xác nhận
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                  Loại bỏ tình trạng chỉ chọn dòng xe chung chung. Mỗi đơn thuê trên VehicleRent đều gắn liền với biển số thực tế và được đối soát 6 điểm kỹ thuật số lưu biên bản điện tử trực tiếp trên hệ thống.
                </p>
              </div>

              {/* 6-point digital checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium text-[11px]">Đèn & Xi nhan</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium text-[11px]">Hệ thống phanh</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium text-[11px]">Lốp xe & Áp suất</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium text-[11px]">Gương chiếu hậu</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium text-[11px]">Vạch xăng hiện trạng</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium text-[11px]">Ảnh chụp trầy xước</span>
                </div>
              </div>
            </div>

            {/* Bento Card 2: 5 cols - Khóa xe 10 phút & Webhook PayOS */}
            <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-2xl p-7 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-500/20 text-cyan-300 text-xs font-bold border border-cyan-400/30">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span>Khóa xe 10 phút chống xung đột</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  VietQR tức thời, không lo trùng lịch
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Cơ chế khóa chỗ độc quyền 10 phút bảo vệ lượt đặt của bạn. Thanh toán cọc tự động qua chuẩn Napas247 PayOS, hệ thống tự động giải phóng vị trí nếu quá hạn mà không phát sinh bất kỳ rủi ro nào.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-200 font-semibold">Tự động hoàn cọc theo quy chế</span>
                </div>
                <span className="text-cyan-300 font-bold text-[11px] bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-500/30">0% phụ phí ẩn</span>
              </div>
            </div>

            {/* Bento Card 3: 5 cols - Nhận xe tận nơi */}
            <div className="md:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-100 dark:border-emerald-900">
                  <Compass className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Tiện ích giao nhận</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-slate-100 tracking-tight">
                  Giao xe tận sảnh khách sạn & sân bay
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Linh hoạt lựa chọn: nhận trực tiếp tại showroom đối tác hoặc yêu cầu giao xe tận nơi theo giờ hẹn. Tặng kèm mũ bảo hiểm đạt chuẩn và áo mưa dự phòng cho mọi chuyến đi.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-semibold text-slate-700 dark:text-slate-300">Miễn phí giao &lt; 5km</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-semibold text-slate-700 dark:text-slate-300">Giao đúng giờ hẹn</span>
              </div>
            </div>

            {/* Bento Card 4: 7 cols - Pháp lý & Hotline */}
            <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-900">
                  <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Quy định pháp lý minh bạch</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-slate-100 tracking-tight">
                  Rõ ràng phạt nguội, an tâm di chuyển
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                  Chính sách trách nhiệm vi phạm giao thông (phạt nguội) và điều kiện hoàn hủy cọc được niêm yết công khai. Đội ngũ quản lý vận hành hỗ trợ xử lý sự cố phát sinh 24/7 trong suốt hành trình.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-3">
                  <Link href="/terms" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    Quy định phạt nguội →
                  </Link>
                  <Link href="/refund" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    Chính sách hoàn cọc →
                  </Link>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Hotline hỗ trợ: <a href="tel:0384340974" className="text-slate-900 dark:text-slate-100 font-bold hover:underline">0384 340 974</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Compare Bar */}
      <FloatingCompareBar
        vehicles={comparedVehicles}
        onOpenModal={() => setIsCompareModalOpen(true)}
        onRemoveVehicle={removeComparedVehicle}
        onClearAll={clearComparedVehicles}
      />

      {/* Vehicle Compare Modal */}
      <VehicleCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        vehicles={comparedVehicles}
        onRemoveVehicle={removeComparedVehicle}
        onClearAll={clearComparedVehicles}
      />
    </div>
  );
}
