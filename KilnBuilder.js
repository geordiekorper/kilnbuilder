/* eslint-disable eol-last */
/* eslint-disable space-before-function-paren */
/* eslint-disable semi */
/* eslint-disable camelcase */

/*
TODO: 
  Compute ratios (not sure what this means so I am leaving it here for now)
*/

let env = 'dev';

// Constants

// There are two things that influence the size of a kiln the bricks and the shelves

// Bricks
const standardBrick = { 
  width: 4.5, 
  length: 9, 
  height: 2.5, 
  types : {
    // Conductivity is "Thermal Conductivity 750°C (W/m.°K)"
    IFB: { color: 'WhiteSmoke', initial: 'I', cost: 2.5, conductivity: 0.3 },
    Super: { color: 'FireBrick', initial: 'S', cost: 1.5, conductivity: 1 },
    Medium: { color: 'Bisque', initial: 'M', cost: 1, conductivity: 1.1 }
  }
}

// Units
const square_foot = 12 * 12;
const cubic_foot = square_foot * 12;
const horizantalUnit = standardBrick.width;
const verticalUnit = standardBrick.height;

// Scale
const birdseye_scale = 18;
const sideview_scale = 8;

// Globals
// let layers = [];
let num_IFBs, num_supers, num_mediums;
let layer_num_IFBs, layer_num_supers, layer_num_mediums;

