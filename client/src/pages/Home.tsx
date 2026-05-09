/**
 * MindWork Interactive Prototype
 * Design: Morandi Minimalism — 莫兰迪极简主义
 * Color: Low-saturation sage green + warm neutrals + grain texture
 * Layout: Desktop wrapper with centered phone frame
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen =
  | "onboard-1"
  | "onboard-2"
  | "onboard-3"
  | "onboard-4"
  | "onboard-5"
  | "home"
  | "home-empty"
  | "checkin"
  | "checkin-done"
  | "checkin-done-low"
  | "ai-chat"
  | "journal"
  | "journal-add"
  | "stats"
  | "stats-unlocked"
  | "capsule-record"
  | "capsule-view"
  | "meds"
  | "report"
  | "subscribe"
  | "paywall-analysis"
  | "paywall-ai"
  | "paywall-capsule"
  | "crisis"
  | "more"
  | "notifications"
  | "theme"
  | "export"
  | "logout-confirm"
  | "journal-detail"
  | "ai-persona";

type NavTab = "checkin" | "ai" | "journal" | "stats" | "more";
type JournalEntry = {
  id: string;
  time: string;
  moodIdx: number;
  tags: string[];
  note: string;
  cbtTriggered?: boolean;
  cbtCard?: string;
  cbtFeedback?: "helpful" | "not-helpful" | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const MOOD_COLORS = [
  { label: "很糟", color: "oklch(0.55 0.060 260)", bg: "#7B8EC8", score: 1 },
  { label: "低落", color: "oklch(0.62 0.045 240)", bg: "#8FA8C0", score: 2 },
  { label: "疲惫", color: "oklch(0.70 0.030 200)", bg: "#8FBDBC", score: 3 },
  { label: "平静", color: "oklch(0.78 0.038 155)", bg: "#8BB8A0", score: 4 },
  { label: "还好", color: "oklch(0.82 0.045 130)", bg: "#9EC49A", score: 5 },
  { label: "不错", color: "oklch(0.80 0.055 90)", bg: "#BFCA8A", score: 6 },
  { label: "很好", color: "oklch(0.78 0.060 75)", bg: "#D4C47A", score: 7 },
];
// Full-screen mood data: each mood has its own bg gradient, icon, and description
const MOOD_SCREENS = [
  {
    label: "很糟", score: 1,
    bg: "linear-gradient(160deg, #6B7DB8 0%, #5A6AA8 50%, #4A5898 100%)",
    icon: "😞",
    desc: "今天很难熬",
    textColor: "rgba(255,255,255,0.95)",
    subColor: "rgba(255,255,255,0.7)",
  },
  {
    label: "低落", score: 2,
    bg: "linear-gradient(160deg, #7F98B0 0%, #6E88A0 50%, #5D7890 100%)",
    icon: "😔",
    desc: "有点提不起劲",
    textColor: "rgba(255,255,255,0.95)",
    subColor: "rgba(255,255,255,0.7)",
  },
  {
    label: "疲惫", score: 3,
    bg: "linear-gradient(160deg, #7FADAC 0%, #6E9C9B 50%, #5D8B8A 100%)",
    icon: "😮‍💨",
    desc: "身心都有些累",
    textColor: "rgba(255,255,255,0.95)",
    subColor: "rgba(255,255,255,0.7)",
  },
  {
    label: "平静", score: 4,
    bg: "linear-gradient(160deg, #7BA890 0%, #6A9780 50%, #598670 100%)",
    icon: "😌",
    desc: "还好，平平淡淡",
    textColor: "rgba(255,255,255,0.95)",
    subColor: "rgba(255,255,255,0.7)",
  },
  {
    label: "还好", score: 5,
    bg: "linear-gradient(160deg, #8EB48A 0%, #7DA37A 50%, #6C926A 100%)",
    icon: "🙂",
    desc: "感觉还不错",
    textColor: "rgba(255,255,255,0.95)",
    subColor: "rgba(255,255,255,0.7)",
  },
  {
    label: "不错", score: 6,
    bg: "linear-gradient(160deg, #AFBA7A 0%, #9EA96A 50%, #8D985A 100%)",
    icon: "😊",
    desc: "心情挺好的",
    textColor: "rgba(255,255,255,0.95)",
    subColor: "rgba(255,255,255,0.7)",
  },
  {
    label: "很好", score: 7,
    bg: "linear-gradient(160deg, #C4B46A 0%, #B3A35A 50%, #A2924A 100%)",
    icon: "😄",
    desc: "今天状态很棒！",
    textColor: "rgba(255,255,255,0.95)",
    subColor: "rgba(255,255,255,0.7)",
  },
];


const SCENE_TAGS = [
  "💼 汇报", "🌙 熬夜", "☕ 咖啡因", "👥 沟通", "📋 截止日", "🏠 居家",
  "🚇 通勤", "🍱 饮食", "🏃 运动", "😴 睡眠", "👨‍👩‍👧 家人", "🎵 音乐",
];

const PIXEL_DATA = (() => {
  const scores = [4,5,3,6,4,2,3,5,6,7,5,4,3,2,4,5,6,5,4,3,5,6,4,5,3,4,5,6,7,5];
  return scores.map(s => MOOD_COLORS[s - 1]);
})();

const CHAT_MESSAGES = [
  { role: "ai", text: "你好，今天感觉怎么样？有什么想聊的吗？" },
  { role: "user", text: "最近工作压力很大，总感觉做什么都提不起劲" },
  { role: "ai", text: "听起来你正在经历一种持续的疲惫感，这种感觉很真实。能跟我说说，是哪方面的工作让你觉得最沉重吗？" },
  { role: "user", text: "项目一直在改需求，感觉永远做不完" },
  { role: "ai", text: "需求不断变动确实会让人产生一种「努力也没用」的无力感。这种感受在你心里，更多像是疲惫，还是有点愤怒？" },
];

// ─── Grain SVG (inline, reusable) ────────────────────────────────────────────
// CBT intervention cards (防疲劳内容库)
const CBT_CARDS = [
  {
    type: "全有全无思维",
    trigger: "今天搞砸了",
    thought: "我把一切都搞砸了",
    reframe: "这次出了问题，但我今天也做对了很多事。一件事不顺，不代表全部失败。",
    action: "写下今天做得还不错的 3 件事，哪怕很小。",
  },
  {
    type: "灾难化思维",
    trigger: "被批评",
    thought: "这下完了，大家都会觉得我不行",
    reframe: "被指出问题是正常的，这不代表别人对我整个人的评价。大多数人关注自己的事情多于关注我。",
    action: "想一想：最坏的情况真的会发生吗？概率有多大？",
  },
  {
    type: "情绪化推理",
    trigger: "感到焦虑",
    thought: "我感到很焦虑，所以一定有什么不好的事要发生",
    reframe: "感受不等于事实。焦虑是身体的警报，但警报有时会误报。",
    action: "做 4-7-8 呼吸：吸气 4 秒，屏息 7 秒，呼气 8 秒，重复 3 次。",
  },
  {
    type: "应该化思维",
    trigger: "自责",
    thought: "我应该更努力，我不应该这么累",
    reframe: "你已经在尽力了。疲惫不是懒惰，是身体在说它需要休息。",
    action: "如果是你的朋友说这句话，你会怎么回应他？用同样的话对自己说。",
  },
  {
    type: "心理过滤",
    trigger: "只看到负面",
    thought: "今天只有坏事发生",
    reframe: "当我们情绪低落时，大脑会自动过滤掉好的信息。这是认知偏差，不是现实。",
    action: "强制找出今天 1 件中性或积极的事，哪怕是\u201c今天天气不错\u201d。",
  },
];

// Medication reminder data
const MEDS_DATA: Array<{ id: number; name: string; dose: string; times: string[]; days: string; stock: number; note: string; active: boolean }> = [];


function GrainOverlay({ opacity = 0.45 }: { opacity?: number }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity, mixBlendMode: "overlay", zIndex: 1 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="grain-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-filter)" />
    </svg>
  );
}

// ─── Frosted Glass Paywall Overlay ────────────────────────────────────────────
function FrostedPaywall({ title, desc, features, onSubscribe }: {
  title: string;
  desc: string;
  features: string[];
  onSubscribe: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-8"
      style={{ backdropFilter: "blur(18px) saturate(1.2)", WebkitBackdropFilter: "blur(18px) saturate(1.2)", background: "oklch(0.96 0.012 155 / 0.55)" }}>
      <GrainOverlay opacity={0.25} />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="relative z-10 mx-4 rounded-3xl overflow-hidden w-full max-w-xs"
        style={{ background: "oklch(0.98 0.010 155 / 0.92)", border: "1px solid oklch(0.80 0.030 148 / 0.5)", boxShadow: "0 8px 40px oklch(0.35 0.040 148 / 0.18)" }}
      >
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, oklch(0.55 0.080 148), oklch(0.65 0.060 155), oklch(0.55 0.080 148))" }} />
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">✨</span>
            <p className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>{title}</p>
          </div>
          <p className="text-xs leading-relaxed mb-4" style={{ color: "oklch(0.50 0.025 148)" }}>{desc}</p>
          <div className="flex flex-col gap-1.5 mb-5">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "oklch(0.88 0.045 148)" }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="oklch(0.35 0.060 148)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-xs" style={{ color: "oklch(0.38 0.028 148)" }}>{f}</span>
              </div>
            ))}
          </div>
          <motion.button
            onClick={onSubscribe}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, oklch(0.42 0.080 148), oklch(0.52 0.065 155))", color: "oklch(0.97 0.008 148)" }}
          >
            解锁完整版 · 14天免费试用
          </motion.button>
          <p className="text-center text-[10px] mt-2" style={{ color: "oklch(0.62 0.020 148)" }}>
            之后 ¥68/月 或 ¥398/年 · 随时取消
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── StatusBar ────────────────────────────────────────────────────────────────
function StatusBar({ light = false }: { light?: boolean }) {
  const color = light ? "text-white/80" : "text-[oklch(0.30_0.020_148)]";
  return (
    <div className={`status-bar flex-shrink-0 ${color}`}>
      <span className="font-semibold">9:41</span>
      <div className="flex items-center gap-1.5">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <rect x="0" y="4" width="3" height="8" rx="0.5" opacity="0.4"/>
          <rect x="4.5" y="2.5" width="3" height="9.5" rx="0.5" opacity="0.6"/>
          <rect x="9" y="0.5" width="3" height="11.5" rx="0.5"/>
          <rect x="13.5" y="3" width="2" height="6" rx="0.5" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          <rect x="14" y="4.5" width="1" height="3" rx="0.2"/>
        </svg>
        <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor">
          <path d="M7.5 2.5C9.8 2.5 11.8 3.5 13.2 5L14.5 3.7C12.7 1.9 10.2 0.8 7.5 0.8C4.8 0.8 2.3 1.9 0.5 3.7L1.8 5C3.2 3.5 5.2 2.5 7.5 2.5Z" opacity="0.4"/>
          <path d="M7.5 5C9 5 10.4 5.6 11.4 6.6L12.7 5.3C11.3 3.9 9.5 3 7.5 3C5.5 3 3.7 3.9 2.3 5.3L3.6 6.6C4.6 5.6 6 5 7.5 5Z" opacity="0.7"/>
          <path d="M7.5 7.5C8.4 7.5 9.2 7.9 9.8 8.5L11.1 7.2C10.1 6.2 8.9 5.5 7.5 5.5C6.1 5.5 4.9 6.2 3.9 7.2L5.2 8.5C5.8 7.9 6.6 7.5 7.5 7.5Z"/>
          <circle cx="7.5" cy="10.5" r="1.5"/>
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.35"/>
          <rect x="2" y="2" width="17" height="8" rx="2"/>
          <path d="M23 4v4a2 2 0 0 0 0-4z" opacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

// ─── BottomNav ─────────────────────────────────────────────────────────────────
function BottomNav({ active, onNav }: { active: NavTab; onNav: (t: NavTab) => void }) {
  const items: { id: NavTab; label: string; icon: string }[] = [
    { id: "checkin", label: "打卡", icon: "🎨" },
    { id: "ai", label: "树洞", icon: "💬" },
    { id: "journal", label: "日记", icon: "📖" },
    { id: "stats", label: "统计", icon: "📊" },
    { id: "more", label: "更多", icon: "⋯" },
  ];
  return (
    <div className="bottom-nav">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onNav(item.id)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
          style={{
            color: active === item.id ? "oklch(0.42 0.055 150)" : "oklch(0.55 0.025 148)",
            fontWeight: active === item.id ? 600 : 400,
          }}
        >
          <span className="text-xl leading-none">{item.icon}</span>
          <span className="text-[10px]">{item.label}</span>
          {active === item.id && (
            <motion.div
              layoutId="nav-dot"
              className="w-1 h-1 rounded-full mt-0.5"
              style={{ background: "oklch(0.42 0.055 150)" }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Screen Components ────────────────────────────────────────────────────────

function OnboardScreen1({ onNext }: { onNext: () => void }) {
  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "linear-gradient(160deg, oklch(0.92 0.030 158) 0%, oklch(0.86 0.038 148) 50%, oklch(0.80 0.032 140) 100%)" }}>
      <GrainOverlay opacity={0.5} />
      <StatusBar />
      <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-8 pb-16">
        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12"
        >
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: "oklch(0.99 0.008 155 / 0.5)", backdropFilter: "blur(12px)", border: "1px solid oklch(0.88 0.025 152 / 0.6)" }}>
            <span className="text-4xl">🌿</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="text-center mb-16"
        >
          <h1 className="text-3xl font-light mb-4 leading-snug"
            style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>
            有些感受，<br />说不清楚，<br />但它就在那里。
          </h1>
          <p className="text-sm font-light leading-relaxed"
            style={{ color: "oklch(0.40 0.025 148)" }}>
            这里是你的情绪空间，<br />随时都可以来。
          </p>
        </motion.div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          onClick={onNext}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-base font-medium"
          style={{
            background: "oklch(0.42 0.055 150)",
            color: "oklch(0.97 0.010 155)",
            boxShadow: "0 8px 24px oklch(0.42 0.055 150 / 0.35)",
          }}
        >
          开始
        </motion.button>

        <p className="mt-4 text-xs" style={{ color: "oklch(0.55 0.020 148)" }}>
          MindWork · 你的情绪陪伴助手
        </p>
      </div>
    </div>
  );
}

function OnboardScreen2({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const goals = [
    { icon: "📊", text: "了解自己的情绪规律" },
    { icon: "💬", text: "有个地方可以说说心里话" },
    { icon: "🧠", text: "学会应对负面想法" },
    { icon: "💊", text: "管理用药和就诊记录" },
    { icon: "🔍", text: "先看看，还没想好" },
  ];
  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "linear-gradient(160deg, oklch(0.95 0.018 155) 0%, oklch(0.91 0.028 150) 100%)" }}>
      <GrainOverlay opacity={0.4} />
      <StatusBar />
      <div className="relative z-10 flex flex-col flex-1 px-6 pt-6 pb-8">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="h-1 flex-1 rounded-full"
              style={{ background: i <= 1 ? "oklch(0.42 0.055 150)" : "oklch(0.85 0.020 152)" }} />
          ))}
        </div>

        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <p className="text-xs font-medium mb-1" style={{ color: "oklch(0.52 0.035 148)" }}>告诉我们</p>
          <h2 className="text-2xl font-semibold mb-2 leading-snug"
            style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>
            你来这里，<br />最想要的是……
          </h2>
        </motion.div>

        <div className="flex flex-col gap-3 mt-6 flex-1">
          {goals.map((g, i) => (
            <motion.button
              key={i}
              initial={{ x: -16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              onClick={() => setSelected(i)}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all"
              style={{
                background: selected === i
                  ? "oklch(0.42 0.055 150 / 0.12)"
                  : "oklch(0.99 0.006 155 / 0.7)",
                border: `1.5px solid ${selected === i ? "oklch(0.42 0.055 150 / 0.6)" : "oklch(0.88 0.020 152 / 0.5)"}`,
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="text-xl">{g.icon}</span>
              <span className="text-sm font-medium" style={{ color: selected === i ? "oklch(0.32 0.045 148)" : "oklch(0.35 0.020 148)" }}>
                {g.text}
              </span>
              {selected === i && (
                <motion.div layoutId="check" className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(0.42 0.055 150)" }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        <motion.button
          onClick={onNext}
          disabled={selected === null}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-base font-medium mt-4 transition-all"
          style={{
            background: selected !== null ? "oklch(0.42 0.055 150)" : "oklch(0.82 0.020 152)",
            color: "oklch(0.97 0.010 155)",
          }}
        >
          继续
        </motion.button>
      </div>
    </div>
  );
}

function OnboardScreen3({ onNext }: { onNext: () => void }) {
  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "linear-gradient(160deg, oklch(0.95 0.018 155) 0%, oklch(0.91 0.028 150) 100%)" }}>
      <GrainOverlay opacity={0.4} />
      <StatusBar />
      <div className="relative z-10 flex flex-col flex-1 px-6 pt-6 pb-8">
        <div className="flex gap-1.5 mb-8">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="h-1 flex-1 rounded-full"
              style={{ background: i <= 2 ? "oklch(0.42 0.055 150)" : "oklch(0.85 0.020 152)" }} />
          ))}
        </div>

        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "oklch(0.42 0.055 150 / 0.12)", border: "1px solid oklch(0.42 0.055 150 / 0.3)" }}>
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-2xl font-semibold mb-4 leading-snug"
            style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>
            关于你的数据，<br />我们想说清楚
          </h2>
        </motion.div>

        <div className="flex flex-col gap-3 flex-1">
          {[
            { icon: "📱", text: "你的所有记录仅存储在你的设备上" },
            { icon: "🚫", text: "我们不会读取你的内容，也不会出售数据" },
            { icon: "🔐", text: "AI 对话在加密通道中进行，不用于训练模型" },
            { icon: "🗑️", text: "你可以随时一键删除所有数据" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ x: -16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: "oklch(0.99 0.006 155 / 0.7)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}
            >
              <span className="text-lg mt-0.5">{item.icon}</span>
              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.32 0.020 148)" }}>{item.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={onNext}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-base font-medium mt-6"
          style={{ background: "oklch(0.42 0.055 150)", color: "oklch(0.97 0.010 155)" }}
        >
          我明白了，继续
        </motion.button>
      </div>
    </div>
  );
}

function FullScreenMoodPicker({ onSelect, title = "现在，你感觉怎么样？", subtitle = "左右滑动选择" }: { onSelect: (i: number) => void; title?: string; subtitle?: string }) {
  const [current, setCurrent] = useState(3);
  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -40 && current < MOOD_SCREENS.length - 1) setCurrent(c => c + 1);
    else if (info.offset.x > 40 && current > 0) setCurrent(c => c - 1);
  };
  const mood = MOOD_SCREENS[current];
  return (
    <motion.div
      className="relative flex flex-col h-full overflow-hidden"
      animate={{ background: mood.bg }}
      transition={{ duration: 0.5 }}
    >
      <GrainOverlay opacity={0.4} />
      <StatusBar light />
      <div className="relative z-10 flex flex-col flex-1 items-center justify-between pb-10 px-6 pt-4">
        <motion.div className="text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-xl font-semibold mb-1" style={{ color: mood.textColor, fontFamily: "'Noto Serif SC', serif" }}>{title}</h2>
          <p className="text-sm" style={{ color: mood.subColor }}>{subtitle}</p>
        </motion.div>
        <motion.div
          key={current}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="flex flex-col items-center gap-6 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: "pan-y" }}
        >
          <div className="text-[96px] leading-none" style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.2))" }}>
            {mood.icon}
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold mb-2" style={{ color: mood.textColor, fontFamily: "'Noto Serif SC', serif" }}>{mood.label}</p>
            <p className="text-base" style={{ color: mood.subColor }}>{mood.desc}</p>
          </div>
        </motion.div>
        <div className="flex flex-col items-center gap-5 w-full">
          <div className="flex gap-2 items-center">
            {MOOD_SCREENS.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setCurrent(i)}
                animate={{ scale: current === i ? 1.4 : 1, opacity: current === i ? 1 : 0.45 }}
                className="rounded-full"
                style={{ width: current === i ? 10 : 7, height: current === i ? 10 : 7, background: "rgba(255,255,255,0.9)" }}
              />
            ))}
          </div>
          <motion.button
            onClick={() => onSelect(current)}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl text-base font-semibold"
            style={{ background: "rgba(255,255,255,0.25)", color: mood.textColor, border: "1.5px solid rgba(255,255,255,0.5)", backdropFilter: "blur(8px)" }}
          >
            就是这个感觉
          </motion.button>
          <div className="flex items-center gap-3" style={{ color: mood.subColor }}>
            <button onClick={() => setCurrent(c => Math.max(0, c - 1))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6L8 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className="text-xs">← 滑动切换 →</span>
            <button onClick={() => setCurrent(c => Math.min(MOOD_SCREENS.length - 1, c + 1))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2L8 6L4 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
function OnboardScreen4({ onNext }: { onNext: (moodIdx: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const handleSelect = (i: number) => {
    setSelected(i);
    setTimeout(() => setDone(true), 400);
  };
  const selectedMoodIdx = selected;
  if (done && selected !== null) {
    const mood = MOOD_SCREENS[selected];
    return (
      <motion.div
        className="relative flex flex-col h-full overflow-hidden items-center justify-center"
        animate={{ background: mood.bg }}
        initial={{ background: mood.bg }}
      >
        <GrainOverlay opacity={0.45} />
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="relative z-10 flex flex-col items-center gap-5 px-8"
        >
          <div className="text-7xl">{mood.icon}</div>
          <p className="text-2xl font-semibold text-center" style={{ color: mood.textColor, fontFamily: "'Noto Serif SC', serif" }}>
            记录下来了
          </p>
          <p className="text-sm text-center leading-relaxed" style={{ color: mood.subColor }}>
            每一次打卡，都是对自己的一点关注。
          </p>
          <motion.button
            onClick={() => onNext(selectedMoodIdx ?? 3)}
            whileTap={{ scale: 0.97 }}
            className="mt-4 px-10 py-4 rounded-2xl text-base font-semibold"
            style={{ background: "rgba(255,255,255,0.25)", color: mood.textColor, border: "1.5px solid rgba(255,255,255,0.5)", backdropFilter: "blur(8px)" }}
          >
            继续
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <FullScreenMoodPicker onSelect={handleSelect} title="现在，你感觉怎么样？" subtitle="左右滑动 · 选择你的心情" />
      {/* Progress overlay */}
      <div className="absolute top-12 left-6 right-6 z-50 flex gap-1.5">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full"
            style={{ background: i <= 3 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }} />
        ))}
      </div>
    </div>
  );
}

