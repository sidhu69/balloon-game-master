import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BalloonGame from "@/components/BalloonGame";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Play = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionStartRef = useRef<Date>(new Date());
  const lastScoreRef = useRef<number>(0);
  const [showBack, setShowBack] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    sessionStartRef.current = new Date();

    // Save session when leaving
    return () => {
      const duration = Math.floor(
        (Date.now() - sessionStartRef.current.getTime()) / 1000
      );
      
      if (duration > 5 && lastScoreRef.current > 0) {
        // Fire and forget - save the session
        supabase
          .from("game_sessions")
          .insert({
            user_id: user.id,
            score: lastScoreRef.current,
            duration_seconds: duration,
          })
          .then(({ error }) => {
            if (error) console.error("Failed to save session:", error);
          });
      }
    };
  }, [user, navigate]);

  // Listen for score changes from the game
  useEffect(() => {
    const handleScoreUpdate = (e: CustomEvent<{ score: number; isRunning: boolean }>) => {
      lastScoreRef.current = e.detail.score;
      setShowBack(!e.detail.isRunning);
      
      // Save session when game ends
      if (!e.detail.isRunning && e.detail.score > 0 && user) {
        const duration = Math.floor(
          (Date.now() - sessionStartRef.current.getTime()) / 1000
        );
        
        supabase
          .from("game_sessions")
          .insert({
            user_id: user.id,
            score: e.detail.score,
            duration_seconds: duration,
          })
          .then(({ error }) => {
            if (error) console.error("Failed to save session:", error);
            // Reset for next game
            sessionStartRef.current = new Date();
            lastScoreRef.current = 0;
          });
      }
    };

    window.addEventListener("game-state-change" as any, handleScoreUpdate);
    return () => {
      window.removeEventListener("game-state-change" as any, handleScoreUpdate);
    };
  }, [user]);

  return (
    <div className="relative">
      {showBack && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-50 bg-background/80 backdrop-blur"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}
      <BalloonGame />
    </div>
  );
};

export default Play;
