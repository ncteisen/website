// run on page load
$(document).ready(function () {

	$(".secret").hide()

});

var press_list_story = []
var secret_code = [72, 65, 79, 78]

function secret() 
{
	if (press_list_story.length < secret_code.length) {
		return false
	}

	for (var i = 0; i < secret_code.length; ++i) {
		if (press_list_story[i] !== secret_code[i]) {
			return false
		}
	}

	return true
}

function handle_secret()
{
	$(".secret").show();
}

$(document).on("keydown", function (e) {
    press_list_story.unshift(e.which)
    if (secret()) {
    	handle_secret();
    }
});