// minify at end
// use https://babeljs.io/
// and https://www.jslint.com/
// and css equivilent
// template literals not supproted ie

/*
    To Do List

    start with 0 weight but 100 hunger

    LETTER SPACING IN CANVAS
    add onload so elements only start when everything is loaded
    after weight shit

    CLEAN UP CODE IT LOOKS SHITE

    weight gain problems like the things doesnt auto add weight/hunger
    some text is fucky on safari

    add some buttons to make alien unhappy and some to make him happy for example

    lowercase letters to look more friendly?

    RE WORK TO USE GET REQUEST FORM INSTEAD OF WHATEVER THE FUCK IS HAPPENING HERE <- maybe not
    - add more info button on last exercise popup that show how much weight your dide gained and shit
    - create death for game <- explosion doesnt always show
    - find workout music
    if you have a small name (2 letters) it fucks up the already created popup

    safari is fucked especially letter spacing holy shit
    make speed in game size proportionally

    when bored make more art!
    - add more exercises <- !!!
    - add more food art
    - media quieries

    multiply by velocity var???

    - edit form transition


    ideas

    add achivements?

    make sure you tell the user that it saves your data when you leave the page
    get them to reload the page during the tutorial so they can see that is tracks
    when you were last there too
    like duck game
    add races etc

    gameplay

    your character is an alien that gains weight extremely fast
    add little sweat band for fitness

    inspo https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXIL4beadD2hvpyCTD5I5rxhUK6QAwb1LqsA&usqp=CAU

    you control a little character who gets large easily 
    (make backstory like its a type of animal that gets fat really fast so you gotta work it out to stop it)
    but the way you get it slim incorparate real world fitness

    list a daily calorie intake level
    and calculate the amount you burn

    run through levels 
    avoid junk food and collect good food
    at end of level do amount of exercise based off of junk food collection

    use real world data to calcuate how much you will burn?

    workout when you lose or at other points
    collect healthy food?
    start as a fat character?
    make character gain weight in real world time
    this makes user come back to play again
    bmi scale where if it gets too large you die
    like tomogachi
    olympics? topical

*/

var data = JSON.parse(window.localStorage.getItem("gameData"));

var workoutNotif = document.getElementById("workoutNotifContainer");
var transitionEl = document.getElementById("transitionEl");
var exerciseElement = document.getElementById("exercise");

var tutorialOverlay;
var actionBtns;
var sections;

// Game vars \\

var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");

var gameStart = false;
var isTutorial = false;
var transitioning = false;
var dead = false;
var grow = true;
var paused = false;

var age;
var filter = 0;
var color = 250;

var divisor;
var alienHunger;
var lastWorkout;

var alienSize;
var alienHeight;

var speed; 
var currentMoveSpeed = speed;
var selfSpeed = [false, false, false, false];
var selfPos = [500, 100];

var spawnFood;
var foods = [];
var pointIndicators = [];

var blurTime;
var dataOnBlur;

resize();
window.onresize = resize;

window.addEventListener("beforeunload", saveData);

var character = new Image(),
    globe = new Image(),
    ship = new Image(),
    happyMeter = new Image();

character.src = "media/1.svg";
globe.src = "media/earth.svg";
ship.src = "media/ship.svg";
happyMeter.src = "media/faceHappy.svg";

var images =  [
    character,
    globe,
    ship,
    happyMeter
];

function loaded(){
    // wait until all images are loaded to init

    var imagesLoaded = 0;

    images.forEach(image => {
        image.onload = () =>{
            imagesLoaded ++;
            
            if (imagesLoaded == images.length) {
                imagesLoaded += 10;
                readData();
            }
        }

        image.setAttribute("src", image.src);
    });
    
}


function readData() {
    if(data == null) initData();

    alienHunger = data.hunger;
    divisor = data.divisor;
    color = data.color;
    age = calcAge();

    let alienColor;

    switch(color){
        case 110:
            alienColor = "#9BF4FB";
            break;
        case 300:
            alienColor = "#F8D6A6";
            break;
        case 250:
            alienColor = "#F5C8EB";
            break;
        default:
            alienColor = "#cef28f";
    }

    document.body.style.backgroundColor = alienColor;
    document.documentElement.style.setProperty("--btnFilter", color + "deg");

    alienHeight = canvas.width/divisor;
    speed = (divisor / 6);

    pageTransition();
    calcChange();

    setTimeout(() => {
        setHunger();
        setDial();
        setCharacter();
    }, 2000);
    
    if(data.lastWorkout != null){
        lastWorkout = new Date(parseInt(data.lastWorkout, 10));

        const [month, day, year] = [lastWorkout.toLocaleString("default", { month: "long" }), lastWorkout.getDate(), lastWorkout.getFullYear()];
        const time = lastWorkout.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
    
        document.getElementById("lastWorkout").innerHTML = `Welcome back! Your last workout was ${month} ${day}, ${year} at ${time}`;
        workoutNotif.style.bottom = 0;
        workoutNotif.style.visibility = "visible";
    }
    
    draw();

    setInterval(() => {
        // for every hour on the page increase hunger by one in intervals of 5 mins
    
        if(alienHunger < 10) alienHunger +=  1 / 12;
        setHunger();
    }, 300000); // 3600000
    
    setInterval(() => {
        // for every two hours on the page increase size by one in intervals of 5 mins
    
        increaseSize(1 / 24);
    }, 300000); // 7200000
}


