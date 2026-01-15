const HIGH_SCORE_KEY = 'coin-runner-high-score';

export const readHighScore = (): number => {
  if (typeof window === 'undefined') {
    return 0;
  }
  const stored = window.localStorage.getItem(HIGH_SCORE_KEY);
  return stored ? Number(stored) || 0 : 0;
};

export const writeHighScore = (score: number): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
};
