var Room1 = function(user, controller) {
	
	this.lights_on = false

	this.run = function(resp) {

		if (controller.look(resp))
			this.handle_look()
		else if (this.lights(resp))
			this.handle_lights()
		else if (this.feel(resp))
			this.handle_feel()
		else
			controller.confused()
	}

	this.feel = function(resp) {
		if (resp.contains(["feel", "around"]))
			return true
		if (resp.contains(["feel", "walls"]))
			return true
		if (resp.contains(["touch", "walls"]))
			return true
		if (resp.contains(["feel", "wall"]))
			return true
		if (resp.contains(["touch", "wall"]))
			return true

		return false
	}

	this.handle_feel = function() {
		controller.add_paragraph("The wall is cool to the touch. " +
			"You run your hand along is as you shuffle along. You hit" +
			" something plastic, it seems to be a light switch.")
	}

	this.lights = function(resp) {
		if (resp.contains(["turn", "lights", "on"]))
			return true
		if (resp.contains(["light", "switch"]))
			return true

		return false
	}

	this.handle_lights = function() {
		this.lights_on = true

		controller.add_paragraph("You hit the switch and a dull yellow light flickers on above your head")
	}

	this.handle_look = function(resp) {
		if (this.lights_on) {
			controller.add_paragraph("The room is large and sparse. Grey concrete makes up the walls and floor; there are no windows. ")
		}
		else {
			controller.add_paragraph("The darkness around you is dense and overpowering, you cannot see a single thing.")
		}
	}

}