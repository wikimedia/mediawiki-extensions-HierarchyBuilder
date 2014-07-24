

var getComparativeWikis = function(wikiVObject, data1, flag1){

	if(flag1){
		var wikiURL = wikiVObject.wiki2;
	} else {
		var wikiURL = wikiVObject.wiki1;
	}

	jQuery.ajax({
		url: wikiURL + '?action=query&meta=siteinfo&format=json&siprop=extensions',
		dataType: 'jsonp',
		async: false,
		success: function (data, textStatus, jqXHR) {
			var wikiData = data.query.extensions;
			
			if(flag1){
				makeDiff(data1, wikiData, wikiVObject);
			} else {
				getComparativeWikis(wikiVObject, wikiData, "true")				
			}			


	},
		error: function (jqXHR, textStatus, errorThrown) {
		   error(textStatus);
		}
	}); 
}



var getGeneralWikiInfo = function(wikiVObject, data1, flag1){

	if(flag1){
		var wikiURL = wikiVObject.wiki2;
	} else {
		var wikiURL = wikiVObject.wiki1;
	}

	jQuery.ajax({
		url: wikiURL + '?action=query&meta=siteinfo&siprop=general&format=json',
		dataType: 'jsonp',
		async: false,
		success: function (data, textStatus, jqXHR) {
			var wikiData = data.query.general;
			
			if(flag1){
				makeGeneralDiff(data1, wikiData, wikiVObject);
			} else {
				getGeneralWikiInfo(wikiVObject, wikiData, "true")				
			}			
	},
		error: function (jqXHR, textStatus, errorThrown) {
		   error(textStatus);
		}
	}); 

}

