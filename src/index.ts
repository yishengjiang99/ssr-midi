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