function initData(){
    // get uri params to initialize data object with default values

    let url = window.location.search,
        color = parseInt(url.slice(url.lastIndexOf("=") + 1), 10),
        name = decodeURIComponent(url.slice(url.indexOf("=") + 1, url.indexOf("&")));

    // if you visit index.html without params and no existing data, redirect to main page
    if(name == ""){
        window.location.href = "./home.html";
        return;
    }

    data = {
        name: name,
        color: color,
        birthday: new Date().getTime(),
        divisor: 10.5,
        hunger: 5,
        lastWorkout: null,
        lastVisit: new Date().getTime()
    };

    window.localStorage.setItem("gameData", JSON.stringify(data));

    toggleTutorialPrompt();
}


function saveData(){
    data.divisor = divisor;
    data.hunger = alienHunger;
    data.lastVisit = new Date().getTime();

    if(lastWorkout != undefined) data.lastWorkout = lastWorkout.getTime();

    window.localStorage.setItem("gameData", JSON.stringify(data));
}


function deleteAlien() {
    window.removeEventListener("beforeunload", saveData);
    window.localStorage.removeItem("gameData");
    window.location.href = "./home.html";
}


function calcAge() {
    // converts milliseconds since birth to days 
    // formula  ->  ( milliseconds / 8.64e7 ) = days

    let diff = new Date().getTime() - data.birthday;
        
    let count = Math.round(diff / ( 8.64 * Math.pow(10, 7)));
    let unitOfTime = "days";

    if(count == 1) unitOfTime = "day";

    return count + " " + unitOfTime;
}


function calcChange() {
    // this funciton calculates the hours since you last visited and changes weight and hunger accordingly
    
    // for every TWO hours since last workout, weight goes up 1
    // for every ONE hour since last fed, hunger also goes up 1

    let time = new Date().getTime() - data.lastVisit;

    let hours = Math.round(time / (3.6 * Math.pow(10, 6)));

    if((hours / 2) > (divisor - 6)) divisor = 6;
    else divisor -= (hours / 2);

    if(hours > (10 - alienHunger)) alienHunger = 10;
    else alienHunger += hours;

    console.log("it's been " + hours + " hours since your last visit.")
    console.log("You hunger went up by " + hours);
    console.log("You weight went up by " + Math.round(hours/2));
}


function hideNotif(){
    workoutNotif.style.bottom = "-1000px";
    workoutNotif.style.visibility = "hidden";
}


function pageTransition(func){
    transitionEl.style.visibility = "visible";
    transitionEl.style.clipPath = "circle(200% at 50% 50%)";
    
    setTimeout(()=>{
        transitionEl.style.clipPath = "circle(0% at 50% 50%)";
        transitionEl.style.visibility = "hidden";
        if(func != undefined) func();
    }, 1000);
}


function resize(){

    alienHeight = alienSize;
    canvas.width = document.documentElement.clientWidth/1.5;
    canvas.height = canvas.width/1.5;

    if(canvas.height >= document.documentElement.clientHeight - 100){
        canvas.height = document.documentElement.clientHeight - 100;
        canvas.width = canvas.height * (3/2);
    };
    
}


// ***************** Audio scripts ***************** \\

var soundButton = document.getElementById("soundBtn");

var mainAudio = document.getElementById("mainMusic");
var gameAudio = document.getElementById("gameMusic");

var currentMainSong = Math.floor(Math.random() * 3);
var currentGameSong = Math.floor(Math.random() * 3);

gameAudio.src = "media/music/game" + currentGameSong + ".mp3";
mainAudio.src = "media/music/main" + currentMainSong + ".mp3";

mainAudio.onended = gameAudio.onended = nextSong;

function nextSong(){
    if(gameStart){
        gameAudio.autoplay = true;

        if(currentGameSong < 2) currentGameSong++;
        else currentGameSong = 0;

        gameAudio.src = "media/music/game" + currentGameSong + ".mp3";
    }else{
        mainAudio.autoplay = true;

        if(currentMainSong < 2) currentMainSong++;
        else currentMainSong = 0;

        mainAudio.src = "media/music/main" + currentMainSong + ".mp3";
    }
    
    if(soundButton.getAttribute("state") == "paused"){
        gameAudio.pause();
        mainAudio.pause();
    }
}

soundButton.addEventListener("click", toggleSound);

function toggleSound() {
    if(soundButton.getAttribute("state") == "paused"){
        if(gameStart) gameAudio.play();
        else mainAudio.play();

        soundButton.style.background = "url('media/play.svg') -10px -9px / 70px no-repeat";
        soundButton.setAttribute("state", "playing");
    }else{
        if(gameStart) gameAudio.pause();
        else mainAudio.pause();

        soundButton.style.background = "url('media/mute.svg') -10px -9px / 70px no-repeat";
        soundButton.setAttribute("state", "paused");
    }
}

