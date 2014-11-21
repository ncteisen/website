var Room2 = function(controller) {

	this.looked = false
	this.note = false
	this.examined = false
	this.key = false
	this.num_bugs = 3

	this.run = function(resp) {

		if (this.go_back(resp))
			this.handle_go_back()

		else if (this.look_under_bed(resp))
			this.handle_look_bed()

		else if (this.take_note(resp))
			this.handle_take_note()

		else if (this.look_note(resp))
			this.handle_look_note()

		else if (this.read_note(resp))
			this.handle_read_note()

		else if (this.look_walls(resp))
			this.handle_look_walls()

		else if(this.introspection(resp))
			this.handle_introspection()

		else if(this.spider(resp))
			this.handle_spider()

		else if (this.look_bug(resp))
			this.handle_look_bug()

		else if (this.eat_bug(resp))
			this.handle_eat_bug()

		else if (this.squish_bug(resp))
			this.handle_squish_bug()

		else if (this.door(resp))
			this.handle_door()

		else if (this.sleep(resp))
			this.handle_sleep()

		else if (this.slime(resp))
			this.handle_slime()

		else if (controller.help(resp))
			this.handle_help()

		else if (controller.look(resp))
			this.handle_look()

		else 
			controller.confused()

	}

	this.handle_look= function() {
		controller.add_paragraph("You are now in a room slightly bigger than last. " + 
			"The smell has gotten noticably stronger, and now the walls are stained " + 
			"with a green, slimy substance. There is a door in front of you and small, " +
			"dirty bed in the corner")
		this.looked = true
	}

	this.go_back = function(resp) {

		if (resp.contains(["go "," back"]))
			return true

		return false
	}

	this.handle_go_back = function() {
		controller.add_paragraph("You gingerly step back into the first room.")
		controller.room = 1
	}

	this.look_bug = function(resp) {

		if (resp.examines("bug"))
			return true

		if (resp.examines("ant"))
			return true

		return false
	}

	this.handle_look_bug = function(resp) {
		if (this.num_bugs)
			controller.add_paragraph("upon closer inspection that ants look a little bit blue-er than " +
				" any ants you have ever seen before. The spider regards you with spite.")
		else 
			controller.add_paragraph("There are no more ants. You killed them all.")
	}

	this.look_under_bed = function(resp) {

		if (resp.examines("bed"))
			return true

		return false
	}

	this.look_walls = function(resp) {

		if (resp.examines("wall"))
			return true

		return false
	}

	this.handle_look_walls = function() {
		controller.add_paragraph("The walls are green and slimy")
	}

	this.handle_look_bed = function() {
		if (this.num_bugs === 1)
			controller.add_paragraph("There is " + this.num_bugs + " ant, a spider, and a note under the bed")
		else if (this.num_bugs)
			controller.add_paragraph("There are " + this.num_bugs + " ants, a spider, and a note under the bed")
		else
			controller.add_paragraph("There is a spider, and a note under the bed")
		this.examined = true
		this.looked = true
	}

	this.look_note = function(resp) {

		if (resp.contains(["look "," note"]))
			return true

		return false
	}

	this.handle_look_note = function() {
		controller.add_paragraph("It's under the bed")
	}

	this.read_note = function(resp) {

		if (resp.examines("note"))
			return true

		if (resp.contains(["read ", " note"]))
			return true

		return false
	}

	this.handle_read_note = function() {

		if (this.note)
			controller.add_paragraph("The note says, \"introspection is the key to living a happy life\"")

		else
			controller.add_paragraph("What note? The one under the bed? It's still there, you have to " +
										 "pick it up before you use it you philistine")

	}

	this.take_note = function(resp) {

		if (resp.contains(["take ", " note"]))
			return true

		if (resp.contains(["grab ", " note"]))
			return true

		if (resp.contains(["pick up ", " note"]))
			return true

		if (resp.contains(["grab ", " note"]))
			return true

		return false
	}

	this.handle_take_note = function() {
		controller.add_paragraph("You now have the note in your hand")
		this.note = true
		this.examine = true
		this.looked = true
	}

	this.introspection = function(resp) {

		if (resp.examines("self"))
			return true

		if (resp.contains(["examine ", "self"]))
			return true

		if (resp.contains(["introspect"]))
			return true

		if (resp.contains(["inspect ", "self"]))
			return true

		if (resp.contains(["examine ", " mind"]))
			return true

		if (resp.contains(["look ", "self"]))
			return true

		if (resp.contains(["find ", "self"]))
			return true

		if (resp.contains(["examine ", " brain"]))
			return true

		return false

	}

	this.handle_introspection = function() {
		controller.add_paragraph("As you search your deep and inner psyche, " +
			"you feel a sudden pressure in your pocket. You reach in and alas, " + 
			"there is a small key. It is now in your hand")
		this.key = true
		this.note = true
		this.examine = true
		this.looked = true
	}

	this.door = function(resp) {

		if (resp.contains("door"))
			return true

		return false
	}

	this.handle_door = function() {

		if (this.key) {
			controller.add_paragraph("The door opens with a satisfying click, and " +
				"swings inward silently. You walk through the doorway into the next room")
			controller.room = 3
		}

		else
			controller.add_paragraph("It's locked you jerk. Did you really think that " +
				"this room would be as easy as the last room?")
	}

	this.sleep = function(resp) {

		if (resp.contains("sleep"))
			return true

		if (resp.contains("lie down"))
			return true

		if (resp.contains(["lie on ", " bed"]))
			return true

		if (resp.contains(["rest on ", " bed"]))
			return true

	}

	this.handle_sleep = function() {
		controller.add_paragraph("You lie down on the plank-like mattress and shut your " +
			"eyes. As you will yourself to fall into the comfort of a dream, a bug scurries " +
			"over your leg and bites it. You jump off the bed; sleeping probably isn't the " +
			"best idea right now")
	}

	this.spider = function(resp) {

		if (resp.contains("spider"))
			return true

		return false
	}

	this.handle_spider = function() {
		controller.add_paragraph("As you reach towards the spider it rears back on its " +
			"hind four legs and spits a yellow substance onto your hands. You pull back " +
			" and see that your skin now has an itchy rash. Nice going.")
	}

	this.eat_bug = function(resp) {

		if (resp.contains(["eat ", " bug"]))
			return true

		if (resp.contains(["eat ", " ant"]))
			return true
	}

	this.handle_eat_bug = function() {

		if (this.num_bugs === 3) {
			controller.add_paragraph("You grab one of the ants and shove it in you mouth. " +
				"It scurries around but you manage to swallow it. You feel it " +
				"twitching all the way down your throat")
			this.num_bugs = 2
		}

		else if (this.num_bugs === 2) {
			controller.add_paragraph("You manage to grab one of the remaining ants and chew " +
				"it to a pulp. Tastes kind of like mango.")
			this.num_bugs = 1
		}

		else if (this.num_bugs === 1) {
			controller.add_paragraph("You pick up the last ant and eat it with one painful " +
				"swallow. Now there are no more ants. You didn't realize how comforting their " +
				"presence was until now that they are gone. The room feels colder.")
			this.num_bugs = 0
		}

		else {
			controller.add_paragraph("There are no more bugs for you to eat you pervert")
		}
	}

	this.squish_bug = function(resp) {

		if (resp.contains(["smash ", " bug"]))
			return true;

		if (resp.contains(["squish ", " bug"]))
			return true;

		if (resp.contains(["hit ", " bug"]))
			return true;

		if (resp.contains(["smush ", " bug"]))
			return true;

		if (resp.contains(["kill ", " bug"]))
			return true;

		if (resp.contains(["smash ", " ant"]))
			return true;

		if (resp.contains(["squish ", " ant"]))
			return true;

		if (resp.contains(["hit ", " ant"]))
			return true;

		if (resp.contains(["smush ", " ant"]))
			return true;

		if (resp.contains(["kill ", " ant"]))
			return true;
	}

	this.handle_squish_bug = function() {

		if (this.num_bugs === 1) {
			controller.add_paragraph("You smash the last bug to a blueish splatter on the floor")
			this.num_bugs = 0
		}

		else if (this.num_bugs) {
			controller.add_paragraph("As you smush the bug into the ground it squirts " +
				"some little blue fluid out")
			this.num_bugs -= 1
		}

		else {
			controller.add_paragraph("There are no more bugs for you to smash")
		}

	}

	this.slime = function(resp) {

		if (resp.contains(["slime"]))
			return true

		return false
	}

	this.handle_slime = function() {
		controller.add_paragraph("Ex, that's disgusting. No")
	}

	this.handle_help = function() {

		if (this.key)
			controller.add_paragraph("Come on, this one's easy")

		else if (this.note)
			controller.add_paragraph("What must you examine in order to be introspective?")

		else if (this.examined)
			controller.add_paragraph("You must pick items up to use them")

		else if (this.looked)
			controller.add_paragraph("Try examining different things in the room to see what is there")

		else 
			controller.add_paragraph("It's a good idea to start every with the command \'look\'")
	}


}

