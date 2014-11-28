// run on page load
$(document).ready(function () {

	// create and run controller
	var model = new Model()
	var controller = new Controller(this)
	var self = this

	this.add_paragraph = function(text) {
		$('#old_text').append("<p>" + text)
	}

	// sends command to controller on enter
	$("#cmd").keyup(function(event){
    	if(event.keyCode == 13){

  			// get user response
        	var resp = $('#cmd').val();

        	// reset input box
        	$('#cmd').val('');

        	// run engine and scroll down
			controller.run(resp);
			$(document).scrollTop($(document).height());
    	}
	});


});