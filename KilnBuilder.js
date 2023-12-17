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
const standardBrick = { width: 4.5,length: 9, height: 2.5,}

// Units
const square_foot = 12 * 12;
const cubic_foot = square_foot * 12;
const horizantalUnit   = standardBrick.width

// Scale
const birdseye_scale = 4;
const sideview_scale = 10;

// Globals
let layers = [];
let num_IFBs, num_supers, num_mediums;
let layer_num_IFBs, layer_num_supers, layer_num_mediums;

// A physical kiln is made up of a series of walls.
// The firing chamber and the shelves in it are considered to be what the kiln is built around.
// For nomenclature purposes the front is the one that you would be looking at if the kiln were 
// the train viewed from the side from which the train kiln gets its name. 
// This diagram shows the layout of the kiln:
//                       Back Wall
//        +-------+ ---------------------- +----+
//        |       |T                       |  C  |
//        |       |h                      B|  h  |
//  Left  |  FB   |r       Chamber        a|  i  | Right
//  Wall  |       |o                      g|  m  | Wall
//        |       |a                       |  n  |
//        |       |t                       |  e  |
//        |       |t                       |  y  |
//        +-------+ ---------------------- +----+
//                     Front Wall
// See the wall object below for more details.

let wall = {
  // A wall is a grid of bricks that is oriented either perpendicular to the viewer's perspective (portrait) or parallel to it (landscape).
  // Walls are measured in horizantalUnit  s which are the 1/2 width of a standard brick (2.25" in imperial).
  // See the kiln diagram above for more details about the walls that make up the kiln.
  // Not countinng the base that the walls sit on there are 2 interior and 4 exterior walls which interlock with each other to form the kiln.
  // The 4 exterior walls are: the left wall, back wall, front wall, and right wall
  // The 2 interior walls are: the throat wall and bag wall
  // These walls form the working components of the kiln which are:
  //    firebox where the fuel is burned and the heat is generated.
  //    firing chamber where the pots are placed to be fired.
  //    chimney where the heat and smoke are vented from the kiln.
  // Conceptually the firebox and chimney have 4 sides whereas the firing chamber only has 2
  // The front and back walls are formed from the sides of the firebox, chamber and the chimney.
  // The front wall is the canonical wall and is always drawn first. It starts at the origin and is drawn left to right.
  // To simplify the code each wall is created as if we were viewing it from the side it is placed on (it's metaphorically the front while it is being drawn).
  // In other words we are moving around the kiln and building walls as we go.
  //    The front wall is built starting at the origin,
  //    The left wall is "built", and rotated 90 degrees,
  //    The back wall is "built", rotated 180 degrees and moved backwards.
  //    The right wall is "built", rotated 270 degrees and moved all the way the right.
  //    ... and so on.
  // We build the walls this way so that we can use the same code to build each wall and 
  //   not have to worry about whether the frontmost brick is on the interior or exterior.
  //   the frontmost brick will always be on the exterior (unless it is a fully internal wall such as the throat of bag wall).
  // Walls are built in layers of which there are 3 types: odd, even, and header.
  //   odd layers are the first layer of bricks in a wall and are always drawn in landscape orientation starting at the origin.
  //   even layers are the second layer of bricks in a wall and are always drawn in landscape orientation starting half a brick length in from the origin.
  //   header layers are created every 4th even layer and are drawn in portrait orientation starting at the origin.
  //          Odd                             Even                        Header
  // XXXXXXXXXXXXXXXXXXXXXXXX       OXXXXXXXXXXXXXXXXXXXXXXO      oooooooooooooooooooooooo   
  // OxxxxxxxxxxxxxxxxxxxxxxO       OoxxxxxxxxxxxxxxxxxxxxoO      oooooooooooooooooooooooo   
  // Oo                    oO       Oo                    oO      xx                    xx   
  // Oo                    oO       Oo                    oO      xx                    xx   
  // Oo                    oO       Oo                    oO      xx                    xx   
  // Oo                    oO       Oo                    oO      xx                    xx   
  // OxxxxxxxxxxxxxxxxxxxxxxO       OoxxxxxxxxxxxxxxxxxxxxoO      oooooooooooooooooooooooo   
  // XXXXXXXXXXXXXXXXXXXXXXXX       OXXXXXXXXXXXXXXXXXXXXXXO      oooooooooooooooooooooooo   

  x_origin: 0,
  y_origin: 0,
  length: 0,
  height: 0,
  thickness: standardBrick.length,
  isPerpendicular: false,
  isMirrored: false,
  isInterior: false,

  init(x_origin, y_origin, length, height, thickness, isPerpendicular, isMirrored, isInterior) {
    this.x_origin = x_origin;
    this.y_origin = y_origin;
    this.length = length;
    this.height = height;
    this.thickness = thickness;
    this.isPerpendicular = isPerpendicular;
    this.isMirrored = isMirrored;
    this.isInterior = isInterior;
    this.brick_courses = [];

    if (this.isInterior === true) {
      brick_courses = ["Super", "Super"]
    } else if (this.isInterior === false) {
      this.brick_courses = ["IFB", "Super"];
    } else {
      console.error('Does not compute. The wall is neither interior nor exterior.')
    }

    this.aWall = {
      orientation: 'cross-wise',
      units_long: this.length,
      x_offset: this.x_origin,
      y_offset: this.y_origin,
      brick_courses: [
        ['Medium', 'external'],
        ['Super', 'internal']
      ]
    };

  },

  create(layer, layer_type) {
    build(layer, layer_type)
  },

  build(layer, layer_type) {
    const layerNum = layers.length - 2
    let y_offset = 0;
    let x_offset = 0;



    if (layer_type === 'header') {
      y_offset -= 1;
    }

    if (layerNum < this.height) {
      walls.create(layer, layer_type, aWall)
    } else {
      // Don't need to do anything.
    }

    wall.depth = 3 * 4;
    wall.height = chamber.height * 1.75;
    wall.square = chamber.width * wall.depth;
    wall.layers = wall.height / standardBrick.height;
  }
};

