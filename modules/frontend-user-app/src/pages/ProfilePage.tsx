import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import LanguageToggle from "@/components/LanguageToggle";
import { ArrowLeft, User, Mail, Globe, LogOut, ShieldCheck } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const ProfilePage = () => {
  const { t, lang, setLang } = useLanguage();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { data: role } = useUserRole();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");

  const handleSave = () => {
    updateUser({ name });
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-foreground">{t.profile.title}</span>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="container max-w-lg pt-6 pb-24 md:pb-6">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
            {(user?.name || "U")[0].toUpperCase()}
          </div>
          <h2 className="mt-3 text-lg font-bold text-foreground">{user?.name}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4">
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <User className="h-3.5 w-3.5" /> {t.profile.name}
            </label>
            {editing ? (
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
            ) : (
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {t.profile.email}
            </label>
            <p className="text-sm text-foreground">{user?.email}</p>
          </div>

          <div className="mb-4">
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Globe className="h-3.5 w-3.5" /> {t.profile.language}
            </label>
            <div className="flex gap-2">
              <button onClick={() => setLang("en")} className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${lang === "en" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>English</button>
              <button onClick={() => setLang("ta")} className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${lang === "ta" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>தமிழ்</button>
            </div>
          </div>

          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={handleSave} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">{t.profile.save}</button>
                <button onClick={() => setEditing(false)} className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-secondary">{t.profile.cancel}</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-secondary">{t.profile.editProfile}</button>
            )}
          </div>
        </div>

        <button
          onClick={async () => { await logout(); navigate("/"); }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-destructive px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-4 w-4" /> {t.nav.logout}
        </button>

        {role?.isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <ShieldCheck className="h-4 w-4" /> Admin · Add Bus Route
          </button>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default ProfilePage;