function OnboardScreen5({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customHour, setCustomHour] = useState(8);
  const [customMinute, setCustomMinute] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const getTimeLabel = () => {
    if (selected === "morning") return "早上 9:00";
    if (selected === "evening") return "晚上 9:00";
    if (selected === "custom") return `${customHour.toString().padStart(2, "0")}:${customMinute.toString().padStart(2, "0")}`;
    return "";
  };
  const handleSelect = (id: string) => {
    setSelected(id);
    if (id === "custom") setShowTimePicker(true);
    else setShowTimePicker(false);
  };
  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(onNext, 1200);
  };
  if (confirmed) {
    return (
      <div className="relative flex flex-col h-full overflow-hidden items-center justify-center"
        style={{ background: "linear-gradient(160deg, oklch(0.92 0.030 158) 0%, oklch(0.86 0.038 148) 100%)" }}>
        <GrainOverlay opacity={0.45} />
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="relative z-10 flex flex-col items-center gap-4">
          <div className="text-6xl">🔔</div>
          <p className="text-xl font-semibold" style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>提醒已设置</p>
          <p className="text-sm" style={{ color: "oklch(0.42 0.025 148)" }}>每天 {getTimeLabel()} 提醒你打卡</p>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "linear-gradient(160deg, oklch(0.95 0.018 155) 0%, oklch(0.91 0.028 150) 100%)" }}>
      <GrainOverlay opacity={0.4} />
      <StatusBar />
      <div className="relative z-10 flex flex-col flex-1 px-6 pt-6 pb-8">
        <div className="flex gap-1.5 mb-8">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="h-1 flex-1 rounded-full"
              style={{ background: "oklch(0.42 0.055 150)" }} />
          ))}
        </div>
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h2 className="text-2xl font-semibold mb-2"
            style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>
            要不要让我<br />每天提醒你一下？
          </h2>
          <p className="text-sm mb-6" style={{ color: "oklch(0.52 0.025 148)" }}>
            养成记录习惯，更容易发现情绪规律
          </p>
        </motion.div>
        <div className="flex flex-col gap-3">
          {[
            { id: "morning", icon: "🌅", label: "早上 9:00", sub: "开始新的一天前，记录一下" },
            { id: "evening", icon: "🌙", label: "晚上 9:00", sub: "睡前回顾，沉淀今天的感受" },
            { id: "custom", icon: "⚙️", label: "自定义时间", sub: "选择最适合你的时刻" },
          ].map((item) => (
            <motion.button
              key={item.id}
              initial={{ x: -16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={() => handleSelect(item.id)}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 px-4 py-4 rounded-2xl text-left"
              style={{
                background: selected === item.id ? "oklch(0.42 0.055 150 / 0.12)" : "oklch(0.99 0.006 155 / 0.7)",
                border: `1.5px solid ${selected === item.id ? "oklch(0.42 0.055 150 / 0.6)" : "oklch(0.88 0.020 152 / 0.5)"}`,
              }}
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "oklch(0.25 0.025 148)" }}>
                  {item.id === "custom" && selected === "custom" ? getTimeLabel() : item.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.020 148)" }}>{item.sub}</p>
              </div>
              {selected === item.id && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "oklch(0.42 0.055 150)" }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </motion.button>
          ))}
        </div>
        <AnimatePresence>
          {showTimePicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3"
            >
              <div className="p-4 rounded-2xl" style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
                <p className="text-xs font-medium mb-3" style={{ color: "oklch(0.42 0.025 148)" }}>选择提醒时间</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => setCustomHour(h => (h + 1) % 24)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 8L6 4L10 8" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <div className="w-14 h-12 rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: "oklch(0.42 0.055 150 / 0.12)", color: "oklch(0.25 0.025 148)" }}>
                      {customHour.toString().padStart(2, "0")}
                    </div>
                    <button onClick={() => setCustomHour(h => (h - 1 + 24) % 24)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: "oklch(0.35 0.025 148)" }}>:</span>
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => setCustomMinute(m => (m + 5) % 60)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 8L6 4L10 8" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <div className="w-14 h-12 rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: "oklch(0.42 0.055 150 / 0.12)", color: "oklch(0.25 0.025 148)" }}>
                      {customMinute.toString().padStart(2, "0")}
                    </div>
                    <button onClick={() => setCustomMinute(m => (m - 5 + 60) % 60)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-col gap-2 mt-auto pt-4">
          <motion.button
            onClick={handleConfirm}
            disabled={!selected}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl text-base font-medium"
            style={{
              background: selected ? "oklch(0.42 0.055 150)" : "oklch(0.82 0.020 152)",
              color: "oklch(0.97 0.010 155)",
            }}
          >
            {selected ? `设置提醒 · ${getTimeLabel()}` : "设置提醒"}
          </motion.button>
          <button onClick={onNext} className="text-sm py-2" style={{ color: "oklch(0.55 0.025 148)" }}>
            暂时跳过
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ onNav, onPaywall, forceEmpty = false, isPaid = false, todayMoodIdx = null, weekMoods = [null,null,null,null,null,null,null], medsEnabled = true, consecutiveLowDays = 0 }: { onNav: (s: Screen) => void; onPaywall: (s: Screen) => void; forceEmpty?: boolean; isPaid?: boolean; todayMoodIdx?: number | null; weekMoods?: (number | null)[]; medsEnabled?: boolean; consecutiveLowDays?: number }) {
  const todayMood = todayMoodIdx !== null ? MOOD_SCREENS[todayMoodIdx] : null;
  const weekDays = ["一","二","三","四","五","六","日"];
  const _todayRaw = new Date().getDay(); // 0=Sun
  const todayDayIdx = _todayRaw === 0 ? 6 : _todayRaw - 1; // Mon=0...Sun=6

  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: todayMood ? `linear-gradient(160deg, ${todayMood.bg} 0%, oklch(0.93 0.018 155) 60%)` : "linear-gradient(160deg, oklch(0.93 0.025 158) 0%, oklch(0.88 0.030 148) 100%)" }}>
      <GrainOverlay opacity={0.4} />
      <StatusBar />
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto pb-24 px-5 pt-2">

        {/* App title */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xl font-bold" style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>MindWork</p>
            <p className="text-xs" style={{ color: "oklch(0.52 0.022 148)" }}>
              {new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}
            </p>
          </div>
          <button onClick={() => onNav("ai-chat")}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.99 0.008 155 / 0.5)", backdropFilter: "blur(8px)", border: "1px solid oklch(0.88 0.025 152 / 0.5)" }}>
            <span className="text-lg">💬</span>
          </button>
        </div>

        {/* Crisis banner — only shown after 3+ consecutive low days */}
        {!forceEmpty && consecutiveLowDays >= 3 && todayMoodIdx !== null && todayMoodIdx <= 1 && (
          <motion.button
            initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            onClick={() => onNav("crisis")}
            className="w-full mb-4 p-3 rounded-2xl text-left flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, oklch(0.72 0.048 220) 0%, oklch(0.62 0.055 205) 100%)", border: "none" }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-xl flex-shrink-0">🫂</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.95)" }}>你今天很不容易</p>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>点击查看支持资源和求助热线</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
              <path d="M5 3L9 7L5 11" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        )}

        {/* Today's mood / checkin card */}
        {todayMood && !forceEmpty ? (
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative rounded-3xl mb-4 overflow-hidden grain"
            style={{ background: todayMood.bg, minHeight: 180 }}
          >
            <GrainOverlay opacity={0.25} />
            {/* Subtle radial glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.18) 0%, transparent 65%)" }} />
            <div className="relative z-10 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>今天的心情</p>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => onNav("checkin")}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{ background: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)" }}
                >
                  + 再记一次
                </motion.button>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-6xl drop-shadow-lg">{todayMood.icon}</div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: "rgba(255,255,255,0.95)", fontFamily: "'Noto Serif SC', serif", textShadow: "0 1px 8px rgba(0,0,0,0.15)" }}>
                    {todayMood.label}
                  </p>
                  <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.78)" }}>
                    {todayMood.desc}
                  </p>
                  <p className="text-xs mt-2 font-medium" style={{ color: "rgba(255,255,255,0.60)" }}>
                    今天已打卡 · 点击再记一次
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="relative rounded-3xl p-6 mb-4 overflow-hidden grain cursor-pointer"
            style={{ background: "linear-gradient(135deg, oklch(0.90 0.022 155) 0%, oklch(0.85 0.030 150) 100%)", border: "2px dashed oklch(0.72 0.040 152 / 0.5)" }}
            onClick={() => onNav("checkin")}
            whileTap={{ scale: 0.98 }}
          >
            <GrainOverlay opacity={0.35} />
            <div className="relative z-10 flex flex-col items-center py-3 gap-3">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="text-5xl"
              >🌱</motion.div>
              <div className="text-center">
                <p className="text-base font-semibold" style={{ color: "oklch(0.28 0.030 148)", fontFamily: "'Noto Serif SC', serif" }}>今天，你感觉怎么样？</p>
                <p className="text-xs mt-1" style={{ color: "oklch(0.52 0.022 148)" }}>点击开始今天的打卡</p>
              </div>
              <div className="px-6 py-2.5 rounded-2xl text-sm font-semibold"
                style={{ background: "oklch(0.42 0.055 150)", color: "white" }}>
                记录心情
              </div>
            </div>
          </motion.div>
        )}

        {/* Week mood bar */}
        <motion.div
          initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="relative rounded-2xl p-4 mb-4 overflow-hidden"
          style={{ background: "oklch(0.99 0.006 155 / 0.75)", border: "1px solid oklch(0.88 0.020 152 / 0.5)", backdropFilter: "blur(8px)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold" style={{ color: "oklch(0.38 0.025 148)" }}>本周情绪</p>
            <button onClick={() => onNav("stats")} className="text-[10px]" style={{ color: "oklch(0.52 0.035 148)" }}>查看统计 →</button>
          </div>
          <div className="flex gap-2">
            {weekDays.map((d, i) => {
              const moodIdx = weekMoods[i];
              const moodColor = moodIdx !== null ? MOOD_SCREENS[moodIdx] : null;
              const isToday = i === todayDayIdx;
              const isFuture = i > todayDayIdx;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  {isFuture ? (
                    <div className="w-full aspect-square rounded-lg flex items-center justify-center"
                      style={{ border: "1.5px dashed oklch(0.82 0.020 152)", background: "oklch(0.96 0.008 155 / 0.5)" }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.82 0.020 152)" }} />
                    </div>
                  ) : moodColor ? (
                    <motion.div
                      key={`mood-${i}-${moodIdx}`}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-full aspect-square rounded-lg relative"
                      style={{
                        background: moodColor.bg,
                        boxShadow: isToday ? "0 0 0 2px white, 0 0 0 3.5px oklch(0.52 0.040 148)" : "none"
                      }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="w-full aspect-square rounded-lg flex items-center justify-center"
                      style={{
                        border: isToday ? "2px solid oklch(0.62 0.040 148 / 0.5)" : "1.5px solid oklch(0.88 0.015 152)",
                        background: "oklch(0.96 0.008 155 / 0.5)"
                      }}>
                      <div className="w-1.5 h-1.5 rounded-full"
                        style={{ background: isToday ? "oklch(0.62 0.040 148 / 0.5)" : "oklch(0.88 0.015 152)" }} />
                    </div>
                  )}
                  <span className="text-[9px]" style={{
                    color: isToday ? "oklch(0.42 0.040 148)" : isFuture ? "oklch(0.72 0.015 148)" : "oklch(0.55 0.020 148)",
                    fontWeight: isToday ? "600" : "400"
                  }}>
                    {isToday ? "今天" : `周${d}`}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Meds reminder card — only shown if meds enabled */}
        {medsEnabled && (
          <motion.button
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNav("meds")}
            className="w-full relative rounded-2xl p-4 overflow-hidden text-left flex items-center gap-3"
            style={{ background: "oklch(0.99 0.006 155 / 0.75)", border: "1px solid oklch(0.88 0.020 152 / 0.5)", backdropFilter: "blur(8px)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.88 0.035 155 / 0.6)" }}>
              <span className="text-xl">💊</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "oklch(0.28 0.025 148)" }}>今日用药提醒</p>
              <p className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.020 148)" }}>舍曲林 · 下次 21:00</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "oklch(0.62 0.080 148)" }} />
              <span className="text-xs" style={{ color: "oklch(0.42 0.040 148)" }}>待服</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="oklch(0.72 0.015 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </motion.button>
        )}
      </div>
      <BottomNav active="checkin" onNav={(t) => {
        if (t === "checkin") onNav("checkin");
        else if (t === "ai") onNav("ai-chat");
        else if (t === "journal") onNav("journal");
        else if (t === "stats") onNav("stats");
        else if (t === "more") onNav("more");
      }} />
    </div>
  );
}
function CheckinScreen({ onBack, onDone }: { onBack: () => void; onDone: (moodIdx: number, tags: string[], note: string) => void }) {
  const [step, setStep] = useState<"mood" | "detail">("mood");
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const handleMoodSelect = (i: number) => {
    setSelectedMood(i);
    setTimeout(() => setStep("detail"), 350);
  };
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  if (step === "mood") {
    return (
      <div className="relative flex flex-col h-full overflow-hidden">
        <FullScreenMoodPicker
          onSelect={handleMoodSelect}
          title="现在，你感觉怎么样？"
          subtitle="左右滑动 · 选择你的心情"
        />
        <button
          onClick={onBack}
          className="absolute top-12 left-5 z-50 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    );
  }
  const mood = selectedMood !== null ? MOOD_SCREENS[selectedMood] : MOOD_SCREENS[3];
  return (
    <motion.div
      className="relative flex flex-col h-full overflow-hidden"
      initial={{ x: "100%" }} animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ background: "oklch(0.96 0.014 155)" }}
    >
      <GrainOverlay opacity={0.3} />
      <StatusBar />
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto pb-6">
        <div className="flex items-center gap-3 px-5 py-3">
          <button onClick={() => setStep("mood")} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{mood.icon}</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.025 148)" }}>心情：{mood.label}</p>
              <p className="text-xs" style={{ color: "oklch(0.52 0.025 148)" }}>今天已打卡 1 次 · 点击返回修改</p>
            </div>
          </div>
        </div>
        <div className="mx-5 mb-5 rounded-2xl p-3 flex items-center gap-3 relative overflow-hidden"
          style={{ background: mood.bg }}>
          <GrainOverlay opacity={0.3} />
          <span className="text-3xl relative z-10">{mood.icon}</span>
          <div className="relative z-10">
            <p className="text-sm font-semibold" style={{ color: mood.textColor }}>{mood.label} · {mood.desc}</p>
            <p className="text-xs" style={{ color: mood.subColor }}>评分 {mood.score}/7</p>
          </div>
          <div className="ml-auto flex gap-1 relative z-10">
            {MOOD_SCREENS.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full"
                style={{ background: selectedMood === i ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.3)" }} />
            ))}
          </div>
        </div>
        <div className="px-5 mb-5">
          <p className="text-sm font-semibold mb-3" style={{ color: "oklch(0.25 0.025 148)" }}>发生了什么？<span className="font-normal text-xs ml-1" style={{ color: "oklch(0.52 0.025 148)" }}>（可多选）</span></p>
          <div className="flex flex-wrap gap-2">
            {SCENE_TAGS.map((tag, i) => (
              <motion.button
                key={i}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.025 }}
                onClick={() => toggleTag(tag)}
                whileTap={{ scale: 0.93 }}
                className="px-3 py-2 rounded-full text-xs font-medium transition-all"
                style={{
                  background: selectedTags.includes(tag) ? "oklch(0.42 0.055 150)" : "oklch(0.92 0.018 152 / 0.8)",
                  color: selectedTags.includes(tag) ? "white" : "oklch(0.35 0.025 148)",
                  border: selectedTags.includes(tag) ? "none" : "1px solid oklch(0.86 0.020 152 / 0.5)",
                }}
              >
                {tag}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="px-5 mb-5">
          <p className="text-sm font-semibold mb-2" style={{ color: "oklch(0.25 0.025 148)" }}>想说点什么？<span className="font-normal text-xs ml-1" style={{ color: "oklch(0.52 0.025 148)" }}>（可选）</span></p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="今天的感受、发生的事……"
            rows={4}
            className="w-full px-4 py-3 rounded-2xl text-sm resize-none outline-none"
            style={{
              background: "oklch(0.99 0.006 155 / 0.8)",
              border: "1px solid oklch(0.88 0.020 152 / 0.5)",
              color: "oklch(0.25 0.020 148)",
            }}
          />
        </div>
        <div className="px-5">
          <motion.button
            onClick={() => onDone(selectedMood ?? 3, selectedTags, note)}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl text-base font-semibold"
            style={{ background: "oklch(0.42 0.055 150)", color: "oklch(0.97 0.010 155)" }}
          >
            完成打卡
          </motion.button>
          <p className="text-center text-xs mt-2" style={{ color: "oklch(0.55 0.020 148)" }}>今天可以随时再打卡，记录不同时刻的心情</p>
        </div>
      </div>
    </motion.div>
  );
}

function CheckinDoneScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative flex flex-col h-full overflow-hidden items-center justify-center"
      style={{ background: "linear-gradient(160deg, oklch(0.92 0.030 158) 0%, oklch(0.86 0.038 148) 100%)" }}>
      <GrainOverlay opacity={0.45} />
      <div className="relative z-10 flex flex-col items-center gap-5 px-8">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: MOOD_COLORS[3].bg, boxShadow: "0 0 50px oklch(0.68 0.055 148 / 0.5)" }}
        >
          <span className="text-4xl">✓</span>
        </motion.div>
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-center">
          <h2 className="text-xl font-semibold mb-2" style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>
            打卡成功
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "oklch(0.42 0.025 148)" }}>
            今天已打卡 2 次<br />每一次记录，都是对自己的关注
          </p>
        </motion.div>
        {/* CBT trigger hint */}
        <motion.div
          initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="w-full p-4 rounded-2xl"
          style={{ background: "oklch(0.99 0.006 155 / 0.65)", border: "1px solid oklch(0.88 0.025 152 / 0.5)" }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: "oklch(0.42 0.035 148)" }}>💡 今日洞察</p>
          <p className="text-sm leading-relaxed" style={{ color: "oklch(0.30 0.020 148)" }}>
            你在"汇报"后情绪评分平均下降 1.5 分，这是你的规律之一。
          </p>
        </motion.div>
        <motion.button
          initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
          onClick={onBack}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-base font-medium"
          style={{ background: "oklch(0.42 0.055 150)", color: "oklch(0.97 0.010 155)" }}
        >
          返回首页
        </motion.button>
      </div>
    </div>
  );
}

function AIChatScreen({ onBack, onNav, onPaywall, isPaid = false, persona = null, onChangePersona, onMarkChatted }: { onBack: () => void; onNav?: (s: Screen) => void; onPaywall: () => void; isPaid?: boolean; persona?: Persona | null; onChangePersona?: () => void; onMarkChatted?: () => void }) {
   const personaCfg = persona ? PERSONA_CONFIG[persona] : PERSONA_CONFIG.counselor;
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([{ role: "ai", text: personaCfg.greeting }]);
  const [inputVal, setInputVal] = useState("");
  const [msgCount, setMsgCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const sendMessage = () => {
    if (!inputVal.trim()) return;
    if (!isPaid && msgCount >= 5) { return; }
    const userText = inputVal;
    const newMsg = { role: "user", text: userText };
    setMessages(prev => [...prev, newMsg]);
    setInputVal("");
    setMsgCount(c => c + 1);
    if (onMarkChatted) onMarkChatted();
    setTimeout(() => {
      const responses = personaCfg.responses;
      const aiText = responses[msgCount % responses.length].replace("{topic}", userText.slice(0, 8));
      setMessages(prev => [...prev, { role: "ai", text: aiText }]);
    }, 800);
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(0.96 0.014 155)" }}>
      <GrainOverlay opacity={0.3} />
      {!isPaid && msgCount >= 5 && (
        <FrostedPaywall
          title="解锁 AI 树洞无限对话"
          desc="今日免费次数已用完。升级后可无限倾诉，AI 会记住你的情绪历史，给出更贴心的回应。"
          features={["无限次 AI 对话", "情绪历史记忆", "每次对话自动生成日记摘要", "专属情绪洞察报告"]}
          onSubscribe={onPaywall}
        />
      )}
      <StatusBar />
      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 py-3 border-b"
        style={{ borderColor: "oklch(0.88 0.020 152 / 0.5)", background: "oklch(0.97 0.010 155 / 0.9)", backdropFilter: "blur(12px)" }}>
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, oklch(0.78 0.048 150), oklch(0.68 0.055 148))" }}>
            <span className="text-base">{personaCfg.icon}</span>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.025 148)" }}>情绪树洞 · {personaCfg.label}</p>
            <p className="text-xs" style={{ color: "oklch(0.52 0.025 148)" }}>今日剩余 {Math.max(0, 5 - msgCount)} 次 · {personaCfg.style}</p>
          </div>
        </div>
        {onChangePersona && (
          <button onClick={onChangePersona}
            className="px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0"
            style={{ background: "oklch(0.88 0.025 152 / 0.6)", color: "oklch(0.38 0.025 148)", border: "1px solid oklch(0.82 0.020 152 / 0.5)" }}>
            换人设
          </button>
        )}
      </div>

      {/* Messages - pb-[160px] ensures last message isn't hidden behind input+nav */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-4 pb-[160px] flex flex-col gap-3">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ai" && (
              <div className="w-7 h-7 rounded-full flex-shrink-0 mr-2 mt-1 flex items-center justify-center"
                style={{ background: "oklch(0.78 0.048 150)" }}>
                <span className="text-xs">🌿</span>
              </div>
            )}
            <div
              className="max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={{
                background: msg.role === "user"
                  ? "oklch(0.42 0.055 150)"
                  : "oklch(0.99 0.006 155 / 0.85)",
                color: msg.role === "user" ? "white" : "oklch(0.25 0.020 148)",
                border: msg.role === "ai" ? "1px solid oklch(0.88 0.020 152 / 0.5)" : "none",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              }}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input - absolutely positioned above BottomNav (80px) */}
      <div className="absolute left-0 right-0 px-4 pb-3 pt-3 border-t"
        style={{ bottom: 80, zIndex: 40, borderColor: "oklch(0.88 0.020 152 / 0.4)", background: "oklch(0.97 0.010 155 / 0.92)", backdropFilter: "blur(12px)" }}>
        {!isPaid && msgCount >= 4 && msgCount < 5 && (
          <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="mb-3 px-4 py-2.5 rounded-xl text-xs text-center"
            style={{ background: "oklch(0.88 0.030 152 / 0.6)", color: "oklch(0.38 0.030 148)" }}>
            今天还剩 {5 - msgCount} 次对话 ·
            <button onClick={onPaywall} className="ml-1 font-semibold underline" style={{ color: "oklch(0.42 0.055 150)" }}>
              解锁无限对话
            </button>
          </motion.div>
        )}
        <div className="flex gap-2">
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="说说你的感受……"
            className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
            style={{
              background: "oklch(0.92 0.018 152 / 0.7)",
              color: "oklch(0.25 0.020 148)",
              border: "1px solid oklch(0.86 0.022 152 / 0.5)",
            }}
          />
          <button
            onClick={sendMessage}
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.42 0.055 150)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8L14 2L8 14L7 9L2 8Z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>
      <BottomNav active="ai" onNav={(t) => {
        if (t === "checkin") onNav ? onNav("home") : onBack();
        else if (t === "ai") {}
        else if (t === "journal") onNav ? onNav("journal") : onBack();
        else if (t === "stats") onNav ? onNav("stats") : onBack();
        else if (t === "more") onNav ? onNav("more") : onBack();
      }} />
    </div>
  );
}

