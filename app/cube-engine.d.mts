export type FaceName = "U" | "L" | "F" | "R" | "B" | "D";

export interface FaceletResult {
  color: "yellow" | "white" | "red" | "orange" | "green" | "blue";
  code: string | null;
  center: boolean;
}

export interface OrientationIssue {
  piece: string;
  buffer: boolean;
  direction?: "顺时针" | "逆时针";
}

export interface MemoAnalysis {
  scramble: string;
  faces: Record<FaceName, FaceletResult[]>;
  edgeMemo: string;
  cornerMemo: string;
  edgePairs: string;
  cornerPairs: string;
  edgeParity: boolean;
  edgeFlips: OrientationIssue[];
  cornerTwists: OrientationIssue[];
  edgeCycleBreaks: string[];
  cornerCycleBreaks: string[];
}

export const FACE_ORDER: FaceName[];
export const FACE_LABELS: Record<FaceName, string>;
export const COLOR_HEX: Record<FaceletResult["color"], string>;
export const EDGE_BUFFER: string;
export const CORNER_BUFFER: string;
export const JB_PERM: string;
export function normalizeScramble(value: string): string;
export function parseScramble(value: string): string[];
export function pairMemo(sequence: string): string;
export function analyzeScramble(value: string): MemoAnalysis;
