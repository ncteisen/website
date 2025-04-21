/*
Notes: 
'data' is lazily imported from the html
'seedrandom' is also imported from html. it gives deterministic random #s based on a seed set in fire()
*/

var NUMBER_OF_WORDS = 25;
var spyMasterMode = false;
var sessionData = [];
var customData = [];
var gameState = [];
var redScore = -1;
var blueScore = -1;
var timer = undefined;

var BLOCK = {
  RED : {unclicked: "#ECC3BF", clicked: "#F2473F", updateScores: function() {redScore--}},
  BLUE: {unclicked: "#E0EEEE", clicked: "#00C5CD", updateScores: function() {blueScore--}},
  NEUTRAL : {unclicked: "#FFFFFF", clicked: "#939393", updateScores: function(){}},
  ASSASIN : {unclicked: "#3f3f3f", clicked: "#000000", updateScores: function(){}},
};

var beeper = new Audio("data/beep.wav");

//init
$("#seed").keyup(function() {
	fire();
});

$("#gameMode").change(function() {
	fire();
});


$("#seed").val(Math.floor(Math.random() * 1000));
fire();

function play_sound() { // buffers automatically when created
	beeper.play();
}

function stop_sound() {
	beeper.pause();
	beeper.currentTime = 0;
}

function cancel_timer() {
	time_element = document.getElementById("timer");
	time_element.innerHTML = 'Timer';
	clearTimeout(timer);
	document.getElementById("cancel").style.visibility = "hidden"
}

function start_timer() {
	var timeLeft = 30;
	time_element = document.getElementById("timer");
	document.getElementById("cancel").style.visibility = "visible"
	timer = setInterval(function() {
	  if (timeLeft <= 0) {
	    clearTimeout(timer);
	    play_sound();
	    time_element.innerHTML = 'Timer';
	    document.getElementById("cancel").style.visibility = "hidden"
	    setTimeout(function() { stop_sound(); }, 3000);
	  } else {
	    time_element.innerHTML = timeLeft + ' sec';
	    timeLeft--;
	  }
	}, 1000);
}

function fire() {
	//get seed and set the seed for randomizer
	var seed = document.getElementById("seed").value;
	Math.seedrandom(seed.toLowerCase());

	var option = $('#gameMode :selected').val();
	switch (option) {
		case 'dirty':
			sessionData = dirty.slice(0)
			break;
		case 'all':
			sessionData = dirty.concat(data).slice(0)
			break
		case '2knouns':
			sessionData = data.slice(0);
			break;
		case 'movies':
			sessionData = movieData.slice(0);
			break;
		default:
			sessionData = defaultData.slice(0);
	}

	spyMasterMode = false;
	gameState = []
	document.getElementById("board").innerHTML = "";

	//fire new board
	createNewGame();
}

function removeItem(array, index) {
	if (index > -1) {
		array.splice(index, 1);
	}
}

function createNewGame() {
	var trs = [];
	for (var i = 0; i < NUMBER_OF_WORDS; i++) {
		if (!trs[i % 5]) {
			trs[i % 5] = "";
		}
		var randomNumber = Math.floor(Math.random() * sessionData.length);
		var word = sessionData[randomNumber];
		removeItem(sessionData, randomNumber);
		trs[i % 5] += "<div class=\"word\" id=\'" + i + "\' onclick=\"clicked(\'" + i + "\')\"><div><a href=\"#\"><span class=\"ada\"></span>" + word + "</a></div></div>";
	}

	for (var i = 0; i < trs.length; i++) {
		document.getElementById("board").innerHTML += '<div class="row">' + trs[i] + '</div>'
	}

	//create teams
	for (var i = 0; i < 8; i++) {
		gameState.push({clicked:false, type:BLOCK.RED});
		gameState.push({clicked:false, type:BLOCK.BLUE});
	}

	// set scores
	redScore = 8
	blueScore = 8

	// one extra for one of the teams
	if (Math.floor(Math.random() * data.length) % 2 === 0) {
		gameState.push({clicked:false, type:BLOCK.RED});
		redScore++;

	} else {
		gameState.push({clicked:false, type:BLOCK.BLUE});
		blueScore++
	}

	// add neturals 
	for (var i = 0; i < 7; i++) {
		gameState.push({clicked:false, type:BLOCK.NEUTRAL});
	}

	// push the assasin
	gameState.push({clicked:false, type:BLOCK.ASSASIN})

	//shuffle teams
	shuffle(gameState);

	UpdateScoreOnScreen();
}

function clicked(value) {
	// toggle the color to be clicked
	document.getElementById(value).style.backgroundColor = gameState[value].type.clicked;
	if (gameState[value].clicked == false) {
		gameState[value].type.updateScores()
	}
	gameState[value].clicked = true;
	UpdateScoreOnScreen();
}

function UpdateScoreOnScreen() {
	$('#redScore').text(redScore);
	$('#blueScore').text(blueScore);
	if(redScore === 0){
		$('#redScore').text('Winner!');
	}
	if(blueScore === 0){
		$('#blueScore').text('Winner!');
	}
}

function spyMaster() {
	spyMasterMode = true;
	for (var i = 0; i < NUMBER_OF_WORDS; i++) {
		document.getElementById(i).style.backgroundColor = gameState[i].type.unclicked;
	}
}

function shuffle(array) {
	var currentIndex = array.length,
		temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

//enable pressing 'Enter' on seed field
document.getElementById('seed').onkeypress = function(e) {
	if (!e) e = window.event;
	var keyCode = e.keyCode || e.which;
	if (keyCode == '13') {
		// Enter pressed
		fire();
		return false;
	}
}