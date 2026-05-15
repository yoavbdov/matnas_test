"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function hebrewError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "סיסמה שגויה. נסה שוב.";
    case "auth/user-not-found":
      return "לא נמצא חשבון עם כתובת דוא\"ל זו.";
    case "auth/too-many-requests":
      return "יותר מדי ניסיונות. נסה שוב מאוחר יותר.";
    default:
      return "אירעה שגיאה. נסה שוב.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      document.cookie = "session=1; path=/; max-age=86400";
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      setError(hebrewError(code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted" dir="rtl">
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8 w-full max-w-sm">
        {/* לוגו */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/chess nimbus logo.png"
            alt="Chess Nimbus Logo"
            width={180}
            height={70}
            className="object-contain mb-3"
            priority
          />
          <p className="text-sm text-muted-foreground">התחברות למערכת</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">דוא"ל</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              required
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">סיסמה</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={128}
                required
                className="pl-16"
              />
              {/* כפתור הצג/הסתר סיסמה */}
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
              >
                {showPassword ? "הסתר" : "הצג"}
              </Button>
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "מתחבר..." : "התחברות"}
          </Button>
        </form>
      </div>
    </div>
  );
}
