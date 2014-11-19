$(document).ready(function () {

	var lacey = new Lacey(this);
	var that = this;

	$('#buttons').addClass('hide')

	this.add_paragraph = function(text) {
		$('#old_text').append("<p class=\"text-center\">" + text + "</p>");
	}

	this.done = function() {
		$('#cmd').addClass('hide')
		$('#buttons').removeClass('hide')
	}

	$("#cmd").keyup(function(event){
    	if(event.keyCode == 13){
        	var resp = $('#cmd').val();
        	$('#cmd').val('');
			lacey.run(resp);
			$('#old_text').append("<br>");
    	}
	});



});