"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bike,
  UserCheck,
  Shield,
  Store,
  Wallet,
  ClipboardList,
  LogOut,
  ChevronDown,
  Menu,
  X,
  LogIn,
  UserPlus,
  User as UserIcon,
  MapPin,
  Tag,
  Ticket,
  Info,
  Car,
  BarChart3,
  Users,
  CheckSquare,
  ArrowLeft,
  Compass,
  Receipt,
  MessageSquare,
  TrendingUp,
  Building2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/context/language-context";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSelector } from "@/components/layout/language-selector";
import { BrandLogo } from "@/components/layout/brand-logo";

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const partnerMode = searchParams?.get("mode"); // "owner" | "branch" | null
  const { user, role, logout } = useAuth();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isCustomer = role === 2;
  const isPartner = role === 1;
  const isAdmin = role === 0;

  const roleLabels: Record<number, { label: string; badge: string; color: string }> = {
    0: { label: "Admin Sàn", badge: "Ban Quản Trị Sàn", color: "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" },
    1: { label: "Đối Tác Xe", badge: "Chủ Xe Đối Tác", color: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    2: { label: "Khách Hàng", badge: "Khách Thuê", color: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  // ─── Distinct Navigation Menus by Role (Tối ưu gọn gàng cho Admin & Partner) ─
  const adminPrimaryLinks = [
    { title: t("nav_admin_reports", "Báo Cáo"), href: "/admin", icon: BarChart3, isActive: pathname === "/admin" },
    { title: t("nav_admin_stores", "Cửa Hàng"), href: "/admin/stores", icon: Store, isActive: pathname.startsWith("/admin/stores") },
    { title: t("nav_admin_transactions", "Giao Dịch"), href: "/admin/transactions", icon: Receipt, isActive: pathname.startsWith("/admin/transactions") },
    { title: t("nav_admin_users", "Người Dùng"), href: "/admin/users", icon: Users, isActive: pathname.startsWith("/admin/users") },
  ];

  const adminSecondaryLinks = [
    { title: t("nav_admin_promotions", "Khuyến Mãi"), href: "/admin/promotions", icon: Ticket, isActive: pathname.startsWith("/admin/promotions") },
    { title: t("nav_admin_feedbacks", "Góp Ý"), href: "/admin/feedbacks", icon: MessageSquare, isActive: pathname.startsWith("/admin/feedbacks") },
    { title: t("nav_admin_reviews", "Đánh Giá"), href: "/admin/reviews", icon: Shield, isActive: pathname.startsWith("/admin/reviews") },
  ];

  const isMoreAdminActive = adminSecondaryLinks.some((l) => l.isActive);
  const adminNavLinks = [...adminPrimaryLinks, ...adminSecondaryLinks]; // Dùng cho Mobile menu drawer

  // Determine partner portal state & active branch context
  const queryStoreId = searchParams?.get("storeId");
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [activeBranchName, setActiveBranchName] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Khi ở màn hình chọn phân hệ gốc (/partner không mode) hoặc phân hệ chủ: xóa context chi nhánh
      if (pathname === "/partner" && (!partnerMode || partnerMode === "owner")) {
        setActiveBranchId(null);
        setActiveBranchName(null);
        localStorage.removeItem("active_partner_store_id");
        localStorage.removeItem("active_partner_store_name");
        return;
      }
      // 2. Khi ở màn hình chọn chi nhánh (/partner?mode=branch) và chưa chọn branch cụ thể
      if (pathname === "/partner" && partnerMode === "branch" && !queryStoreId) {
        setActiveBranchId(null);
        setActiveBranchName(null);
        localStorage.removeItem("active_partner_store_id");
        localStorage.removeItem("active_partner_store_name");
        return;
      }

      // 3. Nếu có queryStoreId: ưu tiên lưu vào localStorage
      if (queryStoreId) {
        setActiveBranchId(queryStoreId);
        localStorage.setItem("active_partner_store_id", queryStoreId);
      } else {
        const storedId = localStorage.getItem("active_partner_store_id");
        if (storedId) {
          setActiveBranchId(storedId);
        }
      }

      const storedName = localStorage.getItem("active_partner_store_name");
      if (storedName) {
        setActiveBranchName(storedName);
      }
    }
  }, [pathname, partnerMode, queryStoreId]);

  // Phân hệ chi nhánh được kích hoạt khi:
  // - Đang ở các trang chi nhánh (/partner/vehicles, /partner/bookings, /partner/onboarding)
  // - Hoặc ở /partner?mode=branch có storeId
  // - Hoặc ở /partner/wallet có queryStoreId hoặc activeBranchId
  const effectiveBranchId = queryStoreId || activeBranchId;
  const isBranchRoute =
    isPartner &&
    Boolean(effectiveBranchId) &&
    (pathname.startsWith("/partner/vehicles") ||
      pathname.startsWith("/partner/bookings") ||
      (pathname.startsWith("/partner/analytics") && partnerMode !== "owner") ||
      (pathname === "/partner" && partnerMode === "branch" && Boolean(queryStoreId)) ||
      (pathname.startsWith("/partner/wallet") && Boolean(queryStoreId || activeBranchId)));

  const isBranchSelecting =
    isPartner && pathname === "/partner" && partnerMode === "branch" && !queryStoreId;

  const isOwnerRoute =
    isPartner &&
    ((pathname === "/partner" && partnerMode === "owner") ||
      (pathname.startsWith("/partner/analytics") && partnerMode === "owner") ||
      (pathname.startsWith("/partner/wallet") && !queryStoreId && !activeBranchId) ||
      pathname.startsWith("/partner/onboarding"));

  const partnerNavLinks = React.useMemo(() => {
    if (!isPartner) return [];

    // TRƯỜNG HỢP 1: Màn hình chọn phân hệ (/partner không mode) -> KHÔNG hiển thị tab nào
    if (pathname === "/partner" && !partnerMode) {
      return [];
    }

    // TRƯỜNG HỢP 2: Màn hình chọn chi nhánh (/partner?mode=branch chưa chọn chi nhánh cụ thể)
    if (isBranchSelecting) {
      return [
        {
          title: t("partner_switch_module", "Đổi Phân Hệ"),
          href: "/partner",
          icon: ArrowLeft,
          isActive: false,
        },
      ];
    }

    // TRƯỜNG HỢP 3: Phân hệ vận hành chi nhánh (Nhân viên / Quản lý chi nhánh)
    if (isBranchRoute) {
      const branchQuery = effectiveBranchId ? `?storeId=${effectiveBranchId}` : "";
      return [
        {
          title: t("partner_branch_ops_short", "Vận Hành"),
          href: `/partner?mode=branch${effectiveBranchId ? `&storeId=${effectiveBranchId}` : ""}`,
          icon: BarChart3,
          isActive: pathname === "/partner" && partnerMode === "branch",
        },
        {
          title: t("partner_vehicles_short", "Dòng Xe"),
          href: `/partner/vehicles${branchQuery}`,
          icon: Bike,
          isActive: pathname.startsWith("/partner/vehicles"),
        },
        {
          title: t("partner_bookings_short", "Đơn Thuê"),
          href: `/partner/bookings${branchQuery}`,
          icon: ClipboardList,
          isActive: pathname.startsWith("/partner/bookings"),
        },
        {
          title: t("partner_analytics_short", "Thống Kê"),
          href: `/partner/analytics${branchQuery}`,
          icon: TrendingUp,
          isActive: pathname.startsWith("/partner/analytics"),
        },
        {
          title: t("partner_wallet_short", "Ví Tiền"),
          href: `/partner/wallet${branchQuery}`,
          icon: Wallet,
          isActive: pathname.startsWith("/partner/wallet"),
        },
        {
          title: t("partner_switch_branch_short", "Đổi Chi Nhánh"),
          href: "/partner?mode=branch",
          icon: ArrowLeft,
          isActive: false,
        },
      ];
    }

    // TRƯỜNG HỢP 4: Phân hệ Chủ cửa hàng (Master Owner HQ)
    if (isOwnerRoute) {
      const links = [
        {
          title: t("partner_revenue_branches_short", "Tổng Quan"),
          href: "/partner?mode=owner",
          icon: Building2,
          isActive: pathname === "/partner" && partnerMode === "owner",
        },
        {
          title: t("partner_analytics_short", "Thống Kê"),
          href: "/partner/analytics?mode=owner",
          icon: BarChart3,
          isActive: pathname.startsWith("/partner/analytics"),
        },
      ];

      if (pathname.startsWith("/partner/onboarding")) {
        links.push({
          title: t("partner_branch_profile_short", "Hồ Sơ"),
          href: `/partner/onboarding${effectiveBranchId ? `?storeId=${effectiveBranchId}` : ""}`,
          icon: Store,
          isActive: true,
        });
      }

      links.push(
        {
          title: t("partner_wallet_payout_short", "Ví Đối Tác"),
          href: "/partner/wallet",
          icon: Wallet,
          isActive: pathname.startsWith("/partner/wallet"),
        },
        {
          title: t("partner_switch_module_short", "Đổi Phân Hệ"),
          href: "/partner",
          icon: ArrowLeft,
          isActive: false,
        }
      );

      return links;
    }

    return [];
  }, [isPartner, pathname, partnerMode, isBranchSelecting, isBranchRoute, isOwnerRoute, effectiveBranchId, t]);

  const customerNavLinks = [
    { title: t("nav_home", "Thuê Xe"), href: "/", icon: Bike, isActive: pathname === "/" },
    { title: t("nav_stores", "Cửa Hàng"), href: "/stores", icon: MapPin, isActive: pathname.startsWith("/stores") },
    { title: t("nav_pricing", "Ưu Đãi"), href: "/#pricing", icon: Tag, isActive: pathname === "/#pricing" },
    ...(isCustomer
      ? [{ title: t("nav_my_bookings", "Đơn Đặt"), href: "/customer/bookings", icon: ClipboardList, isActive: pathname.startsWith("/customer/bookings") }]
      : []),
  ];

  const activeNavLinks = isAdmin ? adminNavLinks : isPartner ? partnerNavLinks : customerNavLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors shadow-xs overflow-x-clip">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Role Tag */}
        <div className="flex items-center gap-3 shrink-0">
          <BrandLogo
            href={isAdmin ? "/admin" : isPartner ? "/partner" : "/"}
            roleBadge={isAdmin ? "ADMIN PORTAL" : isPartner ? "PARTNER PORTAL" : null}
            size="md"
          />

          {isBranchRoute && effectiveBranchId && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-xs max-w-[200px] truncate" title={activeBranchName || `Chi nhánh #${effectiveBranchId}`}>
              <Store className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">{activeBranchName || `Chi nhánh #${effectiveBranchId}`}</span>
            </span>
          )}
        </div>

        {/* Center Navigation Links - Strictly Filtered by Role (Gọn gàng, chỉ giữ tab hay dùng) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0 py-1">
          {isAdmin ? (
            <>
              {adminPrimaryLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`${item.title}-${item.href}`}
                    href={item.href}
                    className={`flex items-center gap-1.5 xl:gap-2 px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                      item.isActive
                        ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        item.isActive ? "text-red-600 dark:text-red-400" : "text-slate-400 dark:text-slate-500"
                      }`}
                    />
                    <span>{item.title}</span>
                  </Link>
                );
              })}

              {/* Dropdown 'Thêm' gom các mục ít dùng cho Admin (Khuyến Mãi, Góp Ý, Đánh Giá) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      isMoreAdminActive
                        ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    <span>{t("nav_more", "Thêm")}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 p-1.5 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  {adminSecondaryLinks.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <DropdownMenuItem key={sub.href} asChild>
                        <Link
                          href={sub.href}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                            sub.isActive
                              ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <SubIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          <span>{sub.title}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            activeNavLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.title}-${item.href}`}
                  href={item.href}
                  className={`flex items-center gap-1.5 xl:gap-2 px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                    item.isActive
                      ? isPartner
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 font-bold shadow-2xs"
                        : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold shadow-2xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      item.isActive
                        ? isPartner
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-blue-600 dark:text-blue-400"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.title}</span>
                </Link>
              );
            })
          )}
        </nav>

        {/* Right Section: Role Actions + Controls + Auth State */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Partner Onboarding CTA Button (Only shown to Guests or Customer) */}
          {!user && (
            <Link href="/register?type=partner" className="hidden xl:inline-block">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-2 border-blue-600/30 text-blue-700 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white transition-all font-bold text-xs h-9.5 px-3.5 rounded-xl shadow-2xs cursor-pointer"
              >
                <Store className="h-4 w-4" />
                <span>{t("become_partner", "Trở thành Đối tác chủ xe")}</span>
              </Button>
            </Link>
          )}

          {/* Language Selector & Theme Toggle (Always visible at top-right) */}
          <div className="flex items-center gap-1.5">
            <LanguageSelector />
            <ThemeToggle />
          </div>

          {user ? (
            /* Logged-in state: Avatar + Name + Dropdown exclusively for current role */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2.5 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 font-medium text-xs sm:text-sm pl-2 pr-3 h-10 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 cursor-pointer"
                >
                  <div className={`w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ${isAdmin
                    ? "bg-gradient-to-tr from-red-600 to-rose-600"
                    : isPartner
                      ? "bg-gradient-to-tr from-amber-600 to-orange-600"
                      : "bg-gradient-to-tr from-blue-600 to-indigo-600"
                    }`}>
                    {getInitials(user.fullName)}
                  </div>
                  <span className="max-w-[100px] sm:max-w-[130px] truncate text-slate-800 dark:text-slate-100 font-bold">
                    {user.fullName}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-2 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="px-3 py-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user.fullName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  {role !== null && roleLabels[role] && (
                    <Badge
                      variant="outline"
                      className={`mt-1.5 text-[10px] py-0.5 px-2 font-semibold ${roleLabels[role].color}`}
                    >
                      {roleLabels[role].badge}
                    </Badge>
                  )}
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer py-2 text-xs">
                    <UserIcon className="mr-2 h-4 w-4 text-slate-500" />
                    <span>{t("profile", "Hồ sơ cá nhân")}</span>
                  </Link>
                </DropdownMenuItem>

                {/* Customer Menu items */}
                {isCustomer && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/customer/bookings" className="cursor-pointer py-2 text-xs">
                        <ClipboardList className="mr-2 h-4 w-4 text-blue-600" />
                        <span>{t("nav_my_bookings", "Lịch sử chuyến đi")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/feedback" className="cursor-pointer py-2 text-xs">
                        <MessageSquare className="mr-2 h-4 w-4 text-blue-600" />
                        <span>{t("nav_feedback", "Góp Ý & Khiếu Nại")}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {/* Partner Menu items */}
                {isPartner && (
                  <>
                    {isBranchRoute && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`/partner/vehicles${effectiveBranchId ? `?storeId=${effectiveBranchId}` : ""}`} className="cursor-pointer py-2 text-xs">
                            <Bike className="mr-2 h-4 w-4 text-amber-600" />
                            <span>Quản lý xe</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/partner/bookings${effectiveBranchId ? `?storeId=${effectiveBranchId}` : ""}`} className="cursor-pointer py-2 text-xs">
                            <ClipboardList className="mr-2 h-4 w-4 text-amber-600" />
                            <span>Đơn thuê</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/partner/wallet${effectiveBranchId ? `?storeId=${effectiveBranchId}` : ""}`} className="cursor-pointer py-2 text-xs">
                            <Wallet className="mr-2 h-4 w-4 text-amber-600" />
                            <span>Sổ  giao dịch chi nhánh</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/partner/onboarding${effectiveBranchId ? `?storeId=${effectiveBranchId}` : ""}`} className="cursor-pointer py-2 text-xs">
                            <Store className="mr-2 h-4 w-4 text-amber-600" />
                            <span>Hồ sơ chi nhánh</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/partner?mode=branch" className="cursor-pointer py-2 text-xs font-semibold text-blue-700">
                            <Store className="mr-2 h-4 w-4 text-blue-600" />
                            <span>Đổi chi nhánh vận hành</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/partner" className="cursor-pointer py-2 text-xs font-semibold text-slate-700">
                            <ArrowLeft className="mr-2 h-4 w-4 text-slate-500" />
                            <span>Đổi phân hệ làm việc</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    {isOwnerRoute && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/partner?mode=owner" className="cursor-pointer py-2 text-xs font-semibold text-amber-700">
                            <BarChart3 className="mr-2 h-4 w-4 text-amber-600" />
                            <span>Báo cáo doanh thu & Chi nhánh</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/partner/wallet" className="cursor-pointer py-2 text-xs">
                            <Wallet className="mr-2 h-4 w-4 text-amber-600" />
                            <span>Ví đối tác & Rút tiền</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/partner" className="cursor-pointer py-2 text-xs font-semibold text-slate-700">
                            <ArrowLeft className="mr-2 h-4 w-4 text-slate-500" />
                            <span>Đổi phân hệ làm việc</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    {!isBranchRoute && !isOwnerRoute && (
                      <DropdownMenuItem asChild>
                        <Link href="/partner" className="cursor-pointer py-2 text-xs font-semibold text-amber-700">
                          <Store className="mr-2 h-4 w-4 text-amber-600" />
                          <span>Chọn phân hệ làm việc</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {/* Admin Menu items */}
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer py-2 text-xs">
                        <BarChart3 className="mr-2 h-4 w-4 text-red-600" />
                        <span>Báo cáo & Thống kê sàn</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/stores" className="cursor-pointer py-2 text-xs">
                        <Store className="mr-2 h-4 w-4 text-red-600" />
                        <span>Duyệt Cửa hàng đối tác</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/transactions" className="cursor-pointer py-2 text-xs">
                        <Receipt className="mr-2 h-4 w-4 text-red-600" />
                        <span>Quản lý giao dịch & Rút tiền</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/users" className="cursor-pointer py-2 text-xs">
                        <Users className="mr-2 h-4 w-4 text-red-600" />
                        <span>Quản trị người dùng</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/reviews" className="cursor-pointer py-2 text-xs">
                        <Shield className="mr-2 h-4 w-4 text-red-600" />
                        <span>Kiểm duyệt đánh giá</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer py-2 font-medium text-xs"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("logout", "Đăng xuất")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Unauthenticated state: Login + Register */
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl h-9 px-3 gap-1.5 cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>{t("login", "Đăng Nhập")}</span>
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-3.5 rounded-xl shadow-xs gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>{t("register", "Đăng Ký")}</span>
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <DropdownMenuItem asChild>
                    <Link href="/register?type=customer" className="cursor-pointer py-2.5">
                      <UserCheck className="mr-2.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{t("register_customer", "Đăng ký Khách thuê")}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{t("register_customer_desc", "Thuê xe tự lái giữ chỗ 10 phút")}</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/register?type=partner" className="cursor-pointer py-2.5">
                      <Store className="mr-2.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{t("register_partner", "Đăng ký Đối tác nhà xe")}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{t("register_partner_desc", "Mở ví đối tác & cho thuê")}</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer - Tailored by Role */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3 shadow-xl">
          {/* Mobile Theme & Language Controls Row */}
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("theme_title", "Giao diện")} & {t("language_title", "Ngôn ngữ")}
            </span>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>

          <nav className="flex flex-col space-y-1">
            {activeNavLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.title}-${item.href}`}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${item.isActive
                    ? isAdmin
                      ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold"
                      : isPartner
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 font-bold"
                        : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                >
                  <Icon className={`h-4 w-4 ${item.isActive
                    ? isAdmin ? "text-red-600 dark:text-red-400" : isPartner ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 dark:text-slate-400"
                    }`} />
                  <span>{item.title}</span>
                </Link>
              );
            })}

            {/* Mobile Partner Onboarding Link for unauthenticated users */}
            {!user && (
              <Link
                href="/register?type=partner"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800"
              >
                <Store className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>{t("become_partner", "Trở thành Đối tác chủ xe")}</span>
              </Link>
            )}

            {user && (
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <UserIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span>{t("profile", "Hồ sơ cá nhân")}</span>
              </Link>
            )}

            <Link
              href="/feedback"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span>{t("nav_feedback", "Góp Ý & Khiếu Nại")}</span>
            </Link>
          </nav>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.fullName}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  {t("logout", "Đăng xuất")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl h-10 border-slate-200 dark:border-slate-700 dark:text-slate-200">
                    {t("login", "Đăng Nhập")}
                  </Button>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button size="sm" className="w-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10">
                    {t("register", "Đăng Ký")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
