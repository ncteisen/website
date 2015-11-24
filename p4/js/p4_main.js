// run on page load
$(document).ready(function () {

	// create and run controller
	var controller = new Controller(this)

	$("#console").hide()

	$("#start").click(function(event) {
		$("#startup").hide()
		$("#console").show()
	});

	this.add_paragraph = function(text, color) {
		$('#old_text').append("<p style='color:" + color + "'>" + text + "</p>")
	}

	this.fade_out = function() {
		$('#overlay').css({"pointer-events": "auto"})
		$('#overlay').animate({
			opacity: 1,
		}, 5000, function() {
			// Animation complete.
		});
   	}

	// sends command to controller on enter
	$("#cmd").keyup(function(event){
    	if(event.keyCode == 13){

  			// get user response
        	var resp = $('#cmd').val();

        	// reset input box
        	$('#cmd').val('');

        	// log resp for debugging
        	console.log(resp)

        	// run engine and scroll down
			controller.run(resp);
			$(document).scrollTop($(document).height());
    	}
	});


});