let walls = {
  debug(message)
  {
     let myMessage = `Walls - ${message}`
     console.debug(myMessage)
  },
  front_wall: {
    col: 0,
    depth: standardBrick.length,
    create(layer, layer_type) {
      walls.debug(`front_wall: layer_type:${layer_type}`)
      const currentLayer = kiln.numOfLayers - 2;
      const aWall = {
        layer_type: layer_type,
        orientation: 'cross-wise',
        units_long: kiln.units_wide,
        x_offset: 0,
        y_offset: 0,
        brick_courses: [
          ['Medium', 'external'],
          ['Super', 'internal']
        ]
      };

      // TODO: Clean this up to be more self-explanatory
      if (layer_type === 'header') {
        // Header rows only need one brick so we override that.
        aWall.brick_courses = [
          ['Super', 'external']
        ];
        aWall.y_offset -= 1;
      }
      // The front wall is pretty simple because it is as high as the firebox and 
      // only interacts with the side wall
      if (currentLayer < firebox.layers) {
        walls.create(layer, aWall)
      } else {
        // Don't need to do anything.
      }
    }
  },
  left_wall: {

    col: 0, // Where the wall starts on the left
    depth: standardBrick.length,
    create(layer, layer_type) {
      walls.debug(`Left: layer_type:${layer_type}`)
      const currentLayer = kiln.numOfLayers - 2
      const aWall = {
        layer_type: layer_type,
        orientation: 'length-wise',
        units_long: kiln.units_long,
        x_offset: 0,
        y_offset: 0,
        brick_courses: [
          ['IFB', 'external'],
          ['Super', 'internal']
        ]
      }
      console.debug(`walls.left_wall.create --- currentLayer:${currentLayer} layer_type:${layer_type} length:${aWall.units_long} offsets:${aWall.y_offset}/${aWall.x_offset}`)

      if (aWall.layer_type === 'header') {
        // Header rows only need one brick so we override that.
        // We also shorten the row and offset 
        // this is because the front and back rows go the whole width of the kiln
        aWall.brick_courses = [
          ['Super', 'external']
        ];
        aWall.x_offset = 2;
        aWall.units_long = kiln.units_long - 4;
      }

      if (currentLayer < chamber.layers) {
        // Create a full length wall
        walls.create(layer, aWall)
        console.debug('Creating left hand wall below chamber height.')
      } else if (currentLayer < firebox.layers) {
        console.debug('Creating left hand wall below firebox height.');

        // Create along firebox
        if (aWall.layer_type === 'header') {
          aWall.units_long = walls.throat.col
        } else {
          aWall.units_long = walls.throat.col + 2
        }
        walls.create(layer, aWall);

        // Create along chimney
        aWall.units_long = chimney.depth / horizantalUnit + 3
        aWall.y_offset = 1;
        aWall.x_offset = kiln.units_long - aWall.units_long - 1
        aWall.brick_courses = [
          ['Medium', 'internal']
        ]

        if (aWall.layer_type === 'header') {
          // The chimney does not have header rows above the chamber height because it is only 1 brick thick.
          aWall.layer_type = 'even'
        }
        walls.create(layer, aWall)
      } else if (currentLayer > firebox.layers) {
        // If we are above the height of the firebox then it is chimney only
        // there are no header rows there and it is only a single brick thick
        if (aWall.layer_type === 'header') {
          aWall.layer_type = 'even'
        }
        console.debug('Creating left hand wall above firebox height.');
        aWall.y_offset = 1;
        aWall.units_long = chimney.depth / horizantalUnit + 3
        aWall.x_offset = kiln.units_long - aWall.units_long - 1
        aWall.brick_courses = [
          ['Medium', 'internal']
        ]
        walls.create(layer, aWall)
      } else {
        console.error('Something is broken in the left_wall function')
      }
    }
  },
  right_wall: {
    col: 0,
    depth: standardBrick.length,
    create(layer, layer_type) {
      walls.debug(`Right: layer_type:${layer_type}`)
      // We ignore the two base layers because they are not walls
      const currentLayer = kiln.numOfLayers - 2
      const aWall = {
        layer_type: layer_type,
        orientation: 'length-wise',
        units_long: kiln.units_long,
        x_offset: 0,
        y_offset: kiln.units_wide - 2,
        brick_courses: [
          ['Super', 'internal'],
          ['IFB', 'external']
        ]
      }

      if (aWall.layer_type === 'header') {
        // Header rows only need one brick so we override that.
        // We also shorten the row and offset it because
        // the front and back rows go the whole width of the kiln
        aWall.brick_courses = [
          ['Super', 'external']
        ];
        aWall.x_offset = 2;
        aWall.units_long = kiln.units_long - 4;
      }

      if (currentLayer < chamber.layers) {
        // Create a full length wall
        walls.create(layer, aWall)
        console.debug('Creating right hand wall below chamber height.');
      } else if (currentLayer < firebox.layers) {
        console.debug('Creating right hand wall below firebox height.');

        // Create along firebox
        if (aWall.layer_type === 'header') {
          aWall.units_long = walls.throat.col
        } else {
          aWall.units_long = walls.throat.col + 2
        }
        walls.create(layer, aWall);

        // Create along chimney
        aWall.units_long = chimney.depth / horizantalUnit + 3
        aWall.x_offset = kiln.units_long - aWall.units_long - 1
        aWall.brick_courses = [
          ['Medium', 'internal']
        ]
        if (aWall.layer_type === 'header') {
          // The chimney does not have header rows above the chamber height because it is only 1 brick thick.
          aWall.layer_type = 'even'
        }
        walls.create(layer, aWall)
      } else if (currentLayer > firebox.layers) {
        // If we are above the height of the firebox then it is chimney only
        // there are no header rows there and it is only a single brick thick
        if (aWall.layer_type === 'header') {
          aWall.layer_type = 'even'
        }
        console.debug('Creating right hand wall above firebox height.');

        aWall.units_long = chimney.depth / horizantalUnit + 3
        aWall.x_offset = kiln.units_long - aWall.units_long - 1
        aWall.brick_courses = [
          ['Medium', 'internal']
        ]
        walls.create(layer, aWall)
      }
    }
  },
  throat: {
    col: 0,
    depth: standardBrick.length,
    create(layer, layer_type) {
      walls.debug(`Throat: layer_type:${layer_type}`)
      const currentLayer = kiln.numOfLayers - 2

      // eslint-disable-next-line prefer-const
      let aWall = {
        layer_type: layer_type,
        orientation: 'cross-wise',
        units_long: kiln.units_wide - 1,
        x_offset: walls.throat.col,
        y_offset: 0,
      }
      if (currentLayer > firebox.layers) {
        // Throat does not need to be drawn above the firebox height so we can return immediately
        return
      } 
      else if (aWall.layer_type === 'header') {
        // The interlacing is different above the chamber though so we need to adjust where things go.
        if (currentLayer < chamber.layers) {
          // We are inside the kiln and need to interlace this header row with the side walls
          aWall.brick_courses = [['Super', 'internal']];
        } 
        else {
          // The wall is now an outside wall because we are above the chamber
          aWall.brick_courses = [['Super', 'external']];
        }
      }
      else if (currentLayer < chamber.layers) {
        // Not a header and below the chamber height
        aWall.brick_courses = [
          ['Super', 'internal'],
          ['Super', 'internal']
        ];
      } 
      else if (currentLayer < firebox.layers) {
        // Not a header and above the chamber height
        aWall.brick_courses = [
          ['Super', 'internal'],
          ['IFB', 'external']
        ];
      } 
      else {
        console.error(`Somehow we ended up with a brick in an unexpected place at Layer=${currentLayer} Layer Type=${layer_type}`);
      }
      walls.create(layer, aWall);
    }
  },
  bag_wall: {
    col: 0,
    depth: standardBrick.length,
    create(layer, layer_type) {
      walls.debug(`Bag: layer_type:${layer_type}`)
      const currentLayer = kiln.numOfLayers - 2;

      // eslint-disable-next-line prefer-const
      let aWall = {
        layer_type: layer_type,
        orientation: 'cross-wise',
        units_long: kiln.units_wide,
        x_offset: walls.bag_wall.col,
        y_offset: 0
      };
      // TODO: Clean this up to be more self-explanatory
      if (currentLayer >= chamber.layers) {
        // When above the chamber we need to only draw a sigle walled chimney
        aWall.x_offset += 1;
        aWall.brick_courses = [
          ['Medium', 'internal']
        ];
        if (aWall.layer_type === 'header') {
          // If we are singled walled headers are not possible so we treat it at as an even row
          aWall.layer_type = 'even'
        }
      } else if (aWall.layer_type === 'header') {
        // Below the height of the chamber we treat header rows normally
        aWall.brick_courses = [
          ['Super', 'internal']
        ];
        aWall.units_long = kiln.units_wide - 3;
      } else if (currentLayer < chamber.layers) {
        // Below the height of the chamber we treat this a two brick thick internal wall
        aWall.brick_courses = [
          ['Super', 'internal'],
          ['Super', 'internal']
        ];
      } else {
        // Can't get here because the currentLayer has to be either one of <,=,>
      }
      walls.create(layer, aWall)
    },
    throat: {
      col: 0,
      depth: standardBrick.length,
      create(layer, layer_type) {
        const currentLayer = kiln.numOfLayers

        // eslint-disable-next-line prefer-const
        let aWall = {
          orientation: 'cross-wise',
          units_long: kiln.units_wide,
          x_offset: walls.throat.col,
          y_offset: 0,
          brick_courses: [
            ['Super', 'internal'],
            ['Super', 'internal']
          ]
        }
        if (currentLayer >= firebox.layers) {
          // Throat does not need to be drawn above the firebox height so we can return immediately
          return
        } else if (layer_type === 'header') {
          // The interlacing is different above the chamber though so we need to adjust where things go.
          if (currentLayer < chamber.layers) {
            // We are inside the kiln and need to interlace this header row with the side walls
            aWall.units_long = kiln.units_wide - 3;
            aWall.brick_courses = [
              ['Super', 'internal']
            ];
          } else {
            // The wall is now an outside wall because we are above the chamber
            aWall.units_long = kiln.units_wide;
            aWall.y_offset -= 1;
            aWall.brick_courses = [
              ['Super', 'external']
            ];
          }
        } else if (currentLayer < chamber.layers) {
          // Not a header and below the chamber height
          aWall.brick_courses = [
            ['Super', 'internal'],
            ['Super', 'internal']
          ];
        } else if (currentLayer < firebox.layers) {
          // Not a header and above the chamber height
          aWall.brick_courses = [
            ['Super', 'internal'],
            ['IFB', 'external']
          ];
        } else {
          console.error(`Somehow we ended up with a brick in an unexpected place at Layer=${currentLayer} Layer Type=${layer_type}`);
        }
        walls.create(layer, aWall);
      }
    }
  },
  back_wall: {
    col: 0,
    depth: standardBrick.length,
    create(layer, layer_type) {
      walls.debug(`Back: layer_type:${layer_type}`)
      const currentLayer = kiln.numOfLayers - 2
      let aWall = {
        layer_type: layer_type,
        orientation: 'cross-wise',
        units_long: kiln.units_wide,
        x_offset: kiln.units_long - 2,
        y_offset: 0,
        brick_courses: [
          ['Super', 'internal'],
          ['Medium', 'external']
        ]
      };

      // TODO: Clean this up to be more self-explanatory
      if (currentLayer >= chamber.layers) {
        // When above the chamber we need to only draw a single walled chimney
        aWall.brick_courses = [
          ['Medium', 'internal']
        ];
        if (aWall.layer_type === 'header') {
          // If we are singled walled then headers are not possible so we treat it at as an even row
          aWall.layer_type = 'even'
        }
      } else if (layer_type === 'header') {
        // Below the height of the chimney we treat header rows normally
        aWall.brick_courses = [
          ['Super', 'internal']
        ];
        aWall.y_offset -= 2;
        aWall.units_long += 1;
      } else {
        // In this case the basic wall we defined originally does not require overrides.
      }
      walls.create(layer, aWall)
    }
  },
  create(layer, wall) {
    walls.debug(`${JSON.stringify(wall)}`);
    console.log(`Create: layer_type:${wall.layer_type} length:${wall.units_long} offsets:${wall.y_offset}/${wall.x_offset}`)

    if (wall.orientation === 'length-wise') {
      this.handleLengthwiseWall(layer, wall);
    } else if (wall.orientation === 'cross-wise') {
      this.handleCrosswiseWall(layer, wall);
    } else {
    console.error('Walls Create --- wall.orientation is not valid')
    }
  },
/**
 * Handles the creation of a lengthwise wall in the kiln.
 *
 * @param {Object} layer - The layer in which the wall is being created.
 * @param {Object} params - The parameters for the wall.
 * @param {number} params.units_long - The length of the wall in units.
 * @param {Array}  params.brick_courses - An array representing the courses of bricks in the wall. Each element is an array where the first element is the brick type and the second element is the course type ('internal', etc.).
 * @param {string} params.layer_type - The type of the layer ('even', 'header', etc.).
 * @param {number} params.x_offset - The x offset of the wall.
 * @param {number} params.y_offset - The y offset of the wall.
 *
 * @returns {void}
 */
  handleLengthwiseWall(layer, { units_long, brick_courses, layer_type, x_offset, y_offset, orientation }) {
    let columns_to_draw = units_long / 2;
    const rows_to_draw = brick_courses.length;
    let brick_orientation = 'landscape';
  
    // Even rows are 1 brick longer and offset by 1/2 a brick 
    if (layer_type === 'odd') {
      x_offset += 1;
      columns_to_draw -= 1;
    }
  
    for (let row = 0; row < rows_to_draw; row++) {
      const [brickType, course_type] = brick_courses[row];
      const additional_offset = course_type === 'internal' ? 1 : 0;
  
      for (let col = 0; col < columns_to_draw - additional_offset; col += 1) {
        const real_row = row + y_offset;
        let real_column = (col * 2) + x_offset + additional_offset;
  
        if (layer_type === 'header') {
          columns_to_draw = units_long;
          brick_orientation = 'portrait';
          real_column = col + x_offset + additional_offset;
        }
  
        console.log(`Creating ${orientation} ${brick_orientation} ${brickType} ${kiln.numOfLayers}:${real_column}:${real_row} in walls.create-length-wise.`);
        const new_brick = new Brick({ layer: kiln.numOfLayers, x: real_column, y: real_row, type: brickType, orientation: brick_orientation });
        
        new_brick.insertIntoLayer(layer);
      }
    }
  },

/**
 * Handles the creation of a crosswise wall in the kiln.
 *
 * @param {Object} layer - The layer in which the wall is being created.
 * @param {Object} params - The parameters for the wall.
 * @param {number} params.units_long - The length of the wall in units.
 * @param {Array} params.brick_courses - An array representing the courses of bricks in the wall. Each element is an array where the first element is the brick type and the second element is the course type ('internal', etc.).
 * @param {string} params.layer_type - The type of the layer ('even', 'header', etc.).
 * @param {number} params.x_offset - The x offset of the wall.
 * @param {number} params.y_offset - The y offset of the wall.
 *
 * @returns {void}
 */
  handleCrosswiseWall(layer, { units_long, brick_courses, layer_type, x_offset, y_offset }) {
    // We deconstruct the wall object into its component parts to make it easier to work with
    let rows_to_draw = units_long / 2;
    const columns_to_draw = brick_courses.length;
    let real_row = 0, real_column = 0, additional_offset = 0;
    let brick_orientation = 'portrait';
  
    // Even rows are 1 brick shorter and offset by 1/2 a brick 
    // and header rows replace every 3 or 4 even rows but behave the same
    if (layer_type === 'even' || layer_type === 'header') {
      rows_to_draw -= 1;
      y_offset += 1;
    }
  
    for (let col = 0; col < columns_to_draw; col++) {  // iterate through the columns of bricks in the wall
      const [brickType, course_type] = brick_courses[col];
      additional_offset = course_type === 'internal' ? 1 : 0;
  
      for (let row = 0; row < rows_to_draw - additional_offset; row += 1) {
        // 
        real_row = (row * 2) + y_offset + additional_offset;
        real_column = col + x_offset;
  
        if (layer_type === 'header') {
          rows_to_draw = units_long;
          brick_orientation = 'landscape';
          real_row = row + y_offset + additional_offset;
        }
        // console.debug(`Creating ${brick_orientation} ${brickType} ${kiln.numOfLayers}:${real_column}:${real_row} in walls.create-length-wise.`);
        const new_brick = new Brick({ layer: kiln.numOfLayers, x: real_column, y: real_row, type: brickType, orientation: brick_orientation });
        new_brick.insertIntoLayer(layer);
      }
    }
  },
}

