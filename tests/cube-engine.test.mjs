import assert from "node:assert/strict";
import test from "node:test";
import {
  FACE_ORDER,
  JB_PERM,
  analyzeScramble,
  normalizeScramble,
} from "../app/cube-engine.mjs";

const GOLDEN_SCRAMBLE =
  "L2 D F2 U D R2 D' B2 L2 R2 D' B2 F' L' R2 F2 L2 R' D2 F' R'";

const MULTI_CYCLE_EDGE_SCRAMBLE =
  "B L2 D2 F2 U2 B' F2 U2 F' D2 R2 F2 R B2 D L' D2 U F' R2 U2";

test("matches the user's calibrated yellow-top red-front example", () => {
  const result = analyzeScramble(GOLDEN_SCRAMBLE);

  assert.equal(result.edgeMemo, "NOLSBHQXPF");
  assert.equal(result.cornerMemo, "JRKBLN");
  assert.equal(result.edgeParity, false);
  assert.deepEqual(result.edgeFlips, [
    { piece: "TI", buffer: false },
    { piece: "CE", buffer: true },
  ]);
  assert.deepEqual(result.cornerTwists, [
    { piece: "GYI", direction: "顺时针", buffer: false },
    { piece: "EDM", direction: "逆时针", buffer: true },
  ]);
});

test("returns an empty memo for a solved cube", () => {
  const result = analyzeScramble("");
  assert.equal(result.edgeMemo, "");
  assert.equal(result.cornerMemo, "");
  assert.equal(result.edgeParity, false);
  assert.deepEqual(result.edgeFlips, []);
  assert.deepEqual(result.cornerTwists, []);
});

test("combines edge orientation across every cycle before reporting the CE buffer", () => {
  const result = analyzeScramble(MULTI_CYCLE_EDGE_SCRAMBLE);

  assert.equal(result.edgeMemo, "PKYHARQLTO");
  assert.deepEqual(result.edgeCycleBreaks, ["A"]);
  assert.deepEqual(result.edgeFlips, [
    { piece: "XM", buffer: false },
    { piece: "SZ", buffer: false },
  ]);
});

test("normalizes whitespace and unicode primes", () => {
  assert.equal(normalizeScramble("  r’  u2\nF′  "), "R' U2 F'");
});

test("rejects unsupported notation", () => {
  assert.throws(() => normalizeScramble("R U M2"), /M2/);
  assert.throws(() => normalizeScramble("R3"), /R3/);
});

test("the parity Jb has no leading U prime", () => {
  assert.equal(JB_PERM, "R U R' F' R U R' U' R' F R2 U' R'");
  assert.equal(JB_PERM.startsWith("U'"), false);
});

test("keeps every random move-sequence state color-valid and bounded", () => {
  const faces = ["U", "D", "L", "R", "F", "B"];
  const suffixes = ["", "'", "2"];
  let seed = 0x5f3759df;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };

  for (let sample = 0; sample < 120; sample += 1) {
    const moves = [];
    let previous = "";
    for (let index = 0; index < 24; index += 1) {
      const choices = faces.filter((face) => face !== previous);
      const face = choices[Math.floor(random() * choices.length)];
      const suffix = suffixes[Math.floor(random() * suffixes.length)];
      moves.push(`${face}${suffix}`);
      previous = face;
    }

    const result = analyzeScramble(moves.join(" "));
    const colors = FACE_ORDER.flatMap((face) => result.faces[face]).map(
      (facelet) => facelet.color,
    );
    const counts = Object.groupBy(colors, (color) => color);

    for (const color of ["yellow", "white", "red", "orange", "green", "blue"]) {
      assert.equal(counts[color].length, 9);
    }
    assert.equal(result.edgeParity, result.edgeMemo.length % 2 === 1);
    assert.equal(result.edgeFlips.length % 2, 0);
    assert.ok(result.edgeMemo.length <= 24);
    assert.ok(result.cornerMemo.length <= 23);
    assert.equal(new Set(result.edgeCycleBreaks).size, result.edgeCycleBreaks.length);
    assert.equal(new Set(result.cornerCycleBreaks).size, result.cornerCycleBreaks.length);
  }
});
