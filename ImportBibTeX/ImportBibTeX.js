
window.importBibTeX = function (div, api_url, xml, overwrite, injurytype) {

	var div_progress = div + "_progress";
	var div_duplicates = div + "_duplicates";
	var div_errors = div + "_errors";
	var div_details = div + "_details";

    var b = new BibtexParser();
    b.setInput(xml);
    b.bibtex();

    var e = b.getEntries();
	var records = new Array();
    for (var item in e) {
		records.push(e[item]);
    }

	var message = "";
	if (overwrite) {
		message += "<p>Duplicate items will be overwritten.</p><br />";
	} else {
		message += "<p>Duplicate items will be ignored.</p><br />";
	}
	message +=
"<p>Items: <span id='" + div_progress + "'>0</span>/" +
records.length + " (<span id='" + div_duplicates + "'>0</span>" +
" duplicates, <span id='" + div_errors + "'>0</span> errors)</p><br />" +
"<div id='" + div_details + "'></div>";
	jQuery("#" + div).html(message);

	importSet(div_progress, div_duplicates, div_errors, div_details, api_url, records, overwrite, injurytype);
}

window.importSet = function (div_progress, div_duplicates, div_errors, div_details,
	api_url, records, overwrite, injurytype) {
	importOne(div_progress, div_duplicates, div_errors, div_details, api_url,
		records, overwrite, 0, 0, 0, injurytype);
}

window.importOne = function (div_progress, div_duplicates, div_errors, div_details,
	api_url, records, overwrite, index, duplicates, errors, injurytype) {
	if (index >= records.length) return;
	var action = "add_bibtex";
	//var data = getFields(records[index]);
	var data2 = records[index];
	var data = {};
	
	data.action = action;
	data.overwrite = overwrite;
	data.format = "json";
	data2["injurytypes"] = injurytype;
	data["bibtexJSON"] = JSON.stringify(data2);

    //console.log("Overwrite: " + overwrite);

	jQuery.ajax({
		type: "POST",
		url: api_url,
		xhrFields: {
			withCredentials: true
		},
		data: data,
		dataType: "json",
		success: function(data) {
			//console.log("Hi Kevin2:" + data[action][0]);
			if (data[action][0] > 0) {
				duplicates++;
				jQuery("#" + div_duplicates).html(duplicates);
				jQuery("#" + div_details).append("<p>Duplicate title: " +
					data[action][1] + "</p>");
			} else if (data[action][0] < 0) {
			    //console.log("Hi Kevin error but successful return:" + data[action][0]);
				errors++;
				jQuery("#" + div_errors).html(errors);
			}
		},
		error: function() {
			//console.log("Hi Kevin error");
			errors++;
			jQuery("#" + div_errors).html(errors);
		},
		complete: function() {
			index++;
			jQuery("#" + div_progress).html(index);
			importOne(div_progress, div_duplicates, div_errors, div_details,
				api_url, records, overwrite, index, duplicates, errors, injurytype);
		}
	});
}