/**
 * Class representing a Kiln.
 */
class Kiln {
  constructor() {
    this.length = 0;
    this.width = 0;
    this.firing_time = 32; // in hours
    this.share = 4; // in cubic feet
    this.numOfLayers = 0; // in cubic feet
  }

  debug(message)
  {
     let myMessage = "Kiln Object debug: " + message
    // this.debug(myMessage)
  }

    /**
   * Calculate the dimensions of the kiln and its components.
   * @returns {void}
   */
  calculate() {
    this.length =
      walls.front_wall.depth +
      firebox.depth +
      walls.throat.depth +
      chamber.length +
      walls.bag_wall.depth +
      chimney.depth +
      walls.back_wall.depth;
    this.units_long = this.length / horizantalUnit;
    this.width = chamber.width + (4 * horizantalUnit)
    this.units_wide = this.width / horizantalUnit;

    walls.throat.col = (walls.front_wall.depth + firebox.depth) / horizantalUnit;
    chamber.offset = ((walls.throat.col / 2 + 1) * standardBrick.length);

    walls.bag_wall.col = walls.throat.col + (chamber.length / horizantalUnit) + 2;
    chimney.offset = ((walls.bag_wall.col / 2 + 1) * standardBrick.length);
  }
  /**
   * Reads the values from the page and calculates the dimensions of the kiln areas.
   *
   * @function
   * @name calculateDimensions
   * @returns {void}
   */
  calculateDimensions() {
    page.readValues();
    shelves.generateShelves();
    chamber.calculate();
    firebox.calculate();
    chimney.calculate();
    kiln.calculate();
  }
  /**
   * Creates the base layers and the layers up to the height of the chimney.
  *
  * @function
  * @name createLayers
  * @returns {void}
  */
  createLayers() {
    // Clear existing layers

    this.layers = new Layers(this.units_long, this.units_wide);
    this.numOfLayers = 0;
    this.layers.createBaseLayer('landscape', 'IFB');
    this.layers.createBaseLayer('portrait', 'Super');

    for (let index = 0; index < chimney.layers; index++) {
      if ((index + 2) % 6 === 0) {
        this.layers.createLayerForWalls('header');
      } else if (index % 2 === 0) {
        this.layers.createLayerForWalls('even');
      } else {
        this.layers.createLayerForWalls('odd');
      }
    }
    kiln.height = kiln.numOfLayers * standardBrick.height;
  }
    /**
   * Draws the kiln in the side view and birdseye view, draws the shelves, and updates the page elements.
   * @returns {void}
   */
  draw() {
    drawSideView(sideview_scale);
    drawBirdseyeView(this.layers.layers);
    shelves.draw();
    page.updateElements();
  }
}

