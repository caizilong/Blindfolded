"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FACE_LABELS,
  FACE_ORDER,
  JB_PERM,
  analyzeScramble,
  type FaceName,
  type MemoAnalysis,
  type OrientationIssue,
} from "./cube-engine.mjs";

const MAX_HISTORY_LENGTH = 50;

type ScrambleModule = typeof import("cubing/scramble");

let scrambleModulePromise: Promise<ScrambleModule> | null = null;

function loadScrambleModule() {
  if (!scrambleModulePromise) {
    scrambleModulePromise = import("cubing/scramble").catch((error) => {
      scrambleModulePromise = null;
      throw error;
    });
  }
  return scrambleModulePromise;
}

async function createRandomAnalysis() {
  const { randomScrambleForEvent } = await loadScrambleModule();
  const scramble = (await randomScrambleForEvent("333")).toString();
  return analyzeScramble(scramble);
}

function CubeFace({
  face,
  analysis,
  showLetters,
}: {
  face: FaceName;
  analysis: MemoAnalysis;
  showLetters: boolean;
}) {
  return (
    <div className={`cube-face face-${face.toLowerCase()}`} aria-label={FACE_LABELS[face]}>
      {analysis.faces[face].map((facelet, index) => (
        <div
          className={`facelet color-${facelet.color}${facelet.center ? " center-facelet" : ""}`}
          key={`${face}-${index}`}
        >
          {showLetters && facelet.code ? (
            <span>{facelet.code}</span>
          ) : facelet.center ? (
            <span className="center-mark">{face}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CubeNet({
  analysis,
  showLetters,
}: {
  analysis: MemoAnalysis;
  showLetters: boolean;
}) {
  return (
    <div className="cube-stage">
      <div className="orientation-axis" aria-hidden="true">
        <span className="axis-up">黄顶</span>
        <span className="axis-front">红前</span>
      </div>
      <div className="cube-net">
        {FACE_ORDER.map((face) => (
          <CubeFace
            analysis={analysis}
            face={face}
            key={face}
            showLetters={showLetters}
          />
        ))}
      </div>
    </div>
  );
}

function MemoLetters({ sequence }: { sequence: string }) {
  if (!sequence) return <span className="memo-empty">已复原</span>;
  return (
    <div className="memo-letters" aria-label={sequence}>
      {sequence.split("").map((letter, index) => (
        <span className="memo-letter" key={`${letter}-${index}`}>
          {letter}
        </span>
      ))}
    </div>
  );
}

function OrientationPills({
  issues,
  emptyLabel,
}: {
  issues: OrientationIssue[];
  emptyLabel: string;
}) {
  if (!issues.length) return <span className="quiet-result">{emptyLabel}</span>;
  return (
    <div className="issue-list">
      {issues.map((issue) => (
        <span className="issue-pill" key={`${issue.piece}-${issue.direction ?? "flip"}`}>
          <strong>{issue.piece}</strong>
          {issue.buffer ? " · 缓冲" : ""}
          {issue.direction ? ` · ${issue.direction}` : " · 翻色"}
        </span>
      ))}
    </div>
  );
}

function CycleBreaks({ edges, corners }: { edges: string[]; corners: string[] }) {
  if (!edges.length && !corners.length) {
    return <span className="quiet-result">本题没有小循环</span>;
  }
  return (
    <div className="cycle-list">
      {edges.map((letter) => (
        <span key={`edge-${letter}`}>棱 · {letter}</span>
      ))}
      {corners.map((letter) => (
        <span key={`corner-${letter}`}>角 · {letter}</span>
      ))}
    </div>
  );
}

function answerText(analysis: MemoAnalysis) {
  const edgeFlips = analysis.edgeFlips.length
    ? analysis.edgeFlips.map((issue) => `${issue.piece}${issue.buffer ? "（缓冲）" : ""}`).join("、")
    : "无";
  const cornerTwists = analysis.cornerTwists.length
    ? analysis.cornerTwists
        .map(
          (issue) =>
            `${issue.piece}${issue.buffer ? "（缓冲）" : ""}${issue.direction ? ` ${issue.direction}` : ""}`,
        )
        .join("、")
    : "无";

  return [
    `打乱：${analysis.scramble || "空打乱"}`,
    `棱块编码：${analysis.edgeMemo || "已复原"}`,
    `棱块奇偶：${analysis.edgeParity ? "奇数，棱块完成后做一次完整 Jb" : "偶数，无需额外 Jb"}`,
    `角块编码：${analysis.cornerMemo || "已复原"}`,
    `翻棱：${edgeFlips}`,
    `扭角：${cornerTwists}`,
  ].join("\n");
}

export default function Home() {
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<MemoAnalysis>(() => analyzeScramble(""));
  const [revealed, setRevealed] = useState(false);
  const [showLetters, setShowLetters] = useState(false);
  const [history, setHistory] = useState<MemoAnalysis[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const moveCount = useMemo(
    () => (analysis.scramble ? analysis.scramble.split(" ").length : 0),
    [analysis.scramble],
  );

  useEffect(() => {
    let active = true;

    void createRandomAnalysis()
      .then((next) => {
        if (!active) return;
        setInput(next.scramble);
        setAnalysis(next);
        setError("");
      })
      .catch((caught) => {
        if (!active) return;
        console.error("Failed to generate the initial random 3x3 scramble", caught);
        setError("初始随机公式生成失败，请点击“随机下一个公式”重试。");
      })
      .finally(() => {
        if (active) setBusy(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function applyAnalysis(next: MemoAnalysis, nextNotice = "") {
    if (next.scramble !== analysis.scramble) {
      setHistory((previous) =>
        [...previous, analysis].slice(-MAX_HISTORY_LENGTH),
      );
    }
    setAnalysis(next);
    setInput(next.scramble);
    setRevealed(false);
    setError("");
    setNotice(nextNotice);
  }

  function applyInput() {
    try {
      const next = analyzeScramble(input);
      applyAnalysis(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "打乱公式有误");
      setNotice("");
    }
  }

  async function nextScramble() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await createRandomAnalysis();
      applyAnalysis(next, "新公式已生成");
    } catch (caught) {
      console.error("Failed to generate a random 3x3 scramble", caught);
      setError("随机状态生成器暂时不可用，请重试或粘贴一条打乱公式。");
    } finally {
      setBusy(false);
    }
  }

  function previousScramble() {
    const previous = history.at(-1);
    if (!previous) return;

    setHistory(history.slice(0, -1));
    setInput(previous.scramble);
    setAnalysis(previous);
    setRevealed(false);
    setError("");
    setNotice("已回到上一个公式");
  }

  async function copy(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(successMessage);
      setError("");
    } catch {
      setError("复制失败，请手动选择文字复制。");
    }
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <div className="brand-block">
          <h1>三阶盲拧编码训练器</h1>
          <p>固定 CE / EDM 缓冲，打乱、观察、编码全程黄顶红前。</p>
        </div>
        <div className="header-actions">
          <Link className="reference-link" href="/reference">
            公式参考
          </Link>
        </div>
      </header>

      <section className="scramble-panel" aria-labelledby="scramble-heading">
        <div className="panel-heading-row">
          <div>
            <span className="section-number">01</span>
            <h2 id="scramble-heading">打乱</h2>
          </div>
          <span className="move-count">{moveCount} 步</span>
        </div>
        <label className="sr-only" htmlFor="scramble-input">
          打乱公式
        </label>
        <textarea
          disabled={busy}
          id="scramble-input"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") applyInput();
          }}
          placeholder={busy ? "正在生成随机公式…" : "输入打乱公式"}
          spellCheck={false}
          value={input}
        />
        <div className="scramble-actions">
          <button
            aria-label="随机下一个公式"
            className="button primary-button"
            disabled={busy}
            onClick={nextScramble}
          >
            {busy ? "正在生成…" : "随机下一个公式"}
          </button>
          <button
            className="button history-button"
            disabled={busy || history.length === 0}
            onClick={previousScramble}
          >
            回看上一个公式
          </button>
          <button className="button secondary-button" disabled={busy} onClick={applyInput}>
            应用公式
          </button>
          <button
            className="button ghost-button"
            onClick={() => copy(analysis.scramble, "打乱已复制")}
          >
            复制打乱
          </button>
          <span className="shortcut-hint">⌘ / Ctrl + Enter 应用</span>
        </div>
        {(error || notice) && (
          <p className={error ? "form-message error-message" : "form-message success-message"} role="status">
            {error || notice}
          </p>
        )}
      </section>

      <div className="workspace-grid">
        <section className="cube-panel" aria-labelledby="cube-heading">
          <div className="panel-heading-row">
            <div>
              <span className="section-number">02</span>
              <h2 id="cube-heading">状态</h2>
            </div>
            <label className="switch-control">
              <input
                checked={showLetters}
                onChange={(event) => setShowLetters(event.target.checked)}
                type="checkbox"
              />
              <span className="switch-track" aria-hidden="true"><span /></span>
              显示编码
            </label>
          </div>
          <CubeNet analysis={analysis} showLetters={showLetters} />
        </section>

        <section
          className={`answer-panel${revealed ? "" : " is-covered"}`}
          aria-labelledby="answer-heading"
        >
          <div className="panel-heading-row">
            <div>
              <span className="section-number">03</span>
              <h2 id="answer-heading">编码</h2>
            </div>
            {revealed && (
              <button className="hide-answer-button" onClick={() => setRevealed(false)}>
                重新隐藏答案
              </button>
            )}
            {revealed && (
              <button
                className="text-button"
                onClick={() => copy(answerText(analysis), "答案已复制")}
              >
                复制答案
              </button>
            )}
          </div>

          {!revealed ? (
            <div className="answer-cover">
              <div className="cover-rings" aria-hidden="true"><span /><span /><span /></div>
              <span className="eyebrow">READY WHEN YOU ARE</span>
              <h3>先自己完成编码</h3>
              <p>检查棱块、奇偶、角块，再确认最后的翻色情况。</p>
              <button className="button reveal-button" onClick={() => setRevealed(true)}>
                揭晓答案
              </button>
            </div>
          ) : (
            <div className="answer-content">
              <article className="memo-step edge-step">
                <div className="step-title-row">
                  <div><span>STEP 1</span><h3>棱块编码</h3></div>
                  <span className={`parity-chip ${analysis.edgeParity ? "odd" : "even"}`}>
                    {analysis.edgeParity ? "奇数" : "偶数"}
                  </span>
                </div>
                <MemoLetters sequence={analysis.edgeMemo} />
                <code className="pair-line">{analysis.edgePairs}</code>
              </article>

              <article className={`parity-note ${analysis.edgeParity ? "needs-jb" : "no-jb"}`}>
                <span className="parity-icon">{analysis.edgeParity ? "!" : "✓"}</span>
                <div>
                  <strong>{analysis.edgeParity ? "棱块完成后直接做一次 Jb" : "无需额外 Jb"}</strong>
                  {!analysis.edgeParity && <p>棱块编码为偶数，直接进入角块。</p>}
                  {analysis.edgeParity && <code>{JB_PERM}</code>}
                </div>
              </article>

              <article className="memo-step corner-step">
                <div className="step-title-row">
                  <div><span>STEP 2</span><h3>角块编码</h3></div>
                </div>
                <MemoLetters sequence={analysis.cornerMemo} />
                <code className="pair-line">{analysis.cornerPairs}</code>
              </article>

              <div className="detail-grid">
                <div className="detail-card">
                  <span className="detail-label">翻棱</span>
                  <OrientationPills issues={analysis.edgeFlips} emptyLabel="无需翻棱" />
                </div>
                <div className="detail-card">
                  <span className="detail-label">扭角</span>
                  <OrientationPills issues={analysis.cornerTwists} emptyLabel="无需扭角" />
                </div>
                <div className="detail-card detail-wide">
                  <span className="detail-label">小循环起点</span>
                  <CycleBreaks
                    corners={analysis.cornerCycleBreaks}
                    edges={analysis.edgeCycleBreaks}
                  />
                </div>
              </div>

            </div>
          )}
        </section>
      </div>

    </main>
  );
}
