$(document).ready(function () {

	var game = new Game(this);
	var that = this;

	this.add_paragraph = function(text) {
		$('#old_text').append("<p>" + text + "</p>");
	}

	$("#cmd").keyup(function(event){
    	if(event.keyCode == 13){
        	var resp = $('#cmd').val();
        	$('#cmd').val('');
			game.run(resp);
    	}
	});



});