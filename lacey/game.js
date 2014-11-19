var Lacey = function(view) {
	

	this.run = function(resp) {

		// users input --> output
		view.add_paragraph("You said: \"" + resp + "\"")

		// create our output
		this.respond(resp)
	}

	this.respond = function(resp) {

		if (this.is_denial(resp)) {
			this.handle_denial()
		}

		if ((resp.indexOf("cam") > -1) || (resp.indexOf("Cam") > -1)) {
			this.handle_cam()
		}

		else {
			this.handle_everything()
		}

	}

	this.is_denial = function(resp) {

		if (resp.indexOf("nothing") > -1)
			return true

		if ((resp.indexOf("didn't ") > -1) && (resp.indexOf(" do ") > -1) && 
			(resp.indexOf(" anything") > -1))
			return true

		if ((resp.indexOf("did ") > -1) && (resp.indexOf(" do ") > -1) && 
			(resp.indexOf(" anything") > -1) && (resp.indexOf(" not ") > -1))
			return true

		return false
	}

	this.handle_denial = function() {

	    rand = Math.floor((Math.random() * 4) + 1);
	    if (rand === 1)
	        view.add_paragraph("\nYeah right.\n");
	    else if (rand === 2)
	        view.add_paragraph("\nI don't believe you.\n");
	    else if (rand === 3)
	        view.add_paragraph("\nPlease be honest with me.\n");
	    else if (rand === 4)
	        view.add_paragraph("\nIf you don't tell me the truth I can't help you.\n");
	}

	this.handle_everything = function() {

	    rand = Math.floor((Math.random() * 8) + 1);
	    if (rand === 1)
	        view.add_paragraph("\nWhy wouldn't you consider her feelings before doing something like that?\n");
	    else if (rand === 2)
	        view.add_paragraph("\nHow could you think that was something you should do.\n");
	    else if (rand === 3)
	        view.add_paragraph("\nThat was a stupid thing for you to do.\n");
	    else if (rand === 4)
	        view.add_paragraph("\nShe just hates you.\n");
	    else if (rand === 5)
	        view.add_paragraph("\nThat will never be something that you should do to her.\n");
	    else if (rand === 6)
	        view.add_paragraph("\nYou should really have known better. You're so stupid.\n");
	    else if (rand === 7)
	        view.add_paragraph("\nOh man I can't belive you did something like that.\n");
	    else if (rand === 8)
	        view.add_paragraph("\nYou should have considered how that would have made her feel.\n");
		
		view.done()
	}

	this.handle_cam = function() {

		rand = Math.floor((Math.random() * 3) + 1);
	    if (rand === 1)
	        view.add_paragraph("\nOh my god... How could you do that to Cam\n");
	    else if (rand === 2)
	        view.add_paragraph("\nYou shouldn't have done anything to Cam\n");
	    else if (rand === 3)
	        view.add_paragraph("\nWhy would you think it was ok to do that to her brother?\n");
	}
}