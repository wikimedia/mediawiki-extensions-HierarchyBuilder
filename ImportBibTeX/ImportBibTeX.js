if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

function importBibTeX(div, api_url, xml, overwrite) {

	var div_progress = div + "_progress";
	var div_duplicates = div + "_duplicates";
	var div_errors = div + "_errors";
	var div_details = div + "_details";

	//var records = jQuery(jQuery.parseXML(xml)).find("record");
	var records = xml.split("@");
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

	importSet(div_progress, div_duplicates, div_errors, div_details, api_url, records, overwrite);
}

function importSet(div_progress, div_duplicates, div_errors, div_details,
	api_url, records, overwrite) {
	importOne(div_progress, div_duplicates, div_errors, div_details, api_url,
		records, overwrite, 0, 0, 0);
}

function importOne(div_progress, div_duplicates, div_errors, div_details,
	api_url, records, overwrite, index, duplicates, errors) {
	if (index >= records.length) return;
	var action = "add_bibtex";
	var data = getFields(records[index]);
	data.action = action;
	data.overwrite = overwrite;
	data.format = "json";

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
				api_url, records, overwrite, index, duplicates, errors);
		}
	});
}

function getFields(tempString) {
    var fields = {};

    //Grab bibtexType
    var index = tempString.indexOf("{");
    var bibtexType = tempString.substring(0, index);
    index++;
    tempString = tempString.substring(index, tempString.length);
    //document.write(bibtexType+ "<bR>");
    
    //Grab second metadata
    index = tempString.indexOf(",");
    var secondMetadata = tempString.substring(0, index);
    index++;
    tempString = tempString.substring(index, tempString.length);
    //document.write(secondMetadata+ "<bR>");
    
    index = tempString.indexOf("=");
                                           
    while(index != -1) {
        var header = tempString.substring(0, index-1).trim();
    
        index++;
        //document.write("header: \"" + header + "\"" + "<br>");
        tempString = tempString.substring(index).trim();
      	
        if(tempString.charAt(0) == "{") {
            var index2 = tempString.indexOf("}");
            var value = tempString.substring(1, index2).trim();
            //document.write("value: \"" + value + "\"" + "<br>");
            index = index2 + 2;
            fields[header] = value;
        } else {
            var index2 = tempString.indexOf(",");
            if(index2 == -1) {
        	    index2 = tempString.indexOf("}");
            }
        	var value = tempString.substring(0, index2).trim();
        	//document.write("value: \"" + value + "\"" + "<br>");
        	index = ++index2;
        	fields[header] = value;
    	}
      	
		tempString = tempString.substring(index).trim();
    	index = tempString.indexOf("=");       
    }
    
	if(fields["type"] == null) {
    	fields["type"] = bibtexType;
    }
    
	//document.write(index + "<br>");
	//document.write("fields[type]: " + fields["type"] + "<br>");
    
	return fields;
    
}
/*
function getFields(record) {
	var tags = [
		"ref-type",
		"title",
		"tertiary-title",
		"full-title",
		"abstract",
		"call-num",
		"isbn",
		"language",
		"notes",
		"pages",
		"publisher",
		"pub-location",
		"volume",
		"date",
		"year",
		"electronic-resource-num",
		"url"
		];
	var fields = {};
	var i;
	for (i in tags) {
		var tag = tags[i];
		var xtag = tag;
		fields[xtag] = "";
		var elements = record.getElementsByTagName(tag);
		var j;
		for (j = 0; j < elements.length; j++) {
			var element = elements[j];
			if (element.textContent.length > 0) {
				if (fields[xtag].length == 0) {
					fields[xtag] = element.textContent;
				} else {
					fields[xtag] += ";" + element.textContent;
				}
			}
		}
	}
	fields.authors = "";
	elements = record.getElementsByTagName("author");
	for (j = 0; j < elements.length; j++) {
		var element = elements[j];
		if (element.textContent.length > 0) {
			fields.authors += "<author>" + element.textContent + "</author>";
		}
	}
	fields.keywords = "";
	elements = record.getElementsByTagName("keyword");
	for (j = 0; j < elements.length; j++) {
		var element = elements[j];
		if (element.textContent.length > 0) {
			fields.keywords += "<keyword>" + element.textContent + "</keyword>";
		}
	}
	return fields;
}
*/
