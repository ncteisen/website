var Controller = function(view) {

	// remembers where we are
	this.room = 1

	// create the rooms
	this.room1 = new Room1(this)
	this.room2 = new Room2(this)
	this.room3 = new Room3(this)
	this.room4 = new Room4(this)

	String.prototype.contains = function(str) {
		
		// checks array of strings
		if (str.constructor === Array) {
			for (i = 0; i < str.length; ++i) {
				if (this.indexOf(str[i]) <= -1)
					return false
			}
			return true
		}
		
		// only one string
		else
			return this.indexOf(str) > -1
	}

	String.prototype.examines = function(str) {
		
		if (this.contains(["examine", str]))
			return true

		if (this.contains(["search", str]))
			return true

		if (this.contains(["look", str]))
			return true

		return false
	}

	this.add_paragraph = function(text) {
		view.add_paragraph(text)
	}

	// handles unrecognized input
	this.confused = function() {
	    rand = Math.floor((Math.random() * 8) + 1);
	    if (rand === 1)
	        view.add_paragraph("\nUh... don't do that\n");
	    else if (rand === 2)
	        view.add_paragraph("\nNo, I don't think that will work\n");
	    else if (rand === 3)
	        view.add_paragraph("\nTry again\n");
	    else if (rand === 4)
	        view.add_paragraph("\nThink of something else to try\n");
	    else if (rand === 5)
	        view.add_paragraph("\nNo, that won't do\n");
	    else if (rand === 6)
	        view.add_paragraph("\nRemember, you can always type help\n");
	    else if (rand === 7)
	        view.add_paragraph("\nHmm, seems like you need use the help command\n");
	    else if (rand === 8)
	        view.add_paragraph("\nI have a hot tip that the help command is really useful\n");
	}

	this.look = function(resp) {

		if (resp === "look")
			return true

		if (resp === "look around")
			return true

		return false
	}

	this.help = function(resp) {

		if (resp === "help")
			return true

		if (resp === "help me")
			return true

		return false
	}

	// delegated to the room obj
	this.run = function(resp) {

		// users input --> output
		view.add_paragraph_simple("> " + resp)

		resp = resp.toLowerCase();

		// create our output
		if (this.room === 1)
			this.room1.run(resp);
		else if (this.room === 2)
			this.room2.run(resp);
		else if (this.room === 3)
			this.room3.run(resp);
		else if (this.room === 4)
			this.room4.run(resp)
	}

}
