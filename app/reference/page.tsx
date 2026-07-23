import type { Metadata } from "next";
import Link from "next/link";
import {
  FACE_LABELS,
  FACE_ORDER,
  analyzeScramble,
  type FaceName,
} from "../cube-engine.mjs";

export const metadata: Metadata = {
  title: "盲拧公式参考手册",
  description: "三阶盲拧魔方编码、Jb Perm、翻色和 Setup 公式参考。",
};

const REFERENCE_CUBE = analyzeScramble("");
const JB_PERM_REFERENCE = "U' (R U R' F') (R U R' U') (R' F R2) (U' R')";

type SetupRow = {
  position: string;
  edge: string;
  corner: string | null;
};

const SETUP_ROWS: SetupRow[] = [
  { position: "A", edge: "F2 U' F2", corner: "B2 R2" },
  { position: "B", edge: "F2 U2 F2", corner: "I U I'" },
  { position: "F", edge: "L' E2 L", corner: "R' D R2" },
  { position: "G", edge: "D' S", corner: "R" },
  { position: "H", edge: "D S2", corner: "D2 R2" },
  { position: "I", edge: "S2", corner: "D R2" },
  { position: "J", edge: "D' S2", corner: "R2" },
  { position: "K", edge: "D2 S2", corner: "D' R2" },
  { position: "L", edge: "S' D2 S2", corner: "B D' R2" },
  { position: "M", edge: "E L' E2 L", corner: null },
  { position: "N", edge: "S", corner: "D R" },
  { position: "O", edge: "B2 D S", corner: "R'" },
  { position: "P", edge: "F L F'", corner: "B' R'" },
  { position: "Q", edge: "D S", corner: "D2 R" },
  { position: "R", edge: "S'", corner: "R B' R2" },
  { position: "S", edge: "L' E L", corner: "B' R2" },
  { position: "T", edge: "D2 S", corner: "D' R" },
  { position: "W", edge: "E' L E'2 L'", corner: "B R2" },
  { position: "X", edge: "E L E' L'", corner: "D' B R2" },
  { position: "Y", edge: "L E' L'", corner: "R' D' R" },
  { position: "Z", edge: "L E'2 L'", corner: "B R'" },
];

function ReferenceCubeFace({ face }: { face: FaceName }) {
  return (
    <div className={`cube-face face-${face.toLowerCase()}`} aria-label={FACE_LABELS[face]}>
      {REFERENCE_CUBE.faces[face].map((facelet, index) => (
        <div
          className={`facelet color-${facelet.color}${facelet.center ? " center-facelet" : ""}`}
          key={`${face}-${index}`}
        >
          {facelet.code ? <span>{facelet.code}</span> : null}
        </div>
      ))}
    </div>
  );
}

function SetupTable({ label, rows }: { label: string; rows: SetupRow[] }) {
  return (
    <div className="setup-table-shell">
      <table className="setup-table">
        <caption className="sr-only">{label} Setup 公式</caption>
        <thead>
          <tr>
            <th className="position-heading" scope="col">位置</th>
            <th className="edge-heading" scope="col">棱块</th>
            <th className="corner-heading" scope="col">角块</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.position}>
              <th className="setup-position" scope="row">{row.position}</th>
              <td className="setup-edge"><code>{row.edge}</code></td>
              <td className="setup-corner">
                {row.corner ? <code>{row.corner}</code> : <span aria-label="无需 Setup">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReferencePage() {
  return (
    <main className="app-shell reference-page">
      <header className="site-header reference-header">
        <div className="brand-block">
          <span className="eyebrow">BLINDFOLDED REFERENCE</span>
          <h1>盲拧公式参考手册</h1>
          <p>固定黄顶红前，集中查看编码、翻色和 Setup 公式。</p>
        </div>
        <Link className="reference-link back-link" href="/">
          ← 返回训练器
        </Link>
      </header>

      <div className="reference-page-grid">
        <div className="reference-left-column">
          <section className="reference-panel" aria-labelledby="reference-cube-heading">
            <div className="panel-heading-row">
              <div>
                <span className="section-number">01</span>
                <h2 id="reference-cube-heading">魔方编码</h2>
              </div>
            </div>
            <div className="cube-stage reference-cube-stage">
              <div className="orientation-axis" aria-hidden="true">
                <span className="axis-up">黄顶</span>
                <span className="axis-front">红前</span>
              </div>
              <div className="cube-net">
                {FACE_ORDER.map((face) => (
                  <ReferenceCubeFace face={face} key={face} />
                ))}
              </div>
            </div>
          </section>

          <section className="reference-panel" aria-labelledby="jb-heading">
            <div className="panel-heading-row">
              <div>
                <span className="section-number">02</span>
                <h2 id="jb-heading">Jb Perm</h2>
              </div>
            </div>
            <article className="formula-card jb-formula-card">
              <span className="formula-label">公式</span>
              <code>{JB_PERM_REFERENCE}</code>
            </article>
          </section>

          <section className="reference-panel" aria-labelledby="flip-heading">
            <div className="panel-heading-row">
              <div>
                <span className="section-number">03</span>
                <h2 id="flip-heading">翻色</h2>
              </div>
            </div>
            <div className="formula-stack">
              <article className="formula-card edge-flip-card">
                <span className="formula-label">棱块</span>
                <code>(M&apos; U M&apos; U M&apos; U2) (M U M U M U2)</code>
              </article>

              <div className="corner-flip-grid">
                <article className="formula-card corner-flip-card">
                  <span className="formula-label">角块 · 顺时针</span>
                  <code>(U R U&apos; R&apos;)2</code>
                </article>
                <article className="formula-card corner-flip-card">
                  <span className="formula-label">角块 · 逆时针</span>
                  <code>(R U R&apos; U&apos;)2</code>
                </article>
              </div>
            </div>
          </section>
        </div>

        <section className="reference-panel setup-panel" aria-labelledby="setup-heading">
          <div className="panel-heading-row">
            <div>
              <span className="section-number">04</span>
              <h2 id="setup-heading">Setup 公式</h2>
            </div>
          </div>
          <SetupTable label="全部位置" rows={SETUP_ROWS} />
        </section>
      </div>

      <section className="reference-sources" aria-labelledby="sources-heading">
        <div>
          <span className="section-number">参考</span>
          <h2 id="sources-heading">延伸资料</h2>
        </div>
        <div className="source-link-list">
          <a
            href="https://www.bilibili.com/video/BV1jm9eBoEgA/?spm_id_from=333.337.search-card.all.click&vd_source=1d9fd5b806df82bffcb81d678062e224"
            rel="noreferrer"
            target="_blank"
          >
            <span>Bilibili</span>
            <strong>盲拧参考视频</strong>
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href="https://www.lyt0112.com/blog/blindfold-zh"
            rel="noreferrer"
            target="_blank"
          >
            <span>Yutong&apos;s Site</span>
            <strong>Rubik&apos;s Cube Blindfold</strong>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </main>
  );
}
