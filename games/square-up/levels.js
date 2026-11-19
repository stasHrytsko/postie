/* Square Up — all 10 levels, 1:1 from stazzi apps/casual/square-up (tools/square-up-levels.json, same order).
   Per level:
     pts        position of each person [x, y] (any units; the screen fits them into the board)
     edges      lines between people [a, b] — neighbours
     coins      start coins of each person (sum is 0); minus = owes
     limit      taps per try (no undo); the stazzi solver checks that fewer is impossible, so best = limit
     solution   [[person, +1 give | -1 take], ...] — the solver's answer, verified by test.js
     difficulty 1 easy · 2 medium · 3 hard — from the solver's greedy test (README.md):
                greedy "tap the biggest number" always wins → 1 (levels 1–5), can fail on a tie → 2 (6–8), always fails → 3 (9–10)
     teach      level 2 brings "take": the hand shows its first 2 moves (give, then press and hold) */
Postie.addLevels("square-up", [
  { pts: [[0, 0], [1, 0], [2, 0], [3, 0]],
    edges: [[0, 1], [1, 2], [2, 3]],
    coins: [-1, 1, 1, -1], limit: 2, difficulty: 1, best: 2,
    solution: [[1, 1], [2, 1]] },
  { pts: [[0, 0], [2, 0], [1, 1.4], [1, 2.9]],
    edges: [[0, 1], [0, 2], [1, 2], [2, 3]],
    coins: [-3, 3, 0, 0], limit: 2, difficulty: 1, best: 2,
    solution: [[1, 1], [0, -1]], teach: 2 },
  { pts: [[1, 0], [0, 1.2], [2, 1.2], [0, 2.9], [2, 2.9]],
    edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]],
    coins: [1, -2, 1, -1, 1], limit: 2, difficulty: 1, best: 2,
    solution: [[1, -1], [3, -1]] },
  { pts: [[1, 0], [2.05, 0.76], [1.65, 2], [0.35, 2], [-0.05, 0.76]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]],
    coins: [1, -4, 2, -1, 2], limit: 3, difficulty: 1, best: 3,
    solution: [[4, 1], [1, -1], [1, -1]] },
  { pts: [[0, 0.9], [2, 0.9], [0, 2.4], [2, 2.4], [1, 0], [2.9, 3.2]],
    edges: [[0, 1], [0, 2], [1, 3], [2, 3], [0, 4], [3, 5]],
    coins: [2, -3, 1, -1, 0, 1], limit: 3, difficulty: 1, best: 3,
    solution: [[1, -1], [1, -1], [3, -1]] },
  { pts: [[1.5, 1], [2.4, 2.5], [0.6, 2.5], [1.5, -0.2], [3.4, 3.2], [-0.4, 3.2]],
    edges: [[0, 1], [1, 2], [2, 0], [0, 3], [1, 4], [2, 5]],
    coins: [-2, -1, 1, 2, 1, -1], limit: 4, difficulty: 2, best: 4,
    solution: [[3, 1], [3, 1], [4, 1], [5, -1]] },
  { pts: [[0, 0], [2, 0], [1, 0.9], [1, 2], [0, 2.9], [2, 2.9], [1, 3.8]],
    edges: [[0, 2], [1, 2], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6], [0, 1]],
    coins: [2, -1, -1, 2, -2, 2, -2], limit: 5, difficulty: 2, best: 5,
    solution: [[0, 1], [4, -1], [4, -1], [6, -1], [6, -1]] },
  { pts: [[1, 0.9], [2.05, 1.66], [1.65, 2.9], [0.35, 2.9], [-0.05, 1.66], [1, -0.4], [2.6, 3.9]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5], [2, 6]],
    coins: [-2, 2, -2, -2, 1, 1, 2], limit: 5, difficulty: 2, best: 5,
    solution: [[1, 1], [5, 1], [6, 1], [6, 1], [3, -1]] },
  { pts: [[0, 0], [2, 0], [0, 1.2], [2, 1.2], [0, 2.4], [2, 2.4], [0, 3.6], [2, 3.6]],
    edges: [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5], [4, 6], [5, 7]],
    coins: [1, 1, -2, -3, 2, 4, -2, -1], limit: 5, difficulty: 3, best: 5,
    solution: [[5, 1], [2, -1], [3, -1], [6, -1], [6, -1]] },
  { pts: [[1, 0.9], [2, 1.5], [2, 2.7], [1, 3.3], [0, 2.7], [0, 1.5], [1, -0.3], [1, 4.5]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [3, 7], [1, 4]],
    coins: [2, -1, 2, -3, 1, -2, -1, 2], limit: 5, difficulty: 3, best: 5,
    solution: [[2, 1], [7, 1], [7, 1], [5, -1], [6, -1]] }
]);
