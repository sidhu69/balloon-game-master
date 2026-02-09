import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Trophy, Lock } from "lucide-react";
import { format, isAfter } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  prize_amount: number;
  ranking_type: string;
  ranking_position: number;
  is_read: boolean;
  created_at: string;
  unlocked_at: string;
}

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user, navigate]);

  const isUnlocked = (unlockedAt: string) => {
    return isAfter(new Date(), new Date(unlockedAt));
  };

  const getRankBadge = (position: number) => {
    const badges = {
      1: { icon: "🥇", color: "text-yellow-500", bg: "bg-yellow-500/20" },
      2: { icon: "🥈", color: "text-gray-400", bg: "bg-gray-400/20" },
      3: { icon: "🥉", color: "text-amber-600", bg: "bg-amber-600/20" },
    };
    return badges[position as keyof typeof badges] || { icon: "🏅", color: "text-primary", bg: "bg-primary/20" };
  };

  const formatRankingType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="min-h-screen sky-gradient p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-display text-2xl font-bold">🔔 Notifications</h1>
        </div>

        <div className="game-panel rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Win a top 3 position in any ranking to receive prize notifications!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const unlocked = isUnlocked(notification.unlocked_at);
                const badge = getRankBadge(notification.ranking_position);

                return (
                  <div
                    key={notification.id}
                    className={`p-4 ${!unlocked ? "opacity-60" : ""} ${
                      !notification.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    {unlocked ? (
                      <>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${badge.bg}`}>
                            <Trophy className={`w-5 h-5 ${badge.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{badge.icon}</span>
                              <h3 className="font-semibold">{notification.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-green-500 font-bold">
                                +₹{notification.prize_amount.toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatRankingType(notification.ranking_type)} Ranking
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 ml-11">
                          {format(new Date(notification.created_at), "PPp")}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">🎁 Prize Notification</p>
                          <p className="text-sm text-muted-foreground">
                            Unlocks at 12:00 AM
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
