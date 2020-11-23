export type MidiNote = {
  instrument: string;
  midi: number;
  trackId?: number;
  measure?: number;
  start?: number;
  end?: number;
  duration: number;
  buffer?: Buffer;
  endTime?: number;
  startTime?: number;
};
export type CombinedNotes = {
  start: number;
  midis: MidiNote[];
  buffer?: Buffer;
  measure: number;
  end: number;
};
export type TimeFrame = number;
export function U32toF32(i) {
  if (i === 0) return 0;
  let r = i & ((1 << 23) - 1);
  1;
  r /= 1 << 23;
  r += 1.0;
  const bias = 127;
  let shift = ((i >> 23) & 0xff) - bias;
  for (; shift > 0; shift--) r *= 2;
  for (; shift < 0; shift++) r /= 2;
  return r;
}