function transitionAudio(pauseEl, playEl) {
    var fadeAudio = setInterval(function () {
        pauseEl.volume = (pauseEl.volume - 0.1).toFixed(1);

        if (pauseEl.volume == 0) {
            clearInterval(fadeAudio);

            pauseEl.pause();
            pauseEl.volume = 1;

            if(soundButton.getAttribute("state") == "playing") playEl.play();
        }
    }, 150);
}




// ***************** Game Controls ***************** \\

document.addEventListener("keydown", function(event) {
    let key = event.key.toLowerCase();

    if(!gameStart || dead) return;

    if(key == "p"){
        paused = true;
    }else if(key == "escape"){
        endGame();
    }else if(key == "e"){
        showExercise();
    } 

    if (key == "d" || key == "arrowright") {
        selfSpeed[0] = true;
        selfSpeed[1] = false;                    
    }else if (key == "a" || key == "arrowleft") {
        selfSpeed[1] = true;
        selfSpeed[0] = false;
    }

    if (key == "w" || key == "arrowup") {
        event.preventDefault();
        selfSpeed[2] = true;
        selfSpeed[3] = false;
    }else if (key == "s" || key == "arrowdown") {
        event.preventDefault();
        selfSpeed[3] = true;
        selfSpeed[2] = false;
    }

    if((selfSpeed[0] && selfSpeed[2]) || (selfSpeed[0] && selfSpeed[3]) || (selfSpeed[1] && selfSpeed[2]) || (selfSpeed[1] && selfSpeed[3])){
        currentMoveSpeed = speed/1.5;
    }else currentMoveSpeed = speed;

});


document.addEventListener("keyup", function(event) {
    if(!gameStart) return;

    let key = event.key.toLowerCase();

    if (key == "d" || key == "arrowright") {
        selfSpeed[0] = false;
    }else if (key == "a" || key == "arrowleft") {
        selfSpeed[1] = false;
    }

    if (key == "w" || key == "arrowup") {
        selfSpeed[2] = false;
    }else if (key == "s" || key == "arrowdown") {
        selfSpeed[3] = false;
    }

    if((selfSpeed[0] && selfSpeed[2]) || (selfSpeed[0] && selfSpeed[3]) || (selfSpeed[1] && selfSpeed[2]) || (selfSpeed[1] && selfSpeed[3])){
        currentMoveSpeed = speed/1.5;
    }else currentMoveSpeed = speed;
});




// Tutorial stuff \\

function toggleTutorialPrompt(){
    let prompt = document.getElementById("tutorialPrompt");
   
    if(prompt.style.visibility == "visible"){
        prompt.style.visibility = "hidden"
        prompt.style.right = "-200px";
        document.body.style.marginRight = 0;
    }else{
        prompt.style.visibility = "visible"
        prompt.style.right = 0;
        document.body.style.marginRight = prompt.clientWidth + "px";
    }
}


function startTutorial() {
    document.getElementById("skipTutorial").style.display = "block";

    hideNotif();

    if(gameStart) endGame();

    if(document.getElementById("settingsContainer").style.visibility == "visible") toggleSettingsDrawer();

    if(exerciseElement.style.visibility == "visible"){
        clearInterval(imgInterval);
        clearInterval(timerInterval);
        exerciseElement.style.visibility = "hidden";
        exerciseElement.style.opacity = 0;
    }

    if(window.getComputedStyle(document.getElementById("tutorialPrompt")).right == "0px") toggleTutorialPrompt();

    tutorialOverlay = document.getElementsByClassName("tutorialOverlay")[0];
    sections = document.getElementsByClassName("tutorialSection");
    actionBtns = document.getElementsByClassName("actionBtn");

    isTutorial = true;

    let fillName = document.getElementsByClassName("name");
    
    for(let i = 0; i < fillName.length; i++){
        fillName[i].innerText = data.name;
    }

    tutorialOverlay.style.visibility = "visible";
    sections[0].style.display = "flex";
}


function endTutorial() {
    isTutorial = false;

    if(gameStart) endGame();

    for(let i = 0 ; i < sections.length; i++){
        sections[i].style.display = "none";
    }

    tutorialOverlay.setAttribute("style", "");
}


