'use strict';

const
	NOTES = {
		"a": 0, "a#": 1, "ab": 11,
		"b": 2, "b#": 3, "bb": 1,
		"c": 3, "c#": 4, "cb": 2,
		"d": 5, "d#": 6, "db": 4,
		"e": 7, "e#": 8, "eb": 6,
		"f": 8, "f#": 9, "fb": 7,
		"g": 10, "g#": 11, "gb": 9
	},
	NOTE_NAMES = [
		"A", "A#",
		"B",
		"C", "C#",
		"D", "D#",
		"E",
		"F", "F#",
		"G", "G#"
	];

const
	NATURAL = [0, 2, 3, 5, 7, 8, 10],
	SHARP = [1, 4, 6, 9, 11],
	HALF_STEP = Math.pow(2, 1/12);

function is_note(n) {
	return /^([abcdefg][#b]?)\d*$/i.exec(n);
}

class Note {
	constructor(index, octave=4) {
		if(typeof index === 'string') {
			let n = /^([abcdefg][#b]?)(\d*)$/.exec(index.toLowerCase());
			index = NOTES[n[1]];
			octave = n[2]||4;
		}
		else if(index instanceof Note) {
			({index, octave} = index);
		}
		this.index = (12 + index%12)%12;
		this.octave = octave|0;
	}
	
	static from(n) {
		if(n instanceof Note) {
			return n;
		}
		else {
			return new Note(n);
		}
	}
	
	static treble(config) {
		if(config instanceof Array) {
			return config.map(v => Note.treble(v));
		}
		
		let from_c0;
		if(typeof config.space === 'number') {
			from_c0 = (config.space - 1 - 2)*2 + 5*7;
		}
		else if(typeof config.line === 'number') {
			from_c0 = (config.line - 1 + 1)*2 + 4*7;
		}
		
		return new Note(
			"CDEFGAB"[from_c0%7],
			(from_c0/7)|0
		);
	}
	
	static bass(config) {
		if(config instanceof Array) {
			return config.map(v => Note.bass(v));
		}
		
		let from_c0 = 0;
		if(typeof config.space === 'number') {
			from_c0 = (config.space - 1 - 1)*2 + 3*7;
		}
		else if(typeof config.line === 'number') {
			from_c0 = (config.line - 1 - 2)*2 + 2*7;
		}
		
		return new Note(
			"CDEFGAB"[from_c0%7],
			(from_c0/7)|0
		);
	}
	
	getBase() {
		return NOTE_NAMES[this.index];
	}
	
	getFrequency(c0=16.35) {
		let x = (this.index - 3 + 12)%12;
		return c0*Math.pow(2, this.octave)*Math.pow(HALF_STEP, x);
	}
	
	toString() {
		return `${this.getBase()}${this.octave}`;
	}
	
	flat() {
		if(this.index === 0) {
			return new Note(11, this.octave - 1);
		}
		return new Note(this.index - 1, this.octave);
	}
	
	sharp() {
		if(this.index === 11) {
			return new Note(0, this.octave + 1);
		}
		return new Note(this.index + 1, this.octave);
	}
	
	natural() {
		// Remote a sharp if one exists
		if(SHARP.indexOf(this.index)) {
			this.flat();
		}
	}
	
	isNatural() {
		return NATURAL.indexOf(this.index) !== -1;
	}
}

module.exports = {
	is_note, Note
};