let shelves = {
  num_wide: 0,
  num_long: 0,
  width: 0,
  length: 0,
  x_offset: 0,
  y_offset: 0,
  total_width: 0,
  total_length: 0,
  cubic_usable: 0,
  rotated: false,
  extra_space: 1,
  instances: [],
  shelf_sizes: [[8, 16], [11, 22], [11, 23], [12, 12], [12, 24], [13, 14], [13, 26], [14, 28], [16, 16], [19, 25], [20, 20], [24, 24]],

  debug(message)
  {
     let myMessage = "Shelves debug: " + message
    // console.debug(myMessage)
  },

  rotateDefaultSizes() {
    // Rotate the shelf sizes so that the longest dimension is the width (or revert to the original if it is already that way)
    // also update the dropdown to reflect the change
    shelves.debug('rotateDefaultSizes started');
    shelves.rotated = $('#shelves_rotated').is(':checked');

    // get currently selected shelf size by index
    let selected_index = $("#shelf_sizes option:selected").index();

    // reverse the shelf sizes using a temporary array
    let temp = [];
    for (let i = 0; i < shelves.shelf_sizes.length; i++) {
      temp[i] = shelves.shelf_sizes[i].reverse();
    }
    shelves.shelf_sizes = temp;

    // repopulate the dropdown with the new shelf sizes select the same shelf size as before and refresh the dropdown
    shelves.populateDropdown();
    $("#shelf_sizes option").eq(selected_index).prop('selected', true).parent().selectmenu("refresh");

    //Refresh the page now that the shelves have been rotated
    page.refreshPage();
    shelves.debug('rotateDefaultSizes finished');
  },

  populateDropdown() {
    // populate the dropdown with the shelf sizes
    // but first clear out the dropdown in case it has been populated before
    $('#shelf_sizes').children().remove();

    $.each(shelves.shelf_sizes, function (size) {
      let shelf_description = shelves.shelf_sizes[size][0] + 'x' + shelves.shelf_sizes[size][1];
      shelves.debug('Populating dropdown with shelf_description: ' + shelf_description);
      $('#shelf_sizes').append($('<option>', {
        value: shelf_description,
        text: shelf_description
      }));
    })
    // add the Custom option
    $('#shelf_sizes').append($('<option>', { value: "Custom", text: "Custom" }));
  },

  updateShelvesOffset() {
    // NOTE: All shelf calculations are done in inches or mm because they are not bound to brick boundaries
    // update x_offset to take into account chamber.dead_space_front and chamber.offset after chamber is created
    // update y_offset to take into account chamber.offset after chamber is created
    this.x_offset = chamber.deadspace_front + chamber.offset;
    this.y_offset = standardBrick.length + (chamber.width - shelves.total_width) / 2;
  },

  /**
   * Draws the shelves in the kiln chamber on two canvases: a scaled-up view and a thumbnail.
   * The function iterates through the shelves and tells each one to draw itself.
   *
   * @function
   * @name draw
   * @returns {void}
   */
  draw() {
    //   // Center shelves in chamber
    //   this.updateShelvesOffset();
    //   // Canvas for main view
    //   const KilnFloor_canvas = document.getElementById('Layer2_canvas');
    //   const KilnFloor_ctx = KilnFloor_canvas.getContext('2d');

    //   // Canvas for thumbnail
    //   const birdseye_thumbnail_canvas = document.getElementById('birdseye_thumbnail_canvas');
    //   const birdseye_thumbnail_ctx = birdseye_thumbnail_canvas.getContext('2d');

    //   // Iterate throught the shelves and draw them
    //   $.each(shelves.instances, function (i) {
    //     let myShelf = shelves.instances[i];
    //     myShelf.draw(KilnFloor_ctx,birdseye_scale);
    //     myShelf.draw(birdseye_thumbnail_ctx,1);
    //   });
    //
    //  
  },
  /** TODO: this description is out of date
   * Calculates the dimensions of the shelves in the kiln chamber based on the shelf length, width, and extra space.
   * The function also calculates the total width and length of the shelves, and the usable cubic footage.
   *
   * @function
   * @name calculate
   * @returns {void}
   */
  generateShelves() {
    'use strict';
    // NOTE: All shelf calculations are done in inches because they are not bound to brick boundaries
    // The chamber that they sit in will be calculated in bricks though.
    let [shelf_length, shelf_width] = [shelves.length, shelves.width];
    const myBox = shelves.getBoundingBox();
    this.debug(`Shelves bounding box is: ${JSON.stringify(myBox)}`);
    this.instances = [];
    for (let col = 0; col < shelves.num_long; col++) {
      for (let row = 0; row < shelves.num_wide; row++) {
        let shelf_x_offset = col * (shelf_length + shelves.extra_space);
        let shelf_y_offset = row * (shelf_width + shelves.extra_space);

        this.instances.push(new Shelf({
          width: shelf_width,
          length: shelf_length,
          x_offset: shelf_x_offset,
          y_offset: shelf_y_offset,
          extra_space: 1
        }));
      }
    }
  },

  getBoundingBox() {
    // at the moment this is only setup to work with the default shelf sizes

    // Need space between each shelf
    shelves.total_width = shelves.num_wide * (shelves.width + shelves.extra_space);
    shelves.total_length = shelves.num_long * (shelves.length + shelves.extra_space)
    this.debug('Shelves total width is: ' + shelves.total_width)
    this.debug('Shelves total length is: ' + shelves.total_length)
    // Calculate the theoretical cubic footage of the shelves. 
    // Right now this calculation is not used anywhere and it appears to be wrong.
    shelves.cubic_usable = Math.round(shelves.total_length * shelves.total_width / cubic_foot * 10) / 10;
    let boundingBox = {
      x_min: 0,
      y_min: 0,
      x_max: 0,
      y_max: 0
    };
    // let x_min = 0;
    // let y_min = 0;
    // let x_max = 0;
    // let y_max = 0;
    // let shelf_x_offset = 0;
    // let shelf_y_offset = 0;
    // let shelf_length, shelf_width;
    // for (let col = 0; col < shelves.num_long; col++) {
    //   for (let row = 0; row < shelves.num_wide; row++) {
    //     shelf_x_offset = col * (shelf_length + shelves.extra_space);
    //     shelf_y_offset = row * (shelf_width + shelves.extra_space);
    //     x_min = Math.min(x_min, shelf_x_offset);
    //     y_min = Math.min(y_min, shelf_y_offset);
    //   }
    // }
    // boundingBox.x_min = x_min;
    // boundingBox.y_min = y_min;
    // boundingBox.x_max = x_max;
    // boundingBox.y_max = y_max;
    return boundingBox;
  }
}


/**
 * Represents a shelf in the kiln. Most kilns will have multiple shelves. 
 * Best practice is to use the same type of shelf throughout the kiln.
 *
 * @constructor
 * @param {Object} options - The properties of the shelve.
 */
class Shelf {
  constructor(options) {
    const {
      width = 0,
      length = 0,
      x_offset = 0,
      y_offset = 0,
      rotated = false,
      extra_space = 1
    } = options;

    this.width = width;
    this.length = length;
    this.x_offset = x_offset;
    this.y_offset = y_offset;
    this.rotated = rotated;
    this.extra_space = extra_space;
  }

  debug(message)
  {
     let myMessage = "Shelf debug: " + message
    // console.debug(myMessage)
  }
  /**
   * Rotates the shelf by swapping its length and width.
   */
  rotate() {
    local_width = this.length;
    local_length = this.width;
    this.length = local_width;
    this.width = local_length;
  }

