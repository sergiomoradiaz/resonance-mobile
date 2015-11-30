var context;
var $fun;
var synth= {};
var graphic;
var noteVal = 400;
var t = new Date();
var isDesktop = false;
var webAudioExists = false;
var touchE;

var accelEvent = {x:1, y:0, z:0};
var orientEvent = {};
var accelVal;
var base_color = Math.random();

var timer = 1;

var q_notes = [
130.813, 146.832, 164.814, 174.614, 195.998, 220.000, 246.942, // C, D, E, F, G, A, B
261.626, 293.665, 329.628, 349.228, 391.995, 440.000, 493.883,
523.251, 587.330, 659.255, 698.456, 783.991, 880.000, 987.767,
1046.502, 1174.659, 1318.510, 1396.913, 1567.982, 1760.000, 1975.533, 
2093.005, 2349.318, 2637.020, 2793.826, 3135.963, 3520.000, 3951.066,
//4186.009, 4698.636, 5274.041, 5587.652, 6271.927, 7040.000, 7902.133
];


$(document).ready(function(){
    setup();
});

window.onload = function(){
    containerNode = document.getElementById( 'canvas' );
    myp5 = new p5(s, containerNode);
}

var checkFeatureSupport = function(){
  try{
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    context = new AudioContext();

    //ios fix from p5.sound
    var iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );
    if (iOS) {
        window.addEventListener('touchend', function() {
            var buffer = context.createBuffer(1, 1, 22050);
            var source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);
            source.start(0);
        }, false);
    }
  }
  catch (err){
    alert('web audio not supported');
  }

  try{
    motionContext = window.DeviceMotionEvent;
  }
  catch (err){
    console.log('motion not supported');
  }
  if (! (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ) {
    isDesktop = true;
    console.log('desktop');
  }
}



///// SETUP /////

var setup = function(){
  checkFeatureSupport();

  if(typeof(context)!=="undefined"){
    webAudioExists = true;
  }

  if(webAudioExists){
    synth = new Synth();
  }

  graphic = new Graphic();

  $fun = $("#fun");

  var c  = HSVtoRGB(base_color,1,1);
  graphic.background_color = "rgb("+c.r+","+c.g+","+c.b+")" ;

  //// Hammer.js and Device Orientation Events ////

  hammertime = Hammer($fun[0], {
    prevent_default: true,
    no_mouseevents: true
  })
  .on('touch', function(event){
    touchActivate(event);
  })
  .on('drag', function(event){
    touchActivate(event);
  })
  .on('release', function(event){
    touchDeactivate();
  });

  if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', deviceMotionHandler, false);
  }

  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', devOrientHandler, false);
  }
  accelEvent = {x:1, y:0, z:0};
}



//// Touch and gesture mapped to sound and graphic ////

var touchActivate = function(e){
  e.preventDefault();

  if(webAudioExists){
    synth.touchActivate(e);
  }
  graphic.touchActivate(e);
}

var touchDeactivate = function(e){

  if(webAudioExists){
    synth.touchDeactivate();
  }
  graphic.touchDeactivate();
}

function deviceMotionHandler(eventData) {
  if(webAudioExists){
    synth.accelHandler(eventData);
  }

  graphic.accelHandler(eventData);
  var a = eventData.acceleration;
  accelEvent = a;
}

function devOrientHandler(eventData) {
  if(webAudioExists){
    synth.orientHandler(eventData);
  }
  graphic.orientHandler(eventData);
}

function desktopMotionHandler(eventData) {

  if(synth.activated){
    w =  $(window).width();
    h = $(window).height();
    x = 16 * (eventData.pageX -w/2)/w;
    y = 16 * (-1*eventData.pageY + h/2)/h;

  }
}



/////////////////////
// SOUND FUNCTIONS //
/////////////////////

function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function Pluck(f){
  this.filter;
  this.gain;
  this.osc;
  this.played = false;
  this.volume = map_range(f,100,1500,0.6, 0.4); 
  this.pitch = f;
  this.buildSynth();
  this.duration = 1;
}

Pluck.prototype.buildSynth = function(){
  this.osc = context.createOscillator(); // Create sound source
  this.osc.type = 3; // Square wave
  this.osc.frequency.value = this.pitch;

  this.filter = context.createBiquadFilter();
  this.filter.type = 0;
  this.filter.frequency.value = 440;

  this.gain = context.createGain();
  this.gain.gain.value = this.volume;
  //decay
  this.osc.connect(this.filter); // Connect sound to output
  this.filter.connect(this.gain);
  this.gain.connect(context.destination);
}

