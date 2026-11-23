"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, Booking, VehicleItem, VehicleModel, Store } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Bike,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  MapPin,
  Calendar,
  Wallet,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  Loader2,
  Store as StoreIcon,
  Search,
  RotateCcw,
  PlusCircle,
  Car,
  Camera,
  Upload,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format24hDateTime } from "@/components/common/datetime-24h-picker";

function PartnerBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryStoreId = searchParams.get("storeId");

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<number | undefined>(undefined); // undefined: all, 1: confirmed, 2: waiting queue, 3: active, 4: completed
  const [isLoading, setIsLoading] = useState(true);

  // Search & Date range filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Handover modal state
  const [handoverBooking, setHandoverBooking] = useState<Booking | null>(null);
  const [availablePlates, setAvailablePlates] = useState<VehicleItem[]>([]);
  const [selectedPlateIds, setSelectedPlateIds] = useState<number[]>([]);
  const [isHandoverLoading, setIsHandoverLoading] = useState(false);

  // Walk-in booking modal state
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInModels, setWalkInModels] = useState<VehicleModel[]>([]);
  const [isLoadingWalkInModels, setIsLoadingWalkInModels] = useState(false);
  const [walkInSelectedModelId, setWalkInSelectedModelId] = useState<number | null>(null);
  const [walkInVehicleItems, setWalkInVehicleItems] = useState<VehicleItem[]>([]);
  const [walkInQuantity, setWalkInQuantity] = useState<number>(1);
  const [walkInSelectedItemIds, setWalkInSelectedItemIds] = useState<number[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const [walkInCustomerName, setWalkInCustomerName] = useState("");
  const [walkInCustomerPhone, setWalkInCustomerPhone] = useState("");
  const [walkInCustomerEmail, setWalkInCustomerEmail] = useState("");
  const [walkInDriverLicense, setWalkInDriverLicense] = useState("");
  const [walkInStartTime, setWalkInStartTime] = useState("");
  const [walkInEndTime, setWalkInEndTime] = useState("");
  const [walkInRentPrice, setWalkInRentPrice] = useState<number>(0);
  const [walkInTotalAmount, setWalkInTotalAmount] = useState<number>(0);
  const [walkInNote, setWalkInNote] = useState("");
  const [walkInHandoverNow, setWalkInHandoverNow] = useState(true);
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);

  // Khách không đến modal state
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // ID Card modal state (Chuẩn Nghị định 13)
  const [idCardModalBooking, setIdCardModalBooking] = useState<Booking | null>(null);
  const [idCardFront, setIdCardFront] = useState("");
  const [idCardBack, setIdCardBack] = useState("");
  const [isUploadingIdFront, setIsUploadingIdFront] = useState(false);
  const [isUploadingIdBack, setIsUploadingIdBack] = useState(false);
  const [isSubmittingIdCard, setIsSubmittingIdCard] = useState(false);
  const [idCardDetails, setIdCardDetails] = useState<{ isDeleted?: boolean; message?: string; idCardCapturedAt?: string } | null>(null);
  const [isLoadingIdCard, setIsLoadingIdCard] = useState(false);

  const handleOpenCancelModal = (b: Booking) => {
    setCancelModalBooking(b);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    setIsSubmittingCancel(true);
    try {
      await api.partner.noShow(cancelModalBooking.id);
      toast.success("Đã ghi nhận khách không đến nhận xe. Xe đã được giải phóng về kho và tiền cọc được giữ lại cho cửa hàng.");
      setCancelModalBooking(null);
      await fetchBookings(activeTab, true);
    } catch (err: any) {
      toast.error(err.message || "Thao tác thất bại!");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleOpenIdCardModal = async (b: Booking) => {
    setIdCardModalBooking(b);
    setIdCardFront(b.idCardFront || "");
    setIdCardBack(b.idCardBack || "");
    setIdCardDetails(null);
    setIsLoadingIdCard(true);
    try {
      const res = await api.partner.getIdCard(b.id);
      setIdCardDetails(res);
      if (res.idCardFront) setIdCardFront(res.idCardFront);
      if (res.idCardBack) setIdCardBack(res.idCardBack);
    } catch {
      // fallback
    } finally {
      setIsLoadingIdCard(false);
    }
  };

  const handleUploadIdCard = async (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (side === "front") setIsUploadingIdFront(true);
    else setIsUploadingIdBack(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "id_cards");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tải ảnh thất bại");
      if (side === "front") setIdCardFront(data.url);
      else setIdCardBack(data.url);
      toast.success(`Đã tải lên ảnh CCCD mặt ${side === "front" ? "trước" : "sau"}!`);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải ảnh!");
    } finally {
      if (side === "front") setIsUploadingIdFront(false);
      else setIsUploadingIdBack(false);
    }
  };

  const handleSaveIdCard = async () => {
    if (!idCardModalBooking) return;
    if (!idCardFront || !idCardBack) {
      toast.error("Vui lòng tải lên đầy đủ ảnh CCCD cả 2 mặt trước và sau!");
      return;
    }
    setIsSubmittingIdCard(true);
    try {
      await api.partner.saveIdCard(idCardModalBooking.id, { idCardFront, idCardBack });
      toast.success("Đã lưu ảnh CCCD xác minh thành công (Chuẩn Nghị định 13/2023/NĐ-CP)!");
      setIdCardModalBooking(null);
      await fetchBookings(activeTab, true);
    } catch (err: any) {
      toast.error(err.message || "Lưu ảnh CCCD thất bại!");
    } finally {
      setIsSubmittingIdCard(false);
    }
  };

  const fetchBookings = async (status?: number, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      if (silent && selectedStore) {
        // Fast polling: only refresh bookings for currently active store without refetching stores
        const data = await api.partner.getBookings(status, selectedStore.id);
        setBookings(data || []);
        return;
      }

      const targetStoreId = queryStoreId
        ? Number(queryStoreId)
        : typeof window !== "undefined" && localStorage.getItem("active_partner_store_id")
        ? Number(localStorage.getItem("active_partner_store_id"))
        : null;

      let storesData: Store[] = [];
      let bookingsData: Booking[] = [];

      if (targetStoreId) {
        const [sRes, bRes] = await Promise.all([
          api.partner.getStores(),
          api.partner.getBookings(status, targetStoreId).catch(() => []),
        ]);
        storesData = sRes || [];
        bookingsData = bRes || [];
      } else {
        storesData = (await api.partner.getStores()) || [];
      }

      setStores(storesData || []);

      const approved = (storesData || []).filter((s) => s.status === 1);
      if (approved.length === 0) {
        if (!silent) {
          toast.warning("Hồ sơ cửa hàng chưa được Admin duyệt (status = PENDING). Vui lòng hoàn tất Onboarding!");
          router.push("/partner/onboarding");
        }
        return;
      }

      let currentStore = targetStoreId
        ? (storesData || []).find((s) => s.id === targetStoreId) || null
        : null;

      if (!currentStore && approved.length > 0) {
        currentStore = approved[0];
      }

      setSelectedStore(currentStore);
      if (currentStore && typeof window !== "undefined") {
        localStorage.setItem("active_partner_store_id", String(currentStore.id));
        localStorage.setItem("active_partner_store_name", currentStore.storeName);
      }

      if (currentStore && targetStoreId === currentStore.id && bookingsData.length >= 0) {
        setBookings(bookingsData);
      } else {
        const data = await api.partner.getBookings(status, currentStore ? currentStore.id : undefined);
        setBookings(data || []);
      }
    } catch {
      // fallback
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(activeTab);
    const interval = setInterval(() => {
      fetchBookings(activeTab, true);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeTab, queryStoreId]);

  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    if (typeof window !== "undefined") {
      localStorage.setItem("active_partner_store_id", String(store.id));
      localStorage.setItem("active_partner_store_name", store.storeName);
    }
    router.replace(`/partner/bookings?storeId=${store.id}`);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Date range filter
      if (fromDate) {
        const itemDate = new Date(b.createdAt).toISOString().split("T")[0];
        if (itemDate < fromDate) return false;
      }
      if (toDate) {
        const itemDate = new Date(b.createdAt).toISOString().split("T")[0];
        if (itemDate > toDate) return false;
      }
      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = b.bookingCode?.toLowerCase().includes(q);
        const matchCustomer =
          b.customer?.fullName?.toLowerCase().includes(q) || b.customer?.phone?.includes(q);
        const matchModel = b.bookingDetails?.some((d) =>
          d.model?.name?.toLowerCase().includes(q)
        );
        const matchPlate = b.bookingDetails?.some((d) =>
          d.vehicleItem?.licensePlate?.toLowerCase().includes(q)
        );
        if (!matchCode && !matchCustomer && !matchModel && !matchPlate) return false;
      }
      return true;
    });
  }, [bookings, searchQuery, fromDate, toDate]);

  const handleOpenHandover = async (b: Booking) => {
    setHandoverBooking(b);
    setSelectedPlateIds([]);
    const details = b.bookingDetails || [];
    const totalQty = details.reduce((sum, d) => sum + (d.quantity || 1), 0);
    const detail = details[0];
    if (detail?.modelId) {
      try {
        const plates = await api.partner.getItems(detail.modelId);
        const heldIds = details
          .map((d) => d.vehicleItemId)
          .filter((id): id is number => typeof id === "number");

        // Hiển thị các xe đang Sẵn sàng (status = 0) HOẶC xe đã được gán giữ chỗ cho đơn này (status = 1)
        const selectablePlates = plates.filter(
          (p) => p.status === 0 || heldIds.includes(p.id)
        );
        setAvailablePlates(selectablePlates);

        // Tự động chọn trước biển số xe đã được giữ chỗ cho đơn này
        const preSelected = selectablePlates
          .filter((p) => heldIds.includes(p.id))
          .map((p) => p.id);

        // Nếu số xe đã giữ chưa đủ số lượng đơn, tự động chọn thêm các xe khả dụng khác
        if (preSelected.length < totalQty) {
          const remainingPlates = selectablePlates
            .filter((p) => !preSelected.includes(p.id))
            .map((p) => p.id);
          const needed = totalQty - preSelected.length;
          preSelected.push(...remainingPlates.slice(0, needed));
        }

        setSelectedPlateIds(preSelected);
      } catch {
        setAvailablePlates([]);
      }
    }
  };

  const handleConfirmHandover = async () => {
    if (!handoverBooking) return;
    const totalQty = (handoverBooking.bookingDetails || []).reduce(
      (sum, d) => sum + (d.quantity || 1),
      0
    );

    if (selectedPlateIds.length !== totalQty) {
      toast.error(`Vui lòng chọn đủ ${totalQty} biển số xe để bàn giao! (Đã chọn: ${selectedPlateIds.length})`);
      return;
    }

    setIsHandoverLoading(true);
    try {
      await api.partner.handover(handoverBooking.id, selectedPlateIds);
      toast.success("Bàn giao xe thành công! Đơn chuyển sang trạng thái Đang thuê (ActiveRental).");
      setHandoverBooking(null);
      fetchBookings(activeTab);
    } catch {
      toast.error("Không thể bàn giao xe.");
    } finally {
      setIsHandoverLoading(false);
    }
  };

  const handleCompleteRental = async (bookingId: number) => {
    if (!confirm("Xác nhận khách đã trả xe đầy đủ nguyên vẹn?")) return;
    try {
      await api.partner.complete(bookingId);
      toast.success("Hoàn tất đơn thuê! Xe đã được tự động đưa về kho khả dụng (Available).");
      fetchBookings(activeTab);
    } catch {
      toast.error("Không thể hoàn tất đơn.");
    }
  };

  const toDateTimeLocalString = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const recalcWalkInPrices = (startStr: string, endStr: string, price: number, qty: number = 1) => {
    const validQty = Math.max(1, qty);
    if (!startStr || !endStr) {
      setWalkInTotalAmount(price * validQty);
      return;
    }
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      setWalkInTotalAmount(price * validQty);
      return;
    }
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const days = Math.max(1, Math.ceil(diffHours / 24));
    const total = Math.round(days * price * validQty);
    setWalkInTotalAmount(total);
  };

  const walkInDays = useMemo(() => {
    if (!walkInStartTime || !walkInEndTime) return 1;
    const start = new Date(walkInStartTime);
    const end = new Date(walkInEndTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 1;
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(1, Math.ceil(diffHours / 24));
  }, [walkInStartTime, walkInEndTime]);

  const loadItemsForModel = async (modelId: number) => {
    setIsLoadingItems(true);
    try {
      const items = await api.partner.getItems(modelId);
      const availableItems = (items || []).filter((it) => it.status === 0);
      setWalkInVehicleItems(availableItems);
      if (availableItems.length > 0) {
        setWalkInQuantity(1);
        setWalkInSelectedItemIds([availableItems[0].id]);
      } else {
        setWalkInQuantity(1);
        setWalkInSelectedItemIds([]);
      }
    } catch {
      setWalkInVehicleItems([]);
      setWalkInQuantity(1);
      setWalkInSelectedItemIds([]);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleOpenWalkInModal = async () => {
    if (!selectedStore) {
      toast.warning("Vui lòng chọn cơ sở chi nhánh trước khi tạo đơn.");
      return;
    }

    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const startStr = toDateTimeLocalString(now);
    const endStr = toDateTimeLocalString(tomorrow);
    setWalkInStartTime(startStr);
    setWalkInEndTime(endStr);
    setWalkInCustomerName("");
    setWalkInCustomerPhone("");
    setWalkInCustomerEmail("");
    setWalkInDriverLicense("");
    setWalkInNote("Khách thuê trực tiếp tại quầy");
    setWalkInHandoverNow(true);
    setWalkInQuantity(1);
    setWalkInSelectedItemIds([]);
    setIsWalkInModalOpen(true);

    setIsLoadingWalkInModels(true);
    try {
      const models = await api.partner.getModels(selectedStore.id);
      setWalkInModels(models || []);
      if (models && models.length > 0) {
        const firstModel = models[0];
        setWalkInSelectedModelId(firstModel.id);
        const price = Number(firstModel.rentPrice) || 0;
        setWalkInRentPrice(price);
        recalcWalkInPrices(startStr, endStr, price, 1);
        await loadItemsForModel(firstModel.id);
      } else {
        setWalkInSelectedModelId(null);
        setWalkInVehicleItems([]);
        setWalkInSelectedItemIds([]);
      }
    } catch {
      toast.error("Không thể tải danh sách dòng xe.");
    } finally {
      setIsLoadingWalkInModels(false);
    }
  };

  const handleWalkInModelChange = async (modelId: number) => {
    setWalkInSelectedModelId(modelId);
    const model = walkInModels.find((m) => m.id === modelId);
    const price = model ? Number(model.rentPrice) || 0 : 0;
    setWalkInRentPrice(price);
    setWalkInQuantity(1);
    recalcWalkInPrices(walkInStartTime, walkInEndTime, price, 1);
    await loadItemsForModel(modelId);
  };

  const handleWalkInTimeChange = (startStr: string, endStr: string) => {
    let adjustedEnd = endStr;
    if (startStr && endStr) {
      const start = new Date(startStr);
      const end = new Date(endStr);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
        // Tự động điều chỉnh thời gian trả xe sau thời gian nhận xe 24 giờ
        const newEnd = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        adjustedEnd = toDateTimeLocalString(newEnd);
      }
    }
    setWalkInStartTime(startStr);
    setWalkInEndTime(adjustedEnd);
    recalcWalkInPrices(startStr, adjustedEnd, walkInRentPrice, walkInQuantity);
  };

  const handleCreateWalkInBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) {
      toast.error("Vui lòng chọn cơ sở chi nhánh!");
      return;
    }
    if (!walkInCustomerName.trim()) {
      toast.error("Vui lòng nhập họ và tên khách hàng!");
      return;
    }
    if (!walkInCustomerPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại khách hàng!");
      return;
    }
    if (!walkInSelectedModelId) {
      toast.error("Vui lòng chọn dòng xe thuê!");
      return;
    }
    if (!walkInSelectedItemIds.length || walkInSelectedItemIds.some((id) => !id)) {
      toast.error("Vui lòng chọn đủ biển số xe bàn giao cho số lượng xe đã chọn!");
      return;
    }
    const uniqueIds = new Set(walkInSelectedItemIds);
    if (uniqueIds.size !== walkInSelectedItemIds.length) {
      toast.error("Biển số xe bàn giao không được trùng nhau!");
      return;
    }
    const start = new Date(walkInStartTime);
    const end = new Date(walkInEndTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      toast.error("Thời gian trả xe phải sau thời gian nhận xe!");
      return;
    }

    setIsSubmittingWalkIn(true);
    try {
      await api.partner.createWalkInBooking({
        storeId: selectedStore.id,
        modelId: walkInSelectedModelId,
        vehicleItemId: walkInSelectedItemIds[0],
        vehicleItemIds: walkInSelectedItemIds,
        quantity: walkInQuantity,
        customerName: walkInCustomerName.trim(),
        customerPhone: walkInCustomerPhone.trim(),
        customerEmail: walkInCustomerEmail.trim() || undefined,
        driverLicense: walkInDriverLicense.trim() || undefined,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        rentPrice: Number(walkInRentPrice),
        depositAmount: 0,
        totalAmount: Number(walkInTotalAmount),
        note: walkInNote.trim() || undefined,
        handoverNow: walkInHandoverNow,
      });

      toast.success(
        walkInHandoverNow
          ? "Tạo đơn tại quầy thành công! Xe đã được bàn giao ngay cho khách."
          : "Tạo đơn tại quầy thành công! Đơn ở trạng thái Chờ nhận xe."
      );
      setIsWalkInModalOpen(false);
      fetchBookings(activeTab);
    } catch (error: any) {
      toast.error(error?.message || "Không thể tạo đơn tại quầy. Vui lòng kiểm tra lại thông tin!");
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  const waitingCount = bookings.filter((b) => b.status === 2).length;

  return (
    <div className="py-10 bg-slate-50/60 min-h-screen">
      <div className="container max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Quản lý đơn thuê & bàn giao xe
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {selectedStore
                ? `Đang quản lý đơn thuê của cơ sở: ${selectedStore.storeName}`
                : "Xử lý đơn hàng, giải phóng hàng chờ FIFO và chọn biển số xe thực tế khi khách đến nhận."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {stores.filter((s) => s.status === 1).length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Chi nhánh:</span>
                <select
                  value={selectedStore?.id || ""}
                  onChange={(e) => {
                    const s = stores.find((item) => item.id === Number(e.target.value));
                    if (s) handleSelectStore(s);
                  }}
                  className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-amber-500/20"
                >
                  {stores
                    .filter((s) => s.status === 1)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.storeName}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <Button
              onClick={handleOpenWalkInModal}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs text-xs sm:text-sm h-10 px-4 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo đơn tại quầy</span>
            </Button>
          </div>
        </div>

        {/* Warning Banner if there are WaitingQueue bookings */}
        {waitingCount > 0 && (
          <div className="rounded-2xl border border-orange-300 bg-orange-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-orange-950">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm">
                  Cảnh báo: Có {waitingCount} đơn trong Hàng chờ (WaitingQueue)!
                </h4>
                <p className="text-xs text-orange-800">
                  Hạn mức ví đối tác hiện đã chạm giới hạn. Vui lòng liên hệ Chủ cửa hàng kiểm tra ví để giải phóng hàng chờ.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: undefined, label: "Tất cả đơn" },
              { id: 1, label: "Chờ bàn giao xe" },
              { id: 3, label: "Đang cho thuê" },
              { id: 4, label: "Đã hoàn tất" },
              { id: 5, label: "Đã hủy" },
              { id: 2, label: "Hàng chờ FIFO (Thiếu ví)" },
            ].map((tab) => (
              <button
                key={String(tab.id)}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-slate-500 font-semibold text-xs">
            Hiển thị: <strong className="text-slate-900 font-mono">{filteredBookings.length}</strong>/{bookings.length} đơn
          </span>
        </div>

        {/* Search & Date Range Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-5 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm theo mã đơn BK-..., tên khách, SĐT, dòng xe, biển số..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9.5 text-xs h-9.5 rounded-xl bg-slate-50/50"
            />
          </div>

          <div className="lg:col-span-3 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs h-9.5 rounded-xl bg-slate-50/50"
              title="Từ ngày đặt xe"
            />
          </div>

          <div className="lg:col-span-3 flex items-center gap-1.5">
            <span className="text-xs text-slate-400 shrink-0">đến</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs h-9.5 rounded-xl bg-slate-50/50"
              title="Đến ngày"
            />
          </div>

          <div className="lg:col-span-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFromDate("");
                setToDate("");
              }}
              className="w-full h-9.5 rounded-xl text-xs text-slate-600 hover:text-slate-900"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-500">
            <Clock className="h-8 w-8 animate-spin mx-auto text-amber-600 mb-2" />
            <p className="text-xs font-semibold">Đang tải danh sách đơn thuê...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="text-center py-16 rounded-2xl border shadow-xs bg-white p-8">
            <Bike className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Không tìm thấy đơn thuê nào phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1">Hãy thử xóa bộ lọc hoặc chọn mục trạng thái khác.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const detail = b.bookingDetails?.[0];
              const totalQuantity = (b.bookingDetails || []).reduce((sum, d) => sum + (d.quantity || 1), 0);
              const assignedVehicles = (b.bookingDetails || [])
                .map((d) => d.vehicleItem)
                .filter((vi): vi is NonNullable<typeof vi> => !!vi);
              const isPending = b.status === 0;
              const isConfirmed = b.status === 1;
              const isWaiting = b.status === 2;
              const isActive = b.status === 3;
              const isCompleted = b.status === 4;
              const isCancelled = b.status === 5;

              return (
                <Card
                  key={b.id}
                  className={`rounded-2xl border shadow-xs bg-white overflow-hidden transition-all ${
                    isCancelled
                      ? "border-rose-200 bg-rose-50/15"
                      : isWaiting
                      ? "border-orange-300 bg-orange-50/20"
                      : "border-slate-200"
                  }`}
                >
                  <CardHeader
                    className={`p-4 sm:p-5 pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isCancelled ? "bg-rose-50/50" : "bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {b.bookingCode}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">
                        Tạo lúc: {new Date(b.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    <div>
                      {isPending && (
                        <Badge className="bg-slate-500 text-white gap-1">
                          <Clock className="h-3 w-3" /> Chờ khách cọc (10p)
                        </Badge>
                      )}
                      {isWaiting && (
                        <Badge className="bg-orange-600 text-white gap-1 animate-pulse">
                          <AlertCircle className="h-3 w-3" /> Hàng chờ FIFO (Thiếu số dư ví)
                        </Badge>
                      )}
                      {isConfirmed && (
                        <Badge className="bg-blue-600 text-white gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Chờ giao xe cho khách
                        </Badge>
                      )}
                      {isActive && (
                        <Badge className="bg-indigo-600 text-white gap-1">
                          <Bike className="h-3 w-3" /> Khách đang đi xe
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="bg-emerald-600 text-white gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Đã hoàn tất & Đã trả xe
                        </Badge>
                      )}
                      {isCancelled && (
                        <Badge className="bg-rose-600 text-white gap-1">
                          <XCircle className="h-3 w-3" /> Đã hủy đơn
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Customer & Vehicle Info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-base font-extrabold text-slate-900">
                            {detail?.model?.name || "Dòng xe cho thuê"}
                          </div>
                          <Badge className="bg-blue-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                            Số lượng: {totalQuantity} xe
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <User className="h-3.5 w-3.5 text-blue-600" />
                            {b.customer?.fullName || "Khách thuê"} ({b.customer?.phone || "09..."})
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            {format24hDateTime(b.startTime)} → {format24hDateTime(b.endTime)} ({b.dayRent} ngày)
                          </span>
                          {b.pickupType === 1 && (
                            <span className="flex items-center gap-1 text-indigo-600 font-medium">
                              <MapPin className="h-3.5 w-3.5" /> Giao tận nơi: {b.deliveryAddress}
                            </span>
                          )}
                        </div>

                        {/* Handover Plate Info */}
                        {assignedVehicles.length > 0 && !isCancelled && (
                          <div className="pt-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-700">Biển số bàn giao:</span>
                            {assignedVehicles.map((vi) => (
                              <span
                                key={vi.id}
                                className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200"
                              >
                                {vi.licensePlate}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Cancellation & Refund Details - Tinh gọn 1 hộp súc tích */}
                        {isCancelled && (
                          <div className="mt-2.5 px-3.5 py-2.5 bg-rose-50/80 border border-rose-200 rounded-xl text-xs space-y-2 text-rose-900">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5 font-medium">
                                <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                                <span>Lý do hủy: <strong className="font-semibold text-slate-900">{b.cancelReason || "Khách hủy đơn"}</strong></span>
                                {b.cancelTime && (
                                  <span className="text-slate-500 text-[11px]">({format24hDateTime(b.cancelTime)})</span>
                                )}
                              </div>
                              <div className="text-[11px] font-semibold shrink-0 flex items-center gap-1.5">
                                {b.cancelType === 2 && (
                                  <Badge className="bg-amber-600 text-white text-[10px]">
                                    Khách không đến
                                  </Badge>
                                )}
                                {b.cancelType === 3 && (
                                  <Badge className="bg-rose-700 text-white text-[10px]">
                                    Cửa hàng tự hủy
                                  </Badge>
                                )}
                                {b.refundStatus === 1 ? (
                                  <Badge className="bg-emerald-600 text-white gap-1 text-[10px]">
                                    <CheckCircle2 className="h-3 w-3" /> Đã hoàn cọc ({Number(b.refundAmount || 0).toLocaleString("vi-VN")} đ)
                                  </Badge>
                                ) : b.refundStatus === 2 ? (
                                  <Badge className="bg-rose-700 text-white gap-1 text-[10px]">
                                    <ShieldCheck className="h-3 w-3" /> Nhà xe giữ cọc ({Number(b.depositAmount || 0).toLocaleString("vi-VN")} đ)
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-500 text-white gap-1 text-[10px]">
                                    <Clock className="h-3 w-3" /> Chờ xử lý hoàn cọc ({Number(b.refundAmount || 0).toLocaleString("vi-VN")} đ)
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {Number(b.compensationAmount) > 0 && (
                              <div className="text-[11px] font-semibold text-rose-800 bg-white/90 px-2.5 py-1 rounded-lg border border-rose-200 inline-block">
                                💸 Tiền bồi thường đã trừ ví đối tác: +{Number(b.compensationAmount).toLocaleString("vi-VN")} đ
                              </div>
                            )}
                          </div>
                        )}

                        {/* Dispute status banner */}
                        {b.disputeStatus === 1 && (
                          <div className="mt-2.5 px-3.5 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs flex items-center justify-between gap-2 text-amber-950">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                              <span>Khách báo sự cố: <strong>&ldquo;{b.disputeReason || "Không có xe giao"}&rdquo;</strong></span>
                            </div>
                            <Badge className="bg-amber-600 text-white text-[10px] shrink-0">
                              Đang chờ Admin đối soát
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Pricing breakdown & Commission */}
                      <div className="text-left md:text-right border-t md:border-t-0 md:border-l md:pl-5 pt-3 md:pt-0 space-y-1 shrink-0 text-xs">
                        <div>
                          <span className="text-slate-500">Tổng tiền: </span>
                          <strong className="text-slate-900 font-bold font-mono text-sm">{Number(b.rentAmount).toLocaleString("vi-VN")} đ</strong>
                        </div>
                        {Number(b.depositAmount) > 0 && (
                          <div className="text-blue-600 font-medium">
                            Đã cọc: {Number(b.depositAmount).toLocaleString("vi-VN")} đ
                          </div>
                        )}
                        {Number(b.commissionAmount) === 0 ? (
                          <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[11px] inline-flex items-center gap-1">
                            <span>🎁 Miễn 100% hoa hồng (Ưu đãi 5 đơn đầu)</span>
                          </div>
                        ) : (
                          <div className="text-amber-700 font-semibold text-[11px]">
                            Hoa hồng sàn: -{Number(b.commissionAmount).toLocaleString("vi-VN")} đ
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Bar - Thao tác bàn giao, hủy, quản lý CCCD */}
                    <div className="border-t pt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500">
                        {isWaiting && "Đơn tự động duyệt khi đối tác nạp đủ tiền bù hoa hồng sàn."}
                        {isConfirmed && "Sẵn sàng bàn giao xe hoặc quản lý CCCD khi khách tới."}
                        {isActive && "Khách đang sử dụng xe."}
                        {isCompleted && "Đơn đã hoàn tất."}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Nút Quản lý CCCD theo Nghị định 13 */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenIdCardModal(b)}
                          className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-8 rounded-xl gap-1.5 shadow-2xs"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                          <span>{b.idCardFront ? "Xem CCCD" : "Chụp CCCD"}</span>
                        </Button>

                        {isConfirmed && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenCancelModal(b)}
                              className="border-amber-300 text-amber-800 hover:bg-amber-50 text-xs h-8 rounded-xl gap-1.5 shadow-2xs font-semibold"
                            >
                              <XCircle className="h-3.5 w-3.5 text-amber-600" />
                              <span>Khách không đến</span>
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleOpenHandover(b)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 rounded-xl gap-1.5 font-bold shadow-xs"
                            >
                              <Bike className="h-3.5 w-3.5" /> Bàn giao xe cho khách
                            </Button>
                          </>
                        )}

                        {isActive && (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteRental(b.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-xl gap-1.5 font-bold shadow-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Xác nhận nhận lại xe
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Handover Modal (Select Available License Plate) */}
      {handoverBooking && (() => {
        const totalQty = (handoverBooking.bookingDetails || []).reduce(
          (sum, d) => sum + (d.quantity || 1),
          0
        );
        const heldIds = (handoverBooking.bookingDetails || [])
          .map((d) => d.vehicleItemId)
          .filter((id): id is number => typeof id === "number");

        return (
          <Dialog open={!!handoverBooking} onOpenChange={() => setHandoverBooking(null)}>
            <DialogContent className="max-w-md rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Bàn giao xe vật lý (biển số)</DialogTitle>
                <DialogDescription className="text-xs">
                  {totalQty > 1
                    ? `Đơn này khách đặt ${totalQty} xe. Hãy chọn đủ ${totalQty} biển số xe để bàn giao cho khách hàng: `
                    : `Chọn 1 biển số xe đang rảnh trong kho để giao cho khách hàng: `}
                  <strong>{handoverBooking.customer?.fullName}</strong> ({handoverBooking.customer?.phone})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Dòng xe thuê:</span>
                    <Badge className="bg-blue-600 text-white text-[11px] font-bold">
                      Số lượng: {totalQty} xe
                    </Badge>
                  </div>
                  <div className="font-bold text-sm text-slate-900 bg-slate-50 p-2.5 rounded-xl border">
                    {handoverBooking.bookingDetails?.[0]?.model?.name}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>
                      {totalQty > 1
                        ? `Chọn ${totalQty} biển số xe để bàn giao:`
                        : `Chọn 1 biển số xe khả dụng:`}
                    </span>
                    <span className={`text-[11px] ${selectedPlateIds.length === totalQty ? "text-emerald-600 font-bold" : "text-amber-600"}`}>
                      Đã chọn: {selectedPlateIds.length}/{totalQty} xe
                    </span>
                  </div>

                  {availablePlates.length === 0 ? (
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs">
                      Hiện không còn xe nào của dòng này có sẵn trong kho! Vui lòng kiểm tra lại trạng thái xe.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {availablePlates.map((plate) => {
                        const isSelected = selectedPlateIds.includes(plate.id);
                        const isPreAssigned = heldIds.includes(plate.id);

                        return (
                          <div
                            key={plate.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedPlateIds(selectedPlateIds.filter((id) => id !== plate.id));
                              } else {
                                if (selectedPlateIds.length < totalQty) {
                                  setSelectedPlateIds([...selectedPlateIds, plate.id]);
                                } else if (totalQty === 1) {
                                  setSelectedPlateIds([plate.id]);
                                } else {
                                  toast.info(`Đơn này thuê ${totalQty} xe. Hãy bỏ chọn 1 xe trước nếu bạn muốn đổi sang xe này.`);
                                }
                              }
                            }}
                            className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10 font-bold"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 text-white font-bold"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected ? "✓" : ""}
                              </div>
                              <span className="font-mono text-sm">{plate.licensePlate}</span>
                              {isPreAssigned && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                                  Xe đã giữ cho đơn này
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500">Màu: {plate.color || "Tiêu chuẩn"}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHandoverBooking(null)}
                  disabled={isHandoverLoading}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmHandover}
                  disabled={selectedPlateIds.length !== totalQty || isHandoverLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isHandoverLoading
                    ? "Đang xử lý..."
                    : totalQty > 1
                    ? `Xác nhận bàn giao (${selectedPlateIds.length}/${totalQty} xe)`
                    : "Xác nhận bàn giao xe"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Walk-in Booking Modal */}
      <Dialog open={isWalkInModalOpen} onOpenChange={setIsWalkInModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-600" />
              Tạo đơn thuê tại quầy
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tạo đơn trực tiếp cho khách vãng lai tại cơ sở <strong>{selectedStore?.storeName}</strong>. Biển số xe sẽ được gán và đồng bộ ngay vào hệ thống.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWalkInBookingSubmit} className="space-y-5 pt-2">
            {/* Thông tin khách hàng */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-amber-600" />
                Thông tin khách hàng
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Họ và tên khách hàng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    placeholder="VD: Nguyễn Văn A"
                    value={walkInCustomerName}
                    onChange={(e) => setWalkInCustomerName(e.target.value)}
                    className="h-9.5 text-xs rounded-xl bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Số điện thoại <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    type="tel"
                    placeholder="VD: 0912345678"
                    value={walkInCustomerPhone}
                    onChange={(e) => setWalkInCustomerPhone(e.target.value)}
                    className="h-9.5 text-xs rounded-xl bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Số GPLX / CCCD (đối chiếu trực tiếp)
                  </Label>
                  <Input
                    placeholder="VD: 012345678901"
                    value={walkInDriverLicense}
                    onChange={(e) => setWalkInDriverLicense(e.target.value)}
                    className="h-9.5 text-xs rounded-xl bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Email (không bắt buộc)
                  </Label>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={walkInCustomerEmail}
                    onChange={(e) => setWalkInCustomerEmail(e.target.value)}
                    className="h-9.5 text-xs rounded-xl bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Chọn dòng xe, số lượng xe & biển số xe */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Car className="w-3.5 h-3.5 text-amber-600" />
                Chọn phương tiện & biển số xe
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Dòng xe thuê <span className="text-red-500">*</span>
                  </Label>
                  {isLoadingWalkInModels ? (
                    <div className="h-9.5 flex items-center gap-2 px-3 text-xs text-slate-500 bg-white border rounded-xl">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" /> Đang tải dòng xe...
                    </div>
                  ) : walkInModels.length === 0 ? (
                    <div className="h-9.5 flex items-center px-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
                      Cơ sở chưa có dòng xe nào
                    </div>
                  ) : (
                    <select
                      value={walkInSelectedModelId || ""}
                      onChange={(e) => handleWalkInModelChange(Number(e.target.value))}
                      className="w-full h-9.5 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500/20"
                    >
                      {walkInModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.brand}) - {Number(m.rentPrice).toLocaleString("vi-VN")} đ/ngày
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Số lượng xe <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={walkInQuantity}
                    disabled={walkInVehicleItems.length === 0}
                    onChange={(e) => {
                      const qty = Math.max(1, Number(e.target.value));
                      setWalkInQuantity(qty);
                      const newIds = walkInVehicleItems.slice(0, qty).map((it) => it.id);
                      setWalkInSelectedItemIds(newIds);
                      recalcWalkInPrices(walkInStartTime, walkInEndTime, walkInRentPrice, qty);
                    }}
                    className="w-full h-9.5 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500/20"
                  >
                    {walkInVehicleItems.length === 0 ? (
                      <option value={1}>0 xe</option>
                    ) : (
                      Array.from({ length: walkInVehicleItems.length }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num} xe ({walkInVehicleItems.length} xe sẵn sàng)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {walkInQuantity === 1 && (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Biển số xe bàn giao <span className="text-red-500">*</span>
                    </Label>
                    {isLoadingItems ? (
                      <div className="h-9.5 flex items-center gap-2 px-3 text-xs text-slate-500 bg-white border rounded-xl">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" /> Đang kiểm tra kho...
                      </div>
                    ) : walkInVehicleItems.length === 0 ? (
                      <div className="h-9.5 flex items-center px-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl font-medium">
                        Hết xe sẵn sàng (status = 0)
                      </div>
                    ) : (
                      <select
                        value={walkInSelectedItemIds[0] || ""}
                        onChange={(e) => setWalkInSelectedItemIds([Number(e.target.value)])}
                        className="w-full h-9.5 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-mono font-bold focus:ring-2 focus:ring-amber-500/20"
                      >
                        {walkInVehicleItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.licensePlate}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Danh sách chọn biển số xe khi số lượng > 1 */}
              {walkInQuantity > 1 && (
                <div className="space-y-2 pt-2 border-t border-slate-200/80">
                  <Label className="text-xs font-semibold text-slate-700 block">
                    Biển số xe bàn giao ({walkInQuantity} xe) <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {Array.from({ length: walkInQuantity }, (_, idx) => (
                      <div key={idx} className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500">Xe #{idx + 1}:</span>
                        <select
                          value={walkInSelectedItemIds[idx] || ""}
                          onChange={(e) => {
                            const newId = Number(e.target.value);
                            const updated = [...walkInSelectedItemIds];
                            updated[idx] = newId;
                            setWalkInSelectedItemIds(updated);
                          }}
                          className="w-full h-9 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-mono font-bold focus:ring-2 focus:ring-amber-500/20"
                        >
                          {walkInVehicleItems.map((item) => {
                            const isChosenElsewhere = walkInSelectedItemIds.some((id, i) => i !== idx && id === item.id);
                            return (
                              <option key={item.id} value={item.id} disabled={isChosenElsewhere}>
                                {item.licensePlate}{isChosenElsewhere ? " (Đã chọn)" : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Thời gian & Chi phí */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Thời gian thuê & Chi phí
              </div>

              {/* Hàng 1: Thời gian nhận & trả xe (chia 2 cột rộng rãi để hiển thị trọn vẹn datetime và icon lịch) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Thời gian nhận xe <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    required
                    value={walkInStartTime}
                    onChange={(e) => handleWalkInTimeChange(e.target.value, walkInEndTime)}
                    onClick={(e) => {
                      try {
                        (e.target as HTMLInputElement).showPicker?.();
                      } catch {}
                    }}
                    className="h-9.5 text-xs rounded-xl bg-white px-3 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-75 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Thời gian trả xe dự kiến <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    required
                    min={walkInStartTime}
                    value={walkInEndTime}
                    onChange={(e) => handleWalkInTimeChange(walkInStartTime, e.target.value)}
                    onClick={(e) => {
                      try {
                        (e.target as HTMLInputElement).showPicker?.();
                      } catch {}
                    }}
                    className="h-9.5 text-xs rounded-xl bg-white px-3 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-75 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
              </div>

              {/* Hàng 2: Đơn giá thuê / ngày và Tổng tiền dự kiến */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-700">
                      Đơn giá thuê niêm yết
                    </Label>
                    <span className="text-[10px] text-slate-400 font-medium">Cố định theo dòng xe</span>
                  </div>
                  <Input
                    type="text"
                    readOnly
                    disabled
                    value={`${Number(walkInRentPrice || 0).toLocaleString("vi-VN")} đ/ngày`}
                    className="h-9.5 text-xs rounded-xl bg-slate-100/80 border-slate-200 text-slate-700 font-mono font-bold cursor-not-allowed select-none"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-amber-950">
                    Tổng tiền thuê dự kiến
                  </Label>
                  <div className="h-9.5 px-3.5 bg-amber-50/90 rounded-xl border border-amber-300/80 flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-900">
                      Tạm tính ({walkInDays} ngày{walkInQuantity > 1 ? ` × ${walkInQuantity} xe` : ""}):
                    </span>
                    <span className="text-base font-black text-amber-700 font-mono">
                      {walkInTotalAmount.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tùy chọn bàn giao ngay */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={walkInHandoverNow}
                  onChange={(e) => setWalkInHandoverNow(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Bàn giao xe ngay cho khách (Đang thuê)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Khách đã có mặt tại cửa hàng và nhận xe ngay. Xe sẽ chuyển sang trạng thái &ldquo;Đang cho thuê&rdquo; và đơn chuyển sang &ldquo;Đang thuê&rdquo;.
                  </span>
                </div>
              </label>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Ghi chú đơn (tùy chọn)</Label>
                <Input
                  placeholder="Ghi chú về tình trạng giấy tờ, mũ bảo hiểm, đồ đi kèm..."
                  value={walkInNote}
                  onChange={(e) => setWalkInNote(e.target.value)}
                  className="h-9.5 text-xs rounded-xl bg-white"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsWalkInModalOpen(false)}
                disabled={isSubmittingWalkIn}
                className="rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingWalkIn || !walkInSelectedItemIds.length || walkInSelectedItemIds.some((id) => !id)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
              >
                {isSubmittingWalkIn ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Đang tạo đơn...
                  </>
                ) : walkInHandoverNow ? (
                  "Tạo đơn & Bàn giao ngay"
                ) : (
                  "Tạo đơn đặt trước"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Hủy Đơn Khi Khách Không Đến */}
      {cancelModalBooking && (() => {
        const isFullPayment = Number(cancelModalBooking.depositAmount) >= Number(cancelModalBooking.rentAmount);
        const now = new Date();
        const startTime = new Date(cancelModalBooking.startTime);

        // Tính thời điểm kết thúc ngày hẹn nhận xe (23:59:59.999 của ngày startTime)
        const endOfPickupDate = new Date(
          startTime.getFullYear(),
          startTime.getMonth(),
          startTime.getDate(),
          23,
          59,
          59,
          999,
        );
        const isPastPickupDate = now.getTime() > endOfPickupDate.getTime();
        const depositAmt = Number(cancelModalBooking.depositAmount);

        const pad = (n: number) => String(n).padStart(2, "0");
        const formattedPickupDate = `${pad(startTime.getDate())}/${pad(startTime.getMonth() + 1)}/${startTime.getFullYear()}`;

        return (
          <Dialog open={!!cancelModalBooking} onOpenChange={() => setCancelModalBooking(null)}>
            <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-amber-600" />
                  <span>Khách không đến nhận xe</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Mã đơn: <strong className="font-mono text-slate-900">{cancelModalBooking.bookingCode}</strong> • Khách: <strong>{cancelModalBooking.customer?.fullName || "Khách thuê"}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-3 text-xs">
                  {isFullPayment ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-red-900">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Không thể hủy đơn đã thanh toán 100%</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Đơn này khách đã thanh toán toàn bộ 100% tiền thuê xe. Theo quy định của sàn, nhà xe bắt buộc phải giữ xe cho khách trong suốt toàn bộ thời gian thuê.
                      </p>
                    </div>
                  ) : !isPastPickupDate ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5 text-amber-950">
                        <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>Chưa hết ngày hẹn nhận xe</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Ngày hẹn nhận xe là <strong>{formattedPickupDate}</strong> (giờ hẹn: {format24hDateTime(cancelModalBooking.startTime)}).
                      </p>
                      <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
                        Cửa hàng chỉ được phép hủy đơn khi đã hết ngày hẹn nhận xe mà khách vẫn không đến nhận xe.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-950">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>Đủ điều kiện hủy do khách không đến</span>
                      </div>
                      <ul className="text-[11px] list-disc list-inside space-y-1 text-emerald-800">
                        <li>Đã kết thúc ngày hẹn nhận xe ({formattedPickupDate}).</li>
                        <li>Xe vật lý sẽ được <strong>giải phóng ngay về kho</strong> để cho khách khác thuê.</li>
                        <li>Tiền cọc ({depositAmt.toLocaleString("vi-VN")} đ) được <strong>giữ lại cho cửa hàng</strong>.</li>
                        <li>Cửa hàng <strong>không bị trừ điểm uy tín</strong>.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelModalBooking(null)}
                  disabled={isSubmittingCancel}
                  className="rounded-xl"
                >
                  Đóng
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmCancel}
                  disabled={isSubmittingCancel || isFullPayment || !isPastPickupDate}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {isSubmittingCancel ? "Đang xử lý..." : "Khách không đến"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Modal Quản Lý / Chụp Ảnh CCCD (Chuẩn Nghị Định 13/2023/NĐ-CP) */}
      {idCardModalBooking && (
        <Dialog open={!!idCardModalBooking} onOpenChange={() => setIdCardModalBooking(null)}>
          <DialogContent className="max-w-lg rounded-2xl p-6 bg-white border border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <span>Ảnh CCCD</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Mã đơn: <strong className="font-mono text-slate-900">{idCardModalBooking.bookingCode}</strong> • Khách: <strong>{idCardModalBooking.customer?.fullName || "Khách thuê"}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Nghị định 13 Banner */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-1 text-blue-950">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
                  <span>Tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  Ảnh CCCD được mã hóa và lưu trữ an toàn. Chỉ <strong>chủ cửa hàng đơn này</strong> và <strong>Quản trị viên</strong> mới có quyền truy cập. Hệ thống sẽ <strong>tự động xóa vĩnh viễn</strong> sau 30 ngày kể từ khi hoàn tất chuyến đi.
                </p>
              </div>

              {idCardDetails?.isDeleted ? (
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-center text-xs text-slate-600 space-y-1">
                  <AlertCircle className="h-6 w-6 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-800">Ảnh CCCD đã được tự động xóa</p>
                  <p className="text-[11px] text-slate-500">{idCardDetails.message}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* CCCD Mặt Trước */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-800 block">
                      CCCD Mặt trước <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative h-36 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center p-2 text-center group">
                      {idCardFront ? (
                        <>
                          <img src={idCardFront} alt="CCCD mặt trước" className="w-full h-full object-cover rounded-lg" />
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-semibold cursor-pointer transition-opacity">
                            <Camera className="h-4 w-4" /> Thay ảnh
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => handleUploadIdCard(e, "front")}
                            />
                          </label>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center p-2 w-full h-full">
                          {isUploadingIdFront ? (
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-1" />
                          ) : (
                            <Camera className="h-6 w-6 text-slate-400 mb-1" />
                          )}
                          <span className="text-xs font-bold text-slate-700">Chụp / Tải mặt trước</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG (Tối đa 5MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleUploadIdCard(e, "front")}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* CCCD Mặt Sau */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-800 block">
                      CCCD Mặt sau <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative h-36 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center p-2 text-center group">
                      {idCardBack ? (
                        <>
                          <img src={idCardBack} alt="CCCD mặt sau" className="w-full h-full object-cover rounded-lg" />
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-semibold cursor-pointer transition-opacity">
                            <Camera className="h-4 w-4" /> Thay ảnh
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => handleUploadIdCard(e, "back")}
                            />
                          </label>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center p-2 w-full h-full">
                          {isUploadingIdBack ? (
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-1" />
                          ) : (
                            <Camera className="h-6 w-6 text-slate-400 mb-1" />
                          )}
                          <span className="text-xs font-bold text-slate-700">Chụp / Tải mặt sau</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG (Tối đa 5MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleUploadIdCard(e, "back")}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIdCardModalBooking(null)}
                disabled={isSubmittingIdCard}
                className="rounded-xl"
              >
                Đóng
              </Button>
              {!idCardDetails?.isDeleted && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveIdCard}
                  disabled={isSubmittingIdCard || !idCardFront || !idCardBack}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {isSubmittingIdCard ? "Đang lưu..." : "Lưu CCCD"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function PartnerBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      }
    >
      <PartnerBookingsContent />
    </Suspense>
  );
}

