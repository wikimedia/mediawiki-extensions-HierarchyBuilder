//This is sort of a helper function I used to assist in calling the other
// two functions that will actually perform the work on the string of 
// BibTex references.  I simply pass the information from a textarea to
// the function.
function handleClick(info){
	document.write("Working" + "<br />");
	
	var myArray = parseBibtex(info);
	
	for (var i = 0; i < myArray.length; i++){
		try {
			myArray[i] = JSON.parse(myArray[i]);
		} catch(e) {
			//This isn't the best solution for the actual website.  Is there some
			// sort of logging system used?
			alert(e);
		}
		document.write('myArray' + i + "<br />" + JSON.stringify(myArray[i]));
		document.write("<br />");
	}

}
			
/**
* This function will take in a block of information that is expected to
* be one or more BibTex references.  The function will then split the 
* block into separate BibTex references, and pass each of them to the
* parseEach function.  The returned string will replace the BibTex 
* reference in the bibtexArray.  Once all have been passed to the 
* parseEach function and reformatted then the array of references will
* be returned.
* @param {string} info  The block of information assumed to contain 
*	BibTex references
* @return {array}  The array of newly formatted JSON strings representing
*	the original BibTex references
*/
function parseBibtex(info){

	//This creates a new array of each of the different BibTex entries
	// by splitting the large file using the @ character.  
	var bibtexArray = info.split("@");
	
	//Because the text starts with an @ symbol there is an empty string
	// created as the first element of the bibtexArray.  Here it is 
	// discarded.
	bibtexArray.shift();
	
	//This array will step through each member of the bibtexArray, trim
	// whitespace, and then pass it to the parseEach function.
	for (var i = 0; i < bibtexArray.length; i++){
	
		bibtexArray[i] = bibtexArray[i].trim();
		bibtexArray[i] = parseEach(bibtexArray[i]);
		
	}

	//Return the formatted information as an array of strings
	return bibtexArray;

}

/**
* This function will take in a string, separate the information according
* to standard BibTex format.  The string will then be rebuilt in JSON 
* format.  This JSON string will then be returned.
* @param {string} bibtex  The string to format	
* @return {string}  The JSON formatted string
*/
function parseEach(bibtex){
	
	//Declare two empty arrays that will be used to store the headings
	// and another to store the corresponding information.
	var headingsArray = [];
	var infoArray = [];

	//This creates a new array and populates it with the separate lines
	// from the BibTex text
	var bibtexSplit = bibtex.split("\n");
	
	//This section splits the first object from the bibtexSplit array,
	// which is the first line from the BibTex.  This object is then
	// split using the '{' as a separator then the two parts are added
	// to the two arrays created earlier. Then the first object from the
	// bibtexSplit array is discarded, and we clear the tempArray for use
	// later.
	var tempArray = bibtexSplit[0].split("{");
	headingsArray.push(tempArray[0]);
	infoArray.push(tempArray[1]);
	bibtexSplit.shift();
	tempArray = [];
	
	//This for loop works through the remaining members of bibtexSplit by
	// splitting each string using ' = ', which separates the remaining headings
	// from the info they denote.  Then the two pieces are added to their 
	// respective arrays.
	for (var i = 0; i < (bibtexSplit.length - 1); i++){
	
		var tempArray = bibtexSplit[i].split("=");
		headingsArray.push(tempArray[0]);
		infoArray.push(tempArray[1]);
		tempArray = [];
		
	}
	
	//This for loop works through each of the members of the infoArray array
	// and prepares them for JSON parsing.
	for (var i = 0; i < infoArray.length; i++){
	
		//This trims any whitespace from the string
		infoArray[i] = infoArray[i].trim();
	
		//This if statement determines if the member has a trailing comma, and 
		// removes it if it does.
		if (infoArray[i].charAt(infoArray[i].length - 1) == ',')
			infoArray[i] = infoArray[i].substring(0, infoArray[i].length - 1); 
		
		//This trims any whitespace from the string
		infoArray[i] = infoArray[i].trim();
		
		//These two if statements determine if the data members are wrapped in
		// quotation marks or braces, which are the two most common styles in
		// BibTex.  If they are it strips these.
		if (infoArray[i].charAt(0) == infoArray[i].charAt(infoArray[i].length - 1) && infoArray[i].charAt(0) == "\"")
			infoArray[i] = infoArray[i].substring(1, infoArray[i].length - 1);
		
		if (infoArray[i].charAt(0) == "{" && infoArray[i].charAt(infoArray[i].length - 1) == "}")
			infoArray[i] = infoArray[i].substring(1, infoArray[i].length - 1);
		
		//This trims any whitespace from the string
		infoArray[i] = infoArray[i].trim();
		
		//This method call will escape any special characters within the string
		// and add quotation marks around the string.
		infoArray[i] = JSON.stringify(infoArray[i]);
		
	}
	
	//This for loop will prepare the headings for use in JSON parsing.
	for (var i = 0; i < headingsArray.length; i++){
	
		//This trims any whitespace from the string
		headingsArray[i] = headingsArray[i].trim();
		
		//This method call will escape any special characters within the string
		// and add quotation marks around the string.
		headingsArray[i] = JSON.stringify(headingsArray[i]);
		
	}
	
	//This creates a string to place the information into JSON format
	var retString = "{";
	
	//This for loop works through the two arrays and builds the return string
	for (var i = 0; i < headingsArray.length; i++){
	
		if (i != headingsArray.length - 1)					
			retString = retString.concat(headingsArray[i], ":", infoArray[i], ", ");
		else 
			retString = retString.concat(headingsArray[i], ":", infoArray[i], "}");
		
	}

	//Return the string previously built
	return retString

}