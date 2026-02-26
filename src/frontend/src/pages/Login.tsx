import { Leaf, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function Login() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center animate-slide-up">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl ember-gradient flex items-center justify-center shadow-ember">
            <Leaf className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="font-display text-4xl font-black text-sidebar-foreground mb-2 tracking-wide">
          SALAD<span className="text-primary">STATION</span>
        </h1>
        <p className="font-body text-sm text-sidebar-foreground/60 mb-10">
          Salad Bar Management System
        </p>

        <div className="bg-sidebar-accent rounded-xl p-6 border border-sidebar-border">
          <h2 className="font-display text-xl font-bold text-sidebar-foreground mb-2">
            Admin Access
          </h2>
          <p className="font-body text-sm text-sidebar-foreground/60 mb-5">
            Sign in to manage your salad bar — menu, orders, inventory, and analytics.
          </p>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="w-full ember-gradient text-white border-0 font-display text-sm font-bold tracking-wider py-5"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </div>

        <p className="text-xs text-sidebar-foreground/40 mt-6 font-body">
          © 2026. Built with ❤️ using{" "}
          <a
            href="https://caffeine.ai"
            className="underline hover:text-sidebar-foreground/70 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
