"use client";

import { useEffect, useMemo, useState } from "react";
import { GuildScene } from "@/components/guild-scene";

function formatClock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

export default function Home() {
  const [running, setRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [prompt, setPrompt] = useState("Today's focus: Lock in your highest-value node before noon.");

  useEffect(() => {
    if (!running) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((previous) => previous + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    const websocket = new WebSocket(process.env.NEXT_PUBLIC_GUILD_WS_URL ?? "ws://localhost:5000/ws/guild");

    websocket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as { type?: string; message?: string };
        if (parsed.type === "agent_prompt" && parsed.message) {
          setPrompt(parsed.message);
        }
      } catch {
        // no-op: payload may be heartbeat text
      }
    };

    return () => websocket.close();
  }, []);

  const urgency = useMemo(() => Math.min(elapsedSeconds / 5400, 1), [elapsedSeconds]);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <GuildScene urgency={urgency} />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
        <header className="flex items-start justify-between">
          <div className="pointer-events-auto rounded-xl bg-slate-900/80 p-4 backdrop-blur-sm ring-1 ring-slate-700">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Guild Timeline</p>
            <h1 className="mt-2 text-xl font-semibold">Immersive 3D Goal Corridor</h1>
            <p className="mt-1 text-sm text-slate-300">
              Scroll to travel along the timeline. Click nodes to zoom and inspect milestones.
            </p>
          </div>

          <div className="pointer-events-auto rounded-xl bg-slate-900/85 p-4 text-right backdrop-blur-sm ring-1 ring-slate-700">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Deep Work Stopwatch</p>
            <p className="mt-1 text-3xl font-semibold text-cyan-100">{formatClock(elapsedSeconds)}</p>
            <button
              className="mt-3 rounded-md bg-cyan-500 px-3 py-1 text-sm font-medium text-slate-950 hover:bg-cyan-400"
              onClick={() => setRunning((previous) => !previous)}
            >
              {running ? "Pause Session" : "Start Session"}
            </button>
          </div>
        </header>

        <aside className="pointer-events-auto max-w-md self-end rounded-xl bg-slate-900/90 p-4 backdrop-blur-sm ring-1 ring-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Guild Agent</p>
          <p className="mt-2 text-sm text-slate-200">{prompt}</p>
          <p className="mt-2 text-xs text-slate-400">
            Real-time prompts are streamed over websocket/kafka events.
          </p>
        </aside>
      </div>
    </main>
  );
}
