const FACE_VECTORS = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

export const FACE_ORDER = ["U", "L", "F", "R", "B", "D"];

export const FACE_LABELS = {
  U: "上 · 黄",
  L: "左 · 蓝",
  F: "前 · 红",
  R: "右 · 绿",
  B: "后 · 橙",
  D: "下 · 白",
};

export const COLOR_HEX = {
  yellow: "#ffd500",
  white: "#f8fafc",
  red: "#e53935",
  orange: "#ff8b1f",
  green: "#38b84a",
  blue: "#1f6feb",
};

const FACE_COLORS = {
  U: "yellow",
  D: "white",
  F: "red",
  B: "orange",
  R: "green",
  L: "blue",
};

// The user's lettering scheme. A letter is shared by the edge and corner
// sticker in the same face quadrant.
const LETTER_GRIDS = {
  U: ["AAB", "D.B", "DCC"],
  F: ["EEF", "X.F", "XGG"],
  R: ["RRS", "Y.S", "YTT"],
  B: ["OOP", "Z.P", "ZQQ"],
  L: ["LLM", "W.M", "WNN"],
  D: ["HHI", "K.I", "KJJ"],
};

const EDGE_LABELS = {
  "0,1,-1": "AO",
  "1,1,0": "BR",
  "0,1,1": "CE",
  "-1,1,0": "DL",
  "1,0,1": "FY",
  "0,-1,1": "GH",
  "-1,0,1": "XM",
  "1,0,-1": "SZ",
  "1,-1,0": "TI",
  "-1,0,-1": "PW",
  "0,-1,-1": "QJ",
  "-1,-1,0": "NK",
};

const CORNER_LABELS = {
  "-1,1,-1": "APL",
  "1,1,-1": "BSO",
  "1,1,1": "CFR",
  "-1,1,1": "EDM",
  "-1,-1,1": "XHN",
  "1,-1,1": "GYI",
  "1,-1,-1": "ZTJ",
  "-1,-1,-1": "QKW",
};

export const EDGE_BUFFER = "CE";
export const CORNER_BUFFER = "EDM";
export const JB_PERM = "R U R' F' R U R' U' R' F R2 U' R'";

function vectorKey(vector) {
  return vector.join(",");
}

function slotKey(position, normal) {
  return `${vectorKey(position)}|${vectorKey(normal)}`;
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

// A clockwise quarter turn as seen while looking straight at the face.
function rotateClockwise(vector, axis) {
  const crossed = cross(axis, vector);
  const projected = dot(axis, vector);
  return [
    -crossed[0] + axis[0] * projected,
    -crossed[1] + axis[1] * projected,
    -crossed[2] + axis[2] * projected,
  ];
}

function facePosition(face, row, column) {
  switch (face) {
    case "U":
      return [column - 1, 1, row - 1];
    case "D":
      return [column - 1, -1, 1 - row];
    case "F":
      return [column - 1, 1 - row, 1];
    case "B":
      return [1 - column, 1 - row, -1];
    case "R":
      return [1, 1 - row, 1 - column];
    case "L":
      return [-1, 1 - row, column - 1];
    default:
      throw new Error(`未知面：${face}`);
  }
}

function pieceType(position) {
  return Math.abs(position[0]) + Math.abs(position[1]) + Math.abs(position[2]);
}

function createSolvedStickers() {
  const stickers = [];
  for (const face of Object.keys(LETTER_GRIDS)) {
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        const homePosition = facePosition(face, row, column);
        const homeNormal = [...FACE_VECTORS[face]];
        const code = LETTER_GRIDS[face][row][column];
        stickers.push({
          code: code === "." ? null : code,
          color: FACE_COLORS[face],
          face,
          row,
          column,
          type: pieceType(homePosition),
          homePosition,
          homeNormal,
          homePiece: vectorKey(homePosition),
          homeSlot: slotKey(homePosition, homeNormal),
          position: [...homePosition],
          normal: [...homeNormal],
        });
      }
    }
  }
  return stickers;
}