function nextSection(){

    for(let i = 0; i < sections.length; i ++){
        if(sections[i].style.display == "flex"){
            sections[i].style.display = "none";

            if(i == sections.length - 1){
                endTutorial();
                break;
            };

            let page = i + 1;

            switch(page){
                case 1:
                    tutorialOverlay.style.height = "70%";
                    tutorialOverlay.style.top = "30%";
                    break;
                case 2:
                    tutorialOverlay.style.top = "0";
                    break;
                case 3:
                    tutorialOverlay.style.top = "30%";
                    break;
                case 4:
                    tutorialOverlay.style.height = "100%";
                    tutorialOverlay.style.top = 0;

                    showTutorialBtns();

                    sections[page].firstElementChild.style.position =  "absolute";
                    sections[page].firstElementChild.style.top =  (actionBtns[0].getBoundingClientRect().top - 100) + "px";
                    
                    actionBtns[0].onclick = () =>{
                        nextSection();
                        showExercise();
                    }
                    actionBtns[1].disabled = true;
                    break;
                case 5:
                    tutorialOverlay.style.clipPath = "none";
                    tutorialOverlay.classList += " tutorialOverlayAlt";
                    tutorialOverlay.style.width = "30%";
                    break;
                case 6:
                    actionBtns[0].onclick = showExercise;
                    actionBtns[0].disabled = true;
                    actionBtns[1].disabled = false;
                    actionBtns[1].onclick = () =>{
                        startGame();
                        nextSection();
                    }

                    tutorialOverlay.style.width = "100%";
                    showTutorialBtns();

                    sections[page].firstElementChild.style.position = "absolute";
                    sections[page].firstElementChild.style.top =  (actionBtns[0].getBoundingClientRect().top - 100) + "px";
                    break;
                case 7:
                    actionBtns[0].disabled = false;
                    actionBtns[1].onclick = startGame;
    
                    tutorialOverlay.style.clipPath = "none";
                    tutorialOverlay.style.width = "30%";
                    break;
                case 8:
                    spawnFood = setInterval(newFood, 2000);
                    break;
                case 10:
                    tutorialOverlay.style.right = "100%";
                    tutorialOverlay.style.transform = "translateX(100%)";
                    tutorialOverlay.style.width = "68%";
                    paused = true;
                    break;
                case 11:
                    tutorialOverlay.style.right = "0";
                    tutorialOverlay.style.transform = "";
                    tutorialOverlay.style.width = "100%";
                    document.getElementById("skipTutorial").style.display = "none";
                    break;
            }

            sections[page].style.display = "flex";

            break;
        }
    }

}


function showTutorialBtns(){
    let topClip = (actionBtns[0].getBoundingClientRect().top - 10) + "px";
    let bottomClip = (actionBtns[0].getBoundingClientRect().bottom + 10) + "px";

    // if I set clip path from the start safari shows a 1px line across the screen which looks gross
    tutorialOverlay.style.clipPath = "polygon(0 0, 0 20%, 0 50%, 100% 50%, 100% 80%, 100% 100%, 0 100%, 0 50%, 100% 50%, 100% 0)";
    
    setTimeout(() => { 
        tutorialOverlay.style.clipPath = `polygon(0 0, 0 20%, 0 ${bottomClip}, 100% ${bottomClip}, 100% 80%, 100% 100%, 0 100%, 0 ${topClip}, 100% ${topClip}, 100% 0)`;
    }, 150);
}


function toggleSettingsDrawer() {
    if(isTutorial) return;

    let drawer = document.getElementById("settingsContainer");

    if(window.getComputedStyle(drawer).transform == "matrix(1, 0, 0, 1, -225, 0)"){
        drawer.style.visibility = "visible";
        drawer.style.transform = "translateX(0)";
    }else{
        drawer.style.visibility = "hidden";
        drawer.style.transform = "translateX(-100%)";
    }
}



// Exercise page stuff \\

var exerciseData = {
    // I based the time param on how long it took me to do these exercises lol

    jumpingJacks: {
        name: "Jumping Jacks",
        count: 10,
        time: 15,
        link: "https://youtu.be/Q4QnlZs9PqI",
    },
    lunges: {
        name: "Lunges",
        count: 8,
        time: 20,
        link: "https://youtu.be/QOVaHwm-Q6U",
    },
    pushups: {
        name: "Push-Ups",
        count: 5,
        time: 15,
        link: "https://youtu.be/CCZGD55NxGo",
    },
    squats: {
        name: "Squats",
        count: 5,
        time: 15,
        link: "https://youtu.be/aclHkVaku9U",
    },
    highknees: {
        name: "High Knees or Run in Place",
        count: 10,
        time: 10,
        link: "https://youtu.be/D0GwAezTvtg",
    }
}


var exerciseKeys = Object.keys(exerciseData);
var exerciseIndex = Math.floor(Math.random() * exerciseKeys.length);

var exerciseGraphic = document.getElementById("exerciseGraphic");
var imgInterval;

var time = 0;
var timerInterval;
var timerElement = document.getElementById("timer");


function setTimer(tempTime){
    timerElement.innerText = formatTime(tempTime);
    timerInterval = setInterval(timer, 1000);
    time = tempTime;
}


function timer() {
    time--;
    timerElement.innerText = formatTime(time);
   
    if(time == 0) clearInterval(timerInterval);
}


function formatTime(seconds){
    let mins = parseInt(seconds / 60, 10);
    let secs = parseInt(seconds % 60, 10);

    // mins = mins < 10 ? "0" + mins : mins;
    secs = secs < 10 ? "0" + secs : secs;

    return mins + ":" + secs;
}


function showExercise() {
    
    if(exerciseElement.style.visibility == "visible") return;

    let exercise = exerciseData[exerciseKeys[exerciseIndex]];

    document.getElementById("exerciseTitle").innerText = exercise.count + " " + exercise.name;
    document.getElementById("howTo").innerHTML = "Don't know how? Check out this video: <br> <a target='_blank' href='" + exercise.link + "'>" + exercise.link + "</a>";

    setTimer(exercise.time);

    exerciseGraphic.src = "media/exercises/" + exercise.name + "1.svg";

    imgInterval = setInterval(()=>{
        exerciseGraphic.src = "media/exercises/" + exercise.name + "2.svg";
        setTimeout(()=>{
            exerciseGraphic.src = "media/exercises/" + exercise.name + "1.svg";
        }, 500);
    }, 1000);

    exerciseElement.style.opacity = 1;
    exerciseElement.style.visibility = "visible";

    if(gameStart){
        paused = true;
        foods = [];
        // remove all enemies as a bonus for exercise
    }
}