  /**
   * Returns a scaled version of the shelf's dimensions and offsets.
   *
   * @method
   * @name getRectScaled
   * @param {number} scaleFactor - The scale factor to apply.
   * @returns {string} - The scaled dimensions and offsets.
   */
  getRectScaled(scaleFactor) {
    scaleFactor = scaleFactor / horizantalUnit;
    let scaledValues = [
      (shelves.x_offset + this.x_offset) * scaleFactor,
      (shelves.y_offset + this.y_offset) * scaleFactor,
      // FIXME: This is a hack to get around the fact that I got the width and length backwards
      this.length * scaleFactor,
      this.width * scaleFactor,
    ];
    this.debug(`Scaled values are: ${JSON.stringify(scaledValues)}`)
    return scaledValues;
  }
  /**
   * Draws the shelf on a canvas.
   * @method  
   * @name draw
   * @param {Object} ctx - The canvas context to draw on.
   * @param {number} scaleFactor - The scale factor to apply.
   * @returns {void}
   */
  draw(ctx, scaleFactor) {
    let myRect = this.getRectScaled(scaleFactor)
    if (scaleFactor < 3) {
      ctx.strokeStyle = 'none';
    } else {
      ctx.strokeStyle = 'black';
    }
    ctx.fillStyle = 'gray';
    ctx.beginPath();
    // Because myRect is an array and ctx.rect expects 4 seperate arguments 
    // we need to spread it out using the spread operator
    ctx.rect(...Object.values(myRect))
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

class KilnSection {
  constructor() {
    this.depth = 0;
    this.length = 0;
    this.height = 0;
    this.square = 0;
    this.cubic = 0;
    this.layers = 0;
    this.offset = 0;
  }

  calculate() {
    // This method should be overridden in the derived classes
  }
}

class Chamber extends KilnSection {
  constructor() {
    super();
    this.deadspace_front = 9;
    this.deadspace_back = 4;
    this.deadspace_sides = 2;
  }
  debug(message)
  {
     let myMessage = "Chamber object debug: " + message
    // console.debug(myMessage)
  }
  calculate() {
    // We need to fit the shelves in the chamber and make sure that
    // the total size is rounded up the nearest whole brick.
    const estimated_length = this.deadspace_front + shelves.total_length + this.deadspace_back;
    let units_long = Math.ceil(estimated_length / horizantalUnit);
    if (units_long % 2 !== 0) { units_long += 1 }
    this.length = units_long * horizantalUnit;

    // Any extra space should be added to the front deadspace
    // TODO: Make the deadspace a modifiable variable 
    this.deadspace_front = 9 + this.length - estimated_length;
    let units_wide = Math.ceil((shelves.total_width + (this.deadspace_sides * 2)) / horizantalUnit);
    if (units_wide % 2 !== 0) { units_wide += 1 }

    this.debug(`Rows and columns in chamber: ${units_long}x${units_wide}`)

    this.width = units_wide * horizantalUnit;
    // TODO: Make the chanmber height something that can be varied
    this.height = this.width;
    this.square = this.width * this.length;
    this.cubic = Math.round(this.square * this.height / cubic_foot * 10) / 10;
    this.layers = this.height / standardBrick.height;
    this.debug(`Chamber length: ${this.length} and length of shelves: ${shelves.total_length}`)
  }
}
class Firebox extends KilnSection {
  calculate() {
    firebox.depth = 3 * standardBrick.length;
    firebox.height = chamber.height * 1.75;
    firebox.square = chamber.width * firebox.depth;
    firebox.cubic = Math.round(firebox.square * firebox.height / cubic_foot * 10) / 10;
    firebox.layers = firebox.height / standardBrick.height;
  }
}
class Chimney extends KilnSection {
  calculate() {
    chimney.depth = 2 * standardBrick.length;
    chimney.height = chamber.height * 2.5;
    chimney.square = chamber.width * chimney.depth;
    chimney.cubic = (chimney.square * chimney.height / cubic_foot).toFixed(1);
    chimney.layers = chimney.height / standardBrick.height;
    chimney.ratio = chimney.square / firebox.square
    console.info(`Optimal chimney size would be ${firebox.square / 10}-${firebox.square / 7}`)
    console.info(`Chimney ratio is ${chimney.ratio}`)
  }
}


/**
 * Class representing a brick.
 */
class Brick {
  /**
   * Create a brick.
   * @param {Object} options - The options for creating a brick.
   * @param {number} options.layer - The layer of the brick (default is 0).
   * @param {number} options.x - The x coordinate of the brick (default is 0).
   * @param {number} options.y - The y coordinate of the brick (default is 0).
   * @param {number} options.width - The width of the brick (default is standardBrick.width).
   * @param {number} options.length - The length of the brick (default is standardBrick.length).
   * @param {number} options.height - The height of the brick (default is standardBrick.height).
   * @param {string} options.type - The type of the brick (default is 'Super').
   * @param {string} options.orientation - The orientation of the brick (default is 'landscape').
   */
  constructor({
    layer = kiln.numOfLayers,
    x = 0,
    y = 0,
    width = standardBrick.width,
    length = standardBrick.length,
    height = standardBrick.height,
    type = 'Super',
    orientation = 'landscape'
  })
  // The constructor above accepts an object as a parameter which allows us to pass in named parameters 
  // without having to remember the order of them. We put eah one on a new line to make it easier to read.
  {
    this.x = x;
    this.y = y;
    this.type = type;
    this.orientation = orientation;
    this.layer = layer;
    if (orientation === 'landscape') {
      this.width = length;
      this.length = width;
    } else if (orientation === 'portrait') {
      this.width = width;
      this.length = length;
    } else {
      console.error('***unknown brick orientation***')
    }
    this.height = height;
    this.unit_length = this.length / horizantalUnit;
    this.unit_width = this.width / horizantalUnit;
    this.unit_height = this.height / verticalUnit;
    this.color = standardBrick.types[this.type].color;
  }
  debug(message)
  {
     let myMessage = `Brick ${this.layer}:${this.x}:${this.y} - ${message}`
     console.debug(myMessage)
  }

  getRefenceToSelf() {
    myReference = kiln.layers[this.layer].bricks[this.x][this.y];
    return myReference;
  }
  insertIntoLayer(layer) {
    this.debug(`insertIntoLayer: ${this.orientation} brick`)
    this.checkForOverlap(layer)
    layer[this.x][this.y] = this;
  }

  deleteSelf(layer) {
    // only delete the brick if it actually exists
    if (layer[this.x][this.y] instanceof Brick)  {
      this.debug(`Deleting brick on layer ${this.layer} at ${this.x}:${this.y}`)
      layer[this.x][this.y] = undefined;
    }
    else
    {
      this.debug(`Not deleting brick on layer ${this.layer} at ${this.x}:${this.y} because it doesn't exist`)
    }
  }
  checkForOverlap(layer) {
    // Check if we are overwriting an existing brick and if so delete it
    // Note: this is normal on crosswise walls on layers where they interlace with the side walls.

    this.debug(`checkForOverlap: ${this.orientation} brick`)
    let bricks = layer;
    let col = this.y;
    let row = this.x;
    let overlappingBrick = {};

    if (bricks[row][col] instanceof Brick) {
      this.debug(`Found brick in current column and row`);
      overlappingBrick = bricks[row][col];
      // This brick will be directly overwritten but we still need to tell it to remove itself 
      //  in order to keep the types of bricks count accurate.
      overlappingBrick.deleteSelf(layer);
    } else if (this.orientation === 'portrait') {
      overlappingBrick = bricks[row][(col + 1)];
      this.debug(`Checking for brick in next row`);
      if (overlappingBrick instanceof Brick) { // If there is a brick in the next row
        this.debug(`Found brick in next row ${row + 1}:${col}`);
        overlappingBrick.deleteSelf(layer);
      }
      else { this.debug('No overlapping brick found') }
    } else if (this.orientation === 'landscape') {
      overlappingBrick = bricks[row][(col + 1)];
      this.debug(`Checking for brick in next column`);
      if (overlappingBrick instanceof Brick) {// If there is a brick in the next column
        this.debug(`Found brick in next column ${row}:${col + 1}`);
        overlappingBrick.deleteSelf(layer);
      }
      else { this.debug('No overlapping brick found') }
    }
  }

/**
 * Draw the brick on a specified context, scaled by a specified factor.
 * @param {Object} ctx - The 2D rendering context for the drawing surface of an HTML canvas.
 * @param {number} scale - The scale factor to apply to the drawing.
 */
  incrementBrickCount(brickType) {
    if (brickType === 'IFB') {
      num_IFBs++;
      layer_num_IFBs++;
    } else if (brickType === 'Medium') {
      num_mediums++;
      layer_num_mediums++;
    } else if (brickType === 'Super') {
      num_supers++;
      layer_num_supers++;
    } else { console.error(`***unknown brick type*** ${brickType}`) }
  }

  drawFromTop(canvasObject) {
    // While we are drawing we keep track of the count of types of bricks
    // to prevent double counting we only increment it if we are drawing from the top
    // and are drawing at a scale greater than 1 (i.e. we are not drawing a thumbnail)

    let x = this.x;
    let y = this.y;
    let width = this.unit_width;
    let length = this.unit_length;
    // this.debug(`drawFromTop: ${this.orientation} brick on layer ${this.layer} at ${x}:${y} with length width of ${length}:${width}`)
    // Draw the brick on the canvas
    canvasObject.drawRect(x, y, width, length, 'gray', this.color);

    // If we aren't drawing a thumbnail then we need to increment the brick count
    // TODO: Move this to a separate function
    // if (scale > 1) { this.incrementBrickCount(this.type) }

  }
  drawFromSide(ctx, scale) {
    scale = scale * verticalUnit;
    let x = this.x * scale;
    let y = (kiln.numOfLayers - this.layer) * scale;
    let width = this.unit_width * scale;
    let length = this.unit_height * scale;
    this.draw(ctx, x, y, width, length);
    this.debug(`drawFromSide: ${this.orientation} brick on layer ${this.layer} at ${x}:${y} with length width of ${length}:${width}} at scale ${scale}`)
  }

  draw(ctx, x, y, width, length) {
    // console.log(`Drawing: ${this.orientation} brick on layer ${this.layer} at ${x}:${y} with length width of ${length}:${width}}`)
    ctx.strokeStyle = 'gray';
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.rect(x, y, width, length);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

class Layers {
  constructor() {
    this.layers = [];
  }
  debug(message)
  {
    // console.debug(message)
  }

  createBaseLayer(oriented, brickType) {
    //let layer = this.initializeLayer();
    let myLayer = new Layer();
    for (let col = 0; col < kiln.units_long;) {
      for (let row = 0; row < kiln.units_wide;) {
        myLayer.bricks[col][row] = new Brick({ layer: kiln.numOfLayers, x: col, y: row, type: brickType, orientation: oriented });
        row += this.calculateRowIncrement(oriented);
      }
      col += this.calculateColumnIncrement(oriented);
    }
    this.addLayer(myLayer);
  }
   createLayerForWalls(layer_type) {
    'use strict';
    let layer = new Layer();
  
    console.log(`Creating layer ${kiln.numOfLayers} of type ${layer_type}`);
    this.debug('Creating right wall');
    walls.right_wall.create(layer.bricks, layer_type);
  
    this.debug('Creating left wall');
    walls.left_wall.create(layer.bricks, layer_type);
  
    this.debug('Creating front wall');
    walls.front_wall.create(layer.bricks, layer_type)
  
    this.debug('Creating throat wall');
    walls.throat.create(layer.bricks, layer_type)
    
    this.debug('Creating bag wall');
    walls.bag_wall.create(layer.bricks, layer_type)
  
    this.debug('Creating Back Wall');
    walls.back_wall.create(layer.bricks, layer_type)
  
    this.addLayer(layer)
  }

  addLayer(layer) {
    this.layers.push(layer);
    kiln.numOfLayers += 1;
  }

  initializeLayer() {
    return new Array(this.units_long).fill().map(() => new Array(this.units_wide).fill());
  }

  calculateRowIncrement(orientation) {
    return orientation === 'landscape' ? 1 : 2;
  }

  calculateColumnIncrement(orientation) {
    return orientation === 'landscape' ? 2 : 1;
  }

}

class Layer {
  constructor() {

    this.units_long = kiln.units_long;
    this.units_wide = kiln.units_wide;
    this.bricks = new Array(this.units_long).fill().map(() => new Array(this.units_wide).fill());
    this.layerNumber = kiln.numOfLayers;
  }

  debug(message)
  {
    myMessage = `Layer ${this.layerNumber} debug: ${message}`
    console.debug(myMessage)
  }

  logOverlappingBrick(col, row, new_brick) {
    this.debug(`Found overlapping brick at ${col}:${row} on layer ${this.layerNumber}`);
    this.debug(` -- Current Value is: ${JSON.stringify(this.layer[col][row])} and new value is: ${JSON.stringify(new_brick)}`);
  }

  deleteBrick(col, row) {
    this.debug(`Deleting brick at ${col}:${row} on layer ${this.layerNumber}`);
    if (this.bricks[col][row]) {
      this.bricks[col][row] = undefined;
    } else {
      console.error(`!!! No brick found at ${col}:${row} on layer ${this.layerNumber}`);
    }
  }
}

/**
 * Creates a new layer of bricks for the kiln and adds that new layer to the layers array. 
 * The new layer is initialized as a 2D array with dimensions based on the kiln's units_long and units_wide properties.
 * The create method of each wall tpe in the walls object is then called with the new layer and the specified layer_type as arguments.
 *
 * @function
 * @name createLayerForWalls
 * @param {string} layer_type - The type of layer to create. This argument is passed to the create method of each wall.
 * @global
 * @returns {void}
 */
function createLayerForWalls(layer_type) {
  'use strict';
  let layer = new Layer();

  console.log(`Creating layer ${kiln.numOfLayers} of type ${layer_type}`);
  console.debug('Creating right wall');
  walls.right_wall.create(layer.bricks, layer_type);

  console.debug('Creating left wall');
  walls.left_wall.create(layer.bricks, layer_type);

  console.debug('Creating front wall');
  walls.front_wall.create(layer.bricks, layer_type)

  console.debug('Creating throat wall');
  walls.throat.create(layer.bricks, layer_type)
  
  console.debug('Creating bag wall');
  walls.bag_wall.create(layer.bricks, layer_type)

  console.debug('Creating Back Wall');
  walls.back_wall.create(layer.bricks, layer_type)

  kiln.layers.addLayer(layer)
}



function drawBricksOnLayer(layer, canvasObject, scale) {
  for (let col = 0; col < layer.length; col++) {
    if (layer[col]) {
      for (let row = 0; row < layer[col].length; row++) {
        if (layer[col][row]) {
          const aBrick = layer[col][row];
          aBrick.drawFromTop(canvasObject)
        }
      };
    }
  };
}



function drawBirdseyeView(layers) {
  $.each(layers, function (currentLayer, layer) {
    layer_num_IFBs = layer_num_mediums = layer_num_supers = 0

    const canvasName = 'Layer' + currentLayer;

    let theCanvas = canvasContainer.createCanvas(canvasName, 'birds_eye_area', birdseye_scale, kiln.units_long, kiln.units_wide);
    drawBricksOnLayer(layer.bricks, theCanvas, birdseye_scale);

    if (currentLayer === 2) {
      let thumbnailCanvas = canvasContainer.createCanvas('birdseye_thumbnail', 'birdseye_thumbnail_area', 4, kiln.units_long, kiln.units_wide);
      drawBricksOnLayer(layer.bricks, thumbnailCanvas, 4);
      $('#birdseye_thumbnail_area').on('click', function () { $('#birdseye_tab_proxy').trigger('click') })
      //drawBricksOnLayer(layer, birdseye_thumbnail_ctx, 1);
    }

    console.debug(`Layer ${currentLayer} IFB: ${layer_num_IFBs} Super: ${layer_num_supers} Medium: ${layer_num_mediums}`)
  });
}

/**
 * Draws a side view of the kiln layers on two canvases: a scaled-up view and a thumbnail.
 * The function iterates through the layers and the bricks in each layer, and draws the visible bricks.
 * The bricks are drawn from the top down, starting with the last layer.
 *
 * @function
 * @name drawSideView
 * @param {Array} layers - An array of layer objects, each representing a layer of bricks in the kiln.
 * @param {number} scale - The scale factor to apply to the drawing. A scale of 1 would draw the kiln at 1 horizantalUnit   per pixel
 * @returns {void}
 */
function drawSideView(scale) {
  // Iterate through the layers and draw the visible bricks
  // For the side view we draw on 2 canvases one for the scaled up view and one for a thumbnail.
  // Although we could just copy a scaled back down version of the main view to a thumbnail
  // due to all the straight lines for the bricks it looks a lot better if we draw at the right scale

  const { side_view_canvas, side_view_ctx } = page.createCanvas('side_view', '', scale, kiln.length, kiln.height);

  // Thumbnail canvas
  const { side_thumbnail_canvas, side_thumbnail_ctx } =
    page.createCanvas('side_thumbnail', 'side_thumbnail_area', 1, kiln.length, kiln.height);

  $('#side_thumbnail_area').on('click', function () { $('#sideview_tab_proxy').trigger('click') })

  console.log('Drawing layers!')

  // Draw the bricks on the layer.
  // We draw the bricks from the top down so start with the last layer but because
  // layers are 0 indexed we need to start with 1 less than the length of the layers array
  // Note: not all of the visible bricks are in the same plane.
  for (let currentLayer = kiln.numOfLayers - 1; currentLayer > 0; currentLayer--) {
    const row_num_to_draw = kiln.numOfLayers - currentLayer
    console.log('Drawing layer: ' + currentLayer)
    const layer = kiln.layers.layers[currentLayer];
    for (let col = 0; col < layer.length; col++) {
      const outer_row = layer[col].length - 1
      console.debug('Drawing column: ' + col + ' row: ' + outer_row)
      let aBrick = {};
      if (layer[col][outer_row]) {
        // There is a brick in the outer row
        aBrick = layer[col][outer_row];
      } else if (col === 0) {
        if (layer[col][(outer_row - 1)]) {
          // We are in the first column and there is a brick in the row behind the outer row
          aBrick = layer[col][(outer_row - 1)];
        }
      } else if (layer[(col - 1)][outer_row]) {
        // There is a brick in the col next to this one so we don't need to do anything.
      } else if (layer[(col)][(outer_row - 1)]) {
        // We are in the chimney and there is a brick in the row one behind the outer row
        aBrick = layer[(col)][(outer_row - 1)];
      } else if (layer[(col)][(outer_row - 2)]) {
        // There is a brick in the row 2 behind the outer row because of interlacing
        aBrick = layer[(col)][(outer_row - 2)];
      } else {
        // This probably means that there is not supposed to be a brick here.
        // console.debug('There is no brick to be found.')
      }
      if (aBrick.type) {
        console.debug(`DrawSideView: ${aBrick.orientation} brick on layer ${currentLayer}:${aBrick.layer} at ${col}:${row_num_to_draw} with length width of ${aBrick.length}:${aBrick.width}}`)
        aBrick.drawFromSide(side_view_ctx, scale);
        aBrick.drawFromSide(side_thumbnail_ctx, 1);
      }
    }
  };
}






env = 'development';

function setDebugLevel(environment) {
  if (environment === 'production') {
    console.debug = function () { };
    console.info = function () { };
  } else if (environment === 'staging') {
    console.debug = function () { }
  }
  else if (environment === 'development') {
    console.log("Debug is enabled");
  } else {
    console.error('Unknown environment: ' + environment)
  }
}

/**
 * Class representing a container for multiple Canvas instances.
 */
class CanvasContainer {
  /**
   * Create a CanvasContainer.
   */
  constructor() {
    this.canvases = {};
  }

  /**
   * Create a Canvas and add it to the container.
   * @param {string} canvasName - The name of the canvas.
   * @param {string} parent_id - The ID of the area where the canvas will be appended.
   * @param {number} scale - The scale factor for the canvas.
   * @param {number} width - The width of the canvas.
   * @param {number} height - The height of the canvas.
   */
  createCanvas(canvasName, parent_id, scale, width, height) {
    let canvas = new Canvas(canvasName, parent_id, scale, width, height);
    this.canvases[canvasName] = canvas;
    return canvas;

  }
}

/**
 * Class representing a Canvas.
 */
class Canvas {
  /**
   * Create a canvas.
   * @param {string} canvasName - The name of the canvas.
   * @param {string} parent_id - The ID of the area where the canvas will be appended.
   * @param {number} scale - The scale factor for the canvas.
   * @param {number} width - The width of the canvas.
   * @param {number} height - The height of the canvas.
   */
  constructor(canvasName, parent_id, scale, width, height) {
    this.canvasName = canvasName + '_canvas';
    this.parent_id = parent_id;
    this.scale = scale;
    this.width = width;
    this.height = height;
    this.createCanvasElement()
  }
  
  debug(message)
  {
     let myMessage = "Canvas debug: " + message
    // console.debug(myMessage)
  }
  createCanvasElement() {
    this.debug('Creating canvas and ctx for: ' + this.canvasName + ' in ' + this.parent_id)
    $('<canvas>')
      .attr({ id: this.canvasName })
      .appendTo(`#${this.parent_id}`)
      .css('border', "solid 1px black");
    $('<span>&nbsp;</span>').appendTo(`#${this.parent_id}`);
    this.canvas = document.getElementById(this.canvasName);
    this.ctx = this.canvas.getContext('2d');
    this.canvas.height = this.height * this.scale;
    this.canvas.width = this.width * this.scale;
  }
  drawRect(x, y, width, length, strokeStyle, fillStyle) {
    // We don't scale the ctx because it will scale the stroke width as well as the position and size of the bricks
    // We scale the x, y, width, and length values instead
    x = x * this.scale;
    y = y * this.scale;
    width = width * this.scale;
    length = length * this.scale;
    //console.debug(`Drawing rect on Canvas ${this.canvasName} at ${x}:${y} with length width of ${length}:${width}}`)
    this.ctx.strokeStyle = strokeStyle;
    this.ctx.fillStyle = fillStyle;
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, length);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }
}
class Page {
  /**
   * Reads the values of various input fields from the page and stores them in the shelves object.
   * The function checks if the shelf size is custom or not and shows or hides the appropriate input fields.
   * The values read are: whether the shelves are rotated, the shelf size, the shelf width, the shelf length, 
   *    the number of shelves wide, and the number of shelves long.
   *
   * @function
   * @name readValues
   * @returns {void}
   */
  readValues() {
    const shelf_size = $('#shelf_sizes option:selected').val();
    console.info('Shelf size is: ' + shelf_size)
    this.handleShelfSizeUI(shelf_size);

    shelves.rotated = $('#shelves_rotated').is(':checked');
    shelves.width = parseInt($('#shelf_width').val());
    shelves.length = parseInt($('#shelf_length').val());
    shelves.num_wide = parseInt($('#shelves_wide').val());
    shelves.num_long = parseInt($('#shelves_long').val());
  }

  handleShelfSizeUI(shelf_size) {
    if (shelf_size !== 'Custom') {
      // If non-custom shelf size is selected then we need to 
      // hide the custom shelf size fields
      console.debug('Shelf size is not custom.');
      [shelves.length, shelves.width] = shelf_size.split('x');
      console.debug(`Shelf width is:${shelves.width} Shelf length is: ${shelves.length}`)
      $('#shelf_width').val(shelves.width)
      $('#shelf_length').val(shelves.length)
      $('.non-custom-shelf').show();
      $('.non-custom-shelf').children().show();
      $('.custom-shelf').hide();
      $('.custom-shelf').children().hide();
    } else {
      // If custom shelf size is selected then we need to  
      //  show the custom shelf size fields
      $('.non-custom-shelf').hide();
      $('.non-custom-shelf').children().hide();
      $('.custom-shelf').show();
      $('.custom-shelf').children().show();
    }
  }

  /**
   * Updates various elements on the page.
   *
   * @returns {void}
   */
  updateElements() {
    $('#firebox_length').html(firebox.depth);
    $('#firebox_width').html(chamber.width);
    $('#firebox_height').html(firebox.height);
    $('#firebox_square').html(firebox.square);
    $('#firebox_cubic').html(firebox.cubic);

    $('#chamber_length').html(chamber.length);
    $('#chamber_width').html(chamber.width);
    $('#chamber_height').html(chamber.height);
    $('#chamber_square').html(chamber.square);
    $('#chamber_cubic').html(chamber.cubic);

    $('#chimney_length').html(chimney.depth);
    $('#chimney_width').html(chamber.width);
    $('#chimney_height').html(chimney.height);
    $('#chimney_square').html(chamber.width * chimney.depth);
    $('#chimney_cubic').html(chimney.cubic);

    $('#kiln_length').html(kiln.length);
    $('#kiln_width').html(kiln.width);

    $('#num_supers').html(num_supers);
    $('#num_mediums').html(num_mediums);
    $('#num_IFBs').html(num_IFBs);
  }

  /**
   * Refreshes the page by recalculating the kiln dimensions and redrawing the kiln.
   * The function first clears the existing drawing areas and resets the brick counts.
   * It then reads the values from the page and calculates the dimensions of the kiln areas.
   * Finally, it creates the layers of the kiln and then draws them.
   *
   * @function
   * @name refreshPage
   * @returns {void}
   */
  refreshPage() {
    'use strict';
    console.info('Recalculating...');
    // Reset variables
    // kiln.layers = [];
    num_IFBs = num_mediums = num_supers = 0
    // Clear the drawing areas before we start
    $('#birds_eye_area').empty();
    $('#birdseye_thumbnail_area').empty();
    $('#side_view_area').empty();
    $('#side_thumbnail_area').empty();
    kiln.calculateDimensions()
    kiln.createLayers();
    kiln.draw();
  }

  /**
   * Initializes various elements on the page.
   *
   * @returns {void}
   */
  initializeControls() {
    $('.controlgroup').controlgroup();
    $('.controlgroup').controlgroup('option', 'onlyVisible', true);
    $('#shelf_sizes').on('selectmenuchange', page.refreshPage);
    $('#shelves_rotated').on('change', shelves.rotateDefaultSizes);
    $('#shelves_wide').on('spinstop', page.refreshPage);
    $('#shelves_long').on('spinstop', page.refreshPage);
    $('#shelf_width').on('spinstop', page.refreshPage);
    $('#shelf_length').on('spinstop', page.refreshPage);
    $('.custom-shelf').hide();
    $('.custom-shelf').children().hide();
    $('#tabs').tabs();
  }
  createCanvas(canvasName, parent_id, scale, width, height) {
    // Create a canvas and add it to the area that matches the canvasName_area unless an parent_id is specified
    // If an parent_id is specified then we will return the canvas and context as properties of the canvasName
    // otherwise we will return the canvas and context as properties as my_canvas and my_ctx
    if (parent_id === "") {
      parent_id = canvasName + '_area'
    }
    console.debug('Creating canvas and ctx for: ' + canvasName + ' in ' + parent_id)
    let fullCanvasName = canvasName + '_canvas';
    $('<canvas>').attr({ id: fullCanvasName }).appendTo(`#${parent_id}`).css('border', "solid 1px black");
    $('<span>&nbsp;</span>').appendTo(`#${parent_id}`);
    const my_canvas = document.getElementById(fullCanvasName);
    const my_ctx = my_canvas.getContext('2d');
    my_canvas.height = height * scale;
    my_canvas.width = width * scale;
    if (parent_id === canvasName + '_area') {
      console.debug(`CreateCanvas returning: ${canvasName}_canvas and ${canvasName}_ctx`)
      return { [`${canvasName}_canvas`]: my_canvas, [`${canvasName}_ctx`]: my_ctx };
    } else { // We assume that if an parent_id is specified then the area is using multiple canvases with generated variables
      //  for the canvas names so we return the canvas and context as properties with a generic known names which 
      //  the calling function can map to its own variables if it wants to
      console.debug(`CreateCanvas returning: my_canvas, my_ctx`)

      return { my_canvas, my_ctx };
    }
  }
}

function getScaledRect(x, y, width, length, scale) {
  let scaledValues = [
    x * scale,
    y * scale,
    length * scale,
    width * scale,
  ];
  return scaledValues;
}
function main() {
  setDebugLevel(env)
  // Initialize all the elements on the page
  shelves.populateDropdown();
  page.initializeControls()
  page.refreshPage();
}
const page = new Page();
let canvasContainer = new CanvasContainer();
let kiln = new Kiln();
let chamber = new Chamber();
let firebox = new Firebox();
let chimney = new Chimney();


main();