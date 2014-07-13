window.WikiTreeMap = function() {
    var jsonData = {"name":"allcategories", "children" : []};
    var elmData;
}






WikiTreeMap.prototype.drawChart = function(graphDiv, divwidth, divheight, wiki) {
	
	window.onload = function(e){        
		if (wiki !== ""){
//			$('#selectAWiki').hide();						
			var elmDiv = wiki;
			elmData = elmDiv;        
			jsonData = {"name":"allcategories", "children" : []};
				$('div.wikitreemap-graph-container').append("<h2>" + elmData + "</h2>");
			var categoryUrl = getCategoryUrl(elmData);
			var	wantedUrl = getWantedUrl(elmData);
			var unusedUrl = getUnusedUrl(elmData);
			getWanted(wantedUrl, categoryUrl, graphDiv, divwidth, divheight);
			getUnused(unusedUrl, categoryUrl, graphDiv, divwidth, divheight);
		} else {
			var vikiObject = [];
				vikiObject.graphDiv = graphDiv;
				vikiObject.divwidth = divwidth;
				vikiObject.divheight = divheight;
			mitre_getAllWikis(vikiObject) 
		}
    }; 

}







function fillDropdown(dropdownName, vikiObject) {
	
	// Creating the dropdown menu
    $('#selectAWiki').append('<select id="wikis" style="width:500px;"></select>');		
    $(dropdownName).prepend("<option value='0' selected='true'>" +"--Select a Wiki--"+ "</option>");
    $(dropdownName).find("option:first")[0].selected = true;
    $('#selectAWiki').append('<p><button id="loadData" type="button">Load Data</button></p>');		
    $('#selectAWiki').append('<p><button id="clearData" type="button">clear</button></p>');		
    $(dropdownName).append('<option value="' + "http://mitrepedia.mitre.org/api.php" + '">' + "MITREpedia" + '</option>');

  	vikiObject.activeWikis.forEach(function(d) {
		if(d.wikiTitle==="CTS" ^ d.wikiTitle==="J85d-jobs" ^ d.wikiTitle==="Energy Tools"){
			console.log(d.wikiTitle);
		} else {
	        $(dropdownName).append('<option value="' + d.apiURL + '">' + d.wikiTitle + '</option>');
		}
    });
	
	$('#clearData').click(function(e){$('svg').remove(); $('h2').remove();})

	$('#loadData').click(function(e){
	    var elmDiv = $('#wikis');
	    elmValue = elmDiv[0].value;        
		elmLabel = elmDiv[0]['selectedOptions'][0]['label'];
	    jsonData = {"name":"allcategories", "children" : []};
		$('div.wikitreemap-graph-container').append("<h2>" + elmLabel + "</h2>");
		vikiObject.elmLabel = elmLabel;
//		console.log(elmValue);
		vikiObject.wUrl = elmValue + "?action=query&list=allcategories&format=json&acprop=size&aclimit=500&acmin=1"
		vikiObject.unusedUrl = elmValue + "?action=query&list=querypage&qppage=Unusedcategories&format=json"
		vikiObject.wantedUrl = elmValue + "?action=query&list=querypage&qppage=Wantedcategories&format=json";
		  if(vikiObject.elmLabel === "MITREpedia"){
			recursiveQuery(vikiObject);			
		  } else {
			getWanted(vikiObject);  
			getUnused(vikiObject);
		  }
	  });     
}