function hideExercise() {
    
    if(time != 0 || exerciseElement.style.visibility == "hidden") {
        timerElement.style.color = "red";
        timerElement.style.transform = "scale(1.2)";

        setTimeout(() => {
            timerElement.style.color = "black";
            timerElement.style.transform = "scale(1)";
        }, 500);

        return;
    };
    
    if(divisor < 15) increaseSize(-2);

    clearInterval(imgInterval);

    exerciseIndex++;
    if(exerciseIndex == exerciseKeys.length) exerciseIndex = 0;

    if(gameStart) draw();
    // game looks weird if pause overlays appears when you start workout
    // so it only shows when you click 'done'

    lastWorkout = new Date();

    exerciseElement.style.visibility = "hidden";
    exerciseElement.style.opacity = 0;

    hideNotif();

    if(isTutorial) nextSection();
}


class food{
    constructor(speed){
        this.pos;
        this.moveX;
        this.moveY;
    
        this.start = false;
        this.isHealthy = false;
        this.hitPlayer = false;
        this.isOutOfBounds = false;
        this.count = 0;
    
        this.temp = [];
        this.warningPos = [];
    
        this.foodImg = new Image();
        this.foodSize = canvas.width/20;
    
        this.showWarning = true;

        this.speed = speed;

        if(Math.floor(Math.random() * 3) == 0){
            this.isHealthy = true;
            this.foodImg.src = "media/foods/healthy" + Math.floor(Math.random() * 5) + ".svg";
        }else{
            this.foodImg.src = "media/foods/unhealthy" + Math.floor(Math.random() * 4) + ".svg";
        }

        let target;
        let rand = Math.floor(Math.random() * 4);

        switch(rand){
            case 0:
                if(this.isHealthy){
                    // spawn food close to the walls to force player to risk

                    let tempx = Math.floor(Math.random() * canvas.width/10) + canvas.width/50;
                    let tempy = [];

                    if(Math.floor(Math.random() * 2) == 1) tempy = [-10, canvas.height]
                    else tempy = [canvas.height + 10, -10];

                    this.pos = [tempx, tempy[0]];
                    target = [tempx, tempy[1]];
                }
                else this.pos = [Math.floor(Math.random() * canvas.width), -10];
                break;
            case 1:
                if(this.isHealthy){
                    let tempx = canvas.width - (Math.floor(Math.random() * canvas.width/10) + canvas.width/50);
                    let tempy = [];

                    if(Math.floor(Math.random() * 2) == 1) tempy = [-10, canvas.height]
                    else tempy = [canvas.height + 10, -10];
                    
                    this.pos = [tempx, tempy[0]];
                    target = [tempx, tempy[1]];
                }
                else this.pos = [Math.floor(Math.random() * canvas.width), canvas.height + 10];
                break;
            case 2: 
                if(this.isHealthy){
                    let tempx = [];
                    let tempy = Math.floor(Math.random() * canvas.height/10) + canvas.height/50;

                    if(Math.floor(Math.random() * 2) == 1) tempx = [-10, canvas.width]
                    else tempx = [canvas.width + 10, -10];
                    
                    this.pos = [tempx[0], tempy];
                    target = [tempx[1], tempy];
                }
                else this.pos = [-10, Math.floor(Math.random() * canvas.height)];
                break;
            case 3:
                if(this.isHealthy){
                    let tempx = [];
                    let tempy = canvas.height - (Math.floor(Math.random() * canvas.height/10) + canvas.height/50);

                    if(Math.floor(Math.random() * 2) == 1) tempx = [-10, canvas.width]
                    else tempx = [canvas.width + 10, -10];
                    
                    this.pos = [tempx[0], tempy];
                    target = [tempx[1], tempy];
                }
                else this.pos = [canvas.width + 10, Math.floor(Math.random() * canvas.height)];
                break;
        }

        setTimeout(()=>{
            if(!this.isHealthy){
                target = [selfPos[0] + (alienSize / 2) - this.foodSize / 2, 
                          selfPos[1] + (alienSize / 3) - this.foodSize / 2];
                // becuase image origins are in the top left I need to add and subtract 
                // values to make the CENTER of the food target the CENTER of the ship
                // ( alienSize / 3 becuase ship isn't perfectly square )
                this.speed += 2;
            }

            let xDif = target[0] - this.pos[0];
            let yDif = target[1] - this.pos[1];

            let dist = Math.sqrt((xDif * xDif) + (yDif * yDif));
        
            this.moveX = (xDif/dist) * this.speed;
            this.moveY = (yDif/dist) * this.speed;

            this.start = true;
        }, 2000)

    }

