import { sponsors } from "./static";

export type Sponsor = typeof sponsors[0] & { color: { bgColor: string, color: string }, isCenterPanel?: boolean, rows?: number, cols?: number };
