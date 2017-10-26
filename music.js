'use strict';

const
	{is_note, Note} = require("./note"),
	{is_mode, Mode} = require("./mode");

class Scale {
	constructor(steps) {
		let scale = [0], off = 0;
		for(let step of steps.toLowerCase()) {
			switch(step) {
				case '1':
				case 's':
				case 'h':
					off += 1;
					break;
				case '2':
				case 't':
				case 'w':
					off += 2;
					break;
			}
			
			scale.push(off);
		}
		
		// We added one too many
		scale.pop();
		this.scale = scale;
	}
}

const
	MAJOR = new Scale("WWHWWWH"),
	MINOR = new Scale("WHWWHWW");

const DEGREE = [
	"tonic", "supertonic",
	"mediant",
	"subdominant", "dominant",
	"submediant",
	"leading"
];

function get_biggest(v) {
	let x = 0, val = v[0];
	for(let i = 1; i < v.length; ++i) {
		if(v[i] > val) {
			x = i;
			val = v[i];
		}
	}
	return x;
}

/**
 * Heuristic for determining if two values have roughly the same
 *  order of magnitude.
**/
function same_order(a, b, base=10) {
	const LB = Math.log(base);
	return Math.abs(Math.log(a) - Math.log(b))/LB < 1;
}

/**
 * Keys are instantiations of scales
**/
class Key {
	constructor(root, scale, mode=null) {
		if(typeof root === 'string') {
			let t = Key.from(root);
			this.root = t.root;
			this.scale = scale||t.scale;
			this.mode = mode||t.mode;
		}
		else {
			this.root = new Note(root);
			this.scale = scale;
			this.mode = mode;
		}
	}
	
	static from(desc) {
		let
			bag = desc.toLowerCase().split(/\s+/g),
			base = new Note('c'),
			scale = MAJOR,
			mode = null;
		
		for(let word of bag) {
			if(is_note(word)) {
				base = Note.from(word);
			}
			else if(word === 'major') {
				scale = MAJOR;
			}
			else if(word === 'minor') {
				scale = MINOR;
			}
			else if(is_mode(word)) {
				mode = new Mode(word);
			}
			else {
				// Ignore
			}
		}
		
		return new Key(base, scale, mode);
	}
	
	/**
	 * Take a bunch of notes and heuristically guess the key they're in.
	**/
	classify(notes) {
		// Count up all the notes
		let bins = new Array(12);
		bins.fill(0);
		
		for(let note of notes) {
			if(note instanceof Chord) {
				for(let n of note.notes) {
					++bin[n.index];
				}
			}
			else {
				++bins[Note.from(note).getBase()];
			}
		}
		
		// Gather the evidence for each scale, major/minor and mode
		let major = new Array(12), minor = new Array(12), mode = new Array(7);
		major.fill(0);
		minor.fill(0);
		mode.fill(0);
		
		for(let note of bins) {
			// Evidence is counted by the occurrences of something
			//  in that key vs the notes which shouldn't be there
			
			for(let step = 0; step < 12; ++step) {
				if(is_major(step)) {
					// Reward correct notes
					major[note] += bins[(note + step)%12];
				}
				else {
					// Penalize wrong notes
					major[note] -= bins[(note + step)%12];
				}
			}
			
			for(let step of MINOR) {
				if(is_minor(step)) {
					// Reward correct notes
					minor[note] += bins[(note + step)%12];
				}
				else {
					// Penalize wrong notes
					minor[note] -= bins[(note + step)%12];
				}
			}
			
			// Modes too, though they only have one note to correct
			
			// Add to the mode which would flatten this note
			mode[(note + 1)%12] += bins[note];
			
			// Subtract from the mode which failed to flatten this note
			mode[(note + 12)%12] -= bins[note];
		}
		
		// Now find which is the biggest
		let M = get_biggest(major), m = get_biggest(minor), o = get_biggest(mode);
		
		let winner, note, scale;
		if(major[M] > minor[m]) {
			winner = major;
			note = M;
			scale = MAJOR;
		}
		else {
			winner = minor;
			note = m;
			scale = MINOR;
		}
		
		// If they have roughly the same order of magnitude, chances
		//  are good that this is a mode rather than a bunch of
		//  accidentals
		return new Key(note, scale,
			same_order(winner[note], mode[o])? new Mode(o) : null
		);
	}
	
	get(x) {
		let note = new Note(this.root.getBase() + this.scale.scale[x]);
		if(this.mode) {
			note = this.mode.apply(note);
		}
		return note;
	}
	
	// Output the full scale of the key
	getScale() {
		let notes = [];
		for(let step of this.scale.scale) {
			let note = new Note(this.root.index + step);
			
			if(this.mode) {
				note = this.mode.apply(note);
			}
			notes.push(note);
		}
		
		return notes;
	}
	
	getDegree(note) {
		return this.scale.indexOf((12 + (Note.from(note).index - this.root.index)%12)%12);
	}
	
	getDegrees(v) {
		return v.map(x => this.getDegree(x));
	}
	
	toString() {
		let scale;
		if(this.scale === MAJOR) {
			scale = 'major';
		}
		else {
			scale = 'minor';
		}
		
		if(this.mode) {
			return `${this.root.getBase()} ${scale} ${this.mode}`;
		}
		else {
			return `${this.root.getBase()} ${scale}`;
		}
	}
}

/**
 * Chords are numbered 1-7 and are independent of a key
**/
class Chord {
	constructor(notes) {
		this.notes = notes;
	}
	
	static dyad(base) {
		return new Chord([base, base + 2]);
	}
	
	static triad(base) {
		return new Chord([base, base + 2, base + 4]);
	}
	
	chromatic(key) {
		return this.notes.map(n => key.get(n));
	}
	
	toString() {
		return `{${this.notes.join(' ')}}`;
	}
}

module.exports = {
	is_note, Note,
	is_mode, Mode,
	MAJOR, MINOR,
	Key, Chord
};
