var Moving_object = function(location, speed) {

	this.moving = false
	this.location = location
	this.speed = speed

	this.is_currently_moving = function() {
		return this.moving
	}

	this.get_current_location = function() {
		return this.location
	}

	this.get_current_speed = function() {
		return this.speed
	}

}