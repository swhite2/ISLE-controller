const { BehaviorSubject } = require('rxjs');
const Honeycomb = require('honeycomb-grid');
const Leap = require('leapjs');
const { performance } = require('perf_hooks');
const log = require('single-line-log').stdout;

module.exports = class MotionController {

  constructor(width = 1920, height = 1080) {
    this.width = width;
    this.height = height;
    this.gridArr = [];
    this.Grid = null;
    this.offsetIncrementor = 0;
    this.controller = new Leap.Controller();
    this.subject = new BehaviorSubject();

    // Configuration variables
    this.num_grids = 8;
    this.hex_size = 10;
    this.orientation = 'flat';
    this.grid_offset = 100;
    this.grid_width = 6;
    this.grid_height = 28;
  }

  // setter for the lightbar parameters
  setParameters(num_grids, hex_size, orientation, grid_offset, grid_width, grid_height) {
    this.num_grids = num_grids;
    this.hex_size = hex_size;
    this.orientation = orientation;
    this.grid_offset = grid_offset;
    this.grid_width = grid_width;
    this.grid_height = grid_height;
  }

  getController() {
    return this.controller;
  }
  
  getControllerSubject() {
    return this.subject;
  }

  /**
   * 
   * @param {Number} [num_grids] - The amount of grids to render, default = 8
   * @param {Number} [hex_size] - The size of the hexagon to render, default = 15
   * @param {string} [orientation] - Either 'flat' or 'point', default = 'flat'
   * @param {Number} [grid_offset] - The offset between each grid, default = 200
   * @param {Number} [grid_width] - The width of each grid, default = 6
   * @param {Number} [grid_height] - The height of each grid, default = 28
   */

   // num_grids = 8, hex_size = 15, orientation = 'flat', grid_offset = 200, grid_width = 6, grid_height = 28

  createGrids(artnetController) {  
    //These properties are called for each hex that is created
    //which means they represent exactly one pixel on the lightbars
    const Hex = Honeycomb.extendHex({
      size: this.hex_size,
      orientation: this.orientation,
      highlight(grid_number) {
        // logic for artnet
        artnetController.highlightHex(this, grid_number);
      }
    })
  
    this.Grid = Honeycomb.defineGrid(Hex)
    //TODO: Rewrite to let the user define the amount of grids
    this.offsetIncrementor = this.grid_offset;
    let offset = 0;
    for(let i = 0; i < this.num_grids; i++) {
      const grid = this.Grid.rectangle({
        width: this.grid_width,
        height: this.grid_height
      });
      console.log(grid);
      this.gridArr.push(grid);
      offset += this.offsetIncrementor;
    }
  }

  logPerformance(perfMeasurement) {
    log('Main Sensor Loop Performance (ms) => [' + (perfMeasurement / 1000) + ']');
  }

  startMainControllerLoop() {

    // performance measurement
    let counter = 0;
    let perfMeasurement = 0;
    let xpos_leap_left;
    let ypos_leap_left;
    let xpos_leap_right;
    let ypos_leap_right;
  
    this.controller.setBackground(false);
    this.controller.connect(); // Connect to the underlying LeapMotion SDK WebSocket
    this.controller.on('connect', () => {
      console.log(new Date() + ' Leap motion WebSocket connected');

      this.controller.on('deviceAttached', () => {
        console.log(new Date() + ' Leap motion controller device attached');
        setInterval(() => {
          const frame = this.controller.frame(); // Poll for a frame
          if(frame.hands.length > 0 && frame.valid) { //This check prevents all of the above logic from executing when no hand has been detected.
            if (counter === 1000) {
              this.logPerformance(perfMeasurement);
              perfMeasurement = 0;
              counter = 0;
            }
            var t0 = performance.now();
            for(let i = 0; i < frame.hands.length; i++){
              let hand = frame.hands[i];
              const zoom_factor_x = 4;
              const zoom_factor_y = 2;
              const offsetX = 0;
              const offsetY = 600;
      
              if(hand.type === 'left') {
                xpos_leap_left = this.convertToScreenCoordsX(zoom_factor_x, offsetX , hand.stabilizedPalmPosition[0]);
                ypos_leap_left = this.convertToScreenCoordsY(zoom_factor_y, offsetY, hand.stabilizedPalmPosition[1]);

                const current_grid_left = this.findCurrentGridAndHex(xpos_leap_left, ypos_leap_left, this.gridArr, this.Grid, this.offsetIncrementor);
                this.subject.next(JSON.stringify(
                  {
                    x: xpos_leap_left, 
                    y: ypos_leap_left, 
                    hand: 'left',
                    hex: current_grid_left ? current_grid_left.hex : undefined,
                    currentGrid: current_grid_left ? current_grid_left.grid_number : undefined
                  })); // the value that is emitted to the client still needs to be edited on the client with svg_left and svg_top
                if (typeof current_grid_left !== 'undefined') {
                  // Send data to the lightbars
                  current_grid_left.hex.highlight(current_grid_left.grid_number);
                }
              }
              if(hand.type === 'right') {
                xpos_leap_right = this.convertToScreenCoordsX(zoom_factor_x, offsetX , hand.stabilizedPalmPosition[0]) //- svg_left;
                ypos_leap_right = this.convertToScreenCoordsY(zoom_factor_y, offsetY, hand.stabilizedPalmPosition[1]) //- svg_top;

                const current_grid_right = this.findCurrentGridAndHex(xpos_leap_right, ypos_leap_right, this.gridArr, this.Grid, this.offsetIncrementor);
                this.subject.next(JSON.stringify(
                  {
                    x: xpos_leap_right, 
                    y: ypos_leap_right, 
                    hand: 'right',
                    hex: current_grid_right ? current_grid_right.hex : undefined,
                    currentGrid: current_grid_right ? current_grid_right.grid_number: undefined
                  }));
                if (typeof current_grid_right !== 'undefined') {
                  current_grid_right.hex.highlight(current_grid_right.grid_number);
                }
              }
            }   
            var t1 = performance.now();
            let timeDifference = t1-t0;
            perfMeasurement += timeDifference;
            counter++;       
          }

      }, 4); //16 represents 60fps in ms, increase for throttling purposes

      });
  
      this.controller.on('deviceStopped', () => {
        console.log(new Date() + ' Leap motion controller device disconnected. Aborting loop..');
      });
      this.controller.on('steamingStarted', () => {
        console.log(new Date() + ' Leap motion controller streaming started');
      })
    })
  
    this.controller.on('disconnect', () => {
      console.log(new Date() + ' Leap motion WebSocket disconnected');
    });
  }

  /**
   * 
   * @param {Number} pos_center_X 
   * @param {Number} pos_center_Y 
   * @param {Array} grid_array 
   * @param {any} defined_grid 
   * @param {Number} offsetIncrementor 
   */
  findCurrentGridAndHex (pos_center_X, pos_center_Y, grid_array, defined_grid, offsetIncrementor) {
    for(let i = 0; i < grid_array.length; i++) {
      const offset = offsetIncrementor * i;
      const hexCoordinates = defined_grid.pointToHex([pos_center_X - offset, pos_center_Y]);
      const hex = grid_array[i].get(hexCoordinates)
      if(hex) {
        return {offset: offset, grid_number: i, hex: hex};
      }
    }
  };

  /** 
   * @param {any} hand_symbol the current hand
   * @param {Boolean} isSecondHand filters wether the current hex is being highlighted by a right hand
   * @param currentGrid 
   * @param defined_grid
   * @param {Number} offsetX The offset to subtract from the hand_symbol's center X position. This allows for a correct reading of the current grid
   */
  checkForHex(hand_x, hand_y, isRightHand, currentGrid, defined_grid, offsetX) {
      const hexCoordinates = defined_grid.pointToHex([hand_x - offsetX, hand_y])
      const hex = currentGrid.get(hexCoordinates)
      if(hex) {
        return hex;
      }
    
  } 

  convertToScreenCoordsX(zoom_factor, offsetX, cartesian_x) {
    return ((zoom_factor * cartesian_x) + (this.width/2)) + offsetX;
  }
  
  convertToScreenCoordsY(zoom_factor, offsetY, cartesian_y) {
    return ((this.height/2) - (zoom_factor * cartesian_y)) + offsetY;
  } 

}



// /**
//  * returns a controller subject instance
//  */
// module.exports.controllerSubject = subject;
// /**
//  * returns a controller instance
//  */
// module.exports.controller = controller;