export function normalizeScramble(value) {
  const normalized = value
    .toUpperCase()
    .replace(/[’′`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "";

  const tokens = normalized.split(" ");
  const invalid = tokens.find((token) => !/^[UDLRFB](?:2|')?$/.test(token));
  if (invalid) {
    throw new Error(`无法识别动作“${invalid}”。请只使用 U D L R F B、' 和 2。`);
  }
  return tokens.join(" ");
}

export function parseScramble(value) {
  const normalized = normalizeScramble(value);
  return normalized ? normalized.split(" ") : [];
}

function applyMove(stickers, token) {
  const face = token[0];
  const axis = FACE_VECTORS[face];
  const turns = token.endsWith("2") ? 2 : token.endsWith("'") ? 3 : 1;

  for (let turn = 0; turn < turns; turn += 1) {
    for (const sticker of stickers) {
      if (dot(sticker.position, axis) === 1) {
        sticker.position = rotateClockwise(sticker.position, axis);
        sticker.normal = rotateClockwise(sticker.normal, axis);
      }
    }
  }
}

function makeCurrentSlotMap(stickers) {
  return new Map(
    stickers.map((sticker) => [slotKey(sticker.position, sticker.normal), sticker]),
  );
}

function groupsForType(stickers, type) {
  const groups = new Map();
  for (const sticker of stickers) {
    if (sticker.type !== type) continue;
    const group = groups.get(sticker.homePiece) ?? [];
    group.push(sticker);
    groups.set(sticker.homePiece, group);
  }
  return groups;
}

function findStickerByCode(stickers, type, code) {
  const sticker = stickers.find(
    (candidate) => candidate.type === type && candidate.code === code,
  );
  if (!sticker) throw new Error(`编码表中缺少 ${code}`);
  return sticker;
}

function isPieceInHomePosition(group, currentSlots) {
  return group.every(
    (slot) => currentSlots.get(slot.homeSlot)?.homePiece === slot.homePiece,
  );
}

function isPieceFullySolved(group, currentSlots) {
  return group.every(
    (slot) => currentSlots.get(slot.homeSlot)?.homeSlot === slot.homeSlot,
  );
}

function cornerDirection(piecePosition, originalSticker, targetSlot) {
  const signedTurn = dot(
    piecePosition,
    cross(originalSticker.homeNormal, targetSlot.homeNormal),
  );
  return signedTurn > 0 ? "顺时针" : "逆时针";
}

function cornerTwistAmount(piecePosition, originalSticker, targetSlot) {
  return cornerDirection(piecePosition, originalSticker, targetSlot) === "顺时针"
    ? 1
    : 2;
}

function analyzePieceType(stickers, options) {
  const { type, anchorCode, bufferCodes, pieceLabels } = options;
  const currentSlots = makeCurrentSlotMap(stickers);
  const groups = groupsForType(stickers, type);
  const anchor = findStickerByCode(stickers, type, anchorCode);
  const bufferPiece = anchor.homePiece;
  const sequence = [];
  const cycleBreaks = [];
  const visitedPieces = new Set([bufferPiece]);

  let slot = anchor;
  let closure = null;
  for (let guard = 0; guard < 32; guard += 1) {
    const occupant = currentSlots.get(slot.homeSlot);
    if (!occupant) throw new Error("魔方状态不完整");
    if (occupant.homePiece === bufferPiece) {
      closure = occupant;
      break;
    }
    sequence.push(occupant.code);
    visitedPieces.add(occupant.homePiece);
    slot = occupant;
  }

  if (!closure) throw new Error("缓冲循环没有闭合");
  if (!bufferCodes.includes(closure.code)) {
    throw new Error("缓冲块方向无法识别");
  }

  // Every disjoint edge cycle can return through the opposite sticker of its
  // starting piece. That flip is absorbed by the buffer while the cycle is
  // solved, so CE is flipped only when an odd number of cycles close this way.
  // Looking at the buffer cycle alone can therefore produce an impossible odd
  // number of final edge flips.
  let edgeBufferFlipped = type === 2 && closure.code !== anchorCode;
  let cornerBufferTwist =
    type === 3 && closure.code !== anchorCode
      ? cornerTwistAmount(anchor.homePosition, closure, anchor)
      : 0;

  const permutedPieces = [...groups.entries()]
    .filter(([piece, group]) => piece !== bufferPiece && !isPieceInHomePosition(group, currentSlots))
    .map(([piece]) => piece);

  while (true) {
    const remaining = permutedPieces.filter((piece) => !visitedPieces.has(piece));
    if (!remaining.length) break;

    const start = remaining
      .flatMap((piece) => groups.get(piece))
      .sort((a, b) => a.code.localeCompare(b.code, "en"))[0];

    cycleBreaks.push(start.code);
    sequence.push(start.code);
    visitedPieces.add(start.homePiece);
    slot = start;

    let closed = false;
    for (let guard = 0; guard < 32; guard += 1) {
      const occupant = currentSlots.get(slot.homeSlot);
      if (!occupant) throw new Error("魔方状态不完整");
      sequence.push(occupant.code);
      visitedPieces.add(occupant.homePiece);
      if (occupant.homePiece === start.homePiece) {
        if (type === 2 && occupant.code !== start.code) {
          edgeBufferFlipped = !edgeBufferFlipped;
        }
        if (type === 3 && occupant.code !== start.code) {
          cornerBufferTwist =
            (cornerBufferTwist +
              cornerTwistAmount(start.homePosition, occupant, start)) %
            3;
        }
        closed = true;
        break;
      }
      slot = occupant;
    }
    if (!closed) throw new Error("小循环没有闭合");
  }

  const orientationIssues = [];
  for (const [piece, group] of groups) {
    if (piece === bufferPiece) continue;
    if (
      isPieceInHomePosition(group, currentSlots) &&
      !isPieceFullySolved(group, currentSlots)
    ) {
      if (type === 2) {
        orientationIssues.push({
          piece: pieceLabels[piece],
          buffer: false,
        });
      } else {
        const referenceSlot = group.find((candidate) =>
          ["U", "D"].includes(candidate.face),
        );
        const occupant = currentSlots.get(referenceSlot.homeSlot);
        orientationIssues.push({
          piece: pieceLabels[piece],
          direction: cornerDirection(referenceSlot.homePosition, occupant, referenceSlot),
          buffer: false,
        });
      }
    }
  }

  if (type === 2 && edgeBufferFlipped) {
    orientationIssues.push({ piece: pieceLabels[bufferPiece], buffer: true });
  } else if (type === 3 && cornerBufferTwist !== 0) {
    orientationIssues.push({
      piece: pieceLabels[bufferPiece],
      direction: cornerBufferTwist === 1 ? "顺时针" : "逆时针",
      buffer: true,
    });
  }

  return {
    sequence: sequence.join(""),
    cycleBreaks,
    orientationIssues,
  };
}

function makeFaces(stickers) {
  const currentSlots = makeCurrentSlotMap(stickers);
  const faces = {};
  for (const face of FACE_ORDER) {
    faces[face] = [];
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        const position = facePosition(face, row, column);
        const normal = FACE_VECTORS[face];
        const occupant = currentSlots.get(slotKey(position, normal));
        const slotCode = LETTER_GRIDS[face][row][column];
        faces[face].push({
          color: occupant.color,
          code: slotCode === "." ? null : slotCode,
          center: row === 1 && column === 1,
        });
      }
    }
  }
  return faces;
}

