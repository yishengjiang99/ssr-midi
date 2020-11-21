"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineNotes = void 0;
exports.combineNotes = function (notes) {
    return notes.reduce(function (array, note) {
        var lastNote = array.length > 0 && array[array.length - 1];
        if (lastNote && lastNote.measure === note.measure) {
            lastNote.midis.push(note);
        }
        else {
            array.push({
                start: note.start,
                midis: [note],
                measure: note.measure,
            });
        }
        return array;
    }, new Array());
};