// JOURNAL_DATA is now managed as state in the main component
// This empty array is the initial value; entries are added after checkin
const JOURNAL_DATA_INITIAL: Array<{
  dateLabel: string; date: string; dayOfWeek: string; avgMoodIdx: number; count: number;
  entries: Array<{ time: string; moodIdx: number; tags: string[]; note: string; summary: string }>;
}> = [];

// Persona definitions for AI chat
type Persona = "counselor" | "lover" | "friend" | "family" | "self";
const PERSONA_CONFIG: Record<Persona, {
  label: string; icon: string; desc: string; greeting: string; style: string;
  responses: string[];
}> = {
  counselor: {
    label: "咨询师", icon: "🧑‍⚕️", desc: "专业、温暖、非评判性倾听",
    style: "专业而温暖",
    greeting: "你好，我是你的情绪支持顾问。今天有什么想聊的吗？无论是工作压力、人际关系，还是内心的困惑，我都在这里陪你。",
    responses: [
      "听起来你正在经历一种持续的疲惫感，这种感觉很真实。能跟我说说，是哪方面让你觉得最沉重吗？",
      "我注意到你提到了「{topic}」，这对你来说意味着什么？",
      "你有没有想过，这种感受背后可能有什么需求没有被满足？",
      "这种情绪已经持续多久了？有没有什么时候会好一些？",
      "我在听，继续说吧。你不需要整理好思路，想到什么说什么。",
      "谢谢你愿意分享这些。你说的每一句话我都认真在听。",
    ]
  },
  lover: {
    label: "恋人", icon: "💑", desc: "亲密、关怀、温柔陪伴",
    style: "温柔亲密",
    greeting: "宝贝，今天怎么样？我一直在想你，有什么开心或不开心的都可以跟我说哦～",
    responses: [
      "听到你说这些，我心里好心疼你……你辛苦了，真的。",
      "别一个人扛着，我在呢。说出来会好受一点的。",
      "你已经很努力了，我都看在眼里。今天能好好休息一下吗？",
      "抱抱你～不管发生什么，我都在你身边。",
      "你说的我都听着呢，继续说，我不会走的。",
      "你真的很棒，只是今天太累了。明天会好的，我陪你。",
    ]
  },
  friend: {
    label: "朋友", icon: "🤝", desc: "轻松、真实、互相支持",
    style: "轻松真实",
    greeting: "哟，最近咋样？有啥烦心事说出来，咱们唠唠！",
    responses: [
      "哎，这也太难了吧……换我我也崩溃。",
      "说真的，你已经做得很好了，别太苛责自己。",
      "我懂那种感觉，真的很难受。你现在最需要什么？",
      "行吧，先发泄一下，说出来总比憋着强。",
      "我在呢，继续说，没事的。",
      "你这个人就是太要强了，偶尔也要让自己喘口气嘛。",
    ]
  },
  family: {
    label: "亲人", icon: "👨‍👩‍👧", desc: "无条件的爱与包容",
    style: "温暖包容",
    greeting: "孩子，最近怎么样？工作累不累？有什么事情跟我说说，别一个人憋着。",
    responses: [
      "听你说这些，我心里很担心你。你要照顾好自己啊。",
      "不管怎样，家里永远是你的港湾，有什么事情我们一起扛。",
      "你从小就懂事，但有时候也要学会放下，不是所有事都要你一个人扛。",
      "我知道你很努力，我们都看见了。你已经很好了。",
      "说吧，我听着呢。说出来心里会好受一些。",
      "别太勉强自己，身体是最重要的，其他的都可以慢慢来。",
    ]
  },
  self: {
    label: "自己", icon: "🪞", desc: "内心对话，自我探索",
    style: "内省深思",
    greeting: "嗨，是我……我们好久没有好好谈谈了。今天，你愿意听听自己内心真正的声音吗？",
    responses: [
      "我知道你很累。但你有没有想过，这种累是来自外部压力，还是来自内心的某种期待？",
      "如果是你最好的朋友说出这句话，你会怎么回应他？",
      "你一直在照顾别人的感受，但你自己的感受呢？",
      "这件事让你难受，是因为它触碰了你很在乎的什么？",
      "我在听，继续说。我不会评判你，因为我就是你。",
      "你比你以为的更坚强。但坚强不代表不能脆弱。",
    ]
  }
};


// ─── AI Persona Select Screen ─────────────────────────────────────────────────
function PersonaSelectScreen({ onSelect, onBack, currentPersona }: { onSelect: (p: Persona) => void; onBack: () => void; currentPersona?: Persona | null }) {
  const personas: Persona[] = ["counselor", "lover", "friend", "family", "self"];
  return (
    <motion.div
      className="relative flex flex-col h-full overflow-hidden"
      initial={{ x: "100%" }} animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ background: "oklch(0.96 0.014 155)" }}
    >
      <GrainOverlay opacity={0.3} />
      <StatusBar />
      <div className="relative z-10 flex items-center gap-3 px-5 py-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h2 className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 148)" }}>选择倾诉对象</h2>
          <p className="text-xs" style={{ color: "oklch(0.52 0.025 148)" }}>选择一个人设，开始你的情绪对话</p>
        </div>
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-8">
        <div className="flex flex-col gap-3 mt-2">
          {personas.map((p, i) => {
            const cfg = PERSONA_CONFIG[p];
            const isSelected = currentPersona === p;
            return (
              <motion.button
                key={p}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.07 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(p)}
                className="w-full p-4 rounded-2xl text-left flex items-center gap-4"
                style={{
                  background: isSelected ? "oklch(0.42 0.055 150)" : "oklch(0.99 0.006 155 / 0.8)",
                  border: isSelected ? "none" : "1px solid oklch(0.88 0.020 152 / 0.5)",
                  boxShadow: isSelected ? "0 4px 16px oklch(0.42 0.055 150 / 0.3)" : "none",
                }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isSelected ? "rgba(255,255,255,0.2)" : "oklch(0.88 0.035 155 / 0.6)", fontSize: 24 }}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: isSelected ? "white" : "oklch(0.22 0.025 148)" }}>{cfg.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: isSelected ? "rgba(255,255,255,0.75)" : "oklch(0.52 0.025 148)" }}>{cfg.desc}</p>
                  <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: isSelected ? "rgba(255,255,255,0.65)" : "oklch(0.62 0.020 148)" }}>"{cfg.greeting.slice(0, 40)}…"</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.25)" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
        <p className="text-xs text-center mt-6" style={{ color: "oklch(0.62 0.020 148)" }}>人设仅影响对话风格，不构成专业心理咨询</p>
      </div>
    </motion.div>
  );
}


function JournalScreen({ onBack, onNav, onAdd, onDetail, isPaid = false, onSubscribe, journalData = [], hasChatted = false }: { onBack: () => void; onNav?: (s: Screen) => void; onAdd?: () => void; onDetail?: (entry: JournalEntry) => void; isPaid?: boolean; onSubscribe?: () => void; journalData?: Array<{ dateLabel: string; date: string; dayOfWeek: string; avgMoodIdx: number; count: number; entries: Array<{ time: string; moodIdx: number; tags: string[]; note: string; summary: string }> }>; hasChatted?: boolean }) {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const FREE_DAYS_LIMIT = 7;
  const isLocked = !isPaid && selectedDayIdx >= FREE_DAYS_LIMIT;
  const day = journalData[selectedDayIdx];
  const avgMood = day ? MOOD_SCREENS[day.avgMoodIdx] : MOOD_SCREENS[3];
  // Empty state: no journal entries yet
  if (journalData.length === 0) {
    return (
      <div className="relative flex flex-col h-full overflow-hidden" style={{ background: "oklch(0.96 0.014 155)" }}>
        <GrainOverlay opacity={0.3} />
        <StatusBar />
        <div className="relative z-10 flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <h2 className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 148)" }}>情绪日记</h2>
          </div>
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-6xl">📖</motion.div>
          <div className="text-center">
            <p className="text-base font-semibold mb-2" style={{ color: "oklch(0.28 0.030 148)", fontFamily: "'Noto Serif SC', serif" }}>还没有日记记录</p>
            <p className="text-sm leading-relaxed" style={{ color: "oklch(0.52 0.022 148)" }}>完成每日打卡后，你的情绪记录会自动出现在这里。</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onNav ? onNav("checkin") : onBack()}
            className="px-6 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "oklch(0.42 0.055 150)", color: "white" }}
          >
            去打卡记录心情
          </motion.button>
        </div>
        <BottomNav active="journal" onNav={(t) => {
          if (t === "checkin") onNav ? onNav("home") : onBack();
          else if (t === "ai") onNav ? onNav("ai-chat") : onBack();
          else if (t === "journal") {}
          else if (t === "stats") onNav ? onNav("stats") : onBack();
          else if (t === "more") onNav ? onNav("more") : onBack();
        }} />
      </div>
    );
  }
  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(0.96 0.014 155)" }}>
      <GrainOverlay opacity={0.3} />
      <StatusBar />
      <div className="relative z-10 flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 148)" }}>情绪日记</h2>
        </div>
        {onAdd && (
          <button onClick={onAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: "oklch(0.42 0.055 150 / 0.12)", color: "oklch(0.32 0.045 148)", border: "1px solid oklch(0.42 0.055 150 / 0.3)" }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1V9M1 5H9" stroke="oklch(0.32 0.045 148)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            补录
          </button>
        )}
      </div>
      {/* Date navigation strip */}
      <div className="relative z-10 flex gap-2 px-5 pb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {journalData.map((d, i) => (
          <motion.button
            key={i}
            onClick={() => setSelectedDayIdx(i)}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl transition-all"
            style={{
              background: selectedDayIdx === i ? "oklch(0.42 0.055 150)" : "oklch(0.99 0.006 155 / 0.8)",
              border: `1px solid ${selectedDayIdx === i ? "transparent" : "oklch(0.88 0.020 152 / 0.5)"}`,
              minWidth: 60,
              opacity: (!isPaid && i >= 7) ? 0.5 : 1,
            }}
          >
            <span className="text-[10px] font-medium" style={{ color: selectedDayIdx === i ? "rgba(255,255,255,0.8)" : "oklch(0.52 0.025 148)" }}>{d.dayOfWeek}</span>
            <span className="text-lg font-bold leading-tight" style={{ color: selectedDayIdx === i ? "white" : "oklch(0.25 0.025 148)" }}>{d.date.split("月")[1].replace("日", "")}</span>
            {(!isPaid && i >= 7) ? (
              <span className="text-[10px] mt-1">🔒</span>
            ) : (
              <div className="w-4 h-4 rounded-full mt-1" style={{ background: MOOD_SCREENS[d.avgMoodIdx].bg }} />
            )}
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDayIdx}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className="relative z-10 flex-1 overflow-y-auto px-5 pb-8"
        >
          {isLocked && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-6"
              style={{ backdropFilter: "blur(18px) saturate(0.7)", WebkitBackdropFilter: "blur(18px) saturate(0.7)", background: "oklch(0.96 0.014 155 / 0.75)" }}>
              <GrainOverlay opacity={0.5} />
              <div className="relative z-10 w-full max-w-xs p-6 rounded-3xl text-center"
                style={{ background: "oklch(0.99 0.008 155 / 0.92)", border: "1px solid oklch(0.88 0.025 152 / 0.6)", boxShadow: "0 8px 32px oklch(0.42 0.055 150 / 0.15)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "oklch(0.88 0.038 155)" }}>
                  <span className="text-2xl">🔒</span>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>7 天前的记录</p>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "oklch(0.48 0.020 148)" }}>
                  免费版仅保留最近 7 天的情绪日记。升级完整版，永久保存你的每一个情绪瞬间。
                </p>
                <div className="flex flex-col gap-2 mb-3">
                  {["📅 无限日记存储，永不丢失", "🔍 深度情绪趋势分析", "🤖 AI 树洞无限对话"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-left">
                      <span className="text-xs" style={{ color: "oklch(0.42 0.055 150)" }}>✓</span>
                      <span className="text-xs" style={{ color: "oklch(0.38 0.025 148)" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={onSubscribe}
                  className="w-full py-3 rounded-2xl text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, oklch(0.42 0.055 150), oklch(0.38 0.060 155))", color: "white" }}>
                  解锁完整版 · 14 天免费试用
                </button>
                <p className="text-[10px] mt-2" style={{ color: "oklch(0.62 0.018 148)" }}>随时可取消 · 无需立即付款</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <div className="text-center px-3 py-2 rounded-2xl"
              style={{ background: avgMood.bg }}>
              <p className="text-xs font-medium" style={{ color: avgMood.subColor }}>{day.dayOfWeek}</p>
              <p className="text-xl font-bold leading-none" style={{ color: avgMood.textColor }}>{day.date.split("月")[1].replace("日", "")}</p>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "oklch(0.25 0.025 148)" }}>
                {day.date} · 共 {day.count} 条记录
              </p>
              <p className="text-xs" style={{ color: "oklch(0.52 0.025 148)" }}>今日平均情绪：{avgMood.label} {avgMood.icon}</p>
            </div>
          </div>
          {/* AI Summary Card — shown for today's entries only */}
          {(() => {
            const isToday = selectedDayIdx === 0 && day.dateLabel === "今天";
            const existingSummary = day.entries.find(e => e.summary)?.summary;
            const now = new Date();
            const isMidnight = now.getHours() === 0 && now.getMinutes() < 5; // just past midnight
            const isPastMidnight = now.getHours() >= 1 || isMidnight; // after 12am

            if (existingSummary) {
              // Has a real summary (generated)
              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-2xl"
                  style={{ background: "oklch(0.88 0.030 155 / 0.5)", border: "1px solid oklch(0.82 0.030 152 / 0.4)" }}
                >
                  <p className="text-xs font-semibold mb-2" style={{ color: "oklch(0.38 0.040 148)" }}>🌿 今日 AI 摘要</p>
                  <p className="text-xs leading-relaxed" style={{ color: "oklch(0.30 0.020 148)" }}>{existingSummary}</p>
                </motion.div>
              );
            }

            if (isToday && hasChatted) {
              // Chatted today but no summary yet — show "generating at midnight"
              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-2xl flex items-center gap-3"
                  style={{ background: "oklch(0.88 0.030 155 / 0.5)", border: "1px solid oklch(0.82 0.030 152 / 0.4)" }}
                >
                  <span className="text-xl flex-shrink-0">🌿</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "oklch(0.38 0.040 148)" }}>今日 AI 摘要</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "oklch(0.52 0.025 148)" }}>摘要将在今晚 12 点生成</p>
                  </div>
                </motion.div>
              );
            }

            if (isToday && !hasChatted) {
              // No chat today — show tree-hole prompt
              return (
                <motion.button
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNav ? onNav("ai-chat") : onBack()}
                  className="w-full mb-4 p-4 rounded-2xl text-left flex items-center gap-3"
                  style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, oklch(0.78 0.048 150), oklch(0.68 0.055 148))" }}>
                    <span className="text-xl">💬</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "oklch(0.28 0.025 148)" }}>今天还没有聊聊心情</p>
                    <p className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.020 148)" }}>去树洞倾诉一下，AI 陪你聊聊 →</p>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4 2L8 6L4 10" stroke="oklch(0.72 0.015 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.button>
              );
            }

            // Past days with no summary — show nothing
            return null;
          })()}
          <div className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
              style={{ background: "oklch(0.85 0.025 152)" }} />
            {day.entries.map((entry, i) => {
              const entryMood = MOOD_SCREENS[entry.moodIdx];
              return (
                <motion.div
                  key={i}
                  initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative mb-4 ml-4"
                >
                  <div className="absolute -left-6 top-4 w-3 h-3 rounded-full border-2 border-white"
                    style={{ background: entryMood.bg }} />
                  <div className="p-4 rounded-2xl"
                    style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color: "oklch(0.52 0.025 148)" }}>{entry.time}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{entryMood.icon}</span>
                        <span className="text-xs font-medium" style={{ color: "oklch(0.42 0.025 148)" }}>{entryMood.label}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {entry.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-xs"
                          style={{ background: "oklch(0.88 0.025 152 / 0.6)", color: "oklch(0.38 0.025 148)" }}>{t}</span>
                      ))}
                    </div>
                    {entry.note && (
                      <p className="text-sm leading-relaxed" style={{ color: "oklch(0.30 0.020 148)" }}>{entry.note}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="text-center mt-2">
            <p className="text-xs" style={{ color: "oklch(0.62 0.020 148)" }}>↑ 点击上方日期查看其他天 · 向下滑动查看更多</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <BottomNav active="journal" onNav={(t) => {
        if (t === "checkin") onNav ? onNav("home") : onBack();
        else if (t === "ai") onNav ? onNav("ai-chat") : onBack();
        else if (t === "journal") {}
        else if (t === "stats") onNav ? onNav("stats") : onBack();
        else if (t === "more") onNav ? onNav("more") : onBack();
      }} />
    </div>
  );
}

