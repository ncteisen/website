var Room1 = function(map, controller) {
	
	this.init = function() {
		map.data[0][0] = '+'
		map.data[1][0] = '|'
		map.data[2][0] = '+'
		map.data[2][1] = '-'
		map.data[2][2] = '+'
		map.data[0][1] = '-'
		map.data[0][2] = '+'
		map.data[1][2] = '|'
	}

	this.init()
}