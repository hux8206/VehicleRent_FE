"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, User, Phone, Store, UserCheck, ArrowLeft, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/layout/brand-logo";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "partner" ? "partner" : "customer";

  const { registerCustomer, registerPartner } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>(initialType);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Per-field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    phone?: string;
    email?: string;
    password?: string;
    agreedToTerms?: string;
    general?: string;
  }>({});

  const validate = () => {
    const errors: typeof fieldErrors = {};
    if (!fullName.trim()) errors.fullName = t("auth_full_name", "Vui lòng nhập họ và tên.");
    if (!phone.trim()) errors.phone = t("auth_phone", "Vui lòng nhập số điện thoại.");
    else if (!/^[0-9+ ]{9,15}$/.test(phone.trim())) errors.phone = "Số điện thoại không hợp lệ.";
    if (!email.trim()) errors.email = t("auth_email", "Vui lòng nhập email.");
    else if (!/\S+@\S+\.\S+/.test(email.trim())) errors.email = "Định dạng email không hợp lệ.";
    if (!password) errors.password = t("auth_password", "Vui lòng nhập mật khẩu.");
    else if (password.length < 6) errors.password = "Mật khẩu phải từ 6 ký tự trở lên.";
    if (!agreedToTerms) errors.agreedToTerms = t("toast_fill_required", "Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật để tiếp tục.");
    return errors;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    setFieldErrors({});

    try {
      if (activeTab === "partner") {
        await registerPartner({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
        });
        toast.success(t("toast_register_success", "Đăng ký tài khoản Đối tác thành công! Hãy thiết lập hồ sơ cửa hàng."));
        router.push("/partner/onboarding");
      } else {
        await registerCustomer({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
        });
        toast.success(t("toast_register_success", "Đăng ký tài khoản Khách thuê thành công! Chào mừng bạn."));
        router.push("/");
      }
    } catch (err: any) {
      let msg = err.message || t("toast_register_failed", "Đăng ký thất bại. Email có thể đã được sử dụng.");
      if (msg === "Failed to fetch" || msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        msg = "Không thể kết nối đến máy chủ API (Failed to fetch). Vui lòng kiểm tra lại cấu hình NEXT_PUBLIC_API_URL trên Vercel hoặc trạng thái của server Backend.";
      }
      setFieldErrors({ general: msg });
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Back to Home Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> {t("nav_home", "Quay lại trang chủ")}
      </Link>

      <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
        <CardContent className="p-5 sm:p-8 md:p-10 space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="mb-2">
              <BrandLogo href="/" size="md" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {t("auth_register_title", "Tạo Tài Khoản Mới")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("auth_register_subtitle", "Chọn vai trò phù hợp để trải nghiệm dịch vụ tốt nhất")}
            </p>
          </div>

          {/* Role Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val);
              setFieldErrors({});
            }}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <TabsTrigger
                value="customer"
                className="text-xs font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-xs py-2.5 gap-1.5 transition-all cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5" /> {t("auth_role_customer", "Khách thuê xe")}
              </TabsTrigger>
              <TabsTrigger
                value="partner"
                className="text-xs font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400 data-[state=active]:shadow-xs py-2.5 gap-1.5 transition-all cursor-pointer"
              >
                <Store className="h-3.5 w-3.5" /> {t("auth_role_partner", "Đối tác nhà xe")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* General Error Banner */}
          {fieldErrors.general && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-400 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span className="font-medium leading-relaxed">{fieldErrors.general}</span>
            </div>
          )}

          {/* Minimalist Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("auth_full_name", "Họ và tên")}
              </Label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  type="text"
                  placeholder={t("auth_full_name_placeholder", "Nguyễn Văn A")}
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: undefined }));
                  }}
                  className={`pl-10 text-xs h-11 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 transition-all ${
                    fieldErrors.fullName ? "border-red-500 focus-visible:ring-red-400" : ""
                  }`}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="text-[11px] font-semibold text-red-600 pl-1">{fieldErrors.fullName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("auth_phone", "Số điện thoại")}
              </Label>
              <div className="relative">
                <Phone className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  type="tel"
                  placeholder={t("auth_phone_placeholder", "0912345678")}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined }));
                  }}
                  className={`pl-10 text-xs h-11 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 transition-all ${
                    fieldErrors.phone ? "border-red-500 focus-visible:ring-red-400" : ""
                  }`}
                />
              </div>
              {fieldErrors.phone && (
                <p className="text-[11px] font-semibold text-red-600 pl-1">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("auth_email", "Địa chỉ Email")}
              </Label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  type="email"
                  placeholder={t("auth_email_placeholder", "name@example.com")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                  }}
                  className={`pl-10 text-xs h-11 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 transition-all ${
                    fieldErrors.email ? "border-red-500 focus-visible:ring-red-400" : ""
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] font-semibold text-red-600 pl-1">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("auth_password", "Mật khẩu")}
              </Label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth_password_placeholder", "Nhập mật khẩu...")}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  className={`pl-10 pr-10 text-xs h-11 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 transition-all ${
                    fieldErrors.password ? "border-red-500 focus-visible:ring-red-400" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-hidden"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] font-semibold text-red-600 pl-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Checkbox Terms */}
            <div className="space-y-1.5 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    if (fieldErrors.agreedToTerms) {
                      setFieldErrors((p) => ({ ...p, agreedToTerms: undefined }));
                    }
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <span className="leading-snug">
                  {t("footer_terms", "Điều khoản dịch vụ")} & {t("footer_privacy", "Chính sách bảo mật")}
                </span>
              </label>
              {fieldErrors.agreedToTerms && (
                <p className="text-[11px] font-semibold text-red-600 pl-6 leading-tight">
                  {fieldErrors.agreedToTerms}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full h-11 rounded-2xl text-white font-bold text-xs gap-2 shadow-md transition-all mt-2 cursor-pointer ${
                activeTab === "partner"
                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25"
              }`}
            >
              {isLoading
                ? t("auth_registering", "Đang xử lý...")
                : activeTab === "partner"
                ? t("register_partner", "Đăng ký Đối tác nhà xe")
                : t("register_customer", "Đăng ký Khách thuê")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Footer Navigation */}
          <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            {t("auth_has_account", "Đã có tài khoản?")}{" "}
            <Link href="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
              {t("auth_login_link", "Đăng nhập ngay")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 sm:py-12 px-3 sm:px-6 pb-24 sm:pb-12 bg-slate-50/40 dark:bg-slate-950 transition-colors">
      <Suspense fallback={<div className="text-center py-12 text-xs">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
