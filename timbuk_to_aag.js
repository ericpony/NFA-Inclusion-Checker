function print(line) {console.log(line?line:'');}
function log(line) { }
var timbuk_to_aag = (function () 
{
	var aut = {};

	aut.setRHS = function(name) {
		this.name_rhs = name? name : 'Aut_1';
		this.states = {};
		this.transitions = {};
		this.alphabets = {};
		this.initial_state_list = [];
		this.lhs_final_state_list = [];
		this.rhs_final_state_list = [];
		this.num_states = 0;
		this.num_alphabets = 0;
		this.isRHS = true;
		this.isLHS = false;
	}

	aut.setLHS = function(name) {
		this.name_lhs = name? name : 'Aut_2';
		this.isLHS = true;
		this.isRHS = false;
	}

	aut.get_canonical_state_name = function(s) {
		return this.isLHS ? s.toUpperCase() : s.toLowerCase(); // state name is case-insensitive
	}

	aut.add_state = function(s) {
		s = this.get_canonical_state_name(s);
		if(this.states[s]) 
			throw '[error] Duplicated state: ' + s;
		this.states[s] = 2*(++this.num_states);
	}

	aut.add_initial_state = function(s) {
		s = this.get_canonical_state_name(s);
		if(!this.states[s]) 
			throw '[error] Undefined state: ' + s;
		this.states[s] += 1;
		this.initial_state_list.push(s);
	}
	aut.add_final_state = function(s) {
		s = this.get_canonical_state_name(s);
		if(!this.states[s]) 
			throw '[error] Undefined state: ' + s;
		(this.isLHS ? this.lhs_final_state_list : this.rhs_final_state_list).push(s);
	}
	aut.add_alphabet = function(a) {
		if(!this.alphabets[a]) 
			this.alphabets[a] = ++this.num_alphabets;
	}

	aut.add_transition = function(from, thru, to) {
		to   = this.get_canonical_state_name(to);
		from = this.get_canonical_state_name(from);
		if(!this.states[from] || !this.states[to]) throw '[error] Invalid transiion: ' + from + ' --' + thru + '--> ' + to;
		if(!this.transitions[to]) this.transitions[to] = [];
		this.transitions[to].push([from, thru]);
		this.add_alphabet(thru);
		log(from + ' --' + thru + '--> ' + to);
	}

	function parse_states(states, add_state_handler) {
		for(var i=0; i<states.length; i++) {
			if(/^([^\[+])\[(\d+)\-\-(\d+)\]/.test(states[i]))
				for(var i=RegExp.$2; i<=RegExp.$3; i++) add_state_handler.call(aut, RegExp.$1+i);
			else
				add_state_handler.call(aut, states[i]);
		};
	}

	function read_line (line) {
		if(!line) return;
		line = line.toString().replace(/^\s+|\s+$/g,'');
		if(/^Automaton (\S+)/.test(line)) { 
			if(!aut.isRHS) {
				aut.setRHS(RegExp.$1);
			}else{
				aut.setLHS(RegExp.$1);
			}
		}else
		if(/^States/i.test(line))
		{
			parse_states(line.split(/\s+/).slice(1), aut.add_state);
		}else
		if(/^Final States/i.test(line))
		{
			parse_states(line.split(/\s+/).slice(2), aut.add_final_state);
		}else
		if(/^[^\(\s]+[\(\)\s]*\->\s*(\S+)/i.test(line))
		{
			aut.add_initial_state(RegExp.$1);
		}else
		if(/^([^\(]+)\(([^\)]+)\)\s*\->\s*(\S+)/.test(line))
		{
			aut.add_transition(RegExp.$2, RegExp.$1, RegExp.$3);
		}
	};

	function print_formula() { 	
		var TRUE = 1, FALSE = 0;		

		var print_gate = (function() {
			var dict = [];
			var _print = function(g)
			{
				if(g instanceof Array) {
					var g0 = g[0] - g[0]%2;
					var g1 = g[1] instanceof Array ? g[1].length ? g[1][0] : FALSE : g[1];
					var g2 = g[2] instanceof Array ? g[2].length ? g[2][0] : FALSE : g[2];
					if(!dict[g0]) {
						print(g0 + ' ' + g1 + ' ' + g2);
						var a = _print(g[1]);
						var b = _print(g[2]);
						dict[g0] = (g[0]%2 ? '!' : '') + '(' + a + ' and ' + b + ')';
					}
					return dict[g0];
				}else
					return g%2 ? '!'+(g-1) : g;
			}
			return _print;
		})();

		var encoded_alphabets = (function () {
			var num_alphabet_bits = Math.ceil(Math.log(aut.num_alphabets+1)/Math.LN2);
			var alphabets = [];
			var alphabets_log = [];
			for(var s in aut.states) aut.states[s] += 2*num_alphabet_bits;				
			return { get_gate: function(aid) {
				 	if(!alphabets[aid]) {
						var a = [], aa = aid;
						for(var i=1; i<=num_alphabet_bits; i++) {
							a[i-1] = 2*i + (aa%2 ? 1 : 0);
							aa >>= 1;
						}
						alphabets[aid] = CONJUNCT(a);
						alphabets_log[aid] = '(' + a.join(',') + ')';
					}
					return alphabets[aid];
				},
				get_log: function(aid) { return alphabets_log[aid]; },
				num_bits: num_alphabet_bits
			};
		})();

		var and_gate_id = aut.num_states + encoded_alphabets.num_bits;

		function flip(id) { return id + (id%2 ? -1 : 1); }
		function and_gate() { return 2*(++and_gate_id); }
		function NOT(gate) { return gate instanceof Array ? gate.length ? [flip(gate[0]), gate[1], gate[2]] : TRUE : flip(gate); }
		function AND(gate_1, gate_2) {  return [and_gate(), gate_1, gate_2]; }
		function NAND(gate_1, gate_2) { return [flip(and_gate()), gate_1, gate_2]; }
		function CONJUNCT(gates) {
			if(!gates.length) return gates instanceof Array ? FALSE : gates;
			var gate = gates[0];
			for(var i=1;i<gates.length;i++) gate = AND(gate, gates[i]);
			return gate;
		}

		var latches = {};
		for(var to in aut.transitions) {
			var dict = {};
			var t = aut.transitions[to];
			var gates = null;
			for(var j=0; j<t.length; j++) {
				var from = t[j][0], thru = t[j][1];
				var key = from + ' ' + thru;
				if(dict[key]) continue;
				dict[key] = true;
				var gate = NAND(aut.states[from], encoded_alphabets.get_gate(aut.alphabets[thru]));
				gates = gates? AND(gates, gate) : gate;
			}
			latches[to] = aut.states[to]%2 ? gates : NOT(gates);
		}

		var f1 = CONJUNCT(aut.lhs_final_state_list.map(function(s) { return flip(aut.states[s]); }));
		var f2 = CONJUNCT(aut.rhs_final_state_list.map(function(s) { return flip(aut.states[s]); }));

		//var bad_state_formula = NAND(NAND(NOT(f1), f2), NAND(f1, NOT(f2)));
		var bad_state_formula = AND(f1, NOT(f2));

		var aag_header = 'aag ' + and_gate_id + ' ' + encoded_alphabets.num_bits + ' ' + aut.num_states + ' 1 ' + (and_gate_id - aut.num_states - encoded_alphabets.num_bits);
		var states = "States: ", alphabets = "Alphabets: ", init_states = "Initial states: ";

		for(var s in aut.states) { 
			var sid = aut.states[s]; 
			states += s + ':' + sid + ' '; 
			if(sid%2) init_states += s + ':' + sid + ' '; 
		}
		for(var a in aut.alphabets) { 
			var aid = aut.alphabets[a]; 
			alphabets += a + ':' + encoded_alphabets.get_log(aid) + ' '; 
		}
		log(states);
		log(init_states);
		log(alphabets);

		print(aag_header);	

		for(var i=1; i<=encoded_alphabets.num_bits; i++)
			print(2*i);

		for(var s in aut.states) {
			var next_state = latches[s];
			if(!next_state)
				next_state = aut.states[s];
			else
			if(next_state.length)
				next_state = next_state[0];
			var current_state = 2*(aut.states[s]>>1);
			print(current_state + ' ' + next_state);
		}

		if(bad_state_formula) {
			print(bad_state_formula[0]);
			log('Bad State: ' + print_gate(bad_state_formula));
		}else
			print(TRUE);

		var t = "Transition: \n";
		for(var s in latches) { 			 
			var state = 2*(aut.states[s]>>1);
			t += 'next(' + state + ') = ' + print_gate(latches[s]) + "\n";
		}
		log(t);
	}	

	return {run: function () {
		try{
			function done(){ if(aut.isRHS||aut.isLHS) print_formula(); }

			if(typeof process != 'undefined') {
				var Lazy = require("lazy");
				var reader = new Lazy(process.stdin);
				reader.lines.forEach(read_line);
				reader.on('end', done);
				process.stdin.resume();
			}else
			if(typeof document != 'undefined') {
				document.getElementById('aut1').value.split("\n").forEach(read_line);
				document.getElementById('aut2').value.split("\n").forEach(read_line);
				done();
			}			
		}catch(e) { log(e); throw e; }
	}};
})();

try{ 
	module.exports = { timbuk_to_aag: timbuk_to_aag } 
}catch(e){}
