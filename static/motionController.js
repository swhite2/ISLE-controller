p5.disableFriendlyErrors = true;

const width = 1920;
const height = 1080;
let dyeInjector;
let corners;
let Hex;
let Grid;
let serializedGrid;

function setup() {
  createCanvas(width, height);
  frameRate(24);
  background(255, 255, 255);
  dyeInjector = new LeapSquare();
  dyeInjector.display();
  strokeWeight(3);
  stroke(237, 34, 93);

  Hex = Honeycomb.extendHex({ 
    size: 20,
    orientation: 'flat'
  });
  Grid = Honeycomb.defineGrid(Hex);

  const grid = Grid.rectangle({ 
    width: 48,
    height: 28
   }).forEach(hex => {
    const point = hex.toPoint();
    corners = hex.corners().map(corner => corner.add(point));
    //drawHex(corners);
  });

}

function drawHex(corners) {
  beginShape();
  const [firstCorner, ...otherCorners] = corners;
  vertex(firstCorner.x, firstCorner.y);
  otherCorners.forEach(point => {
    vertex(point.x, point.y);
  });
  //vertex(corners[corners.length-1].x, corners[corners.length-1].y);
  vertex(firstCorner.x, firstCorner.y);
  endShape();
}


// animationFrame optimizes browser performance
let controller = Leap.loop({frameEventName: 'animationFrame'}, function(frame) {
  background(255, 255, 255);

    if(frame.hands.length > 0) { 
      for(let i = 0; i < frame.hands.length; i++) {
        let hand = frame.hands[i];
        dyeInjector.move(convertToScreenCoordsX(4, 0, hand.palmPosition[0]), convertToScreenCoordsY(2, 600,  hand.palmPosition[1]));
        dyeInjector.display();
        //loop();
      }
    }
    //redraw();
  });

// function draw() {

// }

// Tweak offsets to match the screen
function convertToScreenCoordsX(zoom_factor, offsetX, cartesian_x) {
  return ((zoom_factor * cartesian_x) + (width/2)) + offsetX;
}

function convertToScreenCoordsY(zoom_factor, offsetY, cartesian_y) {
  return ((height/2) - (zoom_factor * cartesian_y)) + offsetY;
}


class LeapSquare {
  constructor() {
    this.x = width/2;
    this.y = height/2;
    this.size = 10;
    this.speed = 1;
  }

  move(x, y) {
    this.x = x;
    this.y = y;
  }

  display() {
    //fill(255, 204, 100);
    // noStroke();
    // fill(255, 0, 0, 0);
    //background(255, 255, 255);
    square(this.x, this.y, this.size);
    //stroke(237, 34, 93);

  }

}

