import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Loader2 } from "lucide-react";
import { useSaveUserProfile, useAssignAdminRole } from "../hooks/useQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminSetup() {
  const { identity } = useInternetIdentity();
  const saveProfile = useSaveUserProfile();
  const assignAdmin = useAssignAdminRole();
  const qc = useQueryClient();

  const [form, setForm] = useState({ name: "", phone: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identity) return;
    try {
      const principal = identity.getPrincipal();
      // Assign admin role and save profile in parallel
      await Promise.all([
        assignAdmin.mutateAsync({ principal }),
        saveProfile.mutateAsync({ name: form.name, phone: form.phone }),
      ]);
      toast.success("Account set up successfully!");
      qc.invalidateQueries({ queryKey: ["isAdmin"] });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    } catch {
      toast.error("Failed to set up account. Please try again.");
    }
  }

  const isPending = saveProfile.isPending || assignAdmin.isPending;

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-xl ember-gradient flex items-center justify-center shadow-ember">
            <Flame className="w-6 h-6 text-white" />
          </div>
        </div>

        <Card className="bg-sidebar-accent border-sidebar-border">
          <CardHeader>
            <CardTitle className="font-display text-2xl text-sidebar-foreground text-center">
              Set Up Your Account
            </CardTitle>
            <p className="text-xs text-sidebar-foreground/60 text-center font-body">
              Welcome! As the first admin, let's create your profile.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setup-name" className="text-sidebar-foreground font-body text-sm">
                  Your Name *
                </Label>
                <Input
                  id="setup-name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="e.g. Alex Chen"
                  className="bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-phone" className="text-sidebar-foreground font-body text-sm">
                  Phone Number
                </Label>
                <Input
                  id="setup-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g. +1 555 000 1234"
                  className="bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40"
                />
              </div>
              <Button
                type="submit"
                disabled={isPending || !form.name.trim()}
                className="w-full ember-gradient text-white border-0 font-display font-bold tracking-wider"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Enter Kitchen"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
