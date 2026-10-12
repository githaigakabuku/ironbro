"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, Html, ScrollControls, useScroll } from "@react-three/drei";
import { a, useSpring } from "@react-spring/three";
import { Vector3 } from "three";

type WeeklyAssessment = {
  id: string;
  label: string;
};

type GoalNode = {
  id: string;
  month: string;
  title: string;
  photoUrl: string;
  milestoneLabel: string;
  milestoneTarget: number;
  milestoneProgress: number;
  position: [number, number, number];
  weekly: WeeklyAssessment[];
};

const GOALS: GoalNode[] = [
  {
    id: "goal-oct",
    month: "October",
    title: "Client Revenue Sprint",
    photoUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=960&q=80",
    milestoneLabel: "Financial Milestone",
    milestoneTarget: 50000,
    milestoneProgress: 36000,
    position: [0, 0.3, 0],
    weekly: [
      { id: "oct-w1", label: "Week 1" },
      { id: "oct-w2", label: "Week 2" },
      { id: "oct-w3", label: "Week 3" },
      { id: "oct-w4", label: "Week 4" },
    ],
  },
  {
    id: "goal-nov",
    month: "November",
    title: "Product Shipping",
    photoUrl:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=960&q=80",
    milestoneLabel: "Launch Milestone",
    milestoneTarget: 100,
    milestoneProgress: 42,
    position: [1.7, -0.1, -16],
    weekly: [
      { id: "nov-w1", label: "Week 1" },
      { id: "nov-w2", label: "Week 2" },
      { id: "nov-w3", label: "Week 3" },
      { id: "nov-w4", label: "Week 4" },
    ],
  },
  {
    id: "goal-dec",
    month: "December",
    title: "Wellness Consistency",
    photoUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=960&q=80",
    milestoneLabel: "Habit Milestone",
    milestoneTarget: 30,
    milestoneProgress: 21,
    position: [-1.5, 0.2, -32],
    weekly: [
      { id: "dec-w1", label: "Week 1" },
      { id: "dec-w2", label: "Week 2" },
      { id: "dec-w3", label: "Week 3" },
      { id: "dec-w4", label: "Week 4" },
    ],
  },
];

function WeeklyNode({
  index,
  item,
  parentId,
}: {
  index: number;
  item: WeeklyAssessment;
  parentId: string;
}) {
  const [hovered, setHovered] = useState(false);
  const angle = (Math.PI * 2 * index) / 4;
  const orbitRadius = 0.9;
  const x = Math.cos(angle) * orbitRadius;
  const z = Math.sin(angle) * orbitRadius;
  const spring = useSpring({ scale: hovered ? 1.4 : 1, config: { tension: 250, friction: 16 } });

  return (
    <a.group position={[x, 0.35, z]} scale={spring.scale as unknown as number}>
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <icosahedronGeometry args={[0.12, 1]} />
        <meshStandardMaterial color={hovered ? "#67e8f9" : "#d4d4d8"} />
      </mesh>
      {hovered ? (
        <Html distanceFactor={8} center>
          <div className="w-48 rounded-lg border border-cyan-200/40 bg-zinc-950/90 p-3 text-xs text-cyan-50 shadow-xl">
            <p className="mb-2 font-semibold">{item.label} · {parentId}</p>
            <textarea
              className="h-20 w-full resize-none rounded bg-zinc-900 p-2 text-[11px] text-zinc-100 outline-none ring-1 ring-zinc-700"
              placeholder="Weekly assessment check-in..."
            />
          </div>
        </Html>
      ) : null}
    </a.group>
  );
}

function GoalObject({
  goal,
  selected,
  onSelect,
}: {
  goal: GoalNode;
  selected: boolean;
  onSelect: (goal: GoalNode) => void;
}) {
  const completion = Math.min(goal.milestoneProgress / goal.milestoneTarget, 1);

  return (
    <group position={goal.position}>
      <mesh onClick={() => onSelect(goal)}>
        <boxGeometry args={[1.3, 1.8, 0.2]} />
        <meshStandardMaterial color={selected ? "#22d3ee" : "#60a5fa"} />
      </mesh>
      <Html position={[0, 1.4, 0]} center>
        <div className="w-60 rounded-xl bg-zinc-950/90 p-3 text-xs text-zinc-100 shadow-lg ring-1 ring-zinc-700">
          <p className="font-semibold">{goal.month}: {goal.title}</p>
          <p className="mt-1 text-zinc-300">{goal.milestoneLabel}: Ksh {goal.milestoneTarget.toLocaleString()}</p>
          <div className="mt-2 h-2 rounded bg-zinc-800">
            <div
              className="h-2 rounded bg-cyan-400"
              style={{ width: `${Math.round(completion * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Progress: Ksh {goal.milestoneProgress.toLocaleString()}
          </p>
        </div>
      </Html>
      {goal.weekly.map((week, index) => (
        <WeeklyNode key={week.id} index={index} item={week} parentId={goal.month} />
      ))}
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.2, 24]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

function TimelineContent({
  urgency,
  selectedGoal,
  onSelectGoal,
}: {
  urgency: number;
  selectedGoal: GoalNode | null;
  onSelectGoal: (goal: GoalNode) => void;
}) {
  const scroll = useScroll();
  const controlsRef = useRef<CameraControls>(null);
  const [target, setTarget] = useState<Vector3 | null>(null);

  useFrame((state) => {
    const z = -scroll.offset * 80;
    state.camera.position.z = z + 8;
    state.camera.position.y = 1 + Math.sin(scroll.offset * Math.PI) * 0.2;

    if (target) {
      controlsRef.current?.setLookAt(
        state.camera.position.x,
        state.camera.position.y,
        state.camera.position.z,
        target.x,
        target.y,
        target.z,
        true,
      );
    }
  });

  const lightColor = useMemo(() => {
    const hour = new Date().getHours();
    if (urgency > 0.8) {
      return "#fb7185";
    }
    if (hour >= 18 || hour < 6) {
      return "#818cf8";
    }
    return "#67e8f9";
  }, [urgency]);

  return (
    <>
      <ambientLight intensity={0.5} color={lightColor} />
      <directionalLight intensity={1.1} position={[3, 8, 5]} color={lightColor} />
      <CameraControls ref={controlsRef} smoothTime={0.4} />
      <group>
        {GOALS.map((goal) => (
          <GoalObject
            key={goal.id}
            goal={goal}
            selected={goal.id === selectedGoal?.id}
            onSelect={(nextGoal) => {
              onSelectGoal(nextGoal);
              setTarget(new Vector3(...nextGoal.position));
            }}
          />
        ))}
      </group>
    </>
  );
}

export function GuildScene({ urgency }: { urgency: number }) {
  const [selectedGoal, setSelectedGoal] = useState<GoalNode | null>(null);

  return (
    <Canvas camera={{ position: [0, 1, 8], fov: 58 }} className="h-full w-full">
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 18, 84]} />
      <ScrollControls pages={8} damping={0.12} infinite>
        <TimelineContent
          urgency={urgency}
          selectedGoal={selectedGoal}
          onSelectGoal={setSelectedGoal}
        />
      </ScrollControls>
    </Canvas>
  );
}
