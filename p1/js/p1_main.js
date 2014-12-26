// run on page load
$(document).ready(function () {

	// create and run controller
	var controller = new Controller(this)
	var self = this

	this.counter = 0

	this.writer = function(text, target) {

	    var count = 0;
	    var speed = 5; // How fast should it type?
	    var $input = $(target);
	    
	    var my_f = function() {
	        var curr_text = $input.html();
	        var curr_letter = text.charAt(count);
	        count++;
	        $input.html(curr_text + curr_letter);
	        if(count == text.length)
	            clearInterval(timerId);
	    }
	    
	    var timerId = setInterval(my_f, speed);
	}

	// code to add text
	this.add_paragraph = function(text) {
		self.add_paragraph_simple(text)
		// $('#old_text').append("<p class=\"new-text-number-" + self.counter + "\">")
		// self.writer(text, ".new-text-number-" + self.counter)
		// self.counter += 1
	}

	this.add_paragraph_simple = function(text) {
		$('#old_text').append("<p>" + text)
	}

	// sends command to controller on enter
	$("#cmd").keyup(function(event){
    	if(event.keyCode == 13){

  			// get user response
        	var resp = $('#cmd').val();
		resp = resp.toLowerCase();
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
