var Map = function(user, controller) {

	this.data = null

	this.draw = function() {

		var str = ""

		for (var i = 0; i < this.data.length; ++i) {
			for (var j = 0; j < this.data[i].length; ++j) {
				var c = this.data[i][j];
				if (user.x === i && user.y === j)
					c = 'U';
				str += "&nbsp" + c + "&nbsp"
			}
			str += "<br>"
		}

		controller.add_paragraph(str)
	}

	this.init = function() {

		this.data = new Array(12)
		for (var i = 0; i < this.data.length; ++i) {
			this.data[i] = new Array(12)
			for (var j = 0; j < this.data[i].length; ++j)
				this.data[i][j] = '?'
		}

	}

	this.init()
}