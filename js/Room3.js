var Room3 = function(controller) {

	this.is_open = false
	this.has_cd = false
	this.cd_broken = false
	this.cut_hand = false

	this.run = function(resp) {

		if (this.examine_walls(resp))
			this.handle_examine_walls()

		else if (this.examine_walkman(resp))
			this.handle_examine_walkman()

		else if (this.go_back(resp))
			this.handle_go_back()

		else if (this.open_walkman(resp))
			this.handle_open_walkman()

		else if (this.play_music(resp))
			this.handle_play_music()

		else if (this.take_cd(resp))
			this.handle_take_cd()

		else if (this.look_note(resp))
			this.handle_look_note()

		else if (this.put_cd_back(resp))
			this.handle_put_cd_back()

		else if (this.break_cd(resp))
			this.handle_break_cd()

		else if (this.cut_self(resp))
			this.handle_cut_self()

		else if (this.sign_wall(resp))
			this.handle_sign_wall()

		else if (this.help2(resp))
			this.handle_help2()

		else if (controller.help(resp))
			this.handle_help()

		else if (controller.look(resp))
			this.handle_look()

		else
			controller.confused()
	}

	this.handle_look = function() {
		controller.add_paragraph("You are now in an even bigger room, and this " +
			"one has white walls. There is a walkman sitting in the right corner " + 
			"of the room. As you turn to your left you see a note scribbled in a " +
			"dark red substance on the wall. It reads,<br><br>&nbsp&nbspBeware the dark, beware " +
			"the painless,<br>&nbsp&nbspA cowardly quester will wander aimless.<br>&nbsp&nbspThe sacrificial " +
			"yield become the pen,<br>&nbsp&nbspThe signer continues, on and again.<br>&nbsp&nbspX_________________")
	}

	this.go_back = function(resp) {

		if (resp.contains(["go "," back"]))
			return true

		return false
	}

	this.handle_go_back = function() {
		controller.add_paragraph("You gingerly step back into the second room.")
		controller.room = 2
	}

	this.look_note = function(resp) {

		if (resp.examines("note"))
			return true

		return false
	}

	this.handle_look_note = function() {
		controller.add_paragraph("This note on the wall... It seems to be written in blood.")
	}

	this.examine_walls = function(resp) {

		if (resp.examines("wall"))
			return true

		if (resp.contains(["feel", "wall"]))
			return true

		if (resp.contains(["touch", "wall"]))
			return true

		return false
	}

	this.handle_examine_walls = function() {
		controller.add_paragraph("The walls are painted white, marred only be the" +
			" red note written on the left wall")
	}

	this.examine_walkman = function(resp) {

		if (resp.examines("walkman"))
			return true

		return false
	}

	this.handle_examine_walkman = function() {
		controller.add_paragraph("The walkman appears to be a 1995 model with a Marvin Gaye CD inside")
	}

	this.open_walkman = function(resp) {

		if (resp.contains(["open", "walkman"]))
			return true

		return false
	}

	this.handle_open_walkman = function() {
		controller.add_paragraph("You open the walkman")
		this.is_open = true
	}

	this.take_cd = function(resp) {

		if (resp.contains(["take", "cd"]))
			return true

		if (resp.contains(["pick up", "cd"]))
			return true

		if (resp.contains(["grab", "cd"]))
			return true

		if (resp.contains(["remove", "cd"]))
			return true

		if (resp.contains(["take", "disc"]))
			return true

		if (resp.contains(["pick up", "disc"]))
			return true

		if (resp.contains(["grab", "disc"]))
			return true

		if (resp.contains(["remove", "disc"]))
			return true

		if (resp.contains(["take", "CD"]))
			return true

		if (resp.contains(["pick up", "CD"]))
			return true

		if (resp.contains(["grab", "CD"]))
			return true

		if (resp.contains(["remove", "CD"]))
			return true

		return false
	}

	this.handle_take_cd = function() {
		
		if (this.is_open) {
			controller.add_paragraph("The CD is now in your hand")
			this.has_cd = true
		}

		else {
			controller.add_paragraph("You can't. It seems to be in a walkman or something.")
		}
	}

	this.play_music = function(resp) {

		if (resp.contains(["play", "music"]))
			return true

		if (resp.contains(["play", "walkman"]))
			return true

		if (resp.contains(["play", "cd"]))
			return true

		if (resp.contains(["play", "disc"]))
			return true

		if (resp.contains(["play", "CD"]))
			return true

		if (resp.contains(["listen", "music"]))
			return true

		if (resp.contains(["listen", "walkman"]))
			return true

		if (resp.contains(["listen", "cd"]))
			return true

		if (resp.contains(["listen", "CD"]))
			return true

		if (resp.contains(["press", "play"]))
			return true

		if (resp.contains(["start", "music"]))
			return true

		if (resp.contains(["start", "walkman"]))
			return true

		return false
	}

	this.handle_play_music = function() {
		
		if (this.has_cd)
			controller.add_paragraph("You can't do that! There is no CD in the walkman")
		
		else
			controller.add_paragraph("The room fills with the slow and sensual rythms of " +
				"Mr. Gaye. This pulsing beat is making you feel things you haven't felt " +
				"in years, and you begin to swoon and sway with the melody. Then you " +
				"realize that you are in some creepy dungeon with weird rooms and puzzles " +
				"and you have no idea why, and this thought sobers you up pretty quickly")
	}

	this.break_cd = function(resp) {

		if (resp.contains(["break", "cd"]))
			return true

		if (resp.contains(["snap", "cd"]))
			return true

		if (resp.contains(["break", "CD"]))
			return true

		if (resp.contains(["snap", "CD"]))
			return true

		if (resp.contains(["break", "disc"]))
			return true

		if (resp.contains(["snap", "disc"]))
			return true

		return false
	}

	this.handle_break_cd = function() {
		
		if (this.has_cd) {
			controller.add_paragraph("The CD breaks easily, leaving two jagged and sharp " +
				"semicircular pieces of plastic in your hand")
			this.cd_broken = true
		}

		else {
			controller.add_paragraph("Do you have a CD in your hand? Didn't think so")
		}
	}

	this.put_cd_back = function(resp) {

		if (resp.contains(["put", "cd", "back"]))
			return true

		if (resp.contains(["return", "cd"]))
			return true

		if (resp.contains(["put", "cd", "walkman"]))
			return true

		if (resp.contains(["put", "CD", "back"]))
			return true

		if (resp.contains(["return", "CD"]))
			return true

		if (resp.contains(["put", "CD", "walkman"]))
			return true

		return false
	}

	this.handle_put_cd_back = function() {

		if (this.cd_broken)
			controller.add_paragraph("You can't! The CD is broken")
		
		else {
			controller.add_paragraph("You put the CD back and close the walkman")
			this.has_cd = false
			this.is_open = false
		}
	}

	this.cut_self = function(resp) {

		if (resp.contains(["cut", "your"]))
			return true

		if (resp.contains(["cut", "self"]))
			return true

		if (resp.contains(["cut", "arm"]))
			return true

		if (resp.contains(["cut", "hand"]))
			return true

		if (resp.contains(["cut", "finger"]))
			return true

		if (resp.contains(["cut", "leg"]))
			return true

		if (resp.contains(["slice", "self"]))
			return true

		if (resp.contains(["slice", "your"]))
			return true

		if (resp.contains(["slice", "self"]))
			return true

		if (resp.contains(["slice", "arm"]))
			return true

		if (resp.contains(["slice", "hand"]))
			return true

		if (resp.contains(["slice", "finger"]))
			return true

		if (resp.contains(["slice", "leg"]))
			return true

		if (resp.contains(["slice", "self"]))
			return true

		return false
	}

	this.handle_cut_self = function() {
		
		if (this.cd_broken) {
			controller.add_paragraph("You make the cut and the blood starts dripping onto the floor")
			this.cut_hand = true
		}

		else
			controller.add_paragraph("There is nothing in your hand that is sharp enough to do that. Try again")

	}

	this.sign_wall = function(resp) {

		if (resp.contains(["sign", "note"]))
			return true

		if (resp.contains(["write", "name"]))
			return true

		if (resp.contains(["sign", "wall"]))
			return true

		if (resp.contains(["write", "wall"]))
			return true

		if (resp.contains(["write", "note"]))
			return true

		return false
	}

	this.handle_sign_wall = function() {

		if (this.cut_hand) {
			controller.add_paragraph("As you sign your name on the wall, you hear a hissing behind " + 
				"you. You turn just in time to see a part of the wall slide down into the floor, " +
				"leaving a path  to the next room. You gingerly step through")
			controller.room = 4
		}

		else
			controller.add_paragraph("But you have nothing with which to sign the wall! (yet)")
	}

	this.help2 = function(resp) {

		if (resp === "help2")
			return true

		return false
	}

	this.handle_help2 = function() {

		if (!this.cut_hand)
			controller.add_paragraph("The key words from the poem are 'pain' and 'sacrifice'")

		else
			controller.add_paragraph("The key word from the poem is 'signer'")

	}

	this.handle_help = function() {

		if (!this.is_open)
			controller.add_paragraph("Try examining, interacting, and opening different objects in the room")

		else if (!this.has_cd)
			controller.add_paragraph("Try picking up objects that could be useful (and sharp)")

		else if (!this.cd_broken)
			controller.add_paragraph("Hmmm, what could you do with this CD. This fragile little CD")

		else
			controller.add_paragraph("Try reading over the poem on the wall again, and if you " +
				"are still confused type help2")
	}
}