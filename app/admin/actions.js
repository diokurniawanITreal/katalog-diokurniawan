"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Server Action untuk memproses login admin menggunakan Supabase Auth.
 * Menerima formData dari form login.
 */
export async function login(prevStateOrFormData, maybeFormData) {
  const isActionState = maybeFormData instanceof FormData;
  const formData = isActionState ? maybeFormData : prevStateOrFormData;

  const email = formData?.get("email");
  const password = formData?.get("password");

  if (!email || !password) {
    const errorMsg = "Email dan password wajib diisi.";
    if (isActionState) {
      return { error: errorMsg };
    }
    redirect(`/admin/login?error=${encodeURIComponent(errorMsg)}`);
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(email).trim(),
    password: String(password),
  });

  if (error) {
    const errorMsg =
      error.message === "Invalid login credentials"
        ? "Email atau password salah."
        : error.message || "Gagal masuk. Periksa kembali email dan password.";

    if (isActionState) {
      return { error: errorMsg };
    }
    redirect(`/admin/login?error=${encodeURIComponent(errorMsg)}`);
  }

  redirect("/admin");
}

/**
 * Server Action untuk mengakhiri sesi admin (logout) lalu kembali ke halaman login.
 */
export async function keluar() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export const logout = keluar;

/**
 * Server Action untuk mengganti password admin yang sedang login.
 * Validasi: admin sudah login, password baru minimal 8 karakter, dan sama dengan konfirmasi.
 */
export async function gantiPassword(prevStateOrFormData, maybeFormData) {
  const isActionState = maybeFormData instanceof FormData;
  const formData = isActionState ? maybeFormData : prevStateOrFormData;

  const passwordBaru = formData?.get("password_baru");
  const konfirmasiPassword = formData?.get("konfirmasi_password");

  const supabase = await createSessionClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  if (!passwordBaru || typeof passwordBaru !== "string" || passwordBaru.length < 8) {
    const errorMsg = "Password baru minimal 8 karakter.";
    if (isActionState) {
      return { error: errorMsg };
    }
    redirect(`/admin/password?error=${encodeURIComponent(errorMsg)}`);
  }

  if (passwordBaru !== konfirmasiPassword) {
    const errorMsg = "Konfirmasi password tidak sama dengan password baru.";
    if (isActionState) {
      return { error: errorMsg };
    }
    redirect(`/admin/password?error=${encodeURIComponent(errorMsg)}`);
  }

  const { error } = await supabase.auth.updateUser({
    password: passwordBaru,
  });

  if (error) {
    const errorMsg = error.message || "Gagal mengganti password.";
    if (isActionState) {
      return { error: errorMsg };
    }
    redirect(`/admin/password?error=${encodeURIComponent(errorMsg)}`);
  }

  const suksesMsg = "Password berhasil diganti.";
  if (isActionState) {
    return { sukses: suksesMsg };
  }
  redirect(`/admin/password?berhasil=${encodeURIComponent(suksesMsg)}`);
}

export const changePassword = gantiPassword;
