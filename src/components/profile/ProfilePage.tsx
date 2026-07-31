import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/providers/AuthProvider";
import { TextField } from "@/components/text-field";
import { supabase } from "@/lib/supabase";
import { User, Mail, Phone, Shield, Calendar, Lock, LogOut, Package } from "lucide-react";
import { toast } from "sonner";

export function ProfilePage() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({ fullName: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });
  const [profileErrors, setProfileErrors] = useState<{ fullName?: string; phone?: string }>({});
  const [passwordErrors, setPasswordErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth/signin", replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    setProfileForm({ fullName: profile?.full_name ?? "", phone: profile?.phone ?? "" });
  }, [profile?.full_name, profile?.phone]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate({ to: "/auth/signin" });
    } catch (error) {
      toast.error("Unable to sign out", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleProfileUpdate = async (event: FormEvent) => {
    event.preventDefault();
    const fullName = profileForm.fullName.trim();
    const phone = profileForm.phone.trim();
    const errors: typeof profileErrors = {};

    if (fullName.length < 2) errors.fullName = "Enter your full name";
    if (fullName.length > 100) errors.fullName = "Use 100 characters or fewer";
    if (phone && !/^[+\d][\d\s()-]{6,}$/.test(phone)) errors.phone = "Enter a valid phone number";
    setProfileErrors(errors);
    if (Object.keys(errors).length || !user) return;

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone: phone || null })
        .eq("id", user.id);
      if (error) throw error;

      await refreshProfile();
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Unable to update profile", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (event: FormEvent) => {
    event.preventDefault();
    const errors: typeof passwordErrors = {};
    if (passwordForm.password.length < 8) errors.password = "Use at least 8 characters";
    if (passwordForm.confirmPassword !== passwordForm.password) errors.confirmPassword = "Passwords do not match";
    setPasswordErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
      if (error) throw error;

      setPasswordForm({ password: "", confirmPassword: "" });
      setPasswordErrors({});
      toast.success("Password updated successfully");
    } catch (error) {
      toast.error("Unable to update password", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="bg-noise flex min-h-screen items-center justify-center px-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    );
  }

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently";

  return (
    <main className="min-h-screen bg-noise pb-24 pt-12 sm:pb-32">
      <section className="relative isolate overflow-hidden">
        {/* Decorative background shapes */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
          <div className="absolute -right-20 top-12 h-64 w-64 rotate-45 rounded-[3rem] border border-teal/10" />
        </div>

        <div className="mx-auto max-w-4xl px-6 pt-16">
          <div className="mb-10 text-center sm:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.35em] text-foreground/85 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" />
              Member Space
            </span>
            <h1 className="text-display mt-6 text-4xl font-light leading-none sm:text-5xl">
              My <span className="italic text-teal">Account.</span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Manage your personal information and preferences.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            {/* Left Column: Profile Info Card */}
            <div className="glass-card rounded-[2rem] p-6 sm:p-9 space-y-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {/* Avatar Placeholder */}
                <div className="grid size-20 shrink-0 place-items-center rounded-3xl border border-white/10 bg-white/[0.03] text-teal">
                  <User className="h-10 w-10" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-display text-2xl font-medium text-foreground truncate">
                    {profile?.full_name || "QYVERO Member"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Logged in as {user.email}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-8 grid gap-6 sm:grid-cols-2">
                <div className="flex gap-4 items-start">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.02] text-teal">
                    <User className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {profile?.full_name || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.02] text-teal">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</p>
                    <p className="mt-1 text-sm font-medium text-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.02] text-teal">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Phone Number</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {profile?.phone || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.02] text-teal">
                    <Shield className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Account Role</p>
                    <p className="mt-1 text-sm font-medium capitalize text-foreground">
                      {profile?.role || "Customer"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Actions & Details */}
            <div className="flex flex-col gap-6">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 space-y-6">
                <h3 className="text-display text-lg font-medium">Overview</h3>
                
                <div className="flex gap-3 items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-teal" />
                  <span>Joined {joinDate}</span>
                </div>

                <div className="flex gap-3 items-center text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-teal" />
                  <span>Status: Active</span>
                </div>

                {profile?.role === "admin" && (
                  <button
                    onClick={() => navigate({ to: "/admin" })}
                    className="w-full inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-foreground transition hover:border-teal hover:text-teal"
                  >
                    Go to Admin Dashboard
                  </button>
                )}

                <button
                  onClick={() => navigate({ to: "/profile" })}
                  className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-foreground transition hover:border-teal hover:text-teal"
                >
                  <User className="h-4 w-4" />
                  Personal Information
                </button>

                <button
                  onClick={() => navigate({ to: "/profile/orders" })}
                  className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-foreground transition hover:border-teal hover:text-teal"
                >
                  <Package className="h-4 w-4" />
                  My Orders
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold uppercase tracking-[0.15em] text-background transition hover:bg-foreground/90"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <form onSubmit={handleProfileUpdate} className="glass-card rounded-[2rem] p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-display text-xl font-medium text-foreground">Edit Profile</h2>
                <p className="mt-1 text-sm text-muted-foreground">Keep your account details up to date.</p>
              </div>
              <div className="space-y-4">
                <TextField
                  label="Full Name"
                  autoComplete="name"
                  icon={<User />}
                  value={profileForm.fullName}
                  onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))}
                  error={profileErrors.fullName}
                />
                <TextField
                  label="Phone Number"
                  type="tel"
                  autoComplete="tel"
                  icon={<Phone />}
                  value={profileForm.phone}
                  onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                  error={profileErrors.phone}
                />
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold uppercase tracking-[0.15em] text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>

            <form onSubmit={handlePasswordUpdate} className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-display text-xl font-medium text-foreground">Change Password</h2>
                <p className="mt-1 text-sm text-muted-foreground">Use at least 8 characters to secure your account.</p>
              </div>
              <div className="space-y-4">
                <TextField
                  label="New Password"
                  type="password"
                  autoComplete="new-password"
                  icon={<Lock />}
                  value={passwordForm.password}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
                  error={passwordErrors.password}
                />
                <TextField
                  label="Confirm Password"
                  type="password"
                  autoComplete="new-password"
                  icon={<Lock />}
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  error={passwordErrors.confirmPassword}
                />
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-medium text-foreground transition hover:border-teal hover:text-teal disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPassword ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ProfilePage;
