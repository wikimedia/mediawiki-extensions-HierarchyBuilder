window.VIKI = (function(my) {
	my.VikiIWLinks = {
		allWikis : new Array(),

		viki_getAllWikisFromIWLinks : function(vikiObject, parameters, hookName) {

			for(var i = 0; i < allWikis.length; i++)
				vikiObject.allWikis.push(allWikis[i]);

			vikiObject.hookCompletion(hookName, null);
		},

		viki_parseWikiData : function(data) {
			allWikis = jQuery.parseJSON(data);
			for(var i = 0; i < allWikis.length; i++) {
				if(allWikis[i].searchableWiki === "true")
					allWikis[i].searchableWiki = true;
				else
					allWikis[i].searchableWiki = false;
			}
		}
	};

	return my;
}(window.VIKI || {}));