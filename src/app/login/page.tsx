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
import { Mail, Lock, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
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
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
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
