window.DummyBase = {

	hasHooks: false,

	initialize: function(hooks) {
		$("#DummyBase_MainDiv").width(1200);
		$("#DummyBase_MainDiv").height(800);

		myHooks = jQuery.parseJSON(hooks);
		DummyBase.hasHooks = (myHooks != null);
		self.log("initialized.");
		
		if(DummyBase.hasHooks) {
			location1Hooks = myHooks["Location 1"];
			if(location1Hooks) {
				self.log("About to call hooks for Location 1...");
				for(var i = 0; i < location1Hooks.length; i++)
					window[location1Hooks[i]]();

				self.log("Done calling hooks for Location 1.");
			}
		}
		else {
			self.log("No hooks for Location 1.");
		}
		
		myArray = new Array();
		if(DummyBase.hasHooks) {
			location2Hooks = myHooks["Location 2"];
			if(location2Hooks) {
				self.log("About to call hooks for Location 2...");
					
				for(var i = 0; i < myHooks["Location 2"].length; i++)
					window[myHooks["Location 2"][i]](myArray);
				
				self.log("Done calling hooks for Location 2. myArray now contains: ");
				for(var i = 0; i < myArray.length; i++)
					self.log(myArray[i]);
			}
		}
		else {
			self.log("No hooks for Location 2.");
		}
		
	}
}

self.log = function(text) {
	if( (window['console'] !== undefined) )
		console.log( text );
}

function n() {
	self.log("n");
}
