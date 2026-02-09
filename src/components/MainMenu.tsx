import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Gamepad2, Trophy, Bell, LogOut } from "lucide-react";

const MainMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const now = new Date().toISOString();
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false)
        .lte("unlocked_at", now);
      
      setUnreadCount(count || 0);
    };

    fetchUnreadCount();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen sky-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="game-panel rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-display text-4xl font-bold mb-2">🎈 Balloon Pop</h1>
            <p className="text-muted-foreground">
              Welcome, <span className="font-semibold text-foreground">{user?.username}</span>!
            </p>
          </div>

          <div className="space-y-4">
            <Button
              className="w-full h-14 text-lg gap-3"
              onClick={() => navigate("/play")}
            >
              <Gamepad2 className="w-6 h-6" />
              Play Game
            </Button>

            <Button
              variant="secondary"
              className="w-full h-14 text-lg gap-3"
              onClick={() => navigate("/rankings")}
            >
              <Trophy className="w-6 h-6" />
              Rankings
            </Button>

            <Button
              variant="secondary"
              className="w-full h-14 text-lg gap-3 relative"
              onClick={() => navigate("/notifications")}
            >
              <Bell className="w-6 h-6" />
              Notifications
              {unreadCount > 0 && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Button>

            <div className="pt-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full gap-2 text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          🎁 Win prizes! Top 3 players in each ranking period win rewards.
        </p>
      </div>
    </div>
  );
};

export default MainMenu;
