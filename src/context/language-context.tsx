"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "vi" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Navigation
    nav_home: "Thuê Xe",
    nav_stores: "Cửa Hàng",
    nav_pricing: "Ưu Đãi",
    nav_feedback: "Góp Ý & Khiếu Nại",
    nav_about: "Về Chúng Tôi",
    nav_vehicles: "Danh sách xe",
    nav_my_bookings: "Đơn Đặt",
    nav_partner_vehicles: "Quản lý xe",
    nav_partner_bookings: "Đơn thuê xe",
    nav_partner_wallet: "Ví & Doanh thu",
    nav_admin_reports: "Báo Cáo Sàn",
    nav_admin_stores: "Duyệt Cửa Hàng",
    nav_admin_transactions: "Quản Lý Giao Dịch",
    nav_admin_users: "Quản Trị Người Dùng",
    nav_admin_feedbacks: "Hòm Thư Góp Ý",
    nav_admin_promotions: "Khuyến Mãi & Voucher",
    nav_admin_reviews: "Duyệt Đánh Giá",

    // Partner specific
    partner_switch_module: "Đổi Phân Hệ",
    partner_branch_ops: "Vận Hành Chi Nhánh",
    partner_vehicles: "Dòng Xe",
    partner_bookings: "Đơn Thuê",
    partner_wallet: "Sổ Giao Dịch",
    partner_switch_branch: "Đổi Chi Nhánh",
    partner_revenue_branches: "Doanh Thu & Chi Nhánh",
    partner_branch_profile: "Hồ Sơ Chi Nhánh",
    partner_wallet_payout: "Ví Đối Tác & Rút Tiền",

    // Auth & Actions
    become_partner: "Trở thành Đối tác chủ xe",
    login: "Đăng Nhập",
    register: "Đăng Ký",
    register_customer: "Đăng ký Khách thuê",
    register_customer_desc: "Thuê xe tự lái giữ chỗ 10 phút",
    register_partner: "Đăng ký Đối tác nhà xe",
    register_partner_desc: "Mở ví đối tác & cho thuê xe",
    profile: "Hồ sơ cá nhân",
    logout: "Đăng xuất",

    // Theme & Lang
    theme_title: "Giao diện",
    theme_light: "Sáng",
    theme_dark: "Tối",
    theme_system: "Hệ thống",
    language_title: "Ngôn ngữ",
    lang_vi: "Tiếng Việt",
    lang_en: "English",

    // Hero & Search
    hero_badge: "Sẵn sàng bàn giao hôm nay",
    hero_title_1: "Thuê xe tự lái — ",
    hero_title_2: "tự do khám phá mọi cung đường",
    hero_desc: "Trải nghiệm những chiếc xe đời mới được bảo dưỡng kỹ lưỡng từ các chủ xe uy tín. Thủ tục nhanh gọn, nhận xe tận nơi hoặc tại cửa hàng, sẵn sàng cho mọi hành trình của bạn.",
    search_pickup_location: "Địa điểm nhận xe",
    search_all_provinces: "Toàn quốc (Tất cả tỉnh thành)",
    search_start_time: "Bắt đầu thuê",
    search_end_time: "Kết thúc thuê",
    search_submit: "Tìm kiếm xe ngay",
    filter_popular_types: "Dòng xe phổ biến:",
    filter_all: "Tất cả",
    type_scooter: "Xe tay ga",
    type_manual: "Xe số",
    type_clutch: "Xe tay côn",
    type_electric: "Xe điện",
    type_car: "Ô tô tự lái",
    trust_point_1: "100% Xe chính chủ đã kiểm tra",
    trust_point_2: "Giao nhận xe tận nơi linh hoạt",
    trust_point_3: "Giá niêm yết không phụ phí ẩn",

    // Showcase
    showcase_title: "Phương tiện nổi bật sẵn sàng cho thuê",
    showcase_desc: "Lựa chọn chiếc xe ưng ý cho chuyến đi tiếp theo của bạn với thông số chi tiết và giá thuê minh bạch.",
    showcase_matching: "dòng xe phù hợp",
    showcase_empty_title: "Không tìm thấy xe phù hợp trong khung giờ này",
    showcase_empty_desc: "Hãy thử chọn loại xe khác hoặc điều chỉnh thời gian nhận / trả xe trên thanh tìm kiếm.",
    per_day: "đ/ngày",
    rent_now: "Đặt xe ngay",
    compare_action: "So sánh",
    view_detail: "Xem chi tiết",

    // Footer
    footer_tagline: "Nền tảng công nghệ cho thuê xe máy và ô tô tự lái hàng đầu Việt Nam. Kết nối khách thuê với mạng lưới đối tác nhà xe chính chủ trên toàn quốc.",
    footer_quick_links: "Khám Phá Sàn",
    footer_support: "Chính Sách & Hỗ Trợ",
    footer_contact: "Liên Hệ Điều Hành",
    footer_terms: "Điều khoản dịch vụ",
    footer_privacy: "Chính sách bảo mật",
    footer_refund: "Hủy & Hoàn cọc",
    footer_cookies: "Cookie",
    footer_feedback: "Góp ý & Khiếu nại",
    footer_rights: "© 2026 VehicleRent. Sàn thương mại điện tử cho thuê xe máy & ô tô tự lái.",
  },
  en: {
    // Navigation
    nav_home: "Rent Vehicle",
    nav_stores: "Stores",
    nav_pricing: "Deals",
    nav_feedback: "Feedback & Support",
    nav_about: "About Us",
    nav_vehicles: "Vehicles",
    nav_my_bookings: "My Bookings",
    nav_partner_vehicles: "Manage Vehicles",
    nav_partner_bookings: "Bookings",
    nav_partner_wallet: "Wallet & Revenue",
    nav_admin_reports: "Platform Reports",
    nav_admin_stores: "Store Approvals",
    nav_admin_transactions: "Transaction History",
    nav_admin_users: "User Directory",
    nav_admin_feedbacks: "Feedback Inbox",
    nav_admin_promotions: "Promotions & Vouchers",
    nav_admin_reviews: "Review Moderation",

    // Partner specific
    partner_switch_module: "Switch Module",
    partner_branch_ops: "Branch Operations",
    partner_vehicles: "Vehicle Models",
    partner_bookings: "Rental Bookings",
    partner_wallet: "Ledger & Wallet",
    partner_switch_branch: "Switch Branch",
    partner_revenue_branches: "Revenue & Branches",
    partner_branch_profile: "Branch Profile",
    partner_wallet_payout: "Partner Wallet & Payout",

    // Auth & Actions
    become_partner: "Become a Host Partner",
    login: "Log In",
    register: "Sign Up",
    register_customer: "Register as Customer",
    register_customer_desc: "Rent vehicles with 10-min reservation",
    register_partner: "Register as Partner",
    register_partner_desc: "Open partner wallet & host vehicles",
    profile: "My Profile",
    logout: "Log Out",

    // Theme & Lang
    theme_title: "Appearance",
    theme_light: "Light",
    theme_dark: "Dark",
    theme_system: "System",
    language_title: "Language",
    lang_vi: "Tiếng Việt",
    lang_en: "English",

    // Hero & Search
    hero_badge: "Ready for delivery today",
    hero_title_1: "Self-Drive Rental — ",
    hero_title_2: "Freedom to Explore Every Road",
    hero_desc: "Experience pristine modern vehicles meticulously maintained by verified hosts. Fast handover, delivery to your door or store pickup, ready for all journeys.",
    search_pickup_location: "Pickup Location",
    search_all_provinces: "Nationwide (All Provinces)",
    search_start_time: "Start Rental",
    search_end_time: "Return Rental",
    search_submit: "Search Vehicles Now",
    filter_popular_types: "Popular Categories:",
    filter_all: "All",
    type_scooter: "Scooter",
    type_manual: "Manual Bike",
    type_clutch: "Clutch Bike",
    type_electric: "Electric Vehicle",
    type_car: "Self-drive Car",
    trust_point_1: "100% Verified host vehicles",
    trust_point_2: "Flexible doorstep delivery",
    trust_point_3: "Transparent pricing without hidden fees",

    // Showcase
    showcase_title: "Featured Vehicles Ready to Rent",
    showcase_desc: "Choose the ideal vehicle for your next adventure with transparent rates and verified specs.",
    showcase_matching: "matching vehicles",
    showcase_empty_title: "No vehicles found for this schedule",
    showcase_empty_desc: "Try selecting a different vehicle category or adjusting your rental dates.",
    per_day: "VND/day",
    rent_now: "Book Now",
    compare_action: "Compare",
    view_detail: "View details",

    // Footer
    footer_tagline: "Vietnam's leading self-drive motorbike and automobile rental platform. Seamlessly connecting renters with verified vehicle hosts nationwide.",
    footer_quick_links: "Explore Platform",
    footer_support: "Policies & Support",
    footer_contact: "Operations & Contact",
    footer_terms: "Terms of Service",
    footer_privacy: "Privacy Policy",
    footer_refund: "Cancellation & Refund",
    footer_cookies: "Cookie Policy",
    footer_feedback: "Feedback & Complaints",
    footer_rights: "© 2026 VehicleRent. E-commerce platform for motorbike & self-drive car rentals.",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("vi");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("vr_locale") as Language | null;
      if (stored === "vi" || stored === "en") {
        setLanguageState(stored);
        document.documentElement.lang = stored;
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("vr_locale", lang);
      document.documentElement.lang = lang;
    } catch {}
  };

  const t = (key: string, defaultText?: string): string => {
    return translations[language]?.[key] || defaultText || translations.vi[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