    disp() {
        if(this.start){
            ctx.drawImage(this.foodImg, this.pos[0], this.pos[1], this.foodSize, this.foodSize);

            this.pos[0] += this.moveX;
            this.pos[1] += this.moveY;
        }else{
            if(this.pos[0] == -10){
                this.warningPos[0] = 15;
                this.warningPos[1] = this.pos[1];
            } else if(this.pos[0] == canvas.width + 10){
                this.warningPos[0] = canvas.width - 15;
                this.warningPos[1] = this.pos[1];
            } else if(this.pos[1] == -10){
                this.warningPos[1] = 30;
                this.warningPos[0] = this.pos[0];
            } else if(this.pos[1] == canvas.height + 10){
                this.warningPos[1] = canvas.height - 10;
                this.warningPos[0] = this.pos[0];
            }

            let color;

            if(this.isHealthy) ctx.fillStyle = "green";
            else ctx.fillStyle = "red";

            ctx.strokeStyle = "white";
            ctx.font = canvas.width/20 + "px Arial";
            ctx.textAlign = "center";

            if(this.count % 20 == 0) this.showWarning = !this.showWarning;

            if(this.showWarning){
                ctx.fillText("!", this.warningPos[0], this.warningPos[1]);
                ctx.strokeText("!", this.warningPos[0], this.warningPos[1]);
            }

            this.count++;
        }
        
        let hitBoxX = (this.pos[0] <= selfPos[0] + alienSize) && (this.pos[0] >= selfPos[0] - (alienSize/3));
        let hitBoxY = (this.pos[1] <= selfPos[1] + (alienSize - (alienSize/3.5))) && (this.pos[1] >= selfPos[1] - (alienSize/3));

        if(this.pos[0] > canvas.width + 15 || this.pos[0] < -15 || this.pos[1] > canvas.height + 15 || this.pos[1] < -15){
            this.isOutOfBounds = true;
        }else if(hitBoxX && hitBoxY){
            this.hitPlayer = true;
        }
    }
}


class pointIndicator{
    constructor(gainPoints){
        this.finished = false;
        
        this.text = document.createElement("h1");
        this.text.id = "pointIndicator";

        if(gainPoints){
            this.text.innerText = "+1";
            this.text.style.color = "green";
        }else{
            this.text.innerText = "- Speed";
            this.text.style.color = "red";
        }

        let xPer = Math.round((selfPos[0] / canvas.width) * 100);
        let yPer = Math.round((selfPos[1] / canvas.height) * 100);

        this.text.style.left = xPer + "%";
        this.text.style.top = yPer + "%";

        document.getElementById("canvasContainer").appendChild(this.text);

        setTimeout(() => {
            this.text.style.opacity = 1;
            this.text.style.top = yPer - (yPer/2) + "%";
        }, 100);

        setTimeout(() => {
            this.text.style.opacity = 0;
        }, 600);

        setTimeout(() => {
            this.finished = true;
            
            for(let i = 0; i < pointIndicators.length; i++){
                if(pointIndicators[i].finished){
                    pointIndicators[i].text.remove();
                    pointIndicators.splice(i, 1);
                }
            }
        }, 1000);
    }

}


function shakeScreen() {
    let el = document.getElementById("canvasContainer");
    el.style.animation = "shake 150ms ease-in-out 3";

    setTimeout(()=>{
        el.style.animation = "none";
        el.offsetHeight; /* trigger reflow */
        el.style.animation = null; 
    }, 500);
}


function newFood(){
    if(!paused) foods.push(new food(3));
}


function draw(){
    if(!paused) window.requestAnimationFrame(draw);
    else if(time == 0) document.getElementById("pauseOverlay").style.display = "flex";

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    alienSize = canvas.width/divisor; // move this?
    
    if(gameStart) game();
    else mainScreen();
}


function addSpacing(string) {
    // safari and many other browers do not support css letter-spacing
    // for canvas text. This function adds 2 hair spaces between each letter reproducing letter-spacing effect

    return string.split("").join(String.fromCharCode(8202) + String.fromCharCode(8202));
}


function unpause(){
    paused = false; 
    document.getElementById("pauseOverlay").style.display = "none"; 
    draw();
}


function mainScreen() {
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";

    // 90 blue 
    // 180 - 250 pink
    // 300 orange

    ctx.drawImage(globe, (canvas.width/2) - ((canvas.width/2)/2), (canvas.height/2) - ((canvas.width/2)/35), canvas.width/2, canvas.width/2);

    ctx.filter = "hue-rotate(" + color + "deg) brightness(" + filter + "%)";
    ctx.drawImage(character, (canvas.width/2) - (alienSize/2), (canvas.height/2) - (alienHeight/1.5), alienSize, alienHeight);
    ctx.filter = "hue-rotate(0deg) brightness(100%)";

    characterAnimation();


    ctx.textAlign = "center";
    ctx.font =  canvas.height/12 + "px alien";

    ctx.fillText(addSpacing("Galactic Gainz"), canvas.width/2, canvas.height/12);

    ctx.font =  canvas.height/20 + "px alien";
    ctx.fillText(addSpacing(data.name), canvas.width/2, canvas.height/8);

    ctx.fillText(addSpacing(age + " old"), canvas.width/2, canvas.height/5);

    ctx.textAlign = "left";
    ctx.fillText(addSpacing("Alien Weight"), canvas.width/1.27, canvas.height/5.5);
    ctx.fillText(addSpacing("Alien Hunger:"), canvas.width/30, canvas.height - canvas.height/8);
    
    ctx.textAlign = "center";
    ctx.fillText(addSpacing("Happiness"), canvas.width/12, canvas.height/20);
    ctx.drawImage(happyMeter, canvas.width/31, canvas.height/25, canvas.width/10, canvas.width/10);
}


