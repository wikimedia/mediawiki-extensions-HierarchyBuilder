//This is sort of a helper function I used to assist in calling the other
// two functions that will actually perform the work on the string of 
// BibTex references.  I simply pass the information from a textarea to
// the function.
function handleClick(info){

	//Test Statement
	document.write("Working" + "<br /><br />");
	
	//This calls the function parseBibtex and sets the returned array to
	// myArray.
	var myArray = parseBibtex(info);
	
	//This for loop steps through the returned array, and parses it using
	// JSON to confirm the format is correct.
	for (var i = 0; i < myArray.length; i++){
		try {
			myArray[i] = JSON.parse(myArray[i]);
		} catch(e) {
			//This should be logged, not printed out to an alert box
			alert(e);
		}
		
		//Test Statement
		document.write('myArray' + i + "<br />" + JSON.stringify(myArray[i]));
		document.write("<br />");
	}

}
			
/**
* This function will take in a block of information that is expected to
* be one or more BibTex references.  The function will then split the 
* block into separate BibTex references, ensure that the format of each
* reference matches what is expected, and pass each of them to the
* parseEach function.  The returned string will replace the BibTex 
* reference in the bibtexArray.  Once all have been passed to the 
* parseEach function and reformatted then the array of references will
* be returned.
*
* @param {string} info  The block of information assumed to contain 
*	BibTex references
* @return {array}  The array of newly formatted JSON strings representing
*	the original BibTex references
*/
function parseBibtex(info){

	//Ensure the object passed into function is not null.
	if (info == null)
		return null;

	//This adds a newline character to the beginning of the block of references
	// to ensure that the block is separated properly in the next statement
	var bibtex = "\n" + info;

	//This creates a new array of each of the different BibTex entries
	// by splitting the large file using the \n@ characters.  
	var bibtexArray = bibtex.split("\n@");
	
	//Because the first BibTeX entry starts with a "\n@" string there 
	// will be a string in the beginning that is either empty or it is
	// an erroneous string as the first element of the bibtexArray.  If 
	// it is not just whitespace, then this will print it out (should be
	// logged) and then discard it either way.
	if (bibtexArray[0].search(/[^\s\n\r]/) != -1){
		//This should be logged, not printed out to the screen
		document.write("This was not recognized as a BibTex reference:<br />" + bibtexArray[0].trim() + "<br /><br />");
	}
	bibtexArray.shift();
	
	//This array will step through each member of the bibtexArray, trim
	// whitespace, and then pass it to the parseEach function.  I have 
	// added the functionality to confirm that the array member is an 
	// actual BibTex reference to avoid issues parsing the information.
	for (var i = 0; i < bibtexArray.length; i++){
	
		//This makes sure that there wasn't any unwanted text that was
		// added to the tail of a reference from a reference that
		// wasn't formatted correctly or erroneous text.  If there is
		// extra text it is printed out (should be logged), and then
		// cut from the end of the reference.
		var endPlace = bibtexArray[i].search(/\n\s*\}/);		
		if (bibtexArray[i].substr(endPlace + 2).search(/[^\s\n\r]/) != -1){
		
			//This should be logged, not printed out to the screen
			document.write("This was not recognized as a BibTex reference:<br />" + bibtexArray[i].substr(endPlace + 2).trim() + "<br /><br />");
			bibtexArray[i] = bibtexArray[i].substring(0, endPlace + 1);
			
		}
	
		//Trims whitespace
		bibtexArray[i] = bibtexArray[i].trim();	
		
		//This confirms that the beginning of the array member matches
		// what would be expected from a BibTeX reference.  If it does 
		// not match it is printed out (should be logged) and discarded. 
		// Then the for loop continues.
		var tmp = bibtexArray[i].match(/\w+\{\S+\s*,/);
		if (tmp != null){
		
			bibtexArray[i] = parseEach(bibtexArray[i]);
			
		} else {
		
			//This should be logged, not printed out to the screen
			document.write("This was not recognized as a BibTex reference:<br />" + bibtexArray[i]);
			bibtexArray.splice(i, 1);
			i--;
			
		}

	}

	//Return the formatted information as an array of strings
	return bibtexArray;

}

/**
* This function will take in a string, separate the information according
* to standard BibTex format.  The string will then be rebuilt in JSON 
* format.  This JSON string will then be returned.
*
* @param {string} bibtex  The string to format	
* @return {string}  The JSON formatted string
*/
function parseEach(bibtex){

	//Ensure the object passed into function is not null.
	if (bibtex == null)
		return null;
	
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
	// splitting each string using '=', which separates the remaining headings
	// from the info they denote.  Then the two pieces are added to their 
	// respective arrays.
	for (var i = 0; i < (bibtexSplit.length - 1); i++){
	
		tempArray = bibtexSplit[i].split("=");
		headingsArray.push(tempArray[0]);
		infoArray.push(tempArray[1]);
		
		//The former statements have the side effect of splitting the information into
		// more than just two pieces if there is an "=" sign present within the information
		// block.  This checks to make sure that has not happened, and if it has it readds
		// the information back to the end of the infoArray data member.
		if (tempArray[2] != null){
			for (var j = 2; j < tempArray.length; j++){
				infoArray[infoArray.length - 1] = infoArray[infoArray.length - 1] + "=" + tempArray[j];
			}
		}
		
		//This clears the temporary array for further use.
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
		// BibTeX.  If they are it strips these.
		if (infoArray[i].charAt(0) == infoArray[i].charAt(infoArray[i].length - 1) && infoArray[i].charAt(0) == "\"")
			infoArray[i] = infoArray[i].substring(1, infoArray[i].length - 1);
		
		if (infoArray[i].charAt(0) == "{" && infoArray[i].charAt(infoArray[i].length - 1) == "}")
			infoArray[i] = infoArray[i].substring(1, infoArray[i].length - 1);
		
	}
	
	//This if statement determines if their is a "type" field present in the
	// BibTeX reference.  If there is not then it adds the field and sets it
	// to the type of BibTeX entry that it is.
	if (headingsArray.indexOf("type" == -1)) {

		headingsArray.push("type");
		infoArray.push(headingsArray[0]);
		
	}
	
	//This creates a string to place the information into JSON format
	var retString = "{";
	
	//This for loop works through the two arrays, prepares all of the strings
	// for JSON parsing and builds the return string
	for (var i = 0; i < headingsArray.length; i++){
	
		//This will trim whitespace and escape any characters JSON dislikes
		headingsArray[i] = JSON.stringify(headingsArray[i].trim());
		infoArray[i] = JSON.stringify(infoArray[i].trim());
	
		//This builds the return string according to JSON styling
		if (i != headingsArray.length - 1)					
			retString = retString.concat(headingsArray[i], ":", infoArray[i], ", ");
		else 
			retString = retString.concat(headingsArray[i], ":", infoArray[i], "}");
		
	}

	//Return the string previously built
	return retString

}