let walls = {
  front_wall: {
    col: 0,
    depth: standardBrick.length,
    create(layer, layer_type) {
      const layerNum = layers.length - 2
      const aWall = {
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
      if (layerNum < firebox.layers) {
        walls.create(layer, layer_type, aWall)
      } else {
        // Don't need to do anything.
      }
    }
  },
  left_wall: {
    col: 0, // Where the wall starts on the left
    depth: standardBrick.length,
    create(layer, layer_type) {
      let myLayerType = layer_type;
      const layerNum = layers.length - 2
      const aWall = {
        orientation: 'length-wise',
        units_long: kiln.units_long,
        x_offset: 0,
        y_offset: 0,
        brick_courses: [
          ['IFB', 'external'],
          ['Super', 'internal']
        ]
      }

      if (myLayerType === 'header') {
        // Header rows only need one brick so we override that.
        // We also shorten the row and offset 
        // this is because the front and back rows go the whole width of the kiln
        aWall.brick_courses = [
          ['Super', 'external']
        ];
        aWall.x_offset = 2;
        aWall.units_long = kiln.units_long - 4;
      }

      if (layerNum < chamber.layers) {
        // Create a full length wall
        walls.create(layer, layer_type, aWall)
        console.debug('Creating left hand wall below chamber height.')
      } else if (layerNum < firebox.layers) {
        console.debug('Creating left hand wall below firebox height.');

        // Create along firebox
        if (myLayerType === 'header') {
          aWall.units_long = walls.throat.col
        } else {
          aWall.units_long = walls.throat.col + 2
        }
        walls.create(layer, myLayerType, aWall);

        // Create along chimney
        aWall.units_long = chimney.depth / horizantalUnit   + 3
        aWall.y_offset = 1;
        aWall.x_offset = kiln.units_long - aWall.units_long - 1
        aWall.brick_courses = [
          ['Medium', 'internal']
        ]

        if (myLayerType === 'header') {
          // The chimney does not have header rows above the chamber height because it is only 1 brick thick.
          myLayerType = 'even'
        }
        walls.create(layer, myLayerType, aWall)
      } else if (layerNum > firebox.layers) {
        // If we are above the height of the firebox then it is chimney only
        // there are no header rows there and it is only a single brick thick
        if (myLayerType === 'header') {
          myLayerType = 'even'
        }
        console.debug('Creating left hand wall above firebox height.');
        aWall.y_offset = 1;
        aWall.units_long = chimney.depth / horizantalUnit   + 3
        aWall.x_offset = kiln.units_long - aWall.units_long - 1
        aWall.brick_courses = [
          ['Medium', 'internal']
        ]
        walls.create(layer, myLayerType, aWall)
      } else {
        console.error('Something is broken in the left_wall function')
      }
    }
  },
  right_wall: {
    col: 0,
    depth: standardBrick.length,
    create(layer, layer_type) {
      let myLayerType = layer_type;
      const layerNum = layers.length - 2
      const aWall = {
        orientation: 'length-wise',
        units_long: kiln.units_long,
        x_offset: 0,
        y_offset: kiln.units_wide - 2,
        brick_courses: [
          ['Super', 'internal'],
          ['IFB', 'external']
        ]
      }

      if (myLayerType === 'header') {
        // Header rows only need one brick so we override that.
        // We also shorten the row and offset it because
        // the front and back rows go the whole width of the kiln
        aWall.brick_courses = [
          ['Super', 'external']
        ];
        aWall.x_offset = 2;
        aWall.units_long = kiln.units_long - 4;
      }

      if (layerNum < chamber.layers) {
        // Create a full length wall
        walls.create(layer, myLayerType, aWall)
        console.debug('Creating right hand wall below chamber height.');
      } else if (layerNum < firebox.layers) {
        console.debug('Creating right hand wall below firebox height.');

        // Create along firebox
        if (myLayerType === 'header') {
          aWall.units_long = walls.throat.col
        } else {
          aWall.units_long = walls.throat.col + 2
        }
        walls.create(layer, myLayerType, aWall);

        // Create along chimney
        aWall.units_long = chimney.depth / horizantalUnit   + 3
        aWall.x_offset = kiln.units_long - aWall.units_long - 1
        aWall.brick_courses = [
          ['Medium', 'internal']
        ]
        if (myLayerType === 'header') {
          // The chimney does not have header rows above the chamber height because it is only 1 brick thick.
          myLayerType = 'even'
        }
        walls.create(layer, myLayerType, aWall)
      } else if (layerNum > firebox.layers) {
        // If we are above the height of the firebox then it is chimney only
        // there are no header rows there and it is only a single brick thick
        if (myLayerType === 'header') {
          myLayerType = 'even'
        }
        console.debug('Creating right hand wall above firebox height.');

        aWall.units_long = chimney.depth / horizantalUnit   + 3
        aWall.x_offset = kiln.units_long - aWall.units_long - 1
        aWall.brick_courses = [
          ['Medium', 'internal']
        ]
        walls.create(layer, myLayerType, aWall)
      }
    }
  },
  throat: {
    col: 0,
    depth: standardBrick.length,
    create(layer, layer_type) {
      const layerNum = layers.length - 2

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
      if (layerNum >= firebox.layers) {
        // Throat does not need to be drawn above the firebox height so we can return immediately
        return
      } else if (layer_type === 'header') {
        // The interlacing is different above the chamber though so we need to adjust where things go.
        if (layerNum < chamber.layers) {
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
      } else if (layerNum < chamber.layers) {
        // Not a header and below the chamber height
        aWall.brick_courses = [
          ['Super', 'internal'],
          ['Super', 'internal']
        ];
      } else if (layerNum < firebox.layers) {
        // Not a header and above the chamber height
        aWall.brick_courses = [
          ['Super', 'internal'],
          ['IFB', 'external']
        ];
      } else {
        console.error(`Somehow we ended up with a brick in an unexpected place at Layer=${layerNum} Layer Type=${layer_type}`);
      }
      walls.create(layer, layer_type, aWall);
    }
  },
  bag_wall: {
    col: 0,
    depth: standardBrick.length,
    create(layer, layer_type) {
      let myLayerType = layer_type;
      const layerNum = layers.length - 2

      // eslint-disable-next-line prefer-const
      let aWall = {
        orientation: 'cross-wise',
        units_long: kiln.units_wide,
        x_offset: walls.bag_wall.col,
        y_offset: 0
      };
      // TODO: Clean this up to be more self-explanatory
      if (layerNum >= chamber.layers) {
        // When above the chamber we need to only draw a sigle walled chimney
        aWall.x_offset += 1;
        aWall.brick_courses = [
          ['Medium', 'internal']
        ];
        if (myLayerType === 'header') {
          // If we are singled walled headers are not possible so we treat it at as an even row
          myLayerType = 'even'
        }
      } else if (myLayerType === 'header') {
        // Below the height of the chamber we treat header rows normally
        aWall.brick_courses = [
          ['Super', 'internal']
        ];
        aWall.units_long = kiln.units_wide - 3;
      } else if (layerNum < chamber.layers) {
        // Below the height of the chamber we treat this a two brick thick internal wall
        aWall.brick_courses = [
          ['Super', 'internal'],
          ['Super', 'internal']
        ];
      } else {
        // Can't get here because the layerNum has to be either one of <,=,>
      }
      walls.create(layer, myLayerType, aWall)
    },
    throat: {
      col: 0,
      depth: standardBrick.length,
      create(layer, layer_type) {
        const layerNum = layers.length - 2

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
        if (layerNum >= firebox.layers) {
          // Throat does not need to be drawn above the firebox height so we can return immediately
          return
        } else if (layer_type === 'header') {
          // The interlacing is different above the chamber though so we need to adjust where things go.
          if (layerNum < chamber.layers) {
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
        } else if (layerNum < chamber.layers) {
          // Not a header and below the chamber height
          aWall.brick_courses = [
            ['Super', 'internal'],
            ['Super', 'internal']
          ];
        } else if (layerNum < firebox.layers) {
          // Not a header and above the chamber height
          aWall.brick_courses = [
            ['Super', 'internal'],
            ['IFB', 'external']
          ];
        } else {
          console.error(`Somehow we ended up with a brick in an unexpected place at Layer=${layerNum} Layer Type=${layer_type}`);
        }
        walls.create(layer, layer_type, aWall);
      }
    }
  },
  back_wall: {
    col: 0,
    depth: standardBrick.length,
    create(layer, layer_type) {
      let myLayerType = layer_type;
      const layerNum = layers.length - 2

      // eslint-disable-next-line prefer-const
      let aWall = {
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
      if (layerNum >= chamber.layers) {
        // When above the chamber we need to only draw a sigle walled chimney
        aWall.brick_courses = [
          ['Medium', 'internal']
        ];
        if (myLayerType === 'header') {
          // If we are singled walled headers are not possible so we treat it at as an even row
          myLayerType = 'even'
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
      walls.create(layer, myLayerType, aWall)
    }
  },
  create(layer, layer_type, wall) {
    const width = wall.brick_courses.length
    const length = wall.units_long
    let x_offset = wall.x_offset;
    let y_offset = wall.y_offset;
    let additional_offset = 0;
    console.debug(`walls.create --- layer_type:${layer_type} length:${wall.units_long} offsets:${wall.y_offset}/${wall.x_offset} additional_offset: ${additional_offset}`)

    if (wall.orientation === 'length-wise') {
      let columns_to_draw = length / 2
      const rows_to_draw = width;
      let brick_orientation = 'landscape';
      if (layer_type === 'odd') {
        x_offset += 1;
        columns_to_draw -= 1
      }

      for (let row = 0; row < rows_to_draw; row++) {
        const course_type = wall.brick_courses[row][1];
        if (course_type === 'internal') {
          additional_offset = 1;
        } else {
          additional_offset = 0;
        }

        for (let col = 0; col < columns_to_draw - additional_offset; col += 1) {
          const real_row = row + y_offset
          let real_column = (col * 2) + x_offset + additional_offset;
          if (layer_type === 'header') {
            columns_to_draw = wall.units_long
            brick_orientation = 'portrait'
            real_column = col + x_offset + additional_offset;
          }
          console.debug(`Creating brick in column: ${col}:${row} (really ${real_column}:${real_row}) out of ${columns_to_draw} in walls.create-length-wise.`);
          const new_brick = { type: wall.brick_courses[row][0], orientation: brick_orientation };
          insertBrick(layer, real_column, real_row, new_brick)
        }
      }
    } else if (wall.orientation === 'cross-wise') {
      let rows_to_draw = length / 2;
      const columns_to_draw = width
      let brick_orientation = 'portrait';

      if (layer_type === 'even') {
        y_offset += 1;
        rows_to_draw -= 1
      } else if (layer_type === 'header') {
        y_offset += 1;
        rows_to_draw -= 1
      }
      for (let col = 0; col < columns_to_draw; col++) {
        const course_type = wall.brick_courses[col][1];
        if (course_type === 'internal') {
          additional_offset = 1;
        } else {
          additional_offset = 0;
        }
        for (let row = 0; row < rows_to_draw - additional_offset; row += 1) {
          let real_row = (row * 2) + y_offset + additional_offset
          const real_column = col + x_offset;
          if (layer_type === 'header') {
            rows_to_draw = wall.units_long
            brick_orientation = 'landscape'
            real_row = row + y_offset + additional_offset;
          }
          const new_brick = { type: wall.brick_courses[col][0], orientation: brick_orientation };
          // console.debug(`Inserting brick in a row: ${col}:${row} (really ${real_column}:${real_row}) out of ${rows_to_draw} in walls.create-width.`);
          insertBrick(layer, real_column, real_row, new_brick)
        }
      }
    }
  }
};

class Kiln {
  constructor() {
    this.length = 0;
    this.width = 0;
    this.firing_time = 32; // in hours
    this.share = 4; // in cubic feet
  }

  calculate() {
    this.length =
      walls.front_wall.depth +
      firebox.depth +
      walls.throat.depth +
      chamber.length +
      walls.bag_wall.depth +
      chimney.depth +
      walls.back_wall.depth;
    this.units_long = this.length / horizantalUnit  ;

    this.width = chamber.width + (4 * horizantalUnit  )
    this.units_wide = this.width / horizantalUnit  ;

    walls.throat.col = (walls.front_wall.depth + firebox.depth) /horizantalUnit  ;
    chamber.offset = ((walls.throat.col / 2 + 1) * standardBrick.length);

    walls.bag_wall.col = walls.throat.col + (chamber.length / horizantalUnit  ) + 2;
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
    // Old global variable will be moved to a local variable
    layers = [];

    this.layers = new Layers(this.units_long, this.units_wide);
    this.layers.createBaseLayer('landscape', 'IFB');
    this.layers.createBaseLayer('portrait', 'Super');

    createBaseLayer('landscape', 'IFB');
    createBaseLayer('portrait', 'Super');
    for (let index = 0; index < chimney.layers; index++) {
      if ((index + 2) % 6 === 0) {
        createLayer('header');
      } else if (index % 2 === 0) {
        createLayer('even');
      } else {
        createLayer('odd');
      }
    }
    kiln.height = layers.length * standardBrick.height;
  }

  draw() {
    drawSideView(layers, sideview_scale);
    drawBirdseyeView(layers);
    shelves.draw();
    page.updateElements();
  }
}

// eslint-disable-next-line prefer-const
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
  shelf_sizes: [[8,16],[11,22],[11,23],[12,12],[12,24],[13,14],[13,26],[14,28],[16,16],[19,25],[20,20],[24,24]],

  rotateDefaultSizes() {
    // Rotate the shelf sizes so that the longest dimension is the width (or revert to the original if it is already that way)
    // also update the dropdown to reflect the change
    console.debug('rotateDefaultSizes started');
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
    console.debug('rotateDefaultSizes finished');
  },

  populateDropdown() {
    // populate the dropdown with the shelf sizes
    // but first clear out the dropdown in case it has been populated before
    $('#shelf_sizes').children().remove();

    $.each(shelves.shelf_sizes, function (size) {
      let shelf_description = shelves.shelf_sizes[size][0] + 'x' + shelves.shelf_sizes[size][1];
      console.debug('Populating dropdown with shelf_description: ' + shelf_description);
      $('#shelf_sizes').append($('<option>', {
        value: shelf_description,
        text: shelf_description
      }));
    })
    // add the Custom option
    $('#shelf_sizes').append($('<option>', {value: "Custom",text: "Custom"}));
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
    // Center shelves in chamber
    this.updateShelvesOffset();
    // Canvas for main view
    const KilnFloor_canvas = document.getElementById('Layer2_canvas');
    const KilnFloor_ctx = KilnFloor_canvas.getContext('2d');

    // Canvas for thumbnail
    const birdseye_thumbnail_canvas = document.getElementById('birdseye_thumbnail_canvas');
    const birdseye_thumbnail_ctx = birdseye_thumbnail_canvas.getContext('2d');

    // Iterate throught the shelves and draw them
    $.each(shelves.instances, function (i) {
      let myShelf = shelves.instances[i];
      myShelf.draw(KilnFloor_ctx,birdseye_scale);
      myShelf.draw(birdseye_thumbnail_ctx,1);
    });
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
    console.debug(`Shelves bounding box is: ${JSON.stringify(myBox)}`);
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
      //    rotated: false,
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
    console.debug('Shelves total width is: ' + shelves.total_width)
    console.debug('Shelves total length is: ' + shelves.total_length)
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
    let scaledValues = [
      (shelves.x_offset + this.x_offset) * scaleFactor,
      (shelves.y_offset + this.y_offset) * scaleFactor, 
       // FIXME: This is a hack to get around the fact that I got the width and length backwards
      this.length * scaleFactor,
      this.width * scaleFactor,
    ];
    console.debug(`Scaled values are: ${JSON.stringify(scaledValues)}` )
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

  calculate() {
    // We need to fit the shelves in the chamber and make sure that
    // the total size is rounded up the nearest whole brick.
    const estimated_length = this.deadspace_front + shelves.total_length + this.deadspace_back;
    let units_long = Math.ceil(estimated_length / horizantalUnit  );
    if (units_long % 2 !== 0) { units_long += 1 }
    this.length = units_long * horizantalUnit  ;

    // Any extra space should be added to the front deadspace
    // TODO: Make the deadspace a modifiable variable 
    this.deadspace_front = 9 + this.length - estimated_length;
    let units_wide = Math.ceil((shelves.total_width + (this.deadspace_sides * 2)) / horizantalUnit  );
    if (units_wide % 2 !== 0) { units_wide += 1 }

    console.debug(`Rows and columns in chamber: ${units_long}x${units_wide}`)

    this.width = units_wide * horizantalUnit  ;
    // TODO: Make the chanmber height something that can be varied
    this.height = this.width;
    this.square = this.width * this.length;
    this.cubic = Math.round(this.square * this.height / cubic_foot * 10) / 10;
    this.layers = this.height / standardBrick.height;
    console.debug(`Chamber length: ${this.length} and length of shelves: ${shelves.total_length}`)  }
}
class Firebox extends KilnSection {
  calculate() {
    firebox.depth = 3 * standardBrick.length;
    firebox.height = chamber.height * 1.75;
    firebox.square = chamber.width * firebox.depth;
    firebox.cubic = Math.round(firebox.square * firebox.height / cubic_foot * 10) / 10;
    firebox.layers = firebox.height / standardBrick.height;  }
}
class Chimney extends KilnSection {
  calculate() {
    chimney.depth = 2 * standardBrick.length;
    chimney.height = chamber.height * 3;
    chimney.square = chamber.width * chimney.depth;
    chimney.cubic = (chimney.square * chimney.height / cubic_foot).toFixed(1);
    chimney.layers = chimney.height / standardBrick.height;
    chimney.ratio = chimney.square / firebox.square
    console.info(`Optimal chimney size would be ${firebox.square / 10}-${firebox.square / 7}`)
    console.info(`Chimney ratio is ${chimney.ratio}`)  }
}


/**
 * Class representing a brick.
 */
class Brick {
  /**
   * Create a brick.
   * @param {number} x - The x coordinate of the brick.
   * @param {number} y - The y coordinate of the brick.
   * @param {string} type - The type of the brick.
   * @param {string} orientation - The orientation of the brick.
   */
  constructor({ 
    layer = 0, 
    x = 0, 
    y = 0, 
    width = standardBrick.width,
    length = standardBrick.length, 
    height = standardBrick.height, 
    type='Super', 
    orientation='landscape'
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
    this.types =  {
      // Conductivity is "Thermal Conductivity 750°C (W/m.°K)"
      IFB:    { color: 'WhiteSmoke', initial: 'I', cost: 2.5, conductivity: 0.3 },
      Super:  { color: 'FireBrick',  initial: 'S', cost: 1.5, conductivity: 1 },
      Medium: { color: 'Bisque',     initial: 'M', cost: 1,   conductivity: 1.1 }
    }
    this.color = this.types[this.type].color;
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

  drawFromTop(ctx, scale) {
    // While we are drawing we keep track of the count of types of bricks
    // to prevent double counting we only increment it if we are drawing from the top
    // and are drawing at a scale greater than 1 (i.e. we are not drawing a thumbnail)
    let x = this.x * horizantalUnit   * scale;
    let y = this.y * horizantalUnit   * scale;
    let width = this.width * scale;
    let length = this.length * scale;

    // Draw the brick
    this.draw(ctx, x, y, width, length);

    // If we aren't drawing a thumbnail then we need to increment the brick count
    if (scale > 1) {this.incrementBrickCount(this.type)}

  }
drawFromSide(ctx, scale) {
  let x = this.x * horizantalUnit   * scale;
  let y = this.y * horizantalUnit   * scale * (standardBrick.height / horizantalUnit  );
  this.draw(ctx, x, y, this.width, this.height);
}

  draw(ctx, x, y, width, length) {

    console.log(`Drawing ${this.orientation} brick at ${x}:${y} ${length}:${width}}`)
    ctx.strokeStyle = 'gray';
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.rect(x, y, width, length);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}


/**
 * Creates the bottom solid layers with bricks either in portrait or landscape orientation.
 * The function iterates through the kiln's units and fills them with bricks of the specified type and orientation.
 * The bricks are placed in the layer a column at a time.
 *
 * @function
 * @name createBaseLayer
 * @param {string} oriented - The orientation of the bricks. This should be 'landscape' or 'portrait'.
 * @param {string} brickType - The type of brick to place in the layer.
 * @returns {void}
 */
function createBaseLayer(oriented, brickType) {
  // This creates the bottom solid layers with bricks either in portrait or landscape orientation
  'use strict';
  // Create a new layer the size of the kiln width and length
  let layer = new Array(kiln.units_long).fill().map(() => new Array(kiln.wide).fill());

  for (let col = 0; col < kiln.units_long;) {
    // We create the layers a column at a time
    for (let row = 0; row < kiln.units_wide;) {
      layer[col][row] = { type: brickType, orientation: oriented };
      // Depending upon the orientation we either have to move one or 2 units in the rows
      if (oriented === 'landscape') {
        row += 1;
      } else if (oriented === 'portrait') {
        row += 2;
      } else {
        console.error('createBaseLayer was called with an unknown orientation.')
      }
    }
    // Depending upon the orientation we either have to move one or 2 units
    // This will always be the inverse of waht we did for the row 
    if (oriented === 'landscape') {
      col += 2;
    } else if (oriented === 'portrait') {
      col += 1;
    } else {
      console.error('createBaseLayer was called with an unknown orientation.')
    }
  }
  layers.push(layer)
}


class Layers {

  constructor(units_long, units_wide) {
    this.units_long = units_long;
    this.units_wide = units_wide;
    this.layers = [];
  }

  createBaseLayer(oriented, brickType) {
    let layer = this.initializeLayer();

    for (let col = 0; col < this.units_long;) {
      for (let row = 0; row < this.units_wide;) {
       //const myBrick = new Brick(col, row_num_to_draw, aBrick.type, aBrick.orientation);

        layer[col][row] = { type: brickType, orientation: oriented };
        row += this.calculateRowIncrement(oriented);
      }
      col += this.calculateColumnIncrement(oriented);
    }

    this.layers.push(layer);
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

/**
 * Inserts a brick into a specified location in a layer of the kiln. If a brick already exists at the location, it is overwritten.
 * If the new brick's orientation is 'portrait' and there is a brick in the next row, or if the new brick's orientation is 'landscape' and there is a brick in the next column, the adjacent brick is removed.
 *
 * @function
 * @name insertBrick
 * @param {Array} layer - The 2D array representing the layer of the kiln where the brick will be inserted.
 * @param {number} col - The column index where the brick will be inserted.
 * @param {number} row - The row index where the brick will be inserted.
 * @param {Object} new_brick - The brick object to be inserted. This object should have an 'orientation' property that is either 'portrait' or 'landscape'.
 * @returns {void}
 */
function insertBrick(layer, col, row, new_brick) {
  // Check if we are overwriting an existing brick
  // Note: this is normal on crosswise walls on layers where they interlace with the side walls.
  if (layer[col][row]) {
    // This brick will be overwritten so we don't need to remove it.
    logOverlappingBrick(layer, col, row, new_brick)
  }
  // Check to see if the brick next to the brick we will be creating needs to be removed.
  if (new_brick.orientation === 'portrait') {
    if (layer[col][(row + 1)]) { // If there is a brick in the next row
      logOverlappingBrick(layer, col, row, new_brick)
      layer[col][(row + 1)] = undefined; // Remove the old brick
    }
  } else if (new_brick.orientation === 'landscape') {
    if (layer[(col + 1)][(row)]) {// If there is a brick in the next column
      logOverlappingBrick(layer, col, row, new_brick)
      layer[(col + 1)][(row)] = undefined; // Remove the old brick
    }
  }
  layer[col][row] = new_brick; // replace or insert the new brick into the layer
}

function logOverlappingBrick(layer, col, row, new_brick) {
  const layerNum = layers.length + 1 // convert to 1 based index for display
  console.debug(`Found overlapping brick at ${col}:${row} on layer ${layerNum}.`);
  console.debug(` -- Current Value is: ${JSON.stringify(layer[col][row])} and new value is: ${JSON.stringify(new_brick)}`);
}

/**
 * Creates a new layer of bricks for the kiln and adds that new layer to the layers array. 
 * The new layer is initialized as a 2D array with dimensions based on the kiln's units_long and units_wide properties.
 * The create method of each wall tpe in the walls object is then called with the new layer and the specified layer_type as arguments.
 *
 * @function
 * @name createLayer
 * @param {string} layer_type - The type of layer to create. This argument is passed to the create method of each wall.
 * @global
 * @returns {void}
 */
function createLayer(layer_type) {
  'use strict';
  // eslint-disable-next-line prefer-const
  let layer = new Array(kiln.units_long).fill().map(() => new Array(kiln.units_wide).fill());
  // const layerNum = layers.length - 2

  console.debug('Creating right wall');
  walls.right_wall.create(layer, layer_type);

  console.debug('Creating left wall');
  walls.left_wall.create(layer, layer_type);

  console.debug('Creating front wall');
  walls.front_wall.create(layer, layer_type)

  console.debug('Creating throat wall');
  walls.throat.create(layer, layer_type)

  console.debug('Creating Back Wall');
  walls.back_wall.create(layer, layer_type)

  console.debug('Creating bag wall');
  walls.bag_wall.create(layer, layer_type)

  layers.push(layer)
}



function drawBricksOnLayer(layer, ctx, scale) {
  for (let col = 0; col < layer.length; col++) {
    if (layer[col]) {
      for (let row = 0; row < layer[col].length; row++) {
        if (layer[col][row]) {
          const aBrick = layer[col][row];
          const myBrick = new  Brick({ x: col, y: row, type: aBrick.type, orientation: aBrick.orientation});
          myBrick.drawFromTop(ctx, scale)
        }
      };
    }
  };
}

function drawBirdseyeView(layers) {
  $.each(layers, function (layerNum, layer) {
    layer_num_IFBs = layer_num_mediums = layer_num_supers = 0

    const canvasName = 'Layer' + layerNum;
    const { my_canvas, my_ctx } = page.createCanvas(canvasName, 'birds_eye_area', birdseye_scale, kiln.length, kiln.width);


    if (layerNum === 2) {
      const { birdseye_thumbnail, birdseye_thumbnail_ctx } = page.createCanvas('birdseye_thumbnail', "", 1, kiln.length, kiln.width);
      $('#birdseye_thumbnail_area').on('click', function () { $('#birdseye_tab_proxy').trigger('click') })
      drawBricksOnLayer(layer, birdseye_thumbnail_ctx, 1);
    }

    drawBricksOnLayer(layer, my_ctx, birdseye_scale);

    console.debug(`Layer ${layerNum} IFB: ${layer_num_IFBs} Super: ${layer_num_supers} Medium: ${layer_num_mediums}`)
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
function drawSideView(layers, scale) {
  // Iterate through the layers and draw the visible bricks
  // For the side view we draw on 2 canvases one for the scaled up view and one for a thumbnail.
  // Although we could just copy a scaled back down version of the main view to a thumbnail
  // due to all the straight lines for the bricks it looks a lot better if we draw at the right scale

  const  { side_view_canvas, side_view_ctx } = page.createCanvas('side_view', '', scale, kiln.length, kiln.height);

  // Thumbnail canvas
  const  { side_thumbnail_canvas, side_thumbnail_ctx } = 
    page.createCanvas('side_thumbnail', 'side_thumbnail_area', 1, kiln.length, kiln.height);

  $('#side_thumbnail_area').on('click', function () { $('#sideview_tab_proxy').trigger('click') })

  console.log('Drawing layers!')

  // Draw the bricks on the layer.
  // We draw the bricks from the top down so start with the last layer but because
  // layers are 0 indexed we need to start with 1 less than the length of the layers array
  // Note: not all of the visible bricks are in the same plane.
  for (let layerNum = layers.length - 1; layerNum > 0; layerNum--) {
    const row_num_to_draw = layers.length - layerNum
    console.debug('Drawing layer: ' + layerNum)
    const layer = layers[layerNum];
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
        const myBrick = new  Brick({ x: col, y: row_num_to_draw, type: aBrick.type, orientation: aBrick.orientation});

        myBrick.drawFromSide(side_view_ctx, scale); 
        myBrick.drawFromSide(side_thumbnail_ctx, 1);
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
    $('#num_IFBs').html(num_IFBs);  }

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
    layers = [];
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
  createCanvas(canvasName, areaId, scale, width, height) {
    // Create a canvas and add it to the area that matches the canvasName_area unless an areaId is specified
    // If an areaId is specified then we will return the canvas and context as properties of the canvasName
    // otherwise we will return the canvas and context as properties as my_canvas and my_ctx
    if (areaId === "") {
      areaId = canvasName + '_area'
    }
    console.debug('Creating canvas and ctx for: ' + canvasName +' in ' + areaId)
    let fullCanvasName = canvasName + '_canvas';
    $('<canvas>').attr({ id: fullCanvasName }).appendTo(`#${areaId}`);
    $('<span>&nbsp;</span>').appendTo(`#${areaId}`);
    const my_canvas = document.getElementById(fullCanvasName);
    const my_ctx = my_canvas.getContext('2d');
    my_canvas.height = height * scale;
    my_canvas.width = width * scale;
    if (areaId === canvasName + '_area') {
      console.debug(`CreateCanvas returning: ${canvasName}_canvas and ${canvasName}_ctx`)
      return { [`${canvasName}_canvas`]: my_canvas, [`${canvasName}_ctx`]: my_ctx };
    }else 
    { // We assume that if an areaId is specified then the area is using multiple canvases with generated variables
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
let kiln = new Kiln();
let chamber = new Chamber();
let firebox = new Firebox();
let chimney = new Chimney();


main();