window.BibtexParser = function() {
  this.pos = 0;
  this.input = "";
  
  this.entries = {};
  this.strings = {
      JAN: "January",
      FEB: "February",
      MAR: "March",      
      APR: "April",
      MAY: "May",
      JUN: "June",
      JUL: "July",
      AUG: "August",
      SEP: "September",
      OCT: "October",
      NOV: "November",
      DEC: "December"
  };
  this.currentKey = "";
  this.currentEntry = "";
  

  this.setInput = function(t) {
    this.input = t;
  }
  
  this.getEntries = function() {
      return this.entries;
  }

  this.isWhitespace = function(s) {
    return (s == ' ' || s == '\r' || s == '\t' || s == '\n');
  }

  this.match = function(s) {
    this.skipWhitespace();
    if (this.input.substring(this.pos, this.pos+s.length) == s) {
      this.pos += s.length;
    } else {
      throw "Token mismatch, expected " + s + ", found " + this.input.substring(this.pos);
    }
    this.skipWhitespace();
  }

  this.tryMatch = function(s) {
    this.skipWhitespace();
    if (this.input.substring(this.pos, this.pos+s.length) == s) {
      return true;
    } else {
      return false;
    }
    this.skipWhitespace();
  }

  this.skipWhitespace = function() {
    while (this.isWhitespace(this.input[this.pos])) {
      this.pos++;
    }
    if (this.input[this.pos] == "%") {
      while(this.input[this.pos] != "\n") {
        this.pos++;
      }
      this.skipWhitespace();
    }
  }

  this.value_braces = function() {
    var bracecount = 0;
    this.match("{");
    var start = this.pos;
    while(true) {
      if (this.input[this.pos] == '}' && this.input[this.pos-1] != '\\') {
        if (bracecount > 0) {
          bracecount--;
        } else {
          var end = this.pos;
          this.match("}");
          return this.input.substring(start, end);
        }
      } else if (this.input[this.pos] == '{') {
        bracecount++;
      } else if (this.pos == this.input.length-1) {
        throw "Unterminated value";
      }
      this.pos++;
    }
  }

  this.value_quotes = function() {
    this.match('"');
    var start = this.pos;
    while(true) {
      if (this.input[this.pos] == '"' && this.input[this.pos-1] != '\\') {
          var end = this.pos;
          this.match('"');
          return this.input.substring(start, end);
      } else if (this.pos == this.input.length-1) {
        throw "Unterminated value:" + this.input.substring(start);
      }
      this.pos++;
    }
  }
  
  this.single_value = function() {
    var start = this.pos;
    if (this.tryMatch("{")) {
      return this.value_braces();
    } else if (this.tryMatch('"')) {
      return this.value_quotes();
    } else {
      var k = this.key();
      if (this.strings[k.toUpperCase()]) {
        return this.strings[k];
      } else if (k.match("^[0-9]+$")) {
        return k;
      } else {
        throw "Value expected:" + this.input.substring(start);
      }
    }
  }
  
  this.value = function() {
    var values = [];
    values.push(this.single_value());
    while (this.tryMatch("#")) {
      this.match("#");
      values.push(this.single_value());
    }
    return values.join("");
  }

  this.key = function() {
    var start = this.pos;
    while(true) {
      if (this.pos == this.input.length) {
        throw "Runaway key";
      }
    
      if (this.input[this.pos].match("[a-zA-Z0-9_:\\./\?-]")) {
        this.pos++
      } else {
        return this.input.substring(start, this.pos).toLowerCase();
      }
    }
  }

  this.key_equals_value = function() {
    var key = this.key();
    if (this.tryMatch("=")) {
      this.match("=");
      var val = this.value();
      return [ key, val ];
    } else {
      throw "... = value expected, equals sign missing:" + this.input.substring(this.pos);
    }
  }

  this.key_value_list = function() {
    var kv = this.key_equals_value();
    this.entries[this.currentEntry][kv[0]] = kv[1];
    while (this.tryMatch(",")) {
      this.match(",");
      if (this.tryMatch("}")) {
        break;
      }
      kv = this.key_equals_value();
      this.entries[this.currentEntry][kv[0]] = kv[1];
    }
  }

  this.entry_body = function(type) {
    this.currentEntry = this.key();
    this.entries[this.currentEntry] = new Object();    
    this.match(",");
    this.key_value_list();
	if(this.entries[this.currentEntry]["type"] == null) {
    	this.entries[this.currentEntry]["type"] = type;
	}
  }

  this.directive = function () {
    this.match("@");
    return "@"+this.key();
  }

  this.string = function () {
    var kv = this.key_equals_value();
    this.strings[kv[0].toUpperCase()] = kv[1];
  }

  this.preamble = function() {
    this.value();
  }

  this.comment = function() {
    this.value(); // this is wrong
  }

  this.entry = function(type) {
    this.entry_body(type);
  }

  this.bibtex = function() {
    while(this.tryMatch("@")) {
      var d = this.directive().toUpperCase();
      this.match("{");
      if (d == "@STRING") {
        this.string();
      } else if (d == "@PREAMBLE") {
        this.preamble();
      } else if (d == "@COMMENT") {
        this.comment();
      } else {
        this.entry(d.substring(1).toLowerCase());
      }
      this.match("}");
    }
  }
}

