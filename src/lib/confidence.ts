import type { ConfidenceLabel } from "@/lib/schema";

export interface ConfidenceSignals {
  extractFoundMechanic?: boolean;
  hookRefCount?: number;
  audiencePicked?: boolean;
  hasCutOrTranscript?: boolean;
  onlyOneLiner?: boolean;
  stageIdeaNoSurface?: boolean;
  hasEvidence?: boolean;
}

export interface ConfidenceResult {
  confidence: number;
  confidence_label: ConfidenceLabel;
  missing: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function confidenceLabel(score: number): ConfidenceLabel {
  if (score < 0.45) {
    return "gissning";
  }
  if (score < 0.7) {
    return "osaker";
  }
  return "dom";
}

export function scoreConfidence(signals: ConfidenceSignals): ConfidenceResult {
  const missing: string[] = [];
  let score = 0.5;

  if (signals.extractFoundMechanic) {
    score += 0.2;
  } else {
    missing.push("extract a product mechanic");
  }

  const hookRefCount = signals.hookRefCount ?? 0;
  if (hookRefCount >= 2) {
    score += 0.15;
  } else {
    missing.push("≥2 live hook references (Tavily Pass B)");
  }

  if (signals.audiencePicked) {
    score += 0.1;
  } else {
    missing.push("pick audience (not default hackathon_jury)");
  }

  if (signals.hasCutOrTranscript) {
    score += 0.1;
  } else {
    missing.push("existing cut or transcript");
  }

  if (signals.onlyOneLiner) {
    score -= 0.25;
    missing.push("more than a one-liner");
  }

  if (signals.stageIdeaNoSurface) {
    score -= 0.2;
    missing.push("a real product surface, not idea-only");
  }

  score = clamp(score, 0, 0.95);

  if (signals.onlyOneLiner) {
    score = Math.min(score, 0.45);
  }

  if (signals.hasEvidence === false) {
    score = Math.min(score, 0.4);
    missing.push("evidence citation for each rubric score");
  }

  const rounded = Math.round(score * 100) / 100;
  return {
    confidence: rounded,
    confidence_label: confidenceLabel(rounded),
    missing: [...new Set(missing)],
  };
}

/** Named the way HANDOVER slice 1 checks it: confidence({onlyOneLiner:true}) < 0.45 */
export function confidence(signals: ConfidenceSignals): number {
  return scoreConfidence(signals).confidence;
}
