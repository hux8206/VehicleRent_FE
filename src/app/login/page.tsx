"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/layout/brand-logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const errorParam = searchParams.get("error");

  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  // ── Forgot & Reset Password States ──────────────────────────────────────────
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1: Email, 2: OTP + New Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOpenForgotModal = () => {
    setForgotEmail(email.trim());
    setForgotStep(1);
    setForgotOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setDevOtpHint(null);
    setForgotError(null);
    setIsForgotModalOpen(true);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes("@")) {
      setForgotError("Vui lòng nhập địa chỉ email hợp lệ!");
      return;
    }
    setIsSubmittingForgot(true);
    setForgotError(null);
    try {
      const res = await api.auth.forgotPassword(forgotEmail.trim());
      setForgotStep(2);
      setCountdown(60);
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      toast.success(res.message || "Mã xác nhận OTP đã được gửi thành công!");
    } catch (err: any) {
      const msg = err.message || "Không thể gửi mã xác nhận lúc này. Vui lòng thử lại!";
      setForgotError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      setForgotError("Mã xác thực OTP phải gồm đúng 6 chữ số!");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotError("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError("Mật khẩu xác nhận không khớp!");
      return;
    }
    setIsSubmittingForgot(true);
    setForgotError(null);
    try {
      await api.auth.resetPassword({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword,
      });
      toast.success("🎉 Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới.");
      setIsForgotModalOpen(false);
      setEmail(forgotEmail.trim());
      setPassword("");
    } catch (err: any) {
      const msg = err.message || "Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP!";
      setForgotError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  useEffect(() => {
    if (errorParam === "unauthorized") {
      setFieldErrors({ general: t("toast_fill_required", "Vui lòng đăng nhập để tiếp tục truy cập trang này.") });
    } else if (errorParam === "forbidden") {
      setFieldErrors({ general: "Tài khoản của bạn không có quyền truy cập vào phân hệ này." });
    }
  }, [errorParam, t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; password?: string; general?: string } = {};

    if (!email.trim()) {
      errors.email = t("auth_email", "Vui lòng nhập địa chỉ email.");
    }
    if (!password) {
      errors.password = t("auth_password", "Vui lòng nhập mật khẩu.");
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    setFieldErrors({});

    try {
      const loggedUser = await login(email.trim(), password);
      toast.success(`${t("toast_login_success", "Đăng nhập thành công!")} ${loggedUser.fullName}.`);

      // Intelligent Redirection based on role
      if (loggedUser.role === 0) {
        router.push("/admin");
      } else if (loggedUser.role === 1) {
        try {
          const stores = await api.partner.getStores();
          const hasActiveStore = stores.some((s) => s.status === 1);
          if (hasActiveStore) {
            router.push("/partner");
          } else {
            router.push("/partner/onboarding");
          }
        } catch {
          router.push("/partner/onboarding");
        }
      } else {
        if (callbackUrl && !callbackUrl.startsWith("/admin") && !callbackUrl.startsWith("/partner")) {
          router.push(callbackUrl);
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      const msg = err.message || t("toast_login_failed", "Email hoặc mật khẩu không chính xác.");
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
        <CardContent className="p-8 sm:p-10 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="mb-2">
              <BrandLogo href="/" size="md" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {t("auth_login_title", "Đăng Nhập Tài Khoản")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("auth_login_subtitle", "Truy cập hệ thống đặt xe và quản lý tài khoản của bạn")}
            </p>
          </div>

          {/* General Error Banner */}
          {fieldErrors.general && (
            <div className="p-4 rounded-2xl border text-xs flex items-start gap-3 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <div className="font-medium leading-relaxed">{fieldErrors.general}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
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
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
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
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t("auth_password", "Mật khẩu")}
                </Label>
                <span
                  onClick={handleOpenForgotModal}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {t("auth_forgot_password", "Quên mật khẩu?")}
                </span>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  type="password"
                  placeholder={t("auth_password_placeholder", "Nhập mật khẩu...")}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`pl-10 text-xs h-11 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 transition-all ${
                    fieldErrors.password ? "border-red-500 focus-visible:ring-red-400" : ""
                  }`}
                />
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] font-semibold text-red-600 pl-1">{fieldErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-md shadow-blue-600/25 transition-all mt-2 cursor-pointer"
            >
              {isLoading ? t("auth_logging_in", "Đang đăng nhập...") : t("auth_login_button", "Đăng Nhập")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Footer Navigation */}
          <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            {t("auth_no_account", "Chưa có tài khoản?")}{" "}
            <Link href="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
              {t("auth_register_now", "Đăng ký ngay")}
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ─── Forgot Password & Reset Modal ────────────────────────────────────── */}
      <Dialog open={isForgotModalOpen} onOpenChange={setIsForgotModalOpen}>
        <DialogContent className="max-w-md p-6 sm:p-7 rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs mb-1">
              <KeyRound className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {forgotStep === 1 ? "Khôi Phục Mật Khẩu" : "Nhập Mã OTP & Đổi Mật Khẩu"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {forgotStep === 1
                ? "Nhập email tài khoản của bạn. Hệ thống sẽ tạo mã xác thực OTP 6 số để bạn thiết lập mật khẩu mới."
                : `Mã OTP đã được gửi. Vui lòng kiểm tra mã xác thực gồm 6 chữ số để hoàn tất đổi mật khẩu.`}
            </DialogDescription>
          </DialogHeader>

          {/* Modal Error Alert */}
          {forgotError && (
            <div className="p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="font-medium leading-relaxed">{forgotError}</div>
            </div>
          )}

          {/* ── STEP 1: NHẬP EMAIL ── */}
          {forgotStep === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Địa chỉ Email tài khoản
                </Label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotError) setForgotError(null);
                    }}
                    className="pl-10 text-xs h-11 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="h-10 px-4 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingForgot}
                  className="h-10 px-5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs gap-2 cursor-pointer"
                >
                  {isSubmittingForgot ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang gửi mã...</span>
                    </>
                  ) : (
                    <>
                      <span>Tiếp tục</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* ── STEP 2: NHẬP OTP VÀ MẬT KHẨU MỚI ── */
            <form onSubmit={handleResetPassword} className="space-y-4 pt-1">
              {/* Hiển thị email nhận mã */}
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                    {forgotEmail}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(1);
                    setForgotError(null);
                  }}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Đổi email
                </button>
              </div>

              {/* Dev mode OTP preview helper */}
              {devOtpHint && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>Mã OTP test: <strong className="font-mono text-sm tracking-widest">{devOtpHint}</strong></span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setForgotOtp(devOtpHint)}
                    className="text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/80 px-2 py-0.5 rounded-md hover:bg-amber-300 dark:hover:bg-amber-800"
                  >
                    Điền nhanh
                  </button>
                </div>
              )}

              {/* Input OTP 6 số */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mã xác nhận OTP (6 số)
                  </Label>
                  {countdown > 0 ? (
                    <span className="text-[11px] text-slate-400 font-medium">
                      Gửi lại sau {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmittingForgot}
                      onClick={handleRequestOtp}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Gửi lại mã</span>
                    </button>
                  )}
                </div>
                <Input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="• • • • • •"
                  value={forgotOtp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setForgotOtp(val);
                    if (forgotError) setForgotError(null);
                  }}
                  className="text-center font-mono text-lg tracking-[0.5em] font-black h-12 rounded-2xl bg-slate-50/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              {/* Input Mật khẩu mới */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mật khẩu mới (tối thiểu 6 ký tự)
                </Label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Nhập mật khẩu mới..."
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (forgotError) setForgotError(null);
                    }}
                    className="pl-10 pr-10 text-xs h-11 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Input Xác nhận mật khẩu mới */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Xác nhận lại mật khẩu mới
                </Label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Nhập lại mật khẩu mới..."
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (forgotError) setForgotError(null);
                    }}
                    className="pl-10 text-xs h-11 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="h-10 px-4 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700"
                >
                  Đóng
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingForgot}
                  className="h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs gap-2 cursor-pointer"
                >
                  {isSubmittingForgot ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Xác Nhận Đổi Mật Khẩu</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 bg-slate-50/40 dark:bg-slate-950 transition-colors">
      <Suspense fallback={<div className="text-center py-12 text-xs">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
