window.VikiIWLinks = {
	allWikis : new Array()
}

window.viki_getAllWikisFromIWLinks = function(vikiObject, parameters, hookName) {

	for(var i = 0; i < VikiIWLinks.allWikis.length; i++)
		vikiObject.allWikis.push(VikiIWLinks.allWikis[i]);

	vikiObject.hookCompletion(hookName, null);
}

window.vikiIWLinks_parseWikiData = function(data) {
	VikiIWLinks.allWikis = jQuery.parseJSON(data);
	for(var i = 0; i < VikiIWLinks.allWikis.length; i++) {
		if(VikiIWLinks.allWikis[i].searchableWiki === "true")
			VikiIWLinks.allWikis[i].searchableWiki = true;
		else
			VikiIWLinks.allWikis[i].searchableWiki = false;
	}
}