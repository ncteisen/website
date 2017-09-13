var Room1 = function(controller) {

	this.looked = false

	this.run = function(resp) {

		if (this.door(resp))
			this.handle_door()

		else if (this.the_window(resp))
			this.handle_window()

		else if(this.puddle(resp))
			this.handle_puddle()

		else if (controller.help(resp))
			this.handle_help()

		else if (controller.look(resp))
			this.handle_look()

		else
			controller.confused()

	}

	this.handle_look = function() {
		controller.add_paragraph("You find yourself in a small dark room. It smells a little moldy, " +
								"and you see some water pooled in dark puddle on the floor. There " +
								"are no windows. You see one small door in front of you");
		this.looked = true
	}

	this.door = function(resp) {

		if (resp.contains("door"))
			return true

		return false
	}

	this.handle_door = function() {
		controller.add_paragraph("The door creaks open. You duck down and shuffle into the next room");
	    controller.room = 2;
	}

	this.the_window = function(resp) {

		if (resp.contains("window"))
			return true

		return false
	}

	this.handle_window = function() {
		controller.add_paragraph("There is no window you fool");
	}

	this.puddle = function(resp) {

		if (resp.contains("puddle"))
			return true

		if (resp.contains("water"))
			return true

		return false
	}

	this.handle_puddle = function() {
		controller.add_paragraph("No, that's disgusting");
	}

	this.handle_help = function() { 

		if (this.looked)
			controller.add_paragraph("KISS; Keep It Simple Stupid");

		else
			controller.add_paragraph("It's a good idea to start every with the command \'look\'")
	}

}