export function pairMemo(sequence) {
  if (!sequence) return "—";
  return sequence.match(/.{1,2}/g).join(" ");
}

export function analyzeScramble(value) {
  const normalizedScramble = normalizeScramble(value);
  const stickers = createSolvedStickers();
  for (const token of parseScramble(normalizedScramble)) {
    applyMove(stickers, token);
  }

  const edges = analyzePieceType(stickers, {
    type: 2,
    anchorCode: "C",
    bufferCodes: ["C", "E"],
    pieceLabels: EDGE_LABELS,
  });
  const corners = analyzePieceType(stickers, {
    type: 3,
    anchorCode: "D",
    bufferCodes: ["E", "D", "M"],
    pieceLabels: CORNER_LABELS,
  });

  return {
    scramble: normalizedScramble,
    faces: makeFaces(stickers),
    edgeMemo: edges.sequence,
    cornerMemo: corners.sequence,
    edgePairs: pairMemo(edges.sequence),
    cornerPairs: pairMemo(corners.sequence),
    edgeParity: edges.sequence.length % 2 === 1,
    edgeFlips: edges.orientationIssues,
    cornerTwists: corners.orientationIssues,
    edgeCycleBreaks: edges.cycleBreaks,
    cornerCycleBreaks: corners.cycleBreaks,
  };
}
