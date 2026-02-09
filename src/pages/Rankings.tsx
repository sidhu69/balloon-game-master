import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, ArrowLeft } from "lucide-react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

interface RankingEntry {
  user_id: string;
  username: string;
  total_score: number;
  total_duration_seconds: number;
  rank: number;
}

interface PrizeInfo {
  total_hours: number;
  total_amount: number;
  first_prize: number;
  second_prize: number;
  third_prize: number;
}

type PeriodType = "daily" | "weekly" | "monthly" | "annual";

const Rankings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [prizeInfo, setPrizeInfo] = useState<PrizeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getPeriodDates = (periodType: PeriodType) => {
    const now = new Date();
    switch (periodType) {
      case "daily":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "weekly":
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case "monthly":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "annual":
        return { start: startOfYear(now), end: endOfYear(now) };
    }
  };

  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true);
      const { start, end } = getPeriodDates(period);

      try {
        // Fetch rankings
        const { data: rankingsData, error: rankingsError } = await supabase
          .rpc("get_rankings", {
            period_type: period,
            period_start: start.toISOString(),
            period_end: end.toISOString(),
          });

        if (rankingsError) throw rankingsError;
        setRankings(rankingsData || []);

        // Fetch prize pool
        const { data: prizeData, error: prizeError } = await supabase
          .rpc("calculate_prize_pool", {
            period_type: period,
            period_start: start.toISOString(),
            period_end: end.toISOString(),
          });

        if (prizeError) throw prizeError;
        setPrizeInfo(prizeData?.[0] || null);
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, [period]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground">{rank}</span>;
    }
  };

  const getPrizeForRank = (rank: number): number => {
    if (!prizeInfo) return 0;
    switch (rank) {
      case 1:
        return prizeInfo.first_prize;
      case 2:
        return prizeInfo.second_prize;
      case 3:
        return prizeInfo.third_prize;
      default:
        return 0;
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen sky-gradient p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-display text-2xl font-bold">🏆 Rankings</h1>
        </div>

        <div className="game-panel rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Prize Pool</h2>
          {prizeInfo && prizeInfo.total_hours > 0 ? (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                <div className="text-sm text-muted-foreground">1st</div>
                <div className="font-bold">₹{prizeInfo.first_prize.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-400/20">
                <Medal className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <div className="text-sm text-muted-foreground">2nd</div>
                <div className="font-bold">₹{prizeInfo.second_prize.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-600/20">
                <Award className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                <div className="text-sm text-muted-foreground">3rd</div>
                <div className="font-bold">₹{prizeInfo.third_prize.toFixed(2)}</div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No gameplay yet. Play to build the prize pool!
            </p>
          )}
          {prizeInfo && prizeInfo.total_hours > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Total: {prizeInfo.total_hours.toFixed(1)} hours played = ₹{prizeInfo.total_amount.toFixed(2)} pool
            </p>
          )}
        </div>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">Annual</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="mt-0">
            <div className="game-panel rounded-2xl overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : rankings.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No players yet. Be the first!
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {rankings.slice(0, 10).map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-4 p-4 ${
                        user?.id === entry.user_id ? "bg-primary/10" : ""
                      }`}
                    >
                      <div className="flex-shrink-0">{getRankIcon(entry.rank)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {entry.username}
                          {user?.id === entry.user_id && (
                            <span className="ml-2 text-xs text-primary">(You)</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDuration(entry.total_duration_seconds)} played
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{entry.total_score.toLocaleString()}</div>
                        {entry.rank <= 3 && (
                          <div className="text-xs text-green-500">
                            +₹{getPrizeForRank(entry.rank).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Rankings;