Pluck.prototype.setPitch = function(p){
  this.osc.frequency.value = p;
}

Pluck.prototype.setFilter = function(f){
  this.filter.frequency.value = f;
}

Pluck.prototype.setVolume= function(v){
  this.gain.gain.value = v;
  this.volume = v;
}

Pluck.prototype.play = function(dur){
  var dur = this.duration || dur;
  this.osc.start(0); // Play instantly
  this.gain.gain.setTargetAtTime(0, 0, 0.3);
  var that = this;
  setTimeout(function(){

  //start and stop don't work on mobile yet
  //and noteOff doesnt allow new notes
    that.setVolume(0);
    that.osc.disconnect();
  },dur*1000);
}

Pluck.prototype.stop = function(){
  return false;
}


function Synth(){
   this.activated =  false;
   this.notes = [220, 440, 880, 880*2];
}

Synth.prototype.touchActivate= function(e){

  if(!this.activated){
  var n = new Pluck(146.83*2);
  n.play();
  this.activated =  true;
  }
}

Synth.prototype.touchDeactivate= function(e){
   this.activated =  false;
}


Synth.prototype.accelHandler = function(accel){
  var x = Math.abs(accel.acceleration.x) ;
  var y = Math.abs(accel.acceleration.y) ;
  var z = Math.abs(accel.acceleration.z) ;

  accelVal = Math.max(x,y,z);

  var change =map_range(accelVal, 0, 15, 100, 1500);
  var qchange = quantize(change, q_notes)
  var interval = (new Date() - t)/1000;

  if(this.activated && ( interval >1/(accelVal+5))){ //speed
      var n = new Pluck(qchange);
      var tiltFB = orientEvent.beta;
      var filterval = map_range(tiltFB, -90, 90, 0, 10000);
      n.setFilter(filterval);
      n.play();
      t = new Date();
  }

}

var randArray = function(a){
  return a[Math.round(Math.random()*(a.length-1))];
}

var quantize = function(f, notes){
  var qnote = 0;
  notes.some(function(n){
      qnote = n;
      return f < n;
  });
  return qnote;
}

Synth.prototype.orientHandler = function(orient){
  orientEvent = orient;
}






///////////////////////
// GRAPHIC FUNCTIONS //
///////////////////////

function Graphic(){
  this.activated = false;
  this.x=0;
  this.y=0;
}

Graphic.prototype.touchActivate = function(e){
  this.activated = true;
  var c = e.gesture.center;
  this.cx = c.pageX;
  this.cy = c.pageY;
  var xRatio = this.cx/$(window).width();
  var yRatio = this.cy/$(window).height();
  this.x = xRatio;
  this.y = yRatio;
  this.decColor=base_color;
}

Graphic.prototype.touchDeactivate = function(){
  this.activated = false;
  $fun.css("background-color","black");
}

Graphic.prototype.accelHandler = function(accel){
 var h = accelVal;
 var h = map_range(accelVal, 0, 20, 0, 0.2);
 var c  = HSVtoRGB(h+base_color,1,1);
 this.decColor = h+base_color;
 if(this.decColor>1){this.decColor--;}
 this.background_color = "rgb("+c.r+","+c.g+","+c.b+")" ;

if(this.activated){
 $fun.css("background-color", this.background_color);
}

}

Graphic.prototype.orientHandler = function(orient){
}









// RGB TO HSV COLOR

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255)
    };
}





/*

// p5 SKETCH

var s = function( sketch ) {
  sketch.setup = function() {
    sketch.createCanvas(500, 500);
    sketch.colorMode("hsb");
    sketch.background(0,0,0);
  };

  sketch.draw = function() {

    // start timer
    timer++;

    // If not playing, background is black
    if(!graphic.activated){
      sketch.background(0,0,0);
    }

    // If playing, background is colored
    if(graphic.activated){

      sketch.background(graphic.decColor,1,1);
      sketch.noStroke();
      sketch.fill(0,0,1, 25);
      sketch.ellipse(graphic.cx,graphic.cy,400,400);

      sketch.fill(0,0,100);
      sketch.textSize(100);
      sketch.text(timer, window.innerWidth/2, window.innerHeight/5);
      
     }
  }
};


*/