function toggleGamePanel() {
    let gamePanel = document.getElementById("gamePanel");
    let display = window.getComputedStyle(gamePanel).display;
    
    if(display === "none"){
        gamePanel.style.display = "block";
        setTimeout(()=>{
            gamePanel.style.marginLeft = 0;
            gamePanel.style.opacity = 1;
        }, 100); // might cause animation to not play occationally
    }else{
        gamePanel.style.marginLeft = "-225px";
        gamePanel.style.opacity = 0;
        setTimeout(()=>{
            gamePanel.style.display = "none";
        }, 1000);
    }

}


function startGame() {
    if(transitioning) return;
    transitioning = true;

    transitionAudio(mainAudio, gameAudio);
    toggleGamePanel();
    increaseSize(0);
    selfSpeed = [false, false, false, false];

    if(divisor <= 6){
        document.getElementById("lastWorkout").innerText = "Uh oh! Your alien is at max size, so their ship can't take off. Workout so you can take flight!";
        workoutNotif.style.backgroundColor = "red";
        workoutNotif.style.visibility = "visible";
        workoutNotif.style.bottom = 0;

        setTimeout(() => { endGame(); }, 1500);
    }

    pageTransition(() => {
        gameStart = true;
        canvas.style.background = "url('media/space.jpg')";
        selfPos = [canvas.width/2 - (alienSize/2), canvas.height/2 - (alienSize/2)];
        if(!isTutorial) spawnFood = setInterval(newFood, 2000);

        document.getElementById("actionBtnsContainer").style.display = "none";
        document.getElementById("dialContainer").style.display = "none";
        document.getElementById("hungerContainer").style.display = "none";

        setDial();
        setHunger();      

        transitioning = false;
    });
    
}


function endGame() {
    if(transitioning || isTutorial) return;
    transitioning = true;

    transitionAudio(gameAudio, mainAudio);
    toggleGamePanel();

    pageTransition(() => {
        canvas.style.background = "linear-gradient(0deg, rgba(34,193,195,1) 0%, rgba(253,187,45,1) 100%)";
        if(paused){
            // if you exercise while paused this fucks shit up FIX
            paused = false;
            document.getElementById("pauseOverlay").style.display = "none";
            draw();
        }
        
        clearInterval(spawnFood);
    
        foods = [];
        gameStart = false;
    
        document.getElementById("actionBtnsContainer").style.display = "flex";
        document.getElementById("dialContainer").style.display = "flex";
        document.getElementById("hungerContainer").style.display = "flex";
    
        setHunger();
        setDial();

        transitioning = false;
    });
}


function game() {
    
    if(selfSpeed[0] && checkBounds("right")) {
        selfPos[0] += currentMoveSpeed;
    }
    if(selfSpeed[1] && checkBounds("left")) {
        selfPos[0] -= currentMoveSpeed;
    }
    if(selfSpeed[2] && checkBounds("up")) {
        selfPos[1] -= currentMoveSpeed;
    }
    if(selfSpeed[3] && checkBounds("down")) {
        selfPos[1] += currentMoveSpeed;
    }

    ctx.shadowColor = "white";
    if(!dead) ctx.shadowBlur = Math.floor(Math.random() * 40) + 30;
    else ctx.filter = "grayscale(100%)";
    ctx.drawImage(ship, selfPos[0], selfPos[1], alienSize, alienSize);
    ctx.shadowBlur = 0;

    for(let i = 0; i < foods.length; i++){
        foods[i].disp();

        if(foods[i].isOutOfBounds == true){
            foods.splice(i, 1);
        }else if(foods[i].hitPlayer == true){
            if(foods[i].isHealthy){
                if(alienHunger > 0) alienHunger--;
                setHunger();
                pointIndicators.push(new pointIndicator(true));
            } else {
                increaseSize(1);
                pointIndicators.push(new pointIndicator(false));
                shakeScreen();
                //hunger = 100% size = max
            }
            foods.splice(i, 1);
        }
    }

}


function checkBounds(direction){
    switch(direction){
        case "up":
            if(selfPos[1] <= -(alienSize/2)) return false;
            break;
        case "down":
            if(selfPos[1] >= canvas.height - (alienSize/2)) return false;
            break;
        case "left":
            if(selfPos[0] <= -(alienSize/2)) return false;
            break;
        case "right":
            if(selfPos[0] >= canvas.width - (alienSize/2)) return false;
            break;
    }

    return true;
}


function increaseSize(increase) {

    if(divisor - increase > 15) divisor = 15;
    else if(increase != 0) divisor -= increase;

    if(divisor >= 6) speed = (divisor/6); // make speed proportional to size

    document.getElementById("speedDisp").innerText = "Speed " + Math.round(((divisor - 6) / (15 - 6)) * 100) + "%";

    if(divisor <= 6){
        divisor = 6;

        if(gameStart && !isTutorial){
            dead = true;
            selfSpeed = [false, false, false, false];

            let explosion = document.createElement("img");
            explosion.src = "media/explosion.gif";
            explosion.id = "explosion";
            explosion.style.top = Math.round((selfPos[1] / canvas.height) * 100) + "%";
            explosion.style.left =  Math.round((selfPos[0] / canvas.width) * 100) + "%";
    
            document.getElementById("canvasContainer").appendChild(explosion);
    
            foods = [];
            clearInterval(spawnFood);
    
            setTimeout(() => { 
                endGame();
                explosion.remove(); 
                explosion = undefined;
            }, 1500);
        }
    }else dead = false;

    setDial();
    setCharacter();

}


