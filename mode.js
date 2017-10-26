'use strict';

const {Note} = require("./note");

const
	MODES = {
		none: 0,
		mixolydian: 1,
		lydian: 2,
		phrygian: 3,
		dorian: 4,
		hypolydian: 5,
		hypophrygian: 6,
		common: 7, locrian: 7, hypodorian: 7
	},
	MODE_NAMES = [
		"none", "mixolydian", "lydian", "phrygian", "dorian",
		"hypolydian", "hypophrygian", "hypodorian"
	];

function is_mode(n) {
	return n.toLowerCase() in MODES;
}

/**
 * Modes flatten a given note to add musical texture
**/
class Mode {
	constructor(base) {
		if(typeof base === 'string') {
			this.base = new Note(MODES[base.toLowerCase()]);
		}
		else {
			this.base = Note.from(base);
		}
	}
	
	get(x, n) {
		return n - (x === this.base);
	}
	
	toString() {
		return MODE_NAMES[this.base.getBase()];
	}
}

module.exports = {
	is_mode, Mode
};
