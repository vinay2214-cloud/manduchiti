export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Wall clock in ms, separate so tests can control elapsed time.
export const now = () => Date.now();
