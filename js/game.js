var Game = function(view) {

	this.room = 1;

	this.inv = function(inv) {
	    view.add_paragraph("\nHere is your hand;");
	    view.add_paragraph("\t");
	    view.add_paragraph(inv);
	    view.add_paragraph("\n");
	}

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


	this.run = function(resp) {

		// users input --> output
		view.add_paragraph("> " + resp)

		// create our output
		if (this.room === 1)
			this.room1(resp);
		else if (this.room === 2)
			this.room2(resp);
		else if (this.room === 3)
			this.room3(resp);
	}

	this.room1 = function(resp) {

	    if (resp.indexOf("look") > -1) {
	        view.add_paragraph("You find yourself in a small dark room. It smells a little moldy, " +
								"and you see some water pooled in dark puddle on the floor. There" +
								"are no windows. You see one small door in front of you");
		}

	    else if (resp.indexOf("door") > -1) {
	        view.add_paragraph("The door creaks open. You duck down and shuffle into the next room");
	        this.room = 2;
	    }

	    else if (resp.indexOf("window") > -1) {
	        view.add_paragraph("There is no window you fool");
	    }

	    else if (resp.indexOf("puddle") > -1) {
	    	view.add_paragraph("No, that's disgusting");
	    }

	    else if (resp.indexOf("water") > -1) {
	    	view.add_paragraph("No, that's disgusting");
	    }

	    else if (resp.indexOf("help") > -1) {
	        view.add_paragraph("KISS; Keep It Simple Stupid");
	    }

	    else {
	        this.confused()
	    }


	}

	this.room2 = function(resp) {
		
	}

	this.room3 = function(resp) {

	}
}