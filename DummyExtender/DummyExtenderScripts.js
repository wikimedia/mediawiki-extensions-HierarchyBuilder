function function1() {
	self.log("function1 called");
}

function function2() {
	self.log("function2 called");
}

function function3(array) {
	array.push("new thing");
	self.log("function3 called and added a thing to the array");
}

function function4(array) {
	array.push("a different new thing");
	self.log("function4 called and added yet another thing to the array");
}
