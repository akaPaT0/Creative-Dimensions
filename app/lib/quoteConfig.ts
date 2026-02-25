export const QUOTE_CONFIG = {
  printer: {
    // Build volume in mm (tune for your printer).
    buildVolumeMm: { x: 220, y: 220, z: 250 },
  },
  material: {
    name: "PLA",
    densityGPerCm3: 1.24,
    plaPerGram: 15 / 1000, // $15/kg
  },
  pricing: {
    electricityPerHour: 0.5,
    machineWearPerHour: 1,
    baseFee: 3,
    profitMultiplier: 1.4,
    colorFeePerExtra: 2,
  },
  presets: {
    draft: {
      label: "Draft",
      baseShellFraction: 0.18,
      wallCount: 2,
      // Tune based on your printer + nozzle + speeds.
      flowRateCm3PerHour: 22,
    },
    standard: {
      label: "Standard",
      baseShellFraction: 0.25,
      wallCount: 3,
      flowRateCm3PerHour: 16,
    },
    fine: {
      label: "Fine",
      baseShellFraction: 0.32,
      wallCount: 4,
      flowRateCm3PerHour: 11,
    },
  },
  heuristics: {
    infillFractionMultiplier: 1,
    minSolidFraction: 0.12,
    maxSolidFraction: 0.85,
    zPenaltyMmPerHour: 140,
    // Complexity penalty ~= triangleCount / value (hours), clamped to max.
    trianglePenaltyDivisor: 90000,
    maxComplexityPenaltyHours: 2.5,
    // Tall/thin support-risk bump.
    supportRiskThresholds: {
      tallHeightMm: 120,
      veryTallHeightMm: 180,
      lowVolumeCm3: 50,
      veryLowVolumeCm3: 35,
      tallRiskAdd: 0.12,
      veryTallRiskAdd: 0.25,
    },
    maxTriangles: 1_200_000,
  },
} as const;

export type QualityPreset = keyof typeof QUOTE_CONFIG.presets;