function setDial(){
    let dialElement;

    if(gameStart) dialElement = document.getElementById("dialIndicatorSide");
    else dialElement = document.getElementById("dialIndicator");

    let ratio = ((15 - 6) - (divisor - 6)) / (15 - 6); // 15 is max, 6 is the min 
    let ang = (180 * (ratio)) - 90;

    dialElement.style.transform = "rotate(" + ang + "deg)  translateX(-50%)";

    calculateHappiness();
}


function setCharacter() {

    let count = 0;

    var strobe = setInterval(() => {
        if(filter == 100) filter = 0;
        else filter = 100;

        if(count == 5){
            if(divisor <= 8){
                character.src = "media/4.svg";
            }else if(divisor <= 10){
                character.src = "media/3.svg";
            }else if(divisor <= 12){
                character.src = "media/2.svg";
            }else{
                character.src = "media/1.svg";
            }
        }else if(count == 10){
            clearInterval(strobe);
            filter = 100;
        }

        count ++;
    }, 200);    
}


function calculateHappiness() {
    let sizePercent = (divisor - 6) / (15 - 6);
    let hungerPercent = (10 - alienHunger) / 10;
    let happyScore = ((sizePercent + hungerPercent) / 2) * 100;

    // happyScore gives a percentage of happiness based on size and hunger level (0% min, 100% max)

    if(happyScore >= 0 && happyScore <= 35){
        happyMeter.src = "media/faceSad.svg";
    }else if(happyScore > 35 && happyScore <= 70){
        happyMeter.src = "media/faceNeutral.svg";
    }else{
        happyMeter.src = "media/faceHappy.svg";
    }
}


function setHunger() {
    let hungerElement = document.getElementsByClassName("hungerBar");

    if(gameStart) hungerElement = hungerElement[1];
    else hungerElement =  hungerElement = hungerElement[0];
    
    let percent = ((10 - alienHunger) / 10) * 100;
    let mixedColor = pickHex(percent/100);
    
    hungerElement.style.backgroundColor = "rgb(" + mixedColor[0] + "," + mixedColor[1] + ", 0";

    if(percent == 0) percent = 1;
    
    hungerElement.style.clipPath = "polygon(0 0, " + percent + "% 0, " + percent + "% 101%, 0 101%)"

    calculateHappiness();
}


function pickHex(weight) {
    var color1 = [0, 255, 0];
    var color2 = [255, 0, 0];

    var w1 = weight;
    var w2 = 1 - w1;

    var rg = [Math.round(color1[0] * w1 + color2[0] * w2), Math.round(color1[1] * w1 + color2[1] * w2)];
    return rg;
}



function characterAnimation() {
    if(grow) alienHeight += 0.2;
    else alienHeight -= 0.2;

    let diffrence  = alienHeight - alienSize;

    if(diffrence > 10 || diffrence < -10) alienHeight = alienSize;

    if(diffrence >= 5){
        grow = false;
    }else if(diffrence <= -5){
        grow = true;
    }
}


window.onblur = () => {
    // pause the game if user goes off tab
    if(gameStart){
        paused = true;
    }

    blurTime = new Date().getTime();
    dataOnBlur = data;
}


window.onfocus = () => {

    // setInterval doesn't always work the best especially when you shutdown/sleep computer while still on the site.
    // This function uses the data saved on blur to calcualte the proper change.
    // If the current weight or hunger values are off significantly off it corrects them



    // test 11:56 full everything


    let timeElapsed = new Date().getTime() - blurTime;
    
    if(timeElapsed > 300000){
        let properHunger = dataOnBlur.hunger + (( 10 / 12 ) * ( timeElapsed / 300000 ));
        let properWeight = dataOnBlur.divisor + (( 1 / 24) * ( timeElapsed / 300000 ));

        if(alienHunger <= properHunger + (10 / 12) && alienHunger >= properHunger - (10 / 12)){
            console.log("set interval hunger is off");
            console.log((timeElapsed / 60000) + " mins have passed");
            console.log("hunger went up " + (alienHunger - dataOnBlur.hunger));
            console.log("It should have gone up by " + (properHunger - dataOnBlur.hunger));

            alienHunger += (properHunger - dataOnBlur.hunger);
            setHunger();
        }

        if(divisor <= properWeight + (1 / 12) && divisor >= properWeight - ( 1  / 12)){
            console.log("set interval weight is off");
            console.log((timeElapsed / 60000) + " mins have passed");
            console.log("divisor went up " + (divisor - dataOnBlur.divisor));
            console.log("It should have gone up by " + (properWeight - dataOnBlur.divisor));

            increaseSize(properWeight - dataOnBlur.divisor);
        }
    }
}
