var Room4 = function(controller) {
	
	this.state = 1;

	this.run = function(resp) {

		if (this.state) {
			controller.add_paragraph("You blink, then blink again. As your eyes adjust " +
				"to the oppressive brightness you hear the omnipresent buzz of " +
				"civilization all around you. You turn back and see the room you just " +
				"exited fading from view. Now that you can see you realize that you are " +
				"sitting in front of your computer, back in the real world. Congradulations, " +
				"you have escaped the mysterious challenges. Or have you...")
			this.state = 0
		}

		else {
			controller.add_paragraph("You find yourself in a small dark room. It smells a " +
				"little moldy, and you see some water pooled in dark puddle on the floor. " +
				"There are no windows. You see one small door in front of you.")
			controller.room = 1
		}

	}

}