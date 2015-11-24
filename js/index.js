// run on page load
$(document).ready(function () {


});

var press_list = []
var konami_code = [65, 66, 39, 37, 39, 37, 40, 40, 38, 38]

function konami() 
{
	if (press_list.length < konami_code.length) {
		return false
	}

	for (var i = 0; i < konami_code.length; ++i) {
		if (press_list[i] !== konami_code[i]) {
			console.log(press_list[i], konami_code[i])
			return false
		}
	}

	return true
}

function handle_konami()
{
	window.location.href = "https://en.wikipedia.org/wiki/Konami_Code";
}

$(document).on("keydown", function (e) {
    console.log(e.which)
    press_list.unshift(e.which)
    if (konami()) {
    	handle_konami()
    }
});