type StatsPeriod = "week" | "lastweek" | "30days" | "all";
const STATS_DATA: Record<StatsPeriod, { bars: number[]; labels: string[]; pieCounts: number[] }> = {
  week: { bars: [4,3,5,2,4,6,5], labels: ["一","二","三","四","五","六","日"], pieCounts: [1,1,1,1,2,1,0] },
  lastweek: { bars: [3,4,2,5,3,4,3], labels: ["一","二","三","四","五","六","日"], pieCounts: [2,2,1,1,1,0,0] },
  "30days": { bars: [4,5,3,6,4,2,3,5,6,7,5,4,3,2,4,5,6,5,4,3,5,6,4,5,3,4,5,6,7,5], labels: [], pieCounts: [3,4,6,8,5,3,1] },
  all: { bars: [4,5,3,6,4,2,3,5,6,7,5,4,3,2,4,5,6,5,4,3,5,6,4,5,3,4,5,6,7,5,4,5,3,6,4,2,3,5,6,7], labels: [], pieCounts: [5,8,10,12,8,5,2] },
};
function PieChart({ counts, selectedSlice, onSelect }: { counts: number[]; selectedSlice: number | null; onSelect: (i: number) => void }) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const cx = 60; const cy = 60; const r = 52;
  let startAngle = -Math.PI / 2;
  const slices = counts.map((count, i) => {
    const angle = (count / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const result = { path, count, pct: Math.round((count / total) * 100), color: MOOD_SCREENS[i].bg, label: MOOD_SCREENS[i].label, icon: MOOD_SCREENS[i].icon };
    startAngle = endAngle;
    return result;
  });
  return (
    <div className="flex items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
        {slices.map((slice, i) => (
          <motion.path
            key={i}
            d={slice.path}
            fill={slice.color}
            opacity={selectedSlice === null || selectedSlice === i ? 1 : 0.3}
            onClick={() => onSelect(i)}
            style={{ cursor: "pointer" }}
            animate={{ opacity: selectedSlice === null || selectedSlice === i ? 1 : 0.3 }}
          />
        ))}
        <circle cx={cx} cy={cy} r={28} fill="oklch(0.99 0.006 155)" />
        {selectedSlice !== null && (
          <>
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="bold" fill="oklch(0.25 0.025 148)">{slices[selectedSlice].pct}%</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="oklch(0.45 0.025 148)">{slices[selectedSlice].label}</text>
          </>
        )}
        {selectedSlice === null && (
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize="9" fill="oklch(0.45 0.025 148)">点击查看</text>
        )}
      </svg>
      <div className="flex flex-col gap-1.5 flex-1">
        {slices.map((slice, i) => (
          <motion.button
            key={i}
            onClick={() => onSelect(i)}
            animate={{ opacity: selectedSlice === null || selectedSlice === i ? 1 : 0.4 }}
            className="flex items-center gap-1.5"
          >
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: slice.color }} />
            <span className="text-[10px]" style={{ color: "oklch(0.35 0.020 148)" }}>{slice.icon} {slice.label}</span>
            <span className="text-[10px] ml-auto font-semibold" style={{ color: selectedSlice === i ? "oklch(0.32 0.035 148)" : "oklch(0.52 0.020 148)" }}>{slice.pct}%</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
function StatsScreen({ onBack, onNav, onPaywall, onUnlocked, isPaid = false }: { onBack: () => void; onNav?: (s: Screen) => void; onPaywall: () => void; onUnlocked?: () => void; isPaid?: boolean }) {
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null);
  const data = STATS_DATA[period];
  const periodLabels: Record<StatsPeriod, string> = { week: "本周", lastweek: "上周", "30days": "30天", all: "全部" };
  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(0.96 0.014 155)" }}>
      <GrainOverlay opacity={0.3} />
      <StatusBar />
      <div className="relative z-10 flex items-center gap-3 px-5 py-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 148)" }}>情绪统计</h2>
      </div>
      {/* Period selector */}
      <div className="relative z-10 flex gap-2 px-5 mb-3">
        {(["week", "lastweek", "30days", "all"] as StatsPeriod[]).map(p => (
          <motion.button
            key={p}
            onClick={() => { setPeriod(p); setSelectedSlice(null); }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-2 rounded-xl text-xs font-medium"
            style={{
              background: period === p ? "oklch(0.42 0.055 150)" : "oklch(0.99 0.006 155 / 0.8)",
              color: period === p ? "white" : "oklch(0.42 0.025 148)",
              border: `1px solid ${period === p ? "transparent" : "oklch(0.88 0.020 152 / 0.5)"}`,
            }}
          >
            {periodLabels[p]}
          </motion.button>
        ))}
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-8">
        {/* Pie chart */}
        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl mb-4"
            style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}
          >
            <p className="text-sm font-semibold mb-3" style={{ color: "oklch(0.25 0.025 148)" }}>
              {periodLabels[period]}心情占比
              {selectedSlice !== null && <span className="ml-2 text-xs font-normal" style={{ color: "oklch(0.52 0.025 148)" }}>· 再次点击取消</span>}
            </p>
            <PieChart counts={data.pieCounts} selectedSlice={selectedSlice} onSelect={(i) => setSelectedSlice(prev => prev === i ? null : i)} />
          </motion.div>
        </AnimatePresence>
        {/* Bar chart */}
        <div className="p-4 rounded-2xl mb-4"
          style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "oklch(0.25 0.025 148)" }}>{periodLabels[period]}情绪分布</p>
          <div className="flex gap-1 items-end" style={{ height: 80 }}>
            {data.bars.map((score, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5" style={{ minWidth: 0 }}>
                <motion.div
                  initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.35 }}
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${score * 10}px`,
                    background: MOOD_SCREENS[score - 1].bg,
                    transformOrigin: "bottom",
                    opacity: selectedSlice !== null && selectedSlice !== score - 1 ? 0.25 : 1,
                  }}
                />
                {data.labels[i] && (
                  <span className="text-[8px]" style={{ color: "oklch(0.55 0.020 148)" }}>{data.labels[i]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Pixel mood wall */}
        <div className="p-4 rounded-2xl mb-4"
          style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: "oklch(0.25 0.025 148)" }}>情绪像素墙</p>
            <span className="text-xs" style={{ color: "oklch(0.52 0.025 148)" }}>{periodLabels[period]}</span>
          </div>
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
            {PIXEL_DATA.slice(0, period === "week" || period === "lastweek" ? 7 : 30).map((m, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: selectedSlice !== null && MOOD_SCREENS.findIndex(ms => ms.bg === m.bg) !== selectedSlice ? 0.2 : 1 }}
                transition={{ delay: i * 0.015 }}
                className="pixel-cell"
                style={{ background: m.bg }}
                title={m.label}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {MOOD_COLORS.map((m, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: m.bg }} />
                <span className="text-[9px]" style={{ color: "oklch(0.52 0.020 148)" }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Locked analysis or unlocked CTA */}
        {!isPaid && (
          <FrostedPaywall
            title="解锁深度情绪分析"
            desc="查看你的情绪规律、压力源排名和最佳状态时段，让数据帮你更了解自己。"
            features={["情绪-行为关联洞察", "压力源排名分析", "最佳/最差时段报告", "AI 个性化建议", "就诊 PDF 报告生成"]}
            onSubscribe={onPaywall}
          />
        )}
        {isPaid ? (
          <motion.button onClick={onUnlocked} whileTap={{ scale: 0.97 }}
            className="relative w-full p-4 rounded-2xl overflow-hidden text-left grain"
            style={{ background: "linear-gradient(135deg, oklch(0.78 0.048 150) 0%, oklch(0.68 0.055 148) 100%)" }}
          >
            <GrainOverlay opacity={0.45} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: "white" }}>深度情绪分析</p>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: "oklch(0.99 0.008 80 / 0.3)", color: "white" }}>✨ 已解锁</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.92 0.015 155)" }}>
                查看 30 天趋势分析、压力源排名、最佳/最差时段洞察
              </p>
              <div className="mt-3 flex items-center justify-end">
                <span className="text-xs font-semibold" style={{ color: "white" }}>查看完整分析 →</span>
              </div>
            </div>
          </motion.button>
        ) : (
          <>
            {onUnlocked && (
              <motion.button onClick={onUnlocked} whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-2xl text-sm font-medium mb-2"
                style={{ background: "oklch(0.42 0.055 150 / 0.12)", color: "oklch(0.32 0.045 148)", border: "1px solid oklch(0.42 0.055 150 / 0.3)" }}>
                ✨ 查看已解锁的深度分析（演示）
              </motion.button>
            )}
            <motion.button
              onClick={onPaywall}
              whileTap={{ scale: 0.98 }}
              className="relative w-full p-4 rounded-2xl overflow-hidden text-left grain"
              style={{ background: "linear-gradient(135deg, oklch(0.78 0.048 150) 0%, oklch(0.68 0.055 148) 100%)" }}
            >
              <GrainOverlay opacity={0.45} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold" style={{ color: "white" }}>深度情绪分析</p>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: "oklch(0.99 0.008 80 / 0.3)", color: "white" }}>🔒 付费版</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "oklch(0.92 0.015 155)" }}>
                  解锁 30 天趋势分析、压力源排名、最佳/最差时段洞察……
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="flex-1 h-6 rounded-lg blur-sm" style={{ background: "oklch(0.99 0.008 155 / 0.3)" }} />
                  <div className="flex-1 h-8 rounded-lg blur-sm" style={{ background: "oklch(0.99 0.008 155 / 0.25)" }} />
                  <div className="flex-1 h-5 rounded-lg blur-sm" style={{ background: "oklch(0.99 0.008 155 / 0.3)" }} />
                  <div className="flex-1 h-9 rounded-lg blur-sm" style={{ background: "oklch(0.99 0.008 155 / 0.2)" }} />
                  <div className="flex-1 h-7 rounded-lg blur-sm" style={{ background: "oklch(0.99 0.008 155 / 0.28)" }} />
                </div>
              </div>
            </motion.button>
          </>
        )}
      </div>
      <BottomNav active="stats" onNav={(t) => {
        if (t === "checkin") onNav ? onNav("home") : onBack();
        else if (t === "ai") onNav ? onNav("ai-chat") : onBack();
        else if (t === "journal") onNav ? onNav("journal") : onBack();
        else if (t === "stats") {}
        else if (t === "more") onNav ? onNav("more") : onBack();
      }} />
    </div>
  );
}

// ─── Crisis Intervention Screen ──────────────────────────────────────────────
function CrisisScreen({ onBack, consecutiveDays = 3 }: { onBack: () => void; consecutiveDays?: number }) {
  const [level, setLevel] = useState<"check" | "mild" | "moderate" | "severe">("check");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Auto-determine level based on consecutive days
  useEffect(() => {
    if (consecutiveDays >= 5) setLevel("severe");
    else if (consecutiveDays >= 3) setLevel("moderate");
    else setLevel("mild");
  }, [consecutiveDays]);

  const hotlines = [
    { name: "北京心理危机研究与干预中心", number: "010-82951332", available: "24小时" },
    { name: "全国心理援助热线", number: "400-161-9995", available: "24小时" },
    { name: "生命热线", number: "400-821-1215", available: "24小时" },
    { name: "希望24热线", number: "400-161-9995", available: "24小时" },
  ];

  const levelConfig = {
    mild: {
      bg: "linear-gradient(160deg, oklch(0.88 0.035 180) 0%, oklch(0.82 0.042 165) 100%)",
      icon: "🌧",
      title: "你最近有些低落",
      subtitle: `已连续 ${consecutiveDays} 天情绪偏低，这很正常，但我们想多关心你一下。`,
      color: "oklch(0.22 0.025 175)",
      subColor: "oklch(0.38 0.025 170)",
      btnBg: "oklch(0.42 0.055 170)",
    },
    moderate: {
      bg: "linear-gradient(160deg, oklch(0.82 0.040 200) 0%, oklch(0.72 0.048 185) 100%)",
      icon: "🌊",
      title: "你已经撑了很久了",
      subtitle: `连续 ${consecutiveDays} 天情绪低落，这段时间一定很不容易。你不需要独自承受这些。`,
      color: "rgba(255,255,255,0.95)",
      subColor: "rgba(255,255,255,0.8)",
      btnBg: "rgba(255,255,255,0.25)",
    },
    severe: {
      bg: "linear-gradient(160deg, oklch(0.62 0.045 240) 0%, oklch(0.52 0.055 225) 100%)",
      icon: "🫂",
      title: "我们很担心你",
      subtitle: `你已经连续 ${consecutiveDays} 天处于很低落的状态。现在，最重要的事是让你知道：有人在乎你，有人可以帮助你。`,
      color: "rgba(255,255,255,0.95)",
      subColor: "rgba(255,255,255,0.8)",
      btnBg: "rgba(255,255,255,0.25)",
    },
    check: {
      bg: "linear-gradient(160deg, oklch(0.88 0.035 180) 0%, oklch(0.82 0.042 165) 100%)",
      icon: "💙",
      title: "先了解一下你的状态",
      subtitle: "回答几个简单的问题，帮助我们更好地支持你。",
      color: "oklch(0.22 0.025 175)",
      subColor: "oklch(0.38 0.025 170)",
      btnBg: "oklch(0.42 0.055 170)",
    },
  };

  const cfg = levelConfig[level];
  const isLight = level === "mild" || level === "check";

  const selfHelpTips = [
    { icon: "🚶", title: "走出去", desc: "哪怕只是在楼道里走 5 分钟，换个环境有时能打破情绪的循环。" },
    { icon: "📞", title: "联系一个人", desc: "不需要解释很多，就说「我最近不太好，想聊聊」，大多数人都愿意听。" },
    { icon: "✍️", title: "写下来", desc: "把脑子里最沉重的那句话写在纸上，不用给任何人看，只是让它离开你的脑袋。" },
    { icon: "🍵", title: "照顾身体", desc: "喝一杯热水，吃点东西。身体的基本需求被满足，情绪会稍微稳定一点。" },
  ];

  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: cfg.bg }}>
      <GrainOverlay opacity={0.4} />
      <StatusBar />
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto pb-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: isLight ? "oklch(0.88 0.025 175 / 0.5)" : "rgba(255,255,255,0.2)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke={isLight ? "oklch(0.35 0.030 170)" : "white"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: isLight ? "oklch(0.55 0.060 25)" : "rgba(255,200,100,0.9)" }} />
            <span className="text-xs font-medium" style={{ color: isLight ? "oklch(0.45 0.040 25)" : "rgba(255,220,120,0.9)" }}>
              关怀模式
            </span>
          </div>
        </div>

        {/* Main message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="px-6 pt-2 pb-6 text-center"
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="text-5xl mb-4">{cfg.icon}</motion.div>
          <h2 className="text-xl font-semibold mb-3 leading-snug"
            style={{ color: cfg.color, fontFamily: "'Noto Serif SC', serif" }}>
            {cfg.title}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: cfg.subColor }}>
            {cfg.subtitle}
          </p>
        </motion.div>

        {/* Level selector */}
        <motion.div
          initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
          className="mx-5 mb-4 p-1 rounded-2xl flex gap-1"
          style={{ background: isLight ? "oklch(0.88 0.025 175 / 0.4)" : "rgba(255,255,255,0.15)" }}>
          {(["mild", "moderate", "severe"] as const).map((l, i) => (
            <button key={l} onClick={() => setLevel(l)}
              className="flex-1 py-2 px-1 rounded-xl font-medium transition-all text-center"
              style={{
                fontSize: "11px",
                lineHeight: "1.3",
                background: level === l ? (isLight ? "white" : "rgba(255,255,255,0.3)") : "transparent",
                color: level === l ? (isLight ? "oklch(0.32 0.040 170)" : "white") : (isLight ? "oklch(0.52 0.030 170)" : "rgba(255,255,255,0.6)"),
                boxShadow: level === l ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                whiteSpace: "nowrap",
              }}>
              {["轻度低落", "持续低落", "需要帮助"][i]}
            </button>
          ))}
        </motion.div>

        {/* Self-help tips */}
        {(level === "mild" || level === "moderate") && (
          <motion.div
            initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="mx-5 mb-4 rounded-2xl"
            style={{ background: isLight ? "oklch(0.99 0.006 155 / 0.85)" : "rgba(255,255,255,0.15)", border: isLight ? "1px solid oklch(0.88 0.020 155 / 0.5)" : "1px solid rgba(255,255,255,0.2)" }}
          >
            <div className="px-4 pt-4 pb-4">
              <p className="text-xs font-semibold mb-3" style={{ color: isLight ? "oklch(0.38 0.040 148)" : "rgba(255,255,255,0.9)" }}>
                🌱 现在可以试试
              </p>
              {selfHelpTips.map((tip, i) => (
                <div key={i}>
                  <button
                    onClick={() => setExpanded(expanded === tip.title ? null : tip.title)}
                    className="w-full flex items-center gap-3 py-2.5 text-left"
                  >
                    <span className="text-lg flex-shrink-0">{tip.icon}</span>
                    <span className="text-sm font-medium flex-1" style={{ color: isLight ? "oklch(0.28 0.025 148)" : "rgba(255,255,255,0.9)" }}>
                      {tip.title}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                      style={{ transform: expanded === tip.title ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                      <path d="M2 4L6 8L10 4" stroke={isLight ? "oklch(0.55 0.025 148)" : "rgba(255,255,255,0.6)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <AnimatePresence>
                    {expanded === tip.title && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs leading-relaxed pb-3 pl-9 pr-2"
                          style={{ color: isLight ? "oklch(0.45 0.020 148)" : "rgba(255,255,255,0.75)" }}>
                          {tip.desc}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {i < selfHelpTips.length - 1 && (
                    <div className="ml-9 h-px" style={{ background: isLight ? "oklch(0.90 0.015 152)" : "rgba(255,255,255,0.1)" }} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Crisis hotlines — only shown for severe level */}
        {level === "severe" && (
        <motion.div
          initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
          className="mx-5 mb-4 rounded-2xl overflow-hidden"
          style={{ background: isLight ? "oklch(0.99 0.006 155 / 0.85)" : "rgba(255,255,255,0.15)", border: isLight ? "1px solid oklch(0.88 0.020 155 / 0.5)" : "1px solid rgba(255,255,255,0.2)" }}
        >
          <div className="px-4 pt-4 pb-3">
            <p className="text-xs font-semibold mb-3" style={{ color: isLight ? "oklch(0.38 0.040 148)" : "rgba(255,255,255,0.9)" }}>
              📞 专业支持热线
            </p>
            {hotlines.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-xs font-medium truncate" style={{ color: isLight ? "oklch(0.28 0.025 148)" : "rgba(255,255,255,0.9)" }}>
                    {h.name}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: isLight ? "oklch(0.55 0.020 148)" : "rgba(255,255,255,0.6)" }}>
                    {h.available}
                  </p>
                </div>
                <motion.a
                  href={`tel:${h.number}`}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: isLight ? "oklch(0.42 0.055 150 / 0.12)" : "rgba(255,255,255,0.25)", color: isLight ? "oklch(0.38 0.045 148)" : "white", border: isLight ? "1px solid oklch(0.42 0.055 150 / 0.3)" : "1px solid rgba(255,255,255,0.3)" }}>
                  {h.number}
                </motion.a>
              </div>
            ))}
          </div>
        </motion.div>
        )}
        {/* Emergency contact + professional help */}
        <motion.div
          initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="mx-5 mb-4 p-4 rounded-2xl"
          style={{ background: isLight ? "oklch(0.92 0.028 100 / 0.5)" : "rgba(255,200,100,0.15)", border: isLight ? "1px solid oklch(0.85 0.030 100 / 0.5)" : "1px solid rgba(255,200,100,0.3)" }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: isLight ? "oklch(0.40 0.045 100)" : "rgba(255,220,120,0.95)" }}>
            🆘 如果你现在很不安全
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: isLight ? "oklch(0.35 0.030 100)" : "rgba(255,220,120,0.8)" }}>
            请立即拨打 <strong>120</strong> 或前往最近的医院急诊，告诉他们你的感受。你的生命很重要。
          </p>
          <motion.a href="tel:120" whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold"
            style={{ background: isLight ? "oklch(0.55 0.060 25)" : "rgba(255,100,80,0.7)", color: "white" }}>
            <span>🚨</span>
            <span>拨打 120 急救</span>
          </motion.a>
        </motion.div>

        {/* Bottom reassurance */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mx-5 text-center"
        >
          <p className="text-xs leading-relaxed" style={{ color: isLight ? "oklch(0.52 0.025 148)" : "rgba(255,255,255,0.6)" }}>
            你愿意记录下这些感受，本身就是一种勇气。<br />
            我们会一直在这里。
          </p>
          <button onClick={onBack} className="mt-3 text-xs py-2 px-4"
            style={{ color: isLight ? "oklch(0.55 0.025 148)" : "rgba(255,255,255,0.5)" }}>
            返回首页
          </button>
        </motion.div>
      </div>
    </div>
  );
}
// ─── Paywall Screens ──────────────────────────────────────────────────────────

function PaywallAnalysis({ onClose, onSubscribe }: { onClose: () => void; onSubscribe?: () => void }) {
  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: "oklch(0.96 0.014 155)" }}
    >
      <GrainOverlay opacity={0.35} />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-end px-5 pt-12">
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.88 0.025 152 / 0.7)" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 px-6 pt-4 pb-8 flex flex-col">
          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <p className="text-xs font-medium mb-1" style={{ color: "oklch(0.52 0.035 148)" }}>你的情绪规律已生成</p>
            <h2 className="text-2xl font-semibold mb-1" style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>
              解锁深度分析
            </h2>
            <p className="text-sm mb-6" style={{ color: "oklch(0.45 0.025 148)" }}>
              你已积累 30 天的情绪数据，解锁后可以看到：
            </p>
          </motion.div>

          {/* Blurred preview */}
          <motion.div
            initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="relative rounded-2xl p-4 mb-5 overflow-hidden"
            style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: "oklch(0.42 0.025 148)" }}>压力源排名（模糊预览）</p>
            <div className="flex flex-col gap-2">
              {[["💼 汇报", "85%"], ["📋 截止日", "72%"], ["🌙 熬夜", "60%"]].map(([tag, pct], i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs w-20" style={{ color: "oklch(0.35 0.020 148)" }}>{tag}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden"
                    style={{ background: "oklch(0.88 0.020 152)" }}>
                    <div className="h-full rounded-full blur-sm"
                      style={{ width: pct, background: "oklch(0.55 0.055 148)" }} />
                  </div>
                  <span className="text-xs blur-sm select-none" style={{ color: "oklch(0.42 0.025 148)" }}>{pct}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="flex flex-col gap-2.5 mb-6">
            {[
              "📈 30 天情绪趋势与规律",
              "🔍 压力源排名与关联分析",
              "⏰ 最佳/最差情绪时段",
              "📄 一键生成就诊 PDF 报告",
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.07 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "oklch(0.42 0.055 150 / 0.15)" }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="oklch(0.42 0.055 150)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm" style={{ color: "oklch(0.30 0.020 148)" }}>{item}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <motion.button
              initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl text-base font-semibold grain relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, oklch(0.52 0.060 148), oklch(0.42 0.055 150))", color: "white" }}
            >
              <GrainOverlay opacity={0.35} />
              <span className="relative z-10">免费体验 14 天</span>
            </motion.button>
            <p className="text-center text-xs" style={{ color: "oklch(0.55 0.020 148)" }}>
              无需绑定支付方式 · 随时可取消
            </p>
            <button onClick={() => { onClose(); onSubscribe?.(); }} className="text-sm py-1 underline font-medium" style={{ color: "oklch(0.42 0.055 150)" }}>
              查看完整版功能
            </button>
            <button onClick={onClose} className="text-sm py-1" style={{ color: "oklch(0.55 0.025 148)" }}>
              稍后再说
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PaywallAI({ onClose, onSubscribe }: { onClose: () => void; onSubscribe?: () => void }) {
  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="absolute inset-0 z-50 flex flex-col justify-end"
      style={{ background: "oklch(0.15 0.020 148 / 0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        className="relative rounded-t-3xl px-6 pt-6 pb-10 overflow-hidden"
        style={{ background: "oklch(0.97 0.010 155)" }}
      >
        <GrainOverlay opacity={0.35} />
        <div className="relative z-10">
          <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "oklch(0.85 0.020 152)" }} />
          <p className="text-sm text-center mb-4" style={{ color: "oklch(0.42 0.025 148)" }}>
            今天的免费对话次数已用完
          </p>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, oklch(0.78 0.048 150), oklch(0.68 0.055 148))" }}>
            <span className="text-3xl">🌿</span>
          </div>
          <h3 className="text-xl font-semibold text-center mb-2"
            style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>
            你说的这些，值得被好好倾听
          </h3>
          <p className="text-sm text-center mb-6" style={{ color: "oklch(0.45 0.025 148)" }}>
            明天可以继续，或者解锁无限对话
          </p>
          <div className="flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { onClose(); onSubscribe?.(); }}
              className="w-full py-4 rounded-2xl text-base font-semibold"
              style={{ background: "oklch(0.42 0.055 150)", color: "white" }}
            >
              了解完整版
            </motion.button>
            <button onClick={onClose} className="text-sm py-2 text-center"
              style={{ color: "oklch(0.55 0.025 148)" }}>
              明天再来
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PaywallCapsule({ onClose, onSubscribe }: { onClose: () => void; onSubscribe?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: "linear-gradient(160deg, oklch(0.88 0.040 90) 0%, oklch(0.78 0.048 75) 100%)" }}
    >
      <GrainOverlay opacity={0.5} />
      <div className="relative z-10 flex flex-col h-full px-6 pb-10">
        <div className="flex justify-end pt-14">
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.99 0.008 80 / 0.3)" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="oklch(0.30 0.025 65)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180 }}
            className="text-8xl mb-6"
          >
            ✉️
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h2 className="text-2xl font-semibold mb-3"
              style={{ color: "oklch(0.22 0.025 60)", fontFamily: "'Noto Serif SC', serif" }}>
              给未来的自己
            </h2>
            <p className="text-sm leading-relaxed mb-8 px-4"
              style={{ color: "oklch(0.38 0.020 65)" }}>
              在你状态最好的时候，录制一封信。<br />
              它会在你最需要的时候，悄悄出现。
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="w-full p-4 rounded-2xl mb-6"
            style={{ background: "oklch(0.99 0.008 80 / 0.4)", border: "1px solid oklch(0.90 0.020 80 / 0.5)" }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: "oklch(0.30 0.025 65)" }}>付费版专属功能</p>
            {["录制语音或文字胶囊信件", "连续高分时自动引导录制", "低谷期以「发光盲盒」形式推送"].map((item, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(0.55 0.055 80 / 0.3)" }}>
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="oklch(0.38 0.045 75)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-xs" style={{ color: "oklch(0.32 0.020 65)" }}>{item}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-2"
        >
          <button className="w-full py-4 rounded-2xl text-base font-semibold"
            style={{ background: "oklch(0.42 0.055 75)", color: "white" }}>
            开始 14 天免费试用
          </button>
          <button onClick={onClose} className="text-sm py-2 text-center"
            style={{ color: "oklch(0.45 0.025 65)" }}>
            先看看别的
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── CBT Done Screen (low mood trigger) ──────────────────────────────────────
function CheckinDoneLowScreen({ onBack, onCBT }: { onBack: () => void; onCBT: () => void }) {
  const [showCBT, setShowCBT] = useState(false);
  const card = CBT_CARDS[1]; //灾难化思维 for demo
  if (showCBT) {
    return (
      <motion.div
        className="relative flex flex-col h-full overflow-hidden"
        initial={{ x: "100%" }} animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        style={{ background: "linear-gradient(160deg, oklch(0.94 0.020 155) 0%, oklch(0.90 0.028 148) 100%)" }}
      >
        <GrainOverlay opacity={0.35} />
        <StatusBar />
        <div className="relative z-10 flex flex-col flex-1 px-6 pt-4 pb-8 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setShowCBT(false)} className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div>
              <p className="text-xs font-medium" style={{ color: "oklch(0.52 0.025 148)" }}>认知行为干预</p>
              <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.025 148)" }}>{card.type}</p>
            </div>
          </div>
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="p-4 rounded-2xl mb-4"
            style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "oklch(0.52 0.025 148)" }}>💭 你可能在想</p>
            <p className="text-sm italic leading-relaxed" style={{ color: "oklch(0.35 0.020 148)" }}>"{card.thought}"</p>
          </motion.div>
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="p-4 rounded-2xl mb-4"
            style={{ background: "oklch(0.88 0.030 155 / 0.5)", border: "1px solid oklch(0.82 0.030 152 / 0.4)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "oklch(0.38 0.040 148)" }}>🌿 换个角度看</p>
            <p className="text-sm leading-relaxed" style={{ color: "oklch(0.28 0.020 148)" }}>{card.reframe}</p>
          </motion.div>
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="p-4 rounded-2xl mb-6"
            style={{ background: "oklch(0.92 0.025 100 / 0.4)", border: "1px solid oklch(0.85 0.025 100 / 0.4)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "oklch(0.40 0.040 100)" }}>✏️ 试试这个</p>
            <p className="text-sm leading-relaxed" style={{ color: "oklch(0.30 0.020 100)" }}>{card.action}</p>
          </motion.div>
          <p className="text-xs text-center mb-4" style={{ color: "oklch(0.55 0.020 148)" }}>这张卡片对你有帮助吗？</p>
          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
              className="flex-1 py-3 rounded-2xl text-sm font-medium"
              style={{ background: "oklch(0.88 0.025 152 / 0.6)", color: "oklch(0.35 0.025 148)", border: "1px solid oklch(0.84 0.020 152 / 0.5)" }}>
              😐 没什么感觉
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
              className="flex-1 py-3 rounded-2xl text-sm font-medium"
              style={{ background: "oklch(0.42 0.055 150)", color: "white" }}>
              🌱 有些帮助
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }
  return (
    <div className="relative flex flex-col h-full overflow-hidden items-center justify-center"
      style={{ background: "linear-gradient(160deg, oklch(0.88 0.035 200) 0%, oklch(0.82 0.042 190) 100%)" }}>
      <GrainOverlay opacity={0.45} />
      <div className="relative z-10 flex flex-col items-center gap-5 px-8 w-full">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{ background: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.4)" }}>
          😔
        </motion.div>
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-center">
          <h2 className="text-xl font-semibold mb-2" style={{ color: "white", fontFamily: "'Noto Serif SC', serif" }}>
            今天有些难熬
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
            谢谢你愿意记录下来。<br />有一个小练习，也许能帮到你。
          </p>
        </motion.div>
        <motion.button
          initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          onClick={() => setShowCBT(true)}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-base font-semibold"
          style={{ background: "rgba(255,255,255,0.25)", color: "white", border: "1.5px solid rgba(255,255,255,0.5)", backdropFilter: "blur(8px)" }}>
          试试认知干预练习 →
        </motion.button>
        <motion.button
          initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          onClick={onBack}
          className="text-sm py-2"
          style={{ color: "rgba(255,255,255,0.7)" }}>
          现在不需要，回首页
        </motion.button>
      </div>
    </div>
  );
}

// ─── Capsule Record Screen ────────────────────────────────────────────────────
function CapsuleRecordScreen({ onBack, isPaid = false, onPaywall }: { onBack: () => void; isPaid?: boolean; onPaywall?: () => void }) {
  const [step, setStep] = useState<"intro" | "trigger" | "compose" | "confirm" | "done">("intro");
  const [trigger, setTrigger] = useState("");
  const [message, setMessage] = useState("");
  const TRIGGERS = [
    { id: "low3", label: "连续 3 天情绪低落时", icon: "🌧️" },
    { id: "low7", label: "连续 7 天情绪低落时", icon: "⛈️" },
    { id: "month1", label: "1 个月后", icon: "📅" },
    { id: "month3", label: "3 个月后", icon: "🗓️" },
    { id: "year1", label: "1 年后", icon: "🎋" },
  ];
  if (step === "done") {
    return (
      <div className="relative flex flex-col h-full overflow-hidden items-center justify-center"
        style={{ background: "linear-gradient(160deg, oklch(0.88 0.040 90) 0%, oklch(0.78 0.048 75) 100%)" }}>
        <GrainOverlay opacity={0.45} />
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180 }}
          className="relative z-10 flex flex-col items-center gap-5 px-8">
          <div className="text-7xl">✉️</div>
          <p className="text-2xl font-semibold text-center" style={{ color: "oklch(0.22 0.025 60)", fontFamily: "'Noto Serif SC', serif" }}>
            信件已封存
          </p>
          <p className="text-sm text-center leading-relaxed" style={{ color: "oklch(0.40 0.020 65)" }}>
            它会在你需要的时候，悄悄出现。<br />未来的你，会感谢现在的你。
          </p>
          <motion.button onClick={onBack} whileTap={{ scale: 0.97 }}
            className="mt-2 px-10 py-4 rounded-2xl text-base font-semibold"
            style={{ background: "oklch(0.42 0.055 75)", color: "white" }}>
            回到首页
          </motion.button>
        </motion.div>
      </div>
    );
  }
  if (step === "confirm") {
    const triggerLabel = TRIGGERS.find(t => t.id === trigger)?.label ?? "";
    return (
      <div className="relative flex flex-col h-full overflow-hidden"
        style={{ background: "linear-gradient(160deg, oklch(0.92 0.025 90) 0%, oklch(0.88 0.032 80) 100%)" }}>
        <GrainOverlay opacity={0.4} />
        <StatusBar />
        <div className="relative z-10 flex flex-col flex-1 px-6 pt-4 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setStep("compose")} className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.88 0.025 80 / 0.6)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 75)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <p className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 65)" }}>确认发送</p>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="p-4 rounded-2xl" style={{ background: "oklch(0.99 0.008 80 / 0.7)", border: "1px solid oklch(0.88 0.020 80 / 0.5)" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "oklch(0.52 0.025 75)" }}>解锁时机</p>
              <p className="text-sm font-semibold" style={{ color: "oklch(0.28 0.025 65)" }}>{triggerLabel}</p>
            </div>
            <div className="p-4 rounded-2xl flex-1" style={{ background: "oklch(0.99 0.008 80 / 0.7)", border: "1px solid oklch(0.88 0.020 80 / 0.5)" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "oklch(0.52 0.025 75)" }}>信件内容预览</p>
              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.28 0.020 65)" }}>{message || "（空信件）"}</p>
            </div>
            <div className="p-3 rounded-xl text-xs text-center" style={{ background: "oklch(0.88 0.025 80 / 0.4)", color: "oklch(0.42 0.025 65)" }}>
              🔒 信件加密保存，仅你可见
            </div>
          </div>
          <motion.button onClick={() => setStep("done")} whileTap={{ scale: 0.97 }}
            className="mt-6 w-full py-4 rounded-2xl text-base font-semibold"
            style={{ background: "oklch(0.42 0.055 75)", color: "white" }}>
            封存这封信 ✉️
          </motion.button>
        </div>
      </div>
    );
  }
  if (step === "compose") {
    return (
      <div className="relative flex flex-col h-full overflow-hidden"
        style={{ background: "linear-gradient(160deg, oklch(0.92 0.025 90) 0%, oklch(0.88 0.032 80) 100%)" }}>
        <GrainOverlay opacity={0.4} />
        <StatusBar />
        <div className="relative z-10 flex flex-col flex-1 px-6 pt-4 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setStep("trigger")} className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.88 0.025 80 / 0.6)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 75)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div>
              <p className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 65)" }}>写下你想说的话</p>
              <p className="text-xs" style={{ color: "oklch(0.52 0.025 75)" }}>对未来的自己说</p>
            </div>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="亲爱的未来的我，\n\n今天我想对你说……\n\n无论你现在感觉怎么样，你已经走过了很多。"
              className="w-full h-full px-4 py-4 rounded-2xl text-sm leading-relaxed resize-none outline-none"
              style={{
                background: "oklch(0.99 0.008 80 / 0.7)",
                border: "1px solid oklch(0.88 0.020 80 / 0.5)",
                color: "oklch(0.25 0.020 65)",
                fontFamily: "'Noto Serif SC', serif",
              }}
            />
          </div>
          <motion.button
            onClick={() => setStep("confirm")}
            whileTap={{ scale: 0.97 }}
            className="mt-4 w-full py-4 rounded-2xl text-base font-semibold"
            style={{ background: "oklch(0.42 0.055 75)", color: "white" }}>
            下一步：确认发送
          </motion.button>
        </div>
      </div>
    );
  }
  if (step === "trigger") {
    return (
      <div className="relative flex flex-col h-full overflow-hidden"
        style={{ background: "linear-gradient(160deg, oklch(0.92 0.025 90) 0%, oklch(0.88 0.032 80) 100%)" }}>
        <GrainOverlay opacity={0.4} />
        <StatusBar />
        <div className="relative z-10 flex flex-col flex-1 px-6 pt-4 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setStep("intro")} className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.88 0.025 80 / 0.6)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 75)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div>
              <p className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 65)" }}>选择解锁时机</p>
              <p className="text-xs" style={{ color: "oklch(0.52 0.025 75)" }}>什么时候，让未来的你看到这封信？</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {TRIGGERS.map(t => (
              <motion.button key={t.id} onClick={() => setTrigger(t.id)} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 px-4 py-4 rounded-2xl text-left"
                style={{
                  background: trigger === t.id ? "oklch(0.42 0.055 75 / 0.15)" : "oklch(0.99 0.008 80 / 0.7)",
                  border: `1.5px solid ${trigger === t.id ? "oklch(0.42 0.055 75 / 0.6)" : "oklch(0.88 0.020 80 / 0.5)"}`,
                }}>
                <span className="text-2xl">{t.icon}</span>
                <p className="text-sm font-medium flex-1" style={{ color: "oklch(0.25 0.025 65)" }}>{t.label}</p>
                {trigger === t.id && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "oklch(0.42 0.055 75)" }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
          <motion.button
            onClick={() => trigger && setStep("compose")}
            whileTap={{ scale: 0.97 }}
            className="mt-4 w-full py-4 rounded-2xl text-base font-semibold"
            style={{ background: trigger ? "oklch(0.42 0.055 75)" : "oklch(0.82 0.020 80)", color: "white" }}>
            下一步：写信
          </motion.button>
        </div>
      </div>
    );
  }
  // intro
  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "linear-gradient(160deg, oklch(0.88 0.040 90) 0%, oklch(0.78 0.048 75) 100%)" }}>
      <GrainOverlay opacity={0.5} />
      <StatusBar light />
      <div className="relative z-10 flex flex-col flex-1 px-6 pt-4 pb-8">
        <div className="flex justify-end mb-4">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.25)" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180 }} className="text-8xl">✉️</motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-center">
            <h2 className="text-2xl font-semibold mb-3" style={{ color: "oklch(0.22 0.025 60)", fontFamily: "'Noto Serif SC', serif" }}>
              给未来的自己
            </h2>
            <p className="text-sm leading-relaxed px-4" style={{ color: "oklch(0.38 0.020 65)" }}>
              在你状态最好的时候，录制一封信。<br />
              它会在你最需要的时候，悄悄出现。
            </p>
          </motion.div>
        </div>
        <motion.button onClick={() => setStep("trigger")} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-base font-semibold"
          style={{ background: "oklch(0.42 0.055 75)", color: "white" }}>
          开始录制 →
        </motion.button>
      </div>
    </div>
  );
}

// ─── Capsule View Screen ──────────────────────────────────────────────────────
function CapsuleViewScreen({ onBack }: { onBack: () => void }) {
  const [opened, setOpened] = useState(false);
  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "linear-gradient(160deg, oklch(0.88 0.040 90) 0%, oklch(0.78 0.048 75) 100%)" }}>
      <GrainOverlay opacity={0.5} />
      <StatusBar light />
      <div className="relative z-10 flex flex-col flex-1 px-6 pt-4 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.25)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 60)" }}>发光盲盒</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <AnimatePresence mode="wait">
            {!opened ? (
              <motion.div key="closed" className="flex flex-col items-center gap-6"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                <motion.div
                  animate={{ y: [0, -8, 0], rotate: [0, 2, -2, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="text-8xl cursor-pointer select-none"
                  onClick={() => setOpened(true)}
                >
                  📦
                </motion.div>
                <div className="text-center">
                  <p className="text-lg font-semibold mb-2" style={{ color: "oklch(0.22 0.025 60)", fontFamily: "'Noto Serif SC', serif" }}>
                    有一封信在等你
                  </p>
                  <p className="text-sm" style={{ color: "oklch(0.42 0.020 65)" }}>
                    来自 42 天前的你
                  </p>
                </div>
                <motion.button onClick={() => setOpened(true)} whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 rounded-2xl text-base font-semibold"
                  style={{ background: "rgba(255,255,255,0.3)", color: "oklch(0.22 0.025 60)", border: "1.5px solid rgba(255,255,255,0.5)", backdropFilter: "blur(8px)" }}>
                  打开信件 ✨
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="opened" className="w-full flex flex-col gap-4"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-center mb-2">
                  <p className="text-4xl mb-2">✉️</p>
                  <p className="text-xs" style={{ color: "oklch(0.45 0.025 65)" }}>42 天前 · 2026年3月25日</p>
                </div>
                <div className="p-5 rounded-2xl"
                  style={{ background: "oklch(0.99 0.008 80 / 0.8)", border: "1px solid oklch(0.88 0.020 80 / 0.5)" }}>
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.25 0.020 65)", fontFamily: "'Noto Serif SC', serif" }}>
                    亲爱的未来的我，<br /><br />
                    今天我状态很好，刚完成了一个重要的项目。我想告诉你：无论你现在感觉怎么样，你已经走过了很多困难的时刻。<br /><br />
                    如果你现在很累，请记得——你值得好好休息。如果你现在很焦虑，请记得——大多数担心的事情最终都没有发生。<br /><br />
                    爱你的，42 天前的自己 🌿
                  </p>
                </div>
                <motion.button onClick={onBack} whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-2xl text-base font-semibold"
                  style={{ background: "oklch(0.42 0.055 75)", color: "white" }}>
                  收好了，谢谢过去的自己
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Medication Reminders Screen ──────────────────────────────────────────────
function MedsScreen({ onBack, meds: propMeds, setMeds: propSetMeds }: { onBack: () => void; meds?: Array<{ id: number; name: string; dose: string; times: string[]; days: string; stock: number; note: string; active: boolean }>; setMeds?: React.Dispatch<React.SetStateAction<Array<{ id: number; name: string; dose: string; times: string[]; days: string; stock: number; note: string; active: boolean }>>> }) {
  const [localMeds, setLocalMeds] = useState(MEDS_DATA);
  const meds = propMeds !== undefined ? propMeds : localMeds;
  const setMeds = propSetMeds !== undefined ? propSetMeds : setLocalMeds;
  const [todayDone, setTodayDone] = useState<Record<string, boolean>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", dose: "", time: "08:00", note: "" });
  const toggleActive = (id: number) => {
    setMeds(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };
  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(0.96 0.014 155)" }}>
      <GrainOverlay opacity={0.3} />
      <StatusBar />
      <div className="relative z-10 flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 148)" }}>用药提醒</h2>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.42 0.055 150)" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2V12M2 7H12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-8">
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
              <div className="p-4 rounded-2xl" style={{ background: "oklch(0.99 0.006 155 / 0.9)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
                <p className="text-sm font-semibold mb-3" style={{ color: "oklch(0.25 0.025 148)" }}>添加新药物</p>
                <div className="flex flex-col gap-2">
                  <input value={newMed.name} onChange={e => setNewMed(p => ({ ...p, name: e.target.value }))}
                    placeholder="药物名称（如：舍曲林）"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "oklch(0.92 0.018 152 / 0.7)", border: "1px solid oklch(0.86 0.022 152 / 0.5)", color: "oklch(0.25 0.020 148)" }} />
                  <div className="flex gap-2">
                    <input value={newMed.dose} onChange={e => setNewMed(p => ({ ...p, dose: e.target.value }))}
                      placeholder="剂量（如：50mg）"
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "oklch(0.92 0.018 152 / 0.7)", border: "1px solid oklch(0.86 0.022 152 / 0.5)", color: "oklch(0.25 0.020 148)" }} />
                    <input value={newMed.time} onChange={e => setNewMed(p => ({ ...p, time: e.target.value }))}
                      type="time"
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "oklch(0.92 0.018 152 / 0.7)", border: "1px solid oklch(0.86 0.022 152 / 0.5)", color: "oklch(0.25 0.020 148)" }} />
                  </div>
                  <input value={newMed.note} onChange={e => setNewMed(p => ({ ...p, note: e.target.value }))}
                    placeholder="备注（可选，如：饭后服用）"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "oklch(0.92 0.018 152 / 0.7)", border: "1px solid oklch(0.86 0.022 152 / 0.5)", color: "oklch(0.25 0.020 148)" }} />
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => {
                      if (newMed.name) {
                        setMeds(prev => [...prev, { id: Date.now(), name: newMed.name, dose: newMed.dose, times: [newMed.time], days: "每天", stock: 30, note: newMed.note, active: true }]);
                        setNewMed({ name: "", dose: "", time: "08:00", note: "" });
                        setShowAdd(false);
                      }
                    }} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: "oklch(0.42 0.055 150)", color: "white" }}>
                      添加
                    </button>
                    <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl text-sm"
                      style={{ background: "oklch(0.88 0.025 152 / 0.6)", color: "oklch(0.42 0.025 148)" }}>
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Today's schedule */}
        {meds.length > 0 ? (
          <div className="mb-4 p-4 rounded-2xl" style={{ background: "oklch(0.88 0.030 155 / 0.5)", border: "1px solid oklch(0.82 0.030 152 / 0.4)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "oklch(0.38 0.040 148)" }}>📅 今日服药计划</p>
            {meds.flatMap(med => med.times.map(t => ({ time: t, name: `${med.name} ${med.dose}`, id: `${med.id}-${t}` }))).map((item) => (
              <div key={item.id} className="flex items-center gap-3 mb-2 last:mb-0">
                <button
                  onClick={() => setTodayDone(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: todayDone[item.id] ? "oklch(0.42 0.055 150)" : "oklch(0.88 0.020 152)", border: todayDone[item.id] ? "none" : "1.5px solid oklch(0.72 0.025 148)" }}>
                  {todayDone[item.id] && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
                <span className="text-xs font-medium" style={{ color: "oklch(0.45 0.025 148)" }}>{item.time}</span>
                <span className="text-sm" style={{ color: todayDone[item.id] ? "oklch(0.62 0.025 148)" : "oklch(0.25 0.025 148)", textDecoration: todayDone[item.id] ? "line-through" : "none" }}>{item.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-4 p-4 rounded-2xl text-center" style={{ background: "oklch(0.88 0.030 155 / 0.5)", border: "1px solid oklch(0.82 0.030 152 / 0.4)" }}>
            <p className="text-xs" style={{ color: "oklch(0.52 0.025 148)" }}>暂无今日服药计划</p>
            <p className="text-[10px] mt-1" style={{ color: "oklch(0.65 0.018 148)" }}>点击右上角 + 添加药物</p>
          </div>
        )}
        {/* Med list */}
        <p className="text-xs font-semibold mb-3" style={{ color: "oklch(0.45 0.025 148)" }}>药物列表</p>
        {meds.map((med, i) => (
          <motion.div key={med.id} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.06 }}
            className="mb-3 p-4 rounded-2xl"
            style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)", opacity: med.active ? 1 : 0.55 }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.025 148)" }}>{med.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.025 148)" }}>{med.dose} · {med.days}</p>
              </div>
              <button onClick={() => toggleActive(med.id)}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: med.active ? "oklch(0.42 0.055 150 / 0.12)" : "oklch(0.88 0.020 152 / 0.6)", color: med.active ? "oklch(0.32 0.045 148)" : "oklch(0.55 0.020 148)" }}>
                {med.active ? "提醒中" : "已暂停"}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                {med.times.map((t, ti) => (
                  <span key={ti} className="px-2 py-0.5 rounded-full text-xs"
                    style={{ background: "oklch(0.88 0.025 152 / 0.6)", color: "oklch(0.38 0.025 148)" }}>🔔 {t}</span>
                ))}
              </div>
              <span className="text-xs ml-auto" style={{ color: "oklch(0.55 0.020 148)" }}>库存 {med.stock} 粒</span>
            </div>
            {med.note && <p className="text-xs mt-2" style={{ color: "oklch(0.55 0.020 148)" }}>📝 {med.note}</p>}
          </motion.div>
        ))}
        {/* Privacy note */}
        <div className="p-3 rounded-xl text-xs text-center mt-2"
          style={{ background: "oklch(0.92 0.018 152 / 0.5)", color: "oklch(0.52 0.025 148)" }}>
          🔒 用药数据仅存储在本地，不会上传
        </div>
      </div>
    </div>
  );
}

// ─── Visit Report Screen ──────────────────────────────────────────────────────
function ReportScreen({ onBack }: { onBack: () => void }) {
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const generate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800);
  };
  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(0.96 0.014 155)" }}>
      <GrainOverlay opacity={0.3} />
      <StatusBar />
      <div className="relative z-10 flex items-center gap-3 px-5 py-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 148)" }}>就诊报告</h2>
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-8">
        {!generated ? (
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="p-4 rounded-2xl mb-4" style={{ background: "oklch(0.88 0.030 155 / 0.5)", border: "1px solid oklch(0.82 0.030 152 / 0.4)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "oklch(0.38 0.040 148)" }}>📋 报告将包含</p>
              {["近 30 天情绪趋势折线图", "情绪低谷时间分布", "主要压力场景标签统计", "用药记录与依从率", "睡眠与情绪相关性（如有记录）", "AI 树洞对话摘要"].map((item, i) => (
                <div key={i} className="flex items-center gap-2 mt-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "oklch(0.42 0.055 150 / 0.2)" }}>
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="oklch(0.38 0.045 148)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span className="text-xs" style={{ color: "oklch(0.30 0.020 148)" }}>{item}</span>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl mb-4 text-xs"
              style={{ background: "oklch(0.92 0.025 100 / 0.3)", border: "1px solid oklch(0.85 0.025 100 / 0.4)", color: "oklch(0.38 0.030 100)" }}>
              💡 建议就诊前 1-2 天生成，确保数据最新
            </div>
            <motion.button
              onClick={generate}
              disabled={generating}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl text-base font-semibold flex items-center justify-center gap-2"
              style={{ background: generating ? "oklch(0.82 0.020 152)" : "oklch(0.42 0.055 150)", color: "white" }}>
              {generating ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  生成中……
                </>
              ) : "生成就诊报告"}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="p-4 rounded-2xl mb-4"
              style={{ background: "oklch(0.99 0.006 155 / 0.9)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.025 148)" }}>情绪健康就诊报告</p>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.025 148)" }}>2026年4月6日 — 5月6日</p>
                </div>
                <div className="px-2 py-1 rounded-lg text-xs" style={{ background: "oklch(0.42 0.055 150 / 0.12)", color: "oklch(0.32 0.045 148)" }}>PDF 预览</div>
              </div>
              {/* Simulated report content */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: "oklch(0.38 0.030 148)" }}>情绪趋势（近 30 天）</p>
                  <div className="flex gap-0.5 items-end h-10">
                    {[4,3,5,2,4,6,5,3,4,5,6,4,3,2,4,5,6,5,4,3,5,6,4,5,3,4,5,6,7,5].map((v, i) => (
                      <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${v * 10}%`, background: MOOD_SCREENS[v-1].bg }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px]" style={{ color: "oklch(0.55 0.020 148)" }}>4月6日</span>
                    <span className="text-[9px]" style={{ color: "oklch(0.55 0.020 148)" }}>5月6日</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "平均情绪分", value: "4.2 / 7" },
                    { label: "打卡天数", value: "26 / 30 天" },
                    { label: "最常见压力源", value: "截止日 · 汇报" },
                    { label: "用药依从率", value: "89%" },
                  ].map((item, i) => (
                    <div key={i} className="p-2.5 rounded-xl" style={{ background: "oklch(0.94 0.015 152 / 0.6)" }}>
                      <p className="text-[9px] mb-0.5" style={{ color: "oklch(0.52 0.025 148)" }}>{item.label}</p>
                      <p className="text-sm font-semibold" style={{ color: "oklch(0.25 0.025 148)" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.97 }}
                className="flex-1 py-3.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
                style={{ background: "oklch(0.42 0.055 150)", color: "white" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1V9M7 9L4 6M7 9L10 6M2 11H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                下载 PDF
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }}
                className="flex-1 py-3.5 rounded-2xl text-sm font-medium"
                style={{ background: "oklch(0.88 0.025 152 / 0.6)", color: "oklch(0.35 0.025 148)", border: "1px solid oklch(0.84 0.020 152 / 0.5)" }}>
                分享给医生
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Stats Unlocked Screen (paid deep analysis) ───────────────────────────────
function StatsUnlockedScreen({ onBack, isPaid = false, onPaywall }: { onBack: () => void; isPaid?: boolean; onPaywall?: () => void }) {
  const [period, setPeriod] = useState<StatsPeriod>("30days");
  const periodLabels: Record<StatsPeriod, string> = { week: "本周", lastweek: "上周", "30days": "30天", all: "全部" };
  const STRESS_SOURCES = [
    { label: "截止日 / 汇报", count: 12, pct: 38 },
    { label: "熬夜 / 睡眠不足", count: 8, pct: 25 },
    { label: "人际冲突", count: 5, pct: 16 },
    { label: "身体不适", count: 4, pct: 13 },
    { label: "其他", count: 3, pct: 8 },
  ];
  const BEST_TIMES = [
    { label: "周六下午", score: 6.2 },
    { label: "周日上午", score: 5.8 },
    { label: "工作日晚上", score: 4.9 },
    { label: "工作日上午", score: 4.1 },
    { label: "工作日下午", score: 3.5 },
  ];
  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(0.96 0.014 155)" }}>
      <GrainOverlay opacity={0.3} />
      <StatusBar />
      <div className="relative z-10 flex items-center gap-3 px-5 py-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h2 className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 148)" }}>深度情绪分析</h2>
          <p className="text-xs" style={{ color: "oklch(0.52 0.025 148)" }}>完整版 · 已解锁</p>
        </div>
        <div className="ml-auto px-2 py-1 rounded-full text-xs" style={{ background: "oklch(0.42 0.055 150 / 0.12)", color: "oklch(0.32 0.045 148)" }}>✨ 付费版</div>
      </div>
      <div className="relative z-10 flex gap-2 px-5 mb-3">
        {(["week", "lastweek", "30days", "all"] as StatsPeriod[]).map(p => (
          <motion.button key={p} onClick={() => setPeriod(p)} whileTap={{ scale: 0.95 }}
            className="flex-1 py-2 rounded-xl text-xs font-medium"
            style={{ background: period === p ? "oklch(0.42 0.055 150)" : "oklch(0.99 0.006 155 / 0.8)", color: period === p ? "white" : "oklch(0.42 0.025 148)", border: `1px solid ${period === p ? "transparent" : "oklch(0.88 0.020 152 / 0.5)"}` }}>
            {periodLabels[p]}
          </motion.button>
        ))}
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-8 space-y-4">
        {/* AI insight summary */}
        <div className="p-4 rounded-2xl" style={{ background: "oklch(0.88 0.030 155 / 0.5)", border: "1px solid oklch(0.82 0.030 152 / 0.4)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "oklch(0.38 0.040 148)" }}>🌿 AI 情绪洞察</p>
          <p className="text-sm leading-relaxed" style={{ color: "oklch(0.28 0.020 148)" }}>
            过去 30 天，你的情绪整体呈<strong>轻微上升趋势</strong>。压力高峰集中在每周三至周四，与截止日高度相关。周末情绪明显好于工作日，差值约 1.8 分。
          </p>
        </div>
        {/* Stress sources */}
        <div className="p-4 rounded-2xl" style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "oklch(0.25 0.025 148)" }}>压力源排名</p>
          {STRESS_SOURCES.map((s, i) => (
            <div key={i} className="mb-2.5 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: "oklch(0.35 0.020 148)" }}>{s.label}</span>
                <span className="text-xs font-medium" style={{ color: "oklch(0.42 0.025 148)" }}>{s.count} 次 · {s.pct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.88 0.020 152 / 0.5)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="h-full rounded-full" style={{ background: MOOD_SCREENS[Math.max(0, 3 - i)].bg }} />
              </div>
            </div>
          ))}
        </div>
        {/* Best/worst times */}
        <div className="p-4 rounded-2xl" style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "oklch(0.25 0.025 148)" }}>最佳 / 最差时段</p>
          {BEST_TIMES.map((t, i) => (
            <div key={i} className="flex items-center gap-3 mb-2 last:mb-0">
              <span className="text-xs w-20 flex-shrink-0" style={{ color: "oklch(0.42 0.025 148)" }}>{t.label}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.88 0.020 152 / 0.5)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(t.score / 7) * 100}%` }} transition={{ delay: i * 0.06, duration: 0.5 }}
                  className="h-full rounded-full" style={{ background: MOOD_SCREENS[Math.round(t.score) - 1].bg }} />
              </div>
              <span className="text-xs font-medium w-8 text-right" style={{ color: "oklch(0.35 0.025 148)" }}>{t.score}</span>
            </div>
          ))}
        </div>
        {/* Emotion-behavior correlation */}
        <div className="p-4 rounded-2xl" style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "oklch(0.25 0.025 148)" }}>情绪-行为关联洞察</p>
          {[
            { icon: "🌙", text: "熬夜后的第二天，情绪评分平均下降 2.3 分" },
            { icon: "🏃", text: "运动当天的情绪比平均高 1.6 分" },
            { icon: "☕", text: "咖啡因摄入与焦虑标签共现率 67%" },
            { icon: "💼", text: "汇报前一天情绪低落概率 78%" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 mb-3 last:mb-0">
              <span className="text-base flex-shrink-0">{item.icon}</span>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.30 0.020 148)" }}>{item.text}</p>
            </motion.div>
          ))}
        </div>
        {/* Generate report CTA */}
        <motion.button whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: "oklch(0.42 0.055 150)", color: "white" }}>
          📋 生成就诊报告
        </motion.button>
      </div>
    </div>
  );
}

// ─── Subscribe Screen ─────────────────────────────────────────────────────────
function SubscribeScreen({ onBack, onSubscribed }: { onBack: () => void; onSubscribed?: () => void }) {
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [subscribed, setSubscribed] = useState(false);
  if (subscribed) {
    return (
      <div className="relative flex flex-col h-full overflow-hidden items-center justify-center"
        style={{ background: "linear-gradient(160deg, oklch(0.78 0.048 150) 0%, oklch(0.68 0.055 148) 100%)" }}>
        <GrainOverlay opacity={0.45} />
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180 }}
          className="relative z-10 flex flex-col items-center gap-5 px-8">
          <div className="text-7xl">🌿</div>
          <p className="text-2xl font-semibold text-center" style={{ color: "white", fontFamily: "'Noto Serif SC', serif" }}>
            欢迎加入完整版
          </p>
          <p className="text-sm text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
            14 天免费试用已开始<br />所有功能现已解锁
          </p>
          <motion.button onClick={() => { onSubscribed?.(); onBack(); }} whileTap={{ scale: 0.97 }}
            className="mt-2 px-10 py-4 rounded-2xl text-base font-semibold"
            style={{ background: "rgba(255,255,255,0.25)", color: "white", border: "1.5px solid rgba(255,255,255,0.5)", backdropFilter: "blur(8px)" }}>
            开始探索完整版 →
          </motion.button>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "linear-gradient(160deg, oklch(0.94 0.020 155) 0%, oklch(0.90 0.028 148) 100%)" }}>
      <GrainOverlay opacity={0.4} />
      <StatusBar />
      <div className="relative z-10 flex flex-col flex-1 px-6 pt-4 pb-8 overflow-y-auto">
        <div className="flex justify-end mb-2">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="text-center mb-6">
          <p className="text-3xl mb-2">🌿</p>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>
            MindWork 完整版
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.45 0.025 148)" }}>14 天免费试用，随时可取消</p>
        </div>
        {/* Features */}
        <div className="mb-5 p-4 rounded-2xl" style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
          {[
            { icon: "💬", text: "AI 树洞无限对话" },
            { icon: "📊", text: "深度情绪分析 + 压力源排名" },
            { icon: "✉️", text: "胶囊信件录制与接收" },
            { icon: "📋", text: "就诊 PDF 报告生成" },
            { icon: "🧠", text: "CBT 卡片全库（120 条）" },
            { icon: "📖", text: "情绪日记永久存储" },
            { icon: "🎨", text: "自定义主题与图标" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 mb-2.5 last:mb-0">
              <span className="text-base">{item.icon}</span>
              <span className="text-sm" style={{ color: "oklch(0.28 0.020 148)" }}>{item.text}</span>
              <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.42 0.055 150 / 0.2)" }}>
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="oklch(0.38 0.045 148)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          ))}
        </div>
        {/* Plan selector */}
        <div className="flex gap-3 mb-4">
          {[
            { id: "yearly" as const, label: "年付", price: "¥298", sub: "¥24.8/月", badge: "省 40%" },
            { id: "monthly" as const, label: "月付", price: "¥42", sub: "¥42/月", badge: null },
          ].map(p => (
            <motion.button key={p.id} onClick={() => setPlan(p.id)} whileTap={{ scale: 0.97 }}
              className="flex-1 p-4 rounded-2xl text-left relative"
              style={{ background: plan === p.id ? "oklch(0.42 0.055 150 / 0.12)" : "oklch(0.99 0.006 155 / 0.8)", border: `1.5px solid ${plan === p.id ? "oklch(0.42 0.055 150 / 0.6)" : "oklch(0.88 0.020 152 / 0.5)"}` }}>
              {p.badge && (
                <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "oklch(0.42 0.055 150)", color: "white" }}>{p.badge}</span>
              )}
              <p className="text-xs font-medium mb-1" style={{ color: "oklch(0.52 0.025 148)" }}>{p.label}</p>
              <p className="text-xl font-bold" style={{ color: "oklch(0.22 0.025 148)" }}>{p.price}</p>
              <p className="text-xs" style={{ color: "oklch(0.52 0.025 148)" }}>{p.sub}</p>
            </motion.button>
          ))}
        </div>
        <motion.button onClick={() => setSubscribed(true)} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-base font-semibold"
          style={{ background: "oklch(0.42 0.055 150)", color: "white" }}>
          开始 14 天免费试用
        </motion.button>
        <p className="text-center text-xs mt-3" style={{ color: "oklch(0.55 0.020 148)" }}>
          试用期结束后自动续费 · 随时可在设置中取消
        </p>
      </div>
    </div>
  );
}

// ─── Journal Add Screen (补录) ────────────────────────────────────────────────
function JournalAddScreen({ onBack }: { onBack: () => void }) {
  const [selectedDate, setSelectedDate] = useState("2026-05-06");
  const [selectedMood, setSelectedMood] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  if (saved) {
    return (
      <div className="relative flex flex-col h-full overflow-hidden items-center justify-center"
        style={{ background: MOOD_SCREENS[selectedMood].bg }}>
        <GrainOverlay opacity={0.4} />
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180 }}
          className="relative z-10 flex flex-col items-center gap-4 px-8">
          <div className="text-6xl">{MOOD_SCREENS[selectedMood].icon}</div>
          <p className="text-xl font-semibold text-center" style={{ color: MOOD_SCREENS[selectedMood].textColor, fontFamily: "'Noto Serif SC', serif" }}>
            补录成功
          </p>
          <motion.button onClick={onBack} whileTap={{ scale: 0.97 }}
            className="mt-2 px-8 py-3.5 rounded-2xl text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.25)", color: MOOD_SCREENS[selectedMood].textColor, border: "1.5px solid rgba(255,255,255,0.5)" }}>
            返回日记
          </motion.button>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(0.96 0.014 155)" }}>
      <GrainOverlay opacity={0.3} />
      <StatusBar />
      <div className="relative z-10 flex items-center gap-3 px-5 py-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 148)" }}>补录历史记录</h2>
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-8">
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={{ color: "oklch(0.45 0.025 148)" }}>选择日期</p>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            max="2026-05-06"
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
            style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)", color: "oklch(0.25 0.020 148)" }} />
        </div>
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={{ color: "oklch(0.45 0.025 148)" }}>那天的心情</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {MOOD_SCREENS.map((m, i) => (
              <motion.button key={i} onClick={() => setSelectedMood(i)} whileTap={{ scale: 0.93 }}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl"
                style={{ background: selectedMood === i ? m.bg : "oklch(0.92 0.018 152 / 0.6)", border: `1.5px solid ${selectedMood === i ? "transparent" : "oklch(0.86 0.020 152 / 0.4)"}` }}>
                <span className="text-xl">{m.icon}</span>
                <span className="text-[10px] font-medium" style={{ color: selectedMood === i ? m.textColor : "oklch(0.42 0.025 148)" }}>{m.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={{ color: "oklch(0.45 0.025 148)" }}>发生了什么？</p>
          <div className="flex flex-wrap gap-2">
            {SCENE_TAGS.map((tag, i) => (
              <motion.button key={i} onClick={() => toggleTag(tag)} whileTap={{ scale: 0.93 }}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: selectedTags.includes(tag) ? "oklch(0.42 0.055 150)" : "oklch(0.92 0.018 152 / 0.8)", color: selectedTags.includes(tag) ? "white" : "oklch(0.35 0.025 148)", border: selectedTags.includes(tag) ? "none" : "1px solid oklch(0.86 0.020 152 / 0.5)" }}>
                {tag}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <p className="text-xs font-medium mb-2" style={{ color: "oklch(0.45 0.025 148)" }}>想说点什么？</p>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="那天的感受……"
            rows={4}
            className="w-full px-4 py-3 rounded-2xl text-sm resize-none outline-none"
            style={{ background: "oklch(0.99 0.006 155 / 0.8)", border: "1px solid oklch(0.88 0.020 152 / 0.5)", color: "oklch(0.25 0.020 148)" }} />
        </div>
        <motion.button onClick={() => setSaved(true)} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-base font-semibold"
          style={{ background: "oklch(0.42 0.055 150)", color: "white" }}>
          保存补录
        </motion.button>
      </div>
    </div>
  );
}



// ─── More Screen ──────────────────────────────────────────────────────────────
function MoreScreen({ onNav, isPaid = false }: { onNav: (s: Screen) => void; isPaid?: boolean }) {
  const menuGroups = [
    {
      title: "健康管理",
      items: [
        { icon: "💊", label: "用药提醒", desc: "管理每日服药计划", screen: "meds" as Screen, arrow: true },
        { icon: "📋", label: "就诊数据", desc: "导出情绪记录 · PDF / CSV / JSON", screen: "export" as Screen, arrow: true },
        { icon: "✉️", label: "给未来的自己", desc: isPaid ? "录制胶囊信件 · 已解锁" : "录制情感胶囊，在未来某天开启", screen: isPaid ? "capsule-record" as Screen : "paywall-capsule" as Screen, arrow: true },
      ],
    },
    {
      title: "设置",
      items: [
        { icon: "🔔", label: "通知偏好", desc: "打卡提醒、危机预警", screen: "notifications" as Screen, arrow: true },
        { icon: "🎨", label: "主题外观", desc: "浅色 / 深色 / 跟随系统", screen: "theme" as Screen, arrow: true },
      ],
    },
    {
      title: "账号",
      items: [
        { icon: "💎", label: isPaid ? "管理订阅" : "升级到完整版 ✨", desc: isPaid ? "已订阅 · 管理或取消" : "解锁 AI 树洞无限对话、深度分析、胶囊信件", screen: "subscribe" as Screen, arrow: true, highlight: !isPaid },
        { icon: "🚪", label: "退出 / 注销账号", desc: "清除本地数据并退出", screen: "logout-confirm" as Screen, arrow: true, danger: true },
      ],
    },
    {
      title: "关于",
      items: [
        { icon: "📋", label: "版本信息", desc: "MindWork v1.0.0 (原型)", screen: null, arrow: false },
        { icon: "💌", label: "意见反馈", desc: "帮助我们做得更好", screen: null, arrow: true },
      ],
    },
  ];

  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(0.96 0.012 155)" }}>
      <GrainOverlay opacity={0.3} />
      <StatusBar />
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto pb-24">
        {/* Profile header */}
        <motion.div
          initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="relative mx-5 mt-4 mb-5 p-5 rounded-3xl grain"
          style={{ background: "linear-gradient(135deg, oklch(0.88 0.038 155) 0%, oklch(0.80 0.045 148) 100%)", borderRadius: "1.5rem" }}
        >
          <GrainOverlay opacity={0.4} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: "oklch(0.99 0.008 155 / 0.4)", backdropFilter: "blur(8px)", border: "1px solid oklch(0.88 0.025 152 / 0.5)" }}>
              🌿
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>你好，用户</p>
                {isPaid && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: "oklch(0.42 0.055 150 / 0.2)", color: "oklch(0.32 0.045 148)", border: "1px solid oklch(0.42 0.055 150 / 0.4)" }}>
                    ✨ 完整版
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: "oklch(0.45 0.025 148)" }}>已记录 14 天 · 本周平均情绪 4.2</p>
            </div>
          </div>
          <div className="relative z-10 flex gap-3 mt-4">
            {[{ label: "打卡天数", value: "14" }, { label: "本月平均", value: "4.2" }, { label: "最长连续", value: "7天" }].map(s => (
              <div key={s.label} className="flex-1 text-center py-2 rounded-xl" style={{ background: "oklch(0.99 0.008 155 / 0.35)" }}>
                <p className="text-base font-bold" style={{ color: "oklch(0.28 0.030 148)" }}>{s.value}</p>
                <p className="text-[9px] mt-0.5" style={{ color: "oklch(0.48 0.020 148)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {menuGroups.map((group, gi) => (
          <motion.div key={group.title} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 * gi }} className="mx-5 mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "oklch(0.62 0.025 148)" }}>{group.title}</p>
            <div className="rounded-2xl overflow-hidden" style={{ background: "oklch(0.99 0.006 155 / 0.85)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
              {group.items.map((item, ii) => (
                <div key={item.label}>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => item.screen ? onNav(item.screen) : undefined} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                    <span className="text-xl flex-shrink-0 w-8 text-center">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: (item as any).danger ? "oklch(0.55 0.120 25)" : (item as any).highlight ? "oklch(0.38 0.055 148)" : "oklch(0.25 0.025 148)" }}>{item.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "oklch(0.58 0.018 148)" }}>{item.desc}</p>
                    </div>
                    {item.arrow && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                        <path d="M4 2L8 6L4 10" stroke="oklch(0.72 0.015 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </motion.button>
                  {ii < group.items.length - 1 && <div className="ml-16 h-px" style={{ background: "oklch(0.90 0.012 152)" }} />}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
        <div className="h-4" />
      </div>
      <BottomNav active="more" onNav={onNav as any} />
    </div>
  );
}


// ─── Notifications Screen ─────────────────────────────────────────────────────
function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [dailyReminder, setDailyReminder] = useState(true);
  const [dailyTime, setDailyTime] = useState("09:00");
  const [eveningReminder, setEveningReminder] = useState(true);
  const [eveningTime, setEveningTime] = useState("21:00");
  const [cbtAlerts, setCbtAlerts] = useState(true);
  const [crisisAlerts, setCrisisAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const ToggleRow = ({ label, desc, value, onChange, children }: {
    label: string; desc: string; value: boolean; onChange: (v: boolean) => void; children?: React.ReactNode
  }) => (
    <div>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "oklch(0.25 0.025 148)" }}>{label}</p>
          <p className="text-[10px] mt-0.5" style={{ color: "oklch(0.58 0.018 148)" }}>{desc}</p>
        </div>
        <button
          onClick={() => onChange(!value)}
          className="w-11 h-6 rounded-full relative transition-all flex-shrink-0"
          style={{ background: value ? "oklch(0.42 0.055 150)" : "oklch(0.82 0.015 152)" }}
        >
          <motion.div
            animate={{ x: value ? 20 : 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
          />
        </button>
      </div>
      {value && children && (
        <motion.div
          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </div>
  );

  const TimeRow = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center justify-between px-4 py-2.5 mx-4 mb-3 rounded-xl"
      style={{ background: "oklch(0.94 0.018 155 / 0.6)" }}>
      <p className="text-xs" style={{ color: "oklch(0.45 0.025 148)" }}>{label}</p>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm font-semibold border-none outline-none bg-transparent"
        style={{ color: "oklch(0.32 0.040 148)" }}
      />
    </div>
  );

  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(0.96 0.012 155)" }}>
      <GrainOverlay opacity={0.3} />
      <StatusBar />
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <p className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>通知偏好</p>
            <p className="text-[10px]" style={{ color: "oklch(0.55 0.020 148)" }}>管理提醒和推送设置</p>
          </div>
        </div>

        {/* Daily reminder */}
        <div className="mx-5 mb-4 rounded-2xl overflow-hidden"
          style={{ background: "oklch(0.99 0.006 155 / 0.85)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider px-4 pt-3 pb-1"
            style={{ color: "oklch(0.62 0.025 148)" }}>打卡提醒</p>
          <ToggleRow label="早间打卡提醒" desc="每天早上提醒你记录今天的开始" value={dailyReminder} onChange={setDailyReminder}>
            <TimeRow label="提醒时间" value={dailyTime} onChange={setDailyTime} />
          </ToggleRow>
          <div className="mx-4 h-px" style={{ background: "oklch(0.90 0.012 152)" }} />
          <ToggleRow label="晚间打卡提醒" desc="每晚提醒你回顾今天的情绪" value={eveningReminder} onChange={setEveningReminder}>
            <TimeRow label="提醒时间" value={eveningTime} onChange={setEveningTime} />
          </ToggleRow>
        </div>

        {/* Intelligent alerts */}
        <div className="mx-5 mb-4 rounded-2xl overflow-hidden"
          style={{ background: "oklch(0.99 0.006 155 / 0.85)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider px-4 pt-3 pb-1"
            style={{ color: "oklch(0.62 0.025 148)" }}>智能提醒</p>
          <ToggleRow label="CBT 干预提醒" desc="情绪低落时推送认知调节建议" value={cbtAlerts} onChange={setCbtAlerts} />
          <div className="mx-4 h-px" style={{ background: "oklch(0.90 0.012 152)" }} />
          <ToggleRow label="危机关怀提醒" desc="连续低落时推送支持资源" value={crisisAlerts} onChange={setCrisisAlerts} />
          <div className="mx-4 h-px" style={{ background: "oklch(0.90 0.012 152)" }} />
          <ToggleRow label="每周情绪报告" desc="每周日推送本周情绪摘要" value={weeklyReport} onChange={setWeeklyReport} />
        </div>

        {/* Privacy note */}
        <div className="mx-5 mb-5 p-4 rounded-2xl"
          style={{ background: "oklch(0.92 0.020 155 / 0.5)", border: "1px solid oklch(0.85 0.020 152 / 0.4)" }}>
          <p className="text-[10px] leading-relaxed" style={{ color: "oklch(0.48 0.022 148)" }}>
            🔒 所有通知内容均在本地生成，不包含任何敏感情绪数据。锁屏通知默认显示为通用文案，保护你的隐私。
          </p>
        </div>

        {/* Save button */}
        <div className="mx-5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold"
            style={{ background: saved ? "oklch(0.52 0.080 148)" : "oklch(0.42 0.055 150)", color: "white" }}
          >
            {saved ? "✓ 已保存" : "保存设置"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ─── Theme Screen ─────────────────────────────────────────────────────────────
function ThemeScreen({ onBack }: { onBack: () => void }) {
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "auto">("light");
  const [accentColor, setAccentColor] = useState<"green" | "sage" | "teal" | "warm">("green");
  const [textSize, setTextSize] = useState<"small" | "medium" | "large">("medium");

  const themes = [
    { id: "light" as const, label: "浅色", icon: "☀️", desc: "明亮清爽的莫兰迪绿", bg: "oklch(0.96 0.012 155)", border: "oklch(0.82 0.025 152)" },
    { id: "dark" as const, label: "深色", icon: "🌙", desc: "沉静护眼的深夜模式", bg: "oklch(0.18 0.020 155)", border: "oklch(0.35 0.030 148)" },
    { id: "auto" as const, label: "跟随系统", icon: "⚙️", desc: "自动切换浅色/深色", bg: "linear-gradient(135deg, oklch(0.96 0.012 155) 50%, oklch(0.18 0.020 155) 50%)", border: "oklch(0.72 0.020 148)" },
  ];

  const accents = [
    { id: "green" as const, label: "莫兰迪绿", color: "oklch(0.52 0.080 148)" },
    { id: "sage" as const, label: "鼠尾草", color: "oklch(0.62 0.060 165)" },
    { id: "teal" as const, label: "青碧", color: "oklch(0.52 0.080 195)" },
    { id: "warm" as const, label: "暖沙", color: "oklch(0.62 0.060 75)" },
  ];

  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(0.96 0.012 155)" }}>
      <GrainOverlay opacity={0.3} />
      <StatusBar />
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <p className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>主题外观</p>
            <p className="text-[10px]" style={{ color: "oklch(0.55 0.020 148)" }}>个性化你的视觉体验</p>
          </div>
        </div>

        {/* Theme mode */}
        <div className="mx-5 mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: "oklch(0.62 0.025 148)" }}>外观模式</p>
          <div className="flex gap-3">
            {themes.map(t => (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTheme(t.id)}
                className="flex-1 p-3 rounded-2xl text-center"
                style={{
                  background: t.id === "auto" ? undefined : t.bg,
                  backgroundImage: t.id === "auto" ? t.bg : undefined,
                  border: selectedTheme === t.id ? `2px solid oklch(0.42 0.055 150)` : `1.5px solid ${t.border}`,
                  boxShadow: selectedTheme === t.id ? "0 0 0 3px oklch(0.42 0.055 150 / 0.15)" : "none",
                }}
              >
                <div className="text-xl mb-1">{t.icon}</div>
                <p className="text-xs font-semibold" style={{ color: t.id === "dark" ? "oklch(0.85 0.015 155)" : "oklch(0.28 0.025 148)" }}>{t.label}</p>
                <p className="text-[9px] mt-0.5 leading-tight" style={{ color: t.id === "dark" ? "oklch(0.65 0.020 148)" : "oklch(0.52 0.020 148)" }}>{t.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div className="mx-5 mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: "oklch(0.62 0.025 148)" }}>主题色</p>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "oklch(0.99 0.006 155 / 0.85)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
            <div className="flex gap-4 p-4">
              {accents.map(a => (
                <button key={a.id} onClick={() => setAccentColor(a.id)}
                  className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-2xl relative"
                    style={{
                      background: a.color,
                      boxShadow: accentColor === a.id ? `0 0 0 3px white, 0 0 0 5px ${a.color}` : "none",
                    }}>
                    {accentColor === a.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px]" style={{ color: "oklch(0.52 0.020 148)" }}>{a.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Text size */}
        <div className="mx-5 mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: "oklch(0.62 0.025 148)" }}>文字大小</p>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "oklch(0.99 0.006 155 / 0.85)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
            <div className="flex p-1 gap-1">
              {(["small", "medium", "large"] as const).map((s, i) => (
                <button key={s} onClick={() => setTextSize(s)}
                  className="flex-1 py-2.5 rounded-xl text-center transition-all"
                  style={{
                    background: textSize === s ? "oklch(0.42 0.055 150)" : "transparent",
                    color: textSize === s ? "white" : "oklch(0.45 0.025 148)",
                  }}>
                  <span style={{ fontSize: [11, 13, 15][i] }}>文</span>
                  <p className="text-[9px] mt-0.5">{["小", "中", "大"][i]}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview note */}
        <div className="mx-5 p-4 rounded-2xl"
          style={{ background: "oklch(0.92 0.020 155 / 0.5)", border: "1px solid oklch(0.85 0.020 152 / 0.4)" }}>
          <p className="text-[10px] leading-relaxed" style={{ color: "oklch(0.48 0.022 148)" }}>
            💡 主题切换为原型演示功能，实际 App 中将即时应用到所有页面。当前预览为浅色莫兰迪绿主题。
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Export Screen ────────────────────────────────────────────────────────────
function ExportScreen({ onBack }: { onBack: () => void }) {
  const [format, setFormat] = useState<"csv" | "pdf" | "json">("pdf");
  const [range, setRange] = useState<"week" | "month" | "all">("month");
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeCBT, setIncludeCBT] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = () => {
    setExporting(true);
    setProgress(0);

    // Generate mock data based on range
    const today = new Date();
    const days = range === "week" ? 7 : range === "month" ? 30 : 90;
    const MOOD_LABELS = ["", "极度低落", "低落", "有些低落", "平静", "还不错", "愉快", "非常愉快"];
    const SCENE_LABELS = ["工作压力", "会议", "熬夜", "运动", "社交", "休息", "家庭"];
    const records = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (days - 1 - i));
      const score = Math.floor(Math.random() * 6) + 2;
      return {
        date: d.toISOString().split("T")[0],
        time: `${String(Math.floor(Math.random() * 12) + 8).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
        score,
        mood: MOOD_LABELS[score],
        scene: SCENE_LABELS[Math.floor(Math.random() * SCENE_LABELS.length)],
        notes: includeNotes ? (score <= 3 ? "今天有点累，工作压力比较大" : score >= 6 ? "状态不错，完成了很多事" : "") : "",
        cbt: includeCBT && score <= 3 ? "触发了CBT干预：过度概括" : "",
      };
    });

    // Simulate progress then trigger download
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 18;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setProgress(100);

        // Generate file content
        let content = "";
        let mime = "text/plain";
        let filename = `mindwork_export_${today.toISOString().split("T")[0]}`;

        if (format === "csv") {
          const headers = ["日期", "时间", "情绪分值", "情绪状态", "场景"];
          if (includeNotes) headers.push("备注");
          if (includeCBT) headers.push("CBT记录");
          const rows = records.map(r => {
            const row = [r.date, r.time, String(r.score), r.mood, r.scene];
            if (includeNotes) row.push(r.notes);
            if (includeCBT) row.push(r.cbt);
            return row.map(v => `"${v}"`).join(",");
          });
          content = [headers.map(h => `"${h}"`).join(","), ...rows].join("\n");
          mime = "text/csv;charset=utf-8;";
          filename += ".csv";
        } else if (format === "json") {
          const exportData = {
            exportedAt: today.toISOString(),
            range,
            totalRecords: records.length,
            averageScore: (records.reduce((s, r) => s + r.score, 0) / records.length).toFixed(2),
            records: records.map(r => {
              const obj: Record<string, string | number> = { date: r.date, time: r.time, score: r.score, mood: r.mood, scene: r.scene };
              if (includeNotes) obj.notes = r.notes;
              if (includeCBT) obj.cbt = r.cbt;
              return obj;
            }),
          };
          content = JSON.stringify(exportData, null, 2);
          mime = "application/json";
          filename += ".json";
        } else {
          // PDF: generate a simple text-based representation
          const avg = (records.reduce((s, r) => s + r.score, 0) / records.length).toFixed(1);
          content = `MindWork 情绪健康报告\n${'='.repeat(40)}\n\n导出时间：${today.toLocaleDateString('zh-CN')}\n数据范围：近${days}天\n总记录数：${records.length} 条\n平均情绪分：${avg} / 7\n\n${'─'.repeat(40)}\n每日记录\n${'─'.repeat(40)}\n${records.map(r => `${r.date} ${r.time}  ${r.mood}（${r.score}分）  ${r.scene}${r.notes ? '\n  备注：' + r.notes : ''}${r.cbt ? '\n  CBT：' + r.cbt : ''}`).join('\n')}\n\n${'─'.repeat(40)}\n本报告由 MindWork 自动生成，仅供参考，不构成医疗诊断。`;
          mime = "text/plain;charset=utf-8;";
          filename += "_report.txt";
        }

        // Trigger browser download
        const blob = new Blob(["\uFEFF" + content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setTimeout(() => {
          setExporting(false);
          setDone(true);
        }, 300);
      } else {
        setProgress(prog);
      }
    }, 150);
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(0.96 0.012 155)" }}>
      <GrainOverlay opacity={0.3} />
      <StatusBar />
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <p className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>导出数据</p>
            <p className="text-[10px]" style={{ color: "oklch(0.55 0.020 148)" }}>将情绪记录导出到本地</p>
          </div>
        </div>

        {/* Format selector */}
        <div className="mx-5 mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: "oklch(0.62 0.025 148)" }}>导出格式</p>
          <div className="flex gap-2">
            {([
              { id: "pdf" as const, label: "PDF 报告", icon: "📄", desc: "适合打印和分享" },
              { id: "csv" as const, label: "CSV 表格", icon: "📊", desc: "适合数据分析" },
              { id: "json" as const, label: "JSON 原始", icon: "🗂", desc: "完整数据备份" },
            ]).map(f => (
              <motion.button key={f.id} whileTap={{ scale: 0.95 }}
                onClick={() => setFormat(f.id)}
                className="flex-1 p-3 rounded-2xl text-center"
                style={{
                  background: format === f.id ? "oklch(0.42 0.055 150 / 0.12)" : "oklch(0.99 0.006 155 / 0.85)",
                  border: format === f.id ? "2px solid oklch(0.42 0.055 150)" : "1.5px solid oklch(0.88 0.020 152 / 0.5)",
                }}>
                <div className="text-xl mb-1">{f.icon}</div>
                <p className="text-xs font-semibold" style={{ color: format === f.id ? "oklch(0.32 0.045 148)" : "oklch(0.28 0.025 148)" }}>{f.label}</p>
                <p className="text-[9px] mt-0.5" style={{ color: "oklch(0.55 0.018 148)" }}>{f.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="mx-5 mb-4 rounded-2xl overflow-hidden"
          style={{ background: "oklch(0.99 0.006 155 / 0.85)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider px-4 pt-3 pb-1"
            style={{ color: "oklch(0.62 0.025 148)" }}>时间范围</p>
          <div className="flex p-2 gap-1">
            {([
              { id: "week" as const, label: "本周" },
              { id: "month" as const, label: "近 30 天" },
              { id: "all" as const, label: "全部数据" },
            ]).map(r => (
              <button key={r.id} onClick={() => setRange(r.id)}
                className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: range === r.id ? "oklch(0.42 0.055 150)" : "transparent",
                  color: range === r.id ? "white" : "oklch(0.45 0.025 148)",
                }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Include options */}
        <div className="mx-5 mb-5 rounded-2xl overflow-hidden"
          style={{ background: "oklch(0.99 0.006 155 / 0.85)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider px-4 pt-3 pb-1"
            style={{ color: "oklch(0.62 0.025 148)" }}>包含内容</p>
          {[
            { label: "情绪记录与标签", desc: "每次打卡的颜色、分值、场景标签", value: true, fixed: true, onChange: () => {} },
            { label: "文字备注", desc: "打卡时填写的个人备注", value: includeNotes, fixed: false, onChange: setIncludeNotes },
            { label: "CBT 干预记录", desc: "触发的认知干预卡片和反馈", value: includeCBT, fixed: false, onChange: setIncludeCBT },
          ].map((opt, i, arr) => (
            <div key={opt.label}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "oklch(0.25 0.025 148)" }}>{opt.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "oklch(0.58 0.018 148)" }}>{opt.desc}</p>
                </div>
                <button
                  onClick={() => !opt.fixed && opt.onChange(!opt.value)}
                  className="w-11 h-6 rounded-full relative transition-all flex-shrink-0"
                  style={{ background: opt.value ? "oklch(0.42 0.055 150)" : "oklch(0.82 0.015 152)", opacity: opt.fixed ? 0.5 : 1 }}
                >
                  <motion.div
                    animate={{ x: opt.value ? 20 : 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>
              {i < arr.length - 1 && <div className="ml-4 h-px" style={{ background: "oklch(0.90 0.012 152)" }} />}
            </div>
          ))}
        </div>

        {/* Export button / progress */}
        <div className="mx-5">
          {done ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="p-4 rounded-2xl text-center"
              style={{ background: "oklch(0.88 0.045 148 / 0.3)", border: "1px solid oklch(0.72 0.040 148 / 0.4)" }}
            >
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm font-semibold" style={{ color: "oklch(0.32 0.040 148)" }}>导出完成</p>
              <p className="text-xs mt-1" style={{ color: "oklch(0.52 0.025 148)" }}>
                文件已保存到"文件" App 的下载文件夹
              </p>
              <button onClick={() => setDone(false)} className="mt-3 text-xs"
                style={{ color: "oklch(0.52 0.025 148)" }}>重新导出</button>
            </motion.div>
          ) : exporting ? (
            <div className="p-4 rounded-2xl"
              style={{ background: "oklch(0.99 0.006 155 / 0.85)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium" style={{ color: "oklch(0.28 0.025 148)" }}>正在生成文件…</p>
                <p className="text-xs font-semibold" style={{ color: "oklch(0.42 0.055 150)" }}>{Math.min(Math.round(progress), 100)}%</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.88 0.020 152)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "oklch(0.42 0.055 150)", width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleExport}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "oklch(0.42 0.055 150)", color: "white" }}
            >
              <span>📤</span>
              <span>开始导出</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Logout Confirm Screen ────────────────────────────────────────────────────
function LogoutConfirmScreen({ onBack, onConfirm }: { onBack: () => void; onConfirm: () => void }) {
  const [step, setStep] = useState<"warning" | "confirm" | "done">("warning");
  const [inputText, setInputText] = useState("");
  const confirmWord = "确认注销";

  if (step === "done") {
    return (
      <div className="relative flex flex-col h-full items-center justify-center"
        style={{ background: "oklch(0.96 0.012 155)" }}>
        <GrainOverlay opacity={0.3} />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 text-center px-8"
        >
          <div className="text-5xl mb-4">🌱</div>
          <p className="text-lg font-semibold mb-2" style={{ color: "oklch(0.28 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>
            数据已清除
          </p>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "oklch(0.52 0.020 148)" }}>
            你的所有本地数据已安全删除。<br />如果有一天你想回来，我们还在这里。
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            className="px-8 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "oklch(0.42 0.055 150)", color: "white" }}
          >
            回到开始
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(0.96 0.012 155)" }}>
      <GrainOverlay opacity={0.3} />
      <StatusBar />
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.88 0.025 152 / 0.6)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p className="text-base font-semibold" style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>退出 / 注销账号</p>
        </div>

        {step === "warning" ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 flex-1">
            {/* Warning card */}
            <div className="p-5 rounded-3xl mb-5"
              style={{ background: "oklch(0.92 0.035 50 / 0.3)", border: "1px solid oklch(0.82 0.045 50 / 0.5)" }}>
              <div className="text-3xl mb-3">⚠️</div>
              <p className="text-sm font-semibold mb-2" style={{ color: "oklch(0.38 0.055 50)" }}>
                注销前请确认
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.45 0.040 50)" }}>
                注销账号将永久删除以下数据，且<strong>无法恢复</strong>：
              </p>
              <ul className="mt-2 space-y-1">
                {["所有情绪打卡记录", "情绪日记和备注", "AI 树洞对话历史", "胶囊信件（未开启的将永久丢失）", "用药提醒设置"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.42 0.040 50)" }}>
                    <span style={{ color: "oklch(0.55 0.120 25)" }}>✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggestion */}
            <div className="p-4 rounded-2xl mb-6"
              style={{ background: "oklch(0.92 0.020 155 / 0.5)", border: "1px solid oklch(0.85 0.020 152 / 0.4)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "oklch(0.38 0.040 148)" }}>💡 建议先导出数据</p>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.48 0.022 148)" }}>
                在注销前，可以先前往"导出数据"将记录保存到本地，以备将来参考。
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => setStep("confirm")}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold"
                style={{ background: "oklch(0.55 0.120 25)", color: "white" }}>
                我了解风险，继续注销
              </motion.button>
              <button onClick={onBack}
                className="w-full py-3 text-sm"
                style={{ color: "oklch(0.52 0.025 148)" }}>
                取消，返回
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 flex-1">
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🔐</div>
              <p className="text-base font-semibold mb-2" style={{ color: "oklch(0.28 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>
                最后确认
              </p>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "oklch(0.52 0.020 148)" }}>
                请在下方输入「{confirmWord}」<br />以确认你的操作
              </p>
            </div>
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`输入「${confirmWord}」`}
              className="w-full px-4 py-3 rounded-2xl text-sm text-center mb-4 outline-none"
              style={{
                background: "oklch(0.99 0.006 155 / 0.85)",
                border: `2px solid ${inputText === confirmWord ? "oklch(0.55 0.120 25)" : "oklch(0.88 0.020 152 / 0.5)"}`,
                color: "oklch(0.25 0.025 148)",
              }}
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => inputText === confirmWord && setStep("done")}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all"
              style={{
                background: inputText === confirmWord ? "oklch(0.55 0.120 25)" : "oklch(0.82 0.015 152)",
                color: inputText === confirmWord ? "white" : "oklch(0.62 0.020 148)",
              }}>
              {inputText === confirmWord ? "确认注销所有数据" : "请先输入确认文字"}
            </motion.button>
            <button onClick={() => setStep("warning")} className="w-full py-3 text-sm mt-2"
              style={{ color: "oklch(0.52 0.025 148)" }}>
              返回上一步
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}


// ─── Journal Detail Screen ────────────────────────────────────────────────────
function JournalDetailScreen({ entry, onBack, onDelete }: { entry: JournalEntry; onBack: () => void; onDelete: () => void }) {
  const mood = MOOD_SCREENS[entry.moodIdx];
  const [editNote, setEditNote] = useState(entry.note);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${mood.bg} 0%, oklch(0.93 0.018 155) 55%)` }}>
      <GrainOverlay opacity={0.4} />
      <StatusBar />
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto pb-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.99 0.008 155 / 0.4)", backdropFilter: "blur(8px)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="oklch(0.35 0.030 148)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p className="text-sm font-semibold" style={{ color: "oklch(0.28 0.025 148)" }}>{entry.time}</p>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.99 0.008 155 / 0.4)", backdropFilter: "blur(8px)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 4H13M5 4V3C5 2.45 5.45 2 6 2H10C10.55 2 11 2.45 11 3V4M6 7V12M10 7V12M4 4L4.5 13C4.5 13.55 4.95 14 5.5 14H10.5C11.05 14 11.5 13.55 11.5 13L12 4" stroke="oklch(0.55 0.120 25)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Mood hero */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="mx-5 mb-4 p-5 rounded-3xl overflow-hidden grain"
          style={{ background: `linear-gradient(135deg, ${mood.bg} 0%, oklch(0.88 0.030 150) 100%)`, border: "1px solid oklch(0.88 0.025 152 / 0.4)" }}
        >
          <GrainOverlay opacity={0.3} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="text-5xl">{mood.icon}</div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>{mood.label}</p>
              <p className="text-xs mt-1" style={{ color: "oklch(0.48 0.022 148)" }}>{mood.desc}</p>
            </div>
          </div>
          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="relative z-10 flex flex-wrap gap-1.5 mt-3">
              {entry.tags.map(t => (
                <span key={t} className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: "oklch(0.99 0.008 155 / 0.4)", color: "oklch(0.35 0.025 148)" }}>{t}</span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Note section */}
        <motion.div
          initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mx-5 mb-4 p-4 rounded-2xl"
          style={{ background: "oklch(0.99 0.006 155 / 0.85)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: "oklch(0.42 0.025 148)" }}>📝 备注</p>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: "oklch(0.90 0.020 152 / 0.6)", color: "oklch(0.42 0.030 148)" }}>编辑</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "oklch(0.90 0.020 152 / 0.6)", color: "oklch(0.52 0.020 148)" }}>取消</button>
                <button onClick={handleSave} className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: "oklch(0.42 0.055 150)", color: "white" }}>保存</button>
              </div>
            )}
          </div>
          {isEditing ? (
            <textarea
              value={editNote}
              onChange={e => setEditNote(e.target.value)}
              className="w-full text-sm leading-relaxed resize-none outline-none bg-transparent"
              style={{ color: "oklch(0.28 0.022 148)", minHeight: "80px" }}
              placeholder="记录此刻的想法…"
              autoFocus
            />
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: editNote ? "oklch(0.28 0.022 148)" : "oklch(0.65 0.015 148)" }}>
              {editNote || "暂无备注，点击编辑添加"}
            </p>
          )}
          {saved && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs mt-2" style={{ color: "oklch(0.42 0.055 150)" }}>✓ 已保存</motion.p>
          )}
        </motion.div>

        {/* CBT history */}
        {entry.cbtTriggered && (
          <motion.div
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-5 mb-4 p-4 rounded-2xl"
            style={{ background: "oklch(0.99 0.006 155 / 0.85)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: "oklch(0.42 0.025 148)" }}>🧠 当时触发的 CBT 干预</p>
            <div className="p-3 rounded-xl mb-3"
              style={{ background: "oklch(0.92 0.020 155 / 0.5)", border: "1px solid oklch(0.85 0.018 152 / 0.4)" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "oklch(0.35 0.025 148)" }}>认知重构</p>
              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.30 0.020 148)" }}>
                {entry.cbtCard || "这种想法是否有些绝对化？试着找找反例：有没有哪次你以为会很糟，但结果还好的经历？"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs" style={{ color: "oklch(0.55 0.018 148)" }}>当时的反馈：</p>
              {entry.cbtFeedback === "helpful" ? (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "oklch(0.88 0.045 148 / 0.4)", color: "oklch(0.38 0.040 148)" }}>👍 有帮助</span>
              ) : entry.cbtFeedback === "not-helpful" ? (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "oklch(0.92 0.020 50 / 0.4)", color: "oklch(0.48 0.040 50)" }}>😐 没感觉</span>
              ) : (
                <span className="text-xs" style={{ color: "oklch(0.65 0.015 148)" }}>未反馈</span>
              )}
            </div>
          </motion.div>
        )}

        {/* No CBT triggered */}
        {!entry.cbtTriggered && (
          <div className="mx-5 mb-4 p-4 rounded-2xl text-center"
            style={{ background: "oklch(0.96 0.010 155 / 0.5)", border: "1px dashed oklch(0.88 0.015 152 / 0.5)" }}>
            <p className="text-xs" style={{ color: "oklch(0.62 0.018 148)" }}>这次打卡未触发 CBT 干预</p>
          </div>
        )}
      </div>

      {/* Delete confirm overlay */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end"
            style={{ background: "oklch(0 0 0 / 0.4)" }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              onClick={e => e.stopPropagation()}
              className="w-full p-5 rounded-t-3xl"
              style={{ background: "oklch(0.97 0.010 155)" }}
            >
              <p className="text-base font-semibold text-center mb-1" style={{ color: "oklch(0.25 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>删除这条记录？</p>
              <p className="text-xs text-center mb-5" style={{ color: "oklch(0.55 0.018 148)" }}>删除后无法恢复，包括备注和 CBT 记录</p>
              <div className="flex flex-col gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={onDelete}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold"
                  style={{ background: "oklch(0.55 0.120 25)", color: "white" }}>
                  确认删除
                </motion.button>
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-3 text-sm" style={{ color: "oklch(0.52 0.025 148)" }}>
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Prototype ───────────────────────────────────────────────────────────

export default function Home() {
  const [screen, setScreen] = useState<Screen>("onboard-1");
  const [paywall, setPaywall] = useState<Screen | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  // Checkin state: todayMoodIdx tracks today's latest checkin mood (null = not checked in)
  // weekMoods: array of 7 mood indices for Mon-Sun (null = no data / future)
  const [todayMoodIdx, setTodayMoodIdx] = useState<number | null>(null);
  const [weekMoods, setWeekMoods] = useState<(number | null)[]>([null, null, null, null, null, null, null]);
  // Simulate 3 consecutive low days before today for crisis demo
  const [consecutiveLowDays, setConsecutiveLowDays] = useState(0);
  const [detailEntry, setDetailEntry] = useState<JournalEntry | null>(null);
  // Lifted meds state so HomeScreen can check if any meds exist
  const [globalMeds, setGlobalMeds] = useState<Array<{ id: number; name: string; dose: string; times: string[]; days: string; stock: number; note: string; active: boolean }>>(MEDS_DATA);
  // Journal data managed at top level so checkin can auto-add entries
  const [journalData, setJournalData] = useState<Array<{
    dateLabel: string; date: string; dayOfWeek: string; avgMoodIdx: number; count: number;
    entries: Array<{ time: string; moodIdx: number; tags: string[]; note: string; summary: string }>;
  }>>(JOURNAL_DATA_INITIAL);
  // Track if user has chatted today (for tree-hole prompt on home)
  const [hasChatted, setHasChatted] = useState(false);
  // AI persona selection
  const [aiPersona, setAiPersona] = useState<Persona | null>(null);

  const navigate = (s: Screen) => setScreen(s);
  const showPaywall = (s: Screen) => setPaywall(s);
  const closePaywall = () => setPaywall(null);

  const navToMain = (tab: NavTab) => {
    if (tab === "checkin") navigate("home");
    else if (tab === "ai") navigate("ai-chat");
    else if (tab === "journal") navigate("journal");
    else if (tab === "stats") navigate("stats");
    else if (tab === "more") navigate("more");
  };

  const renderScreen = () => {
    switch (screen) {
      case "onboard-1": return <OnboardScreen1 onNext={() => navigate("onboard-2")} />;
      case "onboard-2": return <OnboardScreen2 onNext={() => navigate("onboard-3")} />;
      case "onboard-3": return <OnboardScreen3 onNext={() => navigate("onboard-4")} />;
      case "onboard-4": return <OnboardScreen4 onNext={(moodIdx) => {
        setTodayMoodIdx(moodIdx);
        const today = new Date().getDay();
        const todayIdx = today === 0 ? 6 : today - 1;
        setWeekMoods(prev => { const next = [...prev]; next[todayIdx] = moodIdx; return next; });
        // Auto-add journal entry from onboarding checkin
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
        const weekDayNames = ["周日","周一","周二","周三","周四","周五","周六"];
        const monthStr = `${now.getMonth()+1}月${now.getDate()}日`;
        const weekDayStr = weekDayNames[now.getDay()];
        const newEntry = { time: timeStr, moodIdx, tags: [], note: "", summary: "" };
        setJournalData(prev => {
          const todayLabel = "今天";
          const existing = prev.find(d => d.dateLabel === todayLabel);
          if (existing) {
            return prev.map(d => d.dateLabel === todayLabel
              ? { ...d, count: d.count + 1, avgMoodIdx: moodIdx, entries: [newEntry, ...d.entries] }
              : d
            );
          } else {
            const todayDay = { dateLabel: todayLabel, date: monthStr, dayOfWeek: weekDayStr, avgMoodIdx: moodIdx, count: 1, entries: [newEntry] };
            return [todayDay, ...prev.map(d => d.dateLabel === "今天" ? { ...d, dateLabel: d.date } : d)];
          }
        });
        navigate("onboard-5");
      }} />;
      case "onboard-5": return <OnboardScreen5 onNext={() => navigate("home")} />;
      case "home": return <HomeScreen onNav={navigate} onPaywall={showPaywall} isPaid={isPaid} todayMoodIdx={todayMoodIdx} weekMoods={weekMoods} medsEnabled={globalMeds.length > 0} consecutiveLowDays={consecutiveLowDays} />;
      case "home-empty": return <HomeScreen onNav={navigate} onPaywall={showPaywall} forceEmpty isPaid={isPaid} todayMoodIdx={null} weekMoods={[null,null,null,null,null,null,null]} />;
      case "checkin": return <CheckinScreen onBack={() => navigate("home")} onDone={(moodIdx, tags, note) => {
        const newWeek = [...weekMoods];
        const _d = new Date().getDay(); // 0=Sun,1=Mon,...,6=Sat
        const _todayIdx = _d === 0 ? 6 : _d - 1; // Mon=0...Sun=6
        newWeek[_todayIdx] = moodIdx;
        setWeekMoods(newWeek);
        setTodayMoodIdx(moodIdx);
        // Auto-add journal entry
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
        const weekDayNames = ["周日","周一","周二","周三","周四","周五","周六"];
        const monthStr = `${now.getMonth()+1}月${now.getDate()}日`;
        const weekDayStr = weekDayNames[now.getDay()];
        const newEntry = { time: timeStr, moodIdx, tags: tags || [], note: note || "", summary: "" };
        setJournalData(prev => {
          const todayLabel = "今天";
          const existing = prev.find(d => d.dateLabel === todayLabel);
          if (existing) {
            return prev.map(d => d.dateLabel === todayLabel
              ? { ...d, count: d.count + 1, avgMoodIdx: moodIdx, entries: [newEntry, ...d.entries] }
              : d
            );
          } else {
            const todayDay = { dateLabel: todayLabel, date: monthStr, dayOfWeek: weekDayStr, avgMoodIdx: moodIdx, count: 1, entries: [newEntry] };
            return [todayDay, ...prev.map(d => d.dateLabel === "今天" ? { ...d, dateLabel: d.date } : d)];
          }
        });
        // Track consecutive low days for crisis detection (need 3+ days to trigger crisis)
        if (moodIdx <= 1) { // very low / low
          const newCount = consecutiveLowDays + 1;
          setConsecutiveLowDays(newCount);
          if (newCount >= 3) {
            navigate("crisis");
          } else {
            navigate("checkin-done-low");
          }
        } else if (moodIdx <= 2) { // slightly low
          navigate("checkin-done-low");
        } else {
          // Good mood resets streak
          setConsecutiveLowDays(0);
          navigate("checkin-done");
        }
      }} />;
      case "checkin-done": return <CheckinDoneScreen onBack={() => navigate("home")} />;
      case "checkin-done-low": return <CheckinDoneLowScreen onBack={() => navigate("home")} onCBT={() => {}} />;
      case "ai-persona": return <PersonaSelectScreen
        currentPersona={aiPersona}
        onBack={() => navigate("ai-chat")}
        onSelect={(p) => { setAiPersona(p); navigate("ai-chat"); }}
      />;
      case "ai-chat": {
        if (aiPersona === null) {
          // First time: show persona select
          return <PersonaSelectScreen
            currentPersona={null}
            onBack={() => navigate("home")}
            onSelect={(p) => { setAiPersona(p); }}
          />;
        }
        return <AIChatScreen
          onBack={() => navigate("home")}
          onNav={navigate}
          onPaywall={() => showPaywall("paywall-ai")}
          isPaid={isPaid}
          persona={aiPersona}
          onChangePersona={() => navigate("ai-persona")}
          onMarkChatted={() => setHasChatted(true)}
        />;
      }
      case "journal": return <JournalScreen onBack={() => navigate("home")} onNav={navigate} onAdd={() => navigate("journal-add")} onDetail={(entry) => { setDetailEntry(entry); navigate("journal-detail"); }} isPaid={isPaid} onSubscribe={() => navigate("subscribe")} journalData={journalData} hasChatted={hasChatted} />;
      case "journal-add": return <JournalAddScreen onBack={() => navigate("journal")} />;
      case "stats": return <StatsScreen onBack={() => navigate("home")} onNav={navigate} onPaywall={() => showPaywall("paywall-analysis")} onUnlocked={() => navigate("stats-unlocked")} isPaid={isPaid} />;
      case "stats-unlocked": return <StatsUnlockedScreen onBack={() => navigate("stats")} isPaid={isPaid} onPaywall={() => navigate("subscribe")} />;
      case "paywall-capsule": return <PaywallCapsule onClose={() => navigate("more")} onSubscribe={() => navigate("subscribe")} />;
      case "capsule-record": return <CapsuleRecordScreen onBack={() => navigate("more")} />;
      case "capsule-view": return <CapsuleViewScreen onBack={() => navigate("home")} />;
      case "meds": return <MedsScreen onBack={() => navigate("home")} meds={globalMeds} setMeds={setGlobalMeds} />;
      case "report": return <ReportScreen onBack={() => navigate("home")} />;
      case "subscribe": return <SubscribeScreen onBack={() => navigate("home")} onSubscribed={() => { setIsPaid(true); navigate("stats-unlocked"); }} />;
      case "crisis": return <CrisisScreen onBack={() => navigate("home")} consecutiveDays={Math.max(consecutiveLowDays, 3)} />;
      case "more": return <MoreScreen onNav={navigate} isPaid={isPaid} />;
      case "notifications": return <NotificationsScreen onBack={() => navigate("more")} />;
      case "theme": return <ThemeScreen onBack={() => navigate("more")} />;
      case "export": return <ExportScreen onBack={() => navigate("more")} />;
      case "logout-confirm": return <LogoutConfirmScreen onBack={() => navigate("more")} onConfirm={() => navigate("onboard-1")} />;
      default: return <HomeScreen onNav={navigate} onPaywall={showPaywall} />;
    }
  };

  // Screen label for nav indicator
  const screenLabels: Partial<Record<Screen, string>> = {
    "onboard-1": "引导 1/5 — 欢迎",
    "onboard-2": "引导 2/5 — 目标选择",
    "onboard-3": "引导 3/5 — 隐私声明",
    "onboard-4": "引导 4/5 — 第一次打卡",
    "onboard-5": "引导 5/5 — 设置提醒",
    "home": "主界面（已打卡）",
    "home-empty": "主界面（未打卡）",
    "checkin": "心情打卡",
    "checkin-done": "打卡完成（正常）",
    "checkin-done-low": "打卡完成（低分 + CBT）",
    "ai-chat": "AI 树洞",
    "ai-persona": "选择人设",
    "journal": "情绪日记",
    "journal-add": "日记补录",
    "stats": "情绪统计",
    "stats-unlocked": "深度分析（付费版）",
    "capsule-record": "胶囊信件 — 录制",
    "capsule-view": "胶囊信件 — 查看",
    "meds": "用药提醒",
    "report": "就诊报告",
    "subscribe": "订阅页",
    "crisis": "危机干预页",
    "more": "更多页",
    "notifications": "通知偏好设置",
    "theme": "主题切换",
    "export": "数据导出",
    "logout-confirm": "账号注销确认",
    "journal-detail": "日记详情页",
  };

  const quickNavScreens: { label: string; screen: Screen }[] = [
    { label: "欢迎页", screen: "onboard-1" },
    { label: "目标选择", screen: "onboard-2" },
    { label: "隐私声明", screen: "onboard-3" },
    { label: "首次打卡", screen: "onboard-4" },
    { label: "设置提醒", screen: "onboard-5" },
    { label: "主界面（已打卡）", screen: "home" },
    { label: "主界面（未打卡）", screen: "home-empty" },
    { label: "心情打卡", screen: "checkin" },
    { label: "打卡完成（正常）", screen: "checkin-done" },
    { label: "打卡完成（低分）", screen: "checkin-done-low" },
    { label: "AI 树洞", screen: "ai-chat" },
    { label: "情绪日记", screen: "journal" },
    { label: "日记补录", screen: "journal-add" },
    { label: "情绪统计", screen: "stats" },
    { label: "深度分析（付费）", screen: "stats-unlocked" },
    { label: "胶囊录制", screen: "capsule-record" },
    { label: "胶囊查看", screen: "capsule-view" },
    { label: "用药提醒", screen: "meds" },
    { label: "就诊报告", screen: "report" },
    { label: "订阅页", screen: "subscribe" },
    { label: "危机干预", screen: "crisis" },
    { label: "更多页", screen: "more" },
    { label: "通知设置", screen: "notifications" },
    { label: "主题切换", screen: "theme" },
    { label: "数据导出", screen: "export" },
    { label: "账号注销", screen: "logout-confirm" },
    { label: "日记详情", screen: "journal-detail" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-10 px-4"
      style={{ background: "linear-gradient(160deg, oklch(0.94 0.022 155) 0%, oklch(0.90 0.030 150) 50%, oklch(0.86 0.025 145) 100%)" }}>
      {/* Grain on desktop bg */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <svg className="w-full h-full" style={{ opacity: 0.3, mixBlendMode: "overlay" }}>
          <filter id="bg-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#bg-grain)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(0.42 0.055 150)" }}>
            <span className="text-base">🌿</span>
          </div>
          <h1 className="text-xl font-semibold" style={{ color: "oklch(0.22 0.025 148)", fontFamily: "'Noto Serif SC', serif" }}>
            MindWork 交互原型
          </h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: "oklch(0.42 0.055 150 / 0.15)", color: "oklch(0.42 0.055 150)" }}>
            v1.0
          </span>
          {isPaid && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: "oklch(0.42 0.055 150 / 0.2)", color: "oklch(0.32 0.045 148)", border: "1px solid oklch(0.42 0.055 150 / 0.4)" }}>
              ✨ 已订阅
            </span>
          )}
        </div>

        <div className="flex gap-8 items-start w-full justify-center">
          {/* Phone frame */}
          <div className="flex flex-col items-center gap-4">
            <div className="phone-frame relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={screen}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-0"
                >
                  {renderScreen()}
                </motion.div>
              </AnimatePresence>

              {/* Paywall overlay */}
              <AnimatePresence>
                {paywall === "paywall-analysis" && <PaywallAnalysis onClose={closePaywall} onSubscribe={() => { closePaywall(); navigate("subscribe"); }} />}
                {paywall === "paywall-ai" && <PaywallAI onClose={closePaywall} onSubscribe={() => { closePaywall(); navigate("subscribe"); }} />}
                {paywall === "paywall-capsule" && <PaywallCapsule onClose={closePaywall} onSubscribe={() => { closePaywall(); navigate("subscribe"); }} />}
              </AnimatePresence>
            </div>

            {/* Current screen label */}
            <div className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: "oklch(0.99 0.006 155 / 0.7)", color: "oklch(0.35 0.030 148)", border: "1px solid oklch(0.88 0.020 152 / 0.5)" }}>
              {screenLabels[screen] ?? screen}
            </div>
          </div>

          {/* Navigation panel */}
          <div className="flex flex-col gap-3 min-w-[180px]">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.52 0.025 148)" }}>
              快速跳转
            </p>

            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium mt-1" style={{ color: "oklch(0.45 0.025 148)" }}>Onboarding</p>
              {quickNavScreens.slice(0, 5).map(item => (
                <button
                  key={item.screen}
                  onClick={() => { setPaywall(null); navigate(item.screen); }}
                  className="px-3 py-2.5 rounded-xl text-sm text-left transition-all"
                  style={{
                    background: screen === item.screen ? "oklch(0.42 0.055 150 / 0.15)" : "oklch(0.99 0.006 155 / 0.6)",
                    color: screen === item.screen ? "oklch(0.32 0.045 148)" : "oklch(0.40 0.020 148)",
                    border: `1px solid ${screen === item.screen ? "oklch(0.42 0.055 150 / 0.4)" : "oklch(0.88 0.020 152 / 0.4)"}`,
                    fontWeight: screen === item.screen ? 600 : 400,
                  }}
                >
                  {item.label}
                </button>
              ))}

              <p className="text-xs font-medium mt-2" style={{ color: "oklch(0.45 0.025 148)" }}>主功能</p>
              {quickNavScreens.slice(5).map(item => (
                <button
                  key={item.screen}
                  onClick={() => { setPaywall(null); navigate(item.screen); }}
                  className="px-3 py-2.5 rounded-xl text-sm text-left transition-all"
                  style={{
                    background: screen === item.screen ? "oklch(0.42 0.055 150 / 0.15)" : "oklch(0.99 0.006 155 / 0.6)",
                    color: screen === item.screen ? "oklch(0.32 0.045 148)" : "oklch(0.40 0.020 148)",
                    border: `1px solid ${screen === item.screen ? "oklch(0.42 0.055 150 / 0.4)" : "oklch(0.88 0.020 152 / 0.4)"}`,
                    fontWeight: screen === item.screen ? 600 : 400,
                  }}
                >
                  {item.label}
                </button>
              ))}

              <p className="text-xs font-medium mt-2" style={{ color: "oklch(0.45 0.025 148)" }}>付费墙</p>
              {[
                { label: "分析解锁", screen: "paywall-analysis" as Screen },
                { label: "AI 对话限制", screen: "paywall-ai" as Screen },
                { label: "胶囊信件", screen: "paywall-capsule" as Screen },
              ].map(item => (
                <button
                  key={item.screen}
                  onClick={() => { navigate("home"); setTimeout(() => showPaywall(item.screen), 100); }}
                  className="px-3 py-2.5 rounded-xl text-sm text-left transition-all"
                  style={{
                    background: paywall === item.screen ? "oklch(0.78 0.048 90 / 0.2)" : "oklch(0.99 0.006 155 / 0.6)",
                    color: paywall === item.screen ? "oklch(0.42 0.045 80)" : "oklch(0.40 0.020 148)",
                    border: `1px solid ${paywall === item.screen ? "oklch(0.78 0.048 90 / 0.5)" : "oklch(0.88 0.020 152 / 0.4)"}`,
                  }}
                >
                  🔒 {item.label}
                </button>
              ))}
              <p className="text-xs font-medium mt-2" style={{ color: "oklch(0.45 0.025 148)" }}>订阅</p>
              <button
                onClick={() => navigate("subscribe")}
                className="px-3 py-2.5 rounded-xl text-sm text-left transition-all"
                style={{
                  background: screen === "subscribe" ? "oklch(0.42 0.055 150 / 0.15)" : "oklch(0.99 0.006 155 / 0.6)",
                  color: screen === "subscribe" ? "oklch(0.32 0.045 148)" : "oklch(0.40 0.020 148)",
                  border: `1px solid ${screen === "subscribe" ? "oklch(0.42 0.055 150 / 0.4)" : "oklch(0.88 0.020 152 / 0.4)"}`,
                }}
              >
                ✨ 订阅页
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-center" style={{ color: "oklch(0.55 0.020 148)" }}>
          交互原型 · 莫兰迪绿设计系统 · MindWork v1.0
        </p>
      </div>
    </div>
  );
}
