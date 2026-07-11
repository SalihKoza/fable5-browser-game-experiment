import { describe, expect, it } from 'vitest';
import {
  canSprint,
  createStaminaState,
  stepStamina,
  type StaminaConfig,
} from '../../src/core/stamina';

const cfg: StaminaConfig = {
  max: 100,
  drainPerSecond: 30,
  regenPerSecond: 20,
  regenDelayMs: 700,
  restartThreshold: 15,
};

describe('stepStamina', () => {
  it('drains while sprinting and never goes below zero', () => {
    let s = createStaminaState(cfg);
    s = stepStamina(s, true, 1000, cfg); // -30
    expect(s.current).toBeCloseTo(70);
    s = stepStamina(s, true, 10_000, cfg); // would be -300
    expect(s.current).toBe(0);
  });

  it('does NOT regen during the post-drain delay window', () => {
    let s = createStaminaState(cfg);
    s = stepStamina(s, true, 1000, cfg); // 70, delay armed (700ms)
    s = stepStamina(s, false, 500, cfg); // still inside delay
    expect(s.current).toBeCloseTo(70);
    expect(s.regenDelayRemainingMs).toBe(200);
  });

  it('regens after the delay, capped at max', () => {
    let s = createStaminaState(cfg);
    s = stepStamina(s, true, 1000, cfg); // 70
    s = stepStamina(s, false, 700, cfg); // delay expires exactly
    s = stepStamina(s, false, 1000, cfg); // +20
    expect(s.current).toBeCloseTo(90);
    s = stepStamina(s, false, 60_000, cfg);
    expect(s.current).toBe(cfg.max);
  });
});

describe('canSprint (hysteresis)', () => {
  it('an ongoing sprint may continue below the restart threshold', () => {
    expect(canSprint(5, true, cfg)).toBe(true);
  });

  it('a new sprint cannot start below the restart threshold', () => {
    expect(canSprint(5, false, cfg)).toBe(false);
    expect(canSprint(15, false, cfg)).toBe(true);
  });

  it('nobody sprints at zero', () => {
    expect(canSprint(0, true, cfg)).toBe(false);
  });
});
