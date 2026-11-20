"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { api, Store, VehicleModel, Booking, PartnerWallet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bike,
  Store as StoreIcon,
  Download,
  Search,
  Filter,
  ArrowLeft,
  ChevronDown,
  Layers,
  PieChart as PieChartIcon,
  FileSpreadsheet,
  Users,
  Percent,
  RefreshCw,
  Building2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "sonner";

// Predefined date ranges
type DatePreset = "today" | "7d" | "30d" | "this_month" | "last_month" | "custom";

function PartnerAnalyticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Xác định phiên làm việc là Chủ Cửa Hàng (Owner) hay Nhân Viên Chi Nhánh (Branch)
  const isOwnerSession =
    searchParams.get("mode") === "owner" ||
    (typeof window !== "undefined" &&
      sessionStorage.getItem("partner_owner_unlocked") === "true");

  // Selected Store ID (null = "Tất cả chi nhánh" - chỉ khả dụng ở mode owner)
  const initialStoreId = searchParams.get("storeId");
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(() => {
    if (initialStoreId) return Number(initialStoreId);
    if (!isOwnerSession && typeof window !== "undefined") {
      const saved = localStorage.getItem("active_partner_store_id");
      if (saved) return Number(saved);
    }
    return null;
  });

  // Tự động bảo toàn mode=owner nếu đã mở khóa phân hệ chủ cửa hàng
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("partner_owner_unlocked") === "true") {
      const m = searchParams.get("mode");
      if (m !== "owner") {
        const storeId = searchParams.get("storeId") || selectedStoreId;
        router.replace(`/partner/analytics?mode=owner${storeId ? `&storeId=${storeId}` : ""}`);
      }
    }
  }, [searchParams, router, selectedStoreId]);

  // Date Filter State
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split("T")[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Data state
  const [stores, setStores] = useState<Store[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [wallet, setWallet] = useState<PartnerWallet | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [storesData, bookingsData, modelsData, walletData] = await Promise.all([
        api.partner.getStores(),
        api.partner.getBookings(),
        api.partner.getModels(),
        api.partner.getWallet().catch(() => null),
      ]);

      setStores(storesData || []);
      setBookings(bookingsData || []);
      setModels(modelsData || []);
      setWallet(walletData || null);

      // Default store selection if in branch mode and no store selected yet
      if (!isOwnerSession && !selectedStoreId && storesData?.length > 0) {
        setSelectedStoreId(storesData[0].id);
        localStorage.setItem("active_partner_store_id", String(storesData[0].id));
        localStorage.setItem("active_partner_store_name", storesData[0].storeName);
      }
    } catch (error) {
      toast.error("Không thể tải dữ liệu thống kê. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When store selection changes
  const handleStoreChange = (storeId: number | null) => {
    setSelectedStoreId(storeId);
    if (storeId) {
      const storeObj = stores.find((s) => s.id === storeId);
      if (storeObj) {
        localStorage.setItem("active_partner_store_id", String(storeId));
        localStorage.setItem("active_partner_store_name", storeObj.storeName);
      }
      if (isOwnerSession) {
        router.replace(`/partner/analytics?mode=owner&storeId=${storeId}`);
      } else {
        router.replace(`/partner/analytics?mode=branch&storeId=${storeId}`);
      }
    } else {
      localStorage.removeItem("active_partner_store_id");
      localStorage.removeItem("active_partner_store_name");
      if (isOwnerSession) {
        router.replace("/partner/analytics?mode=owner");
      }
    }
  };

  // Determine active date range [startDateObj, endDateObj]
  const dateRange = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (datePreset === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (datePreset === "7d") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    } else if (datePreset === "30d") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    } else if (datePreset === "this_month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (datePreset === "last_month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (datePreset === "custom") {
      const s = new Date(customStartDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(customEndDate);
      e.setHours(23, 59, 59, 999);
      start = s;
      end = e;
    }

    return { start, end };
  }, [datePreset, customStartDate, customEndDate]);

  // Filter Bookings by Store and Date Range
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Branch filter
      if (selectedStoreId && b.storeId !== selectedStoreId) {
        return false;
      }
      // Date filter
      const bDate = new Date(b.createdAt || b.startTime);
      if (bDate < dateRange.start || bDate > dateRange.end) {
        return false;
      }
      return true;
    });
  }, [bookings, selectedStoreId, dateRange]);

  // Search filtered bookings for table
  const searchedBookings = useMemo(() => {
    if (!searchQuery.trim()) return filteredBookings;
    const q = searchQuery.toLowerCase().trim();
    return filteredBookings.filter((b) => {
      const code = (b.bookingCode || "").toLowerCase();
      const customerName = (b.customer?.fullName || "").toLowerCase();
      const customerPhone = (b.customer?.phone || "").toLowerCase();
      const modelName = (b.bookingDetails?.[0]?.model?.name || "").toLowerCase();
      const plate = (b.bookingDetails?.[0]?.vehicleItem?.licensePlate || "").toLowerCase();
      return (
        code.includes(q) ||
        customerName.includes(q) ||
        customerPhone.includes(q) ||
        modelName.includes(q) ||
        plate.includes(q)
      );
    });
  }, [filteredBookings, searchQuery]);

  // Filter Models by Store
  const filteredModels = useMemo(() => {
    if (!selectedStoreId) return models;
    return models.filter((m) => m.storeId === selectedStoreId);
  }, [models, selectedStoreId]);

  // Active Store Object
  const currentStore = useMemo(() => {
    if (!selectedStoreId) return null;
    return stores.find((s) => s.id === selectedStoreId) || null;
  }, [stores, selectedStoreId]);

  // Aggregated Analytics Metrics
  const metrics = useMemo(() => {
    const totalBookings = filteredBookings.length;
    const completed = filteredBookings.filter((b) => b.status === 4);
    const active = filteredBookings.filter((b) => b.status === 3);
    const confirmed = filteredBookings.filter((b) => b.status === 1);
    const pending = filteredBookings.filter((b) => b.status === 0 || b.status === 2);
    const cancelled = filteredBookings.filter((b) => b.status === 5);

    // Revenue calculations (based on completed or active bookings)
    const grossRevenue = completed.reduce((sum, b) => sum + Number(b.rentAmount || 0), 0);
    const netRevenue = completed.reduce((sum, b) => {
      const rent = Number(b.rentAmount || 0);
      const comm = Number(b.commissionAmount || 0);
      return sum + (rent - comm > 0 ? rent - comm : rent * 0.9);
    }, 0);
    const commissionPaid = completed.reduce((sum, b) => sum + Number(b.commissionAmount || 0), 0);
    const totalDeposits = completed.reduce((sum, b) => sum + Number(b.depositAmount || 0), 0);

    const completionRate = totalBookings > 0 ? Math.round((completed.length / totalBookings) * 100) : 0;
    const cancellationRate = totalBookings > 0 ? Math.round((cancelled.length / totalBookings) * 100) : 0;
    const averageOrderValue = completed.length > 0 ? Math.round(grossRevenue / completed.length) : 0;

    // Unique customers
    const uniqueCustomerIds = new Set(
      filteredBookings.map((b) => b.customerId || b.customer?.phone || b.id)
    );
    const totalCustomers = uniqueCustomerIds.size;

    // Fleet stats
    const allItems = filteredModels.flatMap((m) => m.vehicleItems || []);
    const totalVehicles = allItems.length;
    const availableVehicles = allItems.filter((i) => i.status === 0).length;
    const rentedVehicles = allItems.filter((i) => i.status === 1).length;
    const maintenanceVehicles = allItems.filter((i) => i.status === 2).length;
    const occupancyRate = totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;

    return {
      totalBookings,
      completedCount: completed.length,
      activeCount: active.length,
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      cancelledCount: cancelled.length,
      grossRevenue,
      netRevenue: Math.round(netRevenue),
      commissionPaid: Math.round(commissionPaid),
      totalDeposits,
      completionRate,
      cancellationRate,
      averageOrderValue,
      totalCustomers,
      totalVehicles,
      availableVehicles,
      rentedVehicles,
      maintenanceVehicles,
      occupancyRate,
    };
  }, [filteredBookings, filteredModels]);

  // Timeline Trend Chart (Day by day aggregation)
  const timelineTrend = useMemo(() => {
    const daysMap = new Map<string, { dayLabel: string; grossRevenue: number; netRevenue: number; count: number }>();

    // Calculate number of days in range
    const diffTime = Math.abs(dateRange.end.getTime() - dateRange.start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Limit to max 60 points for chart readability
    const stepDays = diffDays > 60 ? Math.ceil(diffDays / 30) : 1;

    const curr = new Date(dateRange.start);
    while (curr <= dateRange.end) {
      const key = curr.toISOString().split("T")[0];
      const dayName = curr.toLocaleDateString("vi-VN", { weekday: "short" });
      const dayFormatted = curr.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      daysMap.set(key, {
        dayLabel: diffDays <= 7 ? `${dayName} (${dayFormatted})` : dayFormatted,
        grossRevenue: 0,
        netRevenue: 0,
        count: 0,
      });
      curr.setDate(curr.getDate() + stepDays);
    }

    // Fill data from bookings
    filteredBookings.forEach((b) => {
      const bDateStr = new Date(b.createdAt || b.startTime).toISOString().split("T")[0];
      if (daysMap.has(bDateStr)) {
        const item = daysMap.get(bDateStr)!;
        item.count += 1;
        if (b.status === 4) {
          const rent = Number(b.rentAmount || 0);
          const comm = Number(b.commissionAmount || 0);
          item.grossRevenue += rent;
          item.netRevenue += rent - comm > 0 ? rent - comm : rent * 0.9;
        }
      }
    });

    return Array.from(daysMap.values()).map((d) => ({
      ...d,
      netRevenue: Math.round(d.netRevenue),
    }));
  }, [filteredBookings, dateRange]);

  // Fleet Status Pie Data
  const fleetPieData = useMemo(() => {
    return [
      { name: "Đang cho khách thuê", value: metrics.rentedVehicles, color: "#3B82F6" },
      { name: "Xe rảnh đón khách", value: metrics.availableVehicles, color: "#10B981" },
      { name: "Bảo dưỡng / Kiểm định", value: metrics.maintenanceVehicles, color: "#F59E0B" },
    ].filter((d) => d.value > 0);
  }, [metrics]);

  // Booking Status Bar Data
  const bookingStatusBarData = useMemo(() => {
    return [
      { name: "Hoàn tất", count: metrics.completedCount, fill: "#10B981" },
      { name: "Đang thuê", count: metrics.activeCount, fill: "#3B82F6" },
      { name: "Chờ giao", count: metrics.confirmedCount, fill: "#6366F1" },
      { name: "Chờ cọc", count: metrics.pendingCount, fill: "#F59E0B" },
      { name: "Đã hủy", count: metrics.cancelledCount, fill: "#EF4444" },
    ];
  }, [metrics]);

  // Top Performing Models
  const topModels = useMemo(() => {
    const stats: Record<string, { id: number; name: string; brand: string; revenue: number; trips: number; itemsCount: number }> = {};

    filteredModels.forEach((m) => {
      stats[m.name] = {
        id: m.id,
        name: m.name,
        brand: m.brand || "Khác",
        revenue: 0,
        trips: 0,
        itemsCount: m.vehicleItems?.length || 0,
      };
    });

    filteredBookings.forEach((b) => {
      if (b.status === 4 && b.bookingDetails?.[0]?.model?.name) {
        const mName = b.bookingDetails[0].model.name;
        if (!stats[mName]) {
          stats[mName] = {
            id: b.bookingDetails[0].modelId || 0,
            name: mName,
            brand: "Khác",
            revenue: 0,
            trips: 0,
            itemsCount: 0,
          };
        }
        stats[mName].revenue += Number(b.rentAmount || 0);
        stats[mName].trips += 1;
      }
    });

    return Object.values(stats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredModels, filteredBookings]);

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "Chờ cọc";
      case 1:
        return "Đã cọc - Chờ giao xe";
      case 2:
        return "Chờ xếp xe";
      case 3:
        return "Đang thuê";
      case 4:
        return "Hoàn tất";
      case 5:
        return "Đã hủy";
      default:
        return "Khác";
    }
  };

  const formatDateTime = (dateVal: string | Date | undefined) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const reportHeaders = [
    "Mã đơn hàng",
    "Khách hàng",
    "Số điện thoại",
    "Chi nhánh",
    "Dòng xe",
    "Biển số xe",
    "Thời gian nhận",
    "Thời gian trả",
    "Số ngày thuê",
    "Hình thức nhận",
    "Tổng tiền thuê (VNĐ)",
    "Tiền cọc (VNĐ)",
    "Phí sàn (VNĐ)",
    "Thực nhận nhà xe (VNĐ)",
    "Trạng thái đơn",
    "Ngày tạo đơn",
  ];

  // Export Data to Excel (.xlsx) - Tối ưu tự căn chỉnh độ rộng cột và giữ text số điện thoại
  const handleExportExcel = () => {
    if (filteredBookings.length === 0) {
      toast.warning("Không có dữ liệu đơn thuê nào trong khoảng thời gian này để xuất file.");
      return;
    }

    const rows = filteredBookings.map((b) => {
      const detail = b.bookingDetails?.[0];
      const modelName = detail?.model?.name || "Xe máy";
      const plate = detail?.vehicleItem?.licensePlate || "Chưa gắn xe";
      const storeName = stores.find((s) => s.id === b.storeId)?.storeName || `Chi nhánh #${b.storeId}`;
      const rent = Number(b.rentAmount || 0);
      const comm = Number(b.commissionAmount || 0);
      const net = rent - comm > 0 ? rent - comm : rent * 0.9;
      const phone = b.customer?.phone ? String(b.customer.phone).trim() : "";

      return [
        b.bookingCode || `#${b.id}`,
        b.customer?.fullName || "Khách lẻ",
        phone,
        storeName,
        modelName,
        plate,
        formatDateTime(b.startTime),
        formatDateTime(b.endTime),
        Number(b.dayRent || 1),
        b.pickupType === 1 ? "Giao tận nơi" : "Nhận tại cửa hàng",
        rent,
        Number(b.depositAmount || 0),
        comm,
        Math.round(net),
        getStatusText(b.status),
        formatDateTime(b.createdAt),
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([reportHeaders, ...rows]);

    // Format phone column (c: 2) explicitly as string so Excel preserves leading zero and avoids 3.84E+08
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
    for (let R = 1; R <= range.e.r; ++R) {
      const phoneCellRef = XLSX.utils.encode_cell({ c: 2, r: R });
      if (worksheet[phoneCellRef]) {
        worksheet[phoneCellRef].t = "s";
        worksheet[phoneCellRef].z = "@";
      }
    }

    // Auto-fit column widths based on maximum content length + padding
    const colWidths = reportHeaders.map((header, colIdx) => {
      let maxLen = header.length;
      rows.forEach((row) => {
        const val = row[colIdx] != null ? String(row[colIdx]) : "";
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
    });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo doanh thu");

    const storeLabel = currentStore ? currentStore.storeName.replace(/[^a-zA-Z0-9]/g, "_") : "Toan_He_Thong";
    const startStr = dateRange.start.toISOString().split("T")[0];
    const endStr = dateRange.end.toISOString().split("T")[0];
    const fileName = `Bao_Cao_Doanh_Thu_${storeLabel}_${startStr}_den_${endStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
    toast.success("Xuất file báo cáo Excel (.xlsx) thành công!");
  };

  // Export Data to CSV
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      toast.warning("Không có dữ liệu đơn thuê nào trong khoảng thời gian này để xuất file.");
      return;
    }

    const rows = filteredBookings.map((b) => {
      const detail = b.bookingDetails?.[0];
      const modelName = detail?.model?.name || "Xe máy";
      const plate = detail?.vehicleItem?.licensePlate || "Chưa gắn xe";
      const storeName = stores.find((s) => s.id === b.storeId)?.storeName || `Chi nhánh #${b.storeId}`;
      const rent = Number(b.rentAmount || 0);
      const comm = Number(b.commissionAmount || 0);
      const net = rent - comm > 0 ? rent - comm : rent * 0.9;
      const phone = b.customer?.phone ? String(b.customer.phone).trim() : "";

      return [
        `"${b.bookingCode || b.id}"`,
        `"${(b.customer?.fullName || "Khách lẻ").replace(/"/g, '""')}"`,
        `"=""${phone}"""`, // Trick: ="038..." keeps leading zero in CSV when opened in Excel
        `"${storeName.replace(/"/g, '""')}"`,
        `"${modelName.replace(/"/g, '""')}"`,
        `"${plate}"`,
        `"${formatDateTime(b.startTime)}"`,
        `"${formatDateTime(b.endTime)}"`,
        `"${b.dayRent || 1}"`,
        `"${b.pickupType === 1 ? "Giao tận nơi" : "Nhận tại cửa hàng"}"`,
        rent,
        Number(b.depositAmount || 0),
        comm,
        Math.round(net),
        `"${getStatusText(b.status)}"`,
        `"${formatDateTime(b.createdAt)}"`,
      ].join(",");
    });

    // Add BOM for UTF-8 compatibility in Excel
    const csvContent = "\uFEFF" + [reportHeaders.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const storeLabel = currentStore ? currentStore.storeName.replace(/[^a-zA-Z0-9]/g, "_") : "Toan_He_Thong";
    const startStr = dateRange.start.toISOString().split("T")[0];
    const endStr = dateRange.end.toISOString().split("T")[0];
    link.href = url;
    link.setAttribute("download", `Bao_Cao_Doanh_Thu_${storeLabel}_${startStr}_den_${endStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Xuất file báo cáo CSV thành công!");
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950">
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Link
              href={isOwnerSession ? "/partner?mode=owner" : `/partner?mode=branch${selectedStoreId ? `&storeId=${selectedStoreId}` : ""}`}
              className="hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{isOwnerSession ? "Quay lại quản lý chủ cửa hàng" : "Quay lại quản lý vận hành"}</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">Thống kê & báo cáo doanh thu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            <span>Trung tâm phân tích & báo cáo doanh thu</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {selectedStoreId === null
              ? "Báo cáo hợp nhất toàn chuỗi và phân tích sâu dòng tiền từng điểm kinh doanh."
              : `Báo cáo chuyên sâu và hiệu suất vận hành riêng cho chi nhánh: ${currentStore?.storeName || "Điểm thuê"}.`}
          </p>
        </div>

        {/* Action Controls: Switch Mode & Export Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher - Chỉ hiển thị cho phân hệ Chủ Cửa Hàng, ẩn hoàn toàn khi ở phân hệ nhân viên */}
          {isOwnerSession && (
            <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  const targetStore = selectedStoreId || stores[0]?.id || null;
                  handleStoreChange(targetStore);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedStoreId !== null
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Cơ sở / điểm thuê
              </button>
              <button
                type="button"
                onClick={() => {
                  handleStoreChange(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedStoreId === null
                    ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Chủ chuỗi (toàn sàn)
              </button>
            </div>
          )}

          {/* Export Report Dropdown (Excel XLSX & CSV) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10 px-4 text-xs shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Tải báo cáo Excel / CSV</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-1.5 shadow-xl border-slate-200 dark:border-slate-800">
              <DropdownMenuItem
                onClick={handleExportExcel}
                className="cursor-pointer gap-2.5 p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    Xuất file Excel (.xlsx)
                    <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 h-4">Tối ưu</Badge>
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">Tự căn chỉnh cột, không lỗi ngày & SĐT</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleExportCSV}
                className="cursor-pointer gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center shrink-0">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Xuất file CSV (.csv)</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">Dữ liệu thô phân cách dấu phẩy</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reload Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={loadData}
            title="Tải lại dữ liệu"
            className="rounded-xl h-10 w-10 border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filter Toolbar: Branch Selector & Date Preset Filters */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Branch Filter Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <StoreIcon className="h-4 w-4 text-blue-600" />
              <span>Phạm vi cơ sở:</span>
            </span>

            <div className="relative min-w-[240px]">
              <select
                value={selectedStoreId === null ? "all" : String(selectedStoreId)}
                onChange={(e) => {
                  const val = e.target.value;
                  handleStoreChange(val === "all" ? null : Number(val));
                }}
                className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 pr-8 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                {isOwnerSession && (
                  <option value="all">🏢 Tất cả chi nhánh (toàn hệ thống)</option>
                )}
                {stores.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    📍 {s.storeName} ({s.province || "Cơ sở"})
                  </option>
                ))}
              </select>
            </div>

            {selectedStoreId && (
              <Badge variant="outline" className="text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                {currentStore?.address || "Đang lọc chi nhánh"}
              </Badge>
            )}
          </div>

          {/* Date Range Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span>Mốc thời gian:</span>
            </span>

            {(
              [
                { id: "today", label: "Hôm nay" },
                { id: "7d", label: "7 ngày qua" },
                { id: "30d", label: "30 ngày qua" },
                { id: "this_month", label: "Tháng này" },
                { id: "last_month", label: "Tháng trước" },
                { id: "custom", label: "Tùy chọn..." },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  datePreset === p.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Inputs (Visible when 'custom' is selected) */}
        {datePreset === "custom" && (
          <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 bg-slate-50/50 dark:bg-slate-800/40 p-3 rounded-xl">
            <div className="flex items-center gap-2 text-xs">
              <Label htmlFor="customStart" className="font-semibold text-slate-600 dark:text-slate-300">
                Từ ngày:
              </Label>
              <Input
                id="customStart"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-9 w-36 text-xs rounded-lg bg-white dark:bg-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Label htmlFor="customEnd" className="font-semibold text-slate-600 dark:text-slate-300">
                Đến ngày:
              </Label>
              <Input
                id="customEnd"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-9 w-36 text-xs rounded-lg bg-white dark:bg-slate-900"
              />
            </div>

            <span className="text-[11px] text-slate-500 italic">
              * Dữ liệu các biểu đồ và danh sách đơn sẽ tự động đối soát chính xác theo khung ngày này.
            </span>
          </div>
        )}

        {/* Current Period Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Kỳ báo cáo: Từ <strong>{dateRange.start.toLocaleDateString("vi-VN")}</strong> đến{" "}
              <strong>{dateRange.end.toLocaleDateString("vi-VN")}</strong>
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {filteredBookings.length} đơn phát sinh
          </span>
        </div>
      </Card>

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Gross Revenue */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-5 space-y-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Tổng thu khách
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {metrics.grossRevenue.toLocaleString("vi-VN")} <span className="text-sm font-bold">đ</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Đơn hoàn tất: {metrics.completedCount} đơn</span>
              <span className="font-semibold text-amber-600">100% hóa đơn</span>
            </div>
          </div>
        </Card>

        {/* Net Revenue */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-5 space-y-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Thực nhận nhà xe
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics.netRevenue.toLocaleString("vi-VN")} <span className="text-sm font-bold">đ</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Phí sàn platform:</span>
              <span className="font-mono text-red-500">-{metrics.commissionPaid.toLocaleString("vi-VN")} đ</span>
            </div>
          </div>
        </Card>

        {/* Customer Volume & Average Order Value */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-5 space-y-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Lượt khách & giá trị đơn
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-baseline gap-2">
              <span>{metrics.totalCustomers}</span>
              <span className="text-xs font-normal text-slate-400">khách hàng</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>TB mỗi đơn (AOV):</span>
              <span className="font-mono font-bold text-blue-600">{metrics.averageOrderValue.toLocaleString("vi-VN")} đ</span>
            </div>
          </div>
        </Card>

        {/* Fleet Occupancy Rate */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-5 space-y-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Tỷ lệ khai thác đội xe
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {metrics.occupancyRate}%
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Đang lăn bánh:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {metrics.rentedVehicles}/{metrics.totalVehicles} xe
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Visual Analytics Charts Row 1: Revenue Over Time & Fleet Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main AreaChart: Revenue Trend */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-500" />
                <span>Biểu đồ xu hướng doanh thu theo thời gian</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Đối chiếu tổng thu khách và thực nhận nhà xe trong mốc thời gian đã chọn
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] self-start sm:self-auto font-mono">
              {timelineTrend.length} mốc thống kê
            </Badge>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineTrend}>
                <defs>
                  <linearGradient id="chartGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="chartNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 10, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`)}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${Number(value).toLocaleString("vi-VN")} đ`,
                    name === "grossRevenue" ? "Tổng thu khách" : "Thực nhận nhà xe",
                  ]}
                />
                <Legend verticalAlign="top" height={36} />
                <Area
                  type="monotone"
                  dataKey="grossRevenue"
                  name="grossRevenue"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#chartGross)"
                />
                <Area
                  type="monotone"
                  dataKey="netRevenue"
                  name="netRevenue"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#chartNet)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Fleet Status PieChart */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
              <span>Tình trạng kho xe thực tế</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              {metrics.totalVehicles} phương tiện sẵn có trong kho
            </CardDescription>
          </div>

          {metrics.totalVehicles === 0 ? (
            <div className="h-60 w-full flex flex-col items-center justify-center text-center p-4">
              <Bike className="h-10 w-10 text-slate-300 mb-2" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Chưa có xe nào được ghi nhận</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Thêm biển số xe tại mục dòng xe để theo dõi kho.</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fleetPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {fleetPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val} xe`, "Số lượng"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                {fleetPieData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{item.value} xe</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Visual Analytics Charts Row 2: Booking Status Breakdown & Top Models */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status BarChart */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <span>Cơ cấu trạng thái đơn thuê</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Phân bố các đơn thuê xe theo từng giai đoạn vận hành
            </CardDescription>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingStatusBarData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(val: any) => [`${val} đơn`, "Số lượng"]} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {bookingStatusBarData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Performing Vehicle Models */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bike className="h-5 w-5 text-amber-600" />
              <span>Top dòng xe sinh lời cao nhất</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Xếp hạng theo tổng doanh thu thực nhận và số chuyến đi hoàn tất
            </CardDescription>
          </div>

          {topModels.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Chưa có dữ liệu chuyến đi nào hoàn tất trong mốc thời gian này
            </div>
          ) : (
            <div className="space-y-3">
              {topModels.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-7 w-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? "bg-amber-500 text-white shadow-xs"
                          : idx === 1
                            ? "bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                            : idx === 2
                              ? "bg-amber-700/20 text-amber-800 dark:text-amber-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{m.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {m.trips} chuyến hoàn tất • {m.itemsCount} xe sẵn có
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                      {m.revenue.toLocaleString("vi-VN")} đ
                    </div>
                    <div className="text-[10px] text-slate-400">Doanh thu</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Detailed Bookings Table in Selected Range */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <span>Dữ liệu đơn thuê chi tiết trong kỳ báo cáo</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Toàn bộ các đơn thuê phát sinh để đối soát và tải về file báo cáo
            </CardDescription>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm mã đơn, tên khách, biển số..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {searchedBookings.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Không tìm thấy đơn thuê nào khớp với bộ lọc và từ khóa tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <TableHead className="font-bold">Mã đơn</TableHead>
                  <TableHead className="font-bold">Khách hàng</TableHead>
                  <TableHead className="font-bold">Dòng xe & biển số</TableHead>
                  <TableHead className="font-bold">Thời gian thuê</TableHead>
                  <TableHead className="font-bold text-right">Tổng thu khách</TableHead>
                  <TableHead className="font-bold text-right">Thực nhận nhà xe</TableHead>
                  <TableHead className="font-bold text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchedBookings.slice(0, 50).map((b) => {
                  const detail = b.bookingDetails?.[0];
                  const rent = Number(b.rentAmount || 0);
                  const comm = Number(b.commissionAmount || 0);
                  const net = rent - comm > 0 ? rent - comm : rent * 0.9;

                  return (
                    <TableRow key={b.id} className="text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="font-mono font-bold text-blue-600">
                        {b.bookingCode || `#${b.id}`}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {b.customer?.fullName || "Khách thuê"}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{b.customer?.phone || ""}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {detail?.model?.name || "Xe máy"}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {detail?.vehicleItem?.licensePlate ? `BS: ${detail.vehicleItem.licensePlate}` : "Chưa gắn xe"}
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-600 dark:text-slate-400">
                        <div>{new Date(b.startTime).toLocaleDateString("vi-VN")}</div>
                        <div className="text-slate-400">({b.dayRent || 1} ngày)</div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {rent.toLocaleString("vi-VN")} đ
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.round(net).toLocaleString("vi-VN")} đ
                      </TableCell>
                      <TableCell className="text-center">
                        {b.status === 4 && (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 text-[10px]">
                            Hoàn tất
                          </Badge>
                        )}
                        {b.status === 3 && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 text-[10px]">
                            Đang thuê
                          </Badge>
                        )}
                        {b.status === 1 && (
                          <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 text-[10px]">
                            Chờ giao
                          </Badge>
                        )}
                        {b.status === 0 && (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 text-[10px]">
                            Chờ cọc
                          </Badge>
                        )}
                        {b.status === 5 && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 text-[10px]">
                            Đã hủy
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
    </div>
  );
}

export default function PartnerAnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Đang tải trung tâm thống kê...</div>}>
      <PartnerAnalyticsContent />
    </Suspense>
  );
}

