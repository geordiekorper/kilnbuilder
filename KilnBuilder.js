/* eslint-disable eol-last */
/* eslint-disable space-before-function-paren */
/* eslint-disable semi */
/* eslint-disable camelcase */

/*
TODO:
  Compute ratios
  Separate out the calculations from the drawing
  Add JSON export of kiln configuration
  Allow removing bricks by clicking on them
  Add flemish header layer capability
  Make firebox and chimney calculations real
  Make height multiple of width
  Add amount of wood calculation
  Add cost calculations
  Add explanation text from spreadsheet
  Add usable/stackable cubic feet calculation
  Add number of bricks per layer
  Add Firing time stuff
  Add share stuff
  Make bag wall into real bag wall.
  Make throat into real throat
  seperate out shelf building stuff from calculation? Maybe allow manual entering based on number of bricks or inches
  Fix rotation offset bug in shelf drawing
  */

/*
TODO: Integrate this

Calculator is designed to calculate an approximate minimum number of bricks you should have on hand
Half bricks are ALWAYS rounded up to 1 when counted even if there are two in a row! (see above)
There is no accounting for openings for doors, peeps, etc.. (see above). With a very few exceptions these holes will still be filled with bricks at least sometimes.
The roof is not inclued in the calculation of number of bricks at this time. Depending upon the size you can either do an arch or a flat removable top.

Simplicity of construction is one of the main goals but durability, safety, and/or cost may nudge things towards a different form of simplicity.

Size of the kiln is based upon the size of the shelves and how many shelves you want to fit
Shelves will need a minimum of 1 inch of extra space on each side

Interior walls are High/Super duty hard fire bricks (H) because they will be exposed to flames and ash
Exterior bricks are soft Insulating fire bricks (I) unless there will be another brick sliding against them (around peepholes and air inlets)
Exterior bricks which will experience wear should be Medium duty (M) bricks at a minimum

The floor is 3 layers:
Layer 0 - Cinder block is used to provide a flat semi-insulating platform for the bricks
Layer 1 - Insulating Fire Brick (IFB) to keep heat from escaping from the bottom
Layer 2 - High/Super duty hard fire bricks for the floor because it will be exposed to heat and ash

The 9 Principles of Design from Kiln Building by Olsen will be followed as much as possible
Principle 1 - A cube [cross-section] is the best all-purpose shape for a kiln
Principle 2 - The chamber shape is determined by heat direction and ease of flame movement to allow a natural flow
Principle 3 - A specific amount of grate area or combustion area is needed for natural draft
Principle 4 - The taper of the chimney controls the rate of draft
Principle 5 - for natural draft killns there should be 3 feet of chimney to every foot of downward pull, plus 1 foot for every 3 feet of horizantal.
Principle 6 - Chimney diameter is approximately 1/4 to 1/5 of chamber (for rectangular kilns such as a train this would be the diagonal)
Principle 7 - A tall chimney increases velocity inside the firing chamber.
Principle 8 - The height of the chimney of a chamber kiln should be equal to the slope of the kiln (N/A)
Principle 9 - Critical areas of the kiln should be planned and built to be altered easily

The number of shelves and their size determine how big a chamber you will have and the chamber size will determine the size of the firebox and chimney. 
Only the highlighted values need to be changed to determine everything else!

The Width and Height will be the same as per Olsen's principle 1
The chamber size will be rounded up to the closest 9" in order to minimize the number of bricks which must be cut.
* Revenue here can be thought of as how much would it cost if you used someone else's kiln 
  or how much you could make by offering such a a service.
Wood
Type    Cords  $ per cord
Pine    3      $200.00
*/

let env = 'dev';

// Constants

// There are two things that influence the size of a kiln the bricks and the shelves
const standardBrick = {
  width: 4.5,
  length: 9,
  height: 2.5,
  types: {
    // Conductivity is "Thermal Conductivity 750°C (W/m.°K)"
    IFB: { color: 'WhiteSmoke', initial: 'I', cost: 2.5, conductivity: 0.3 },
    Super: { color: 'FireBrick', initial: 'S', cost: 1.5, conductivity: 1 },
    Medium: { color: 'Bisque', initial: 'M', cost: 1, conductivity: 1.1 }
  }
}

// Units
const square_foot = 12 * 12;
const cubic_foot = square_foot * 12;
const unit = standardBrick.width

// Scale
const birdseye_scale = 4;
const sideview_scale = 5;

// Globals
let layers = [];
let num_IFBs, num_supers, num_mediums;
let layer_num_IFBs, layer_num_supers, layer_num_mediums;
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
        aWall.units_long = chimney.depth / unit + 3
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
        aWall.units_long = chimney.depth / unit + 3
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
        aWall.units_long = chimney.depth / unit + 3
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

        aWall.units_long = chimney.depth / unit + 3
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

// eslint-disable-next-line prefer-const
let kiln = {
  // A kiln is made up of a firebox a chamber and a chimney.
  // At the moment the kiln object just has measurements kept in it.
  length: 0,
  width: 0,
  firing_time: 32, // in hours
  share: 4, // in cubic feet
  calculate() {
    kiln.length =
      walls.front_wall.depth +
      firebox.depth +
      walls.throat.depth +
      chamber.length +
      walls.bag_wall.depth +
      chimney.depth +
      walls.back_wall.depth;
    kiln.units_long = kiln.length / unit;

    kiln.width = chamber.width + (4 * unit)
    kiln.units_wide = kiln.width / unit;

    walls.throat.col = (walls.front_wall.depth + firebox.depth) / unit;
    chamber.offset = ((walls.throat.col / 2 + 1) * standardBrick.length);

    walls.bag_wall.col = walls.throat.col + (chamber.length / unit) + 2;
    chimney.offset = ((walls.bag_wall.col / 2 + 1) * standardBrick.length);
  }
};

// eslint-disable-next-line prefer-const
let shelves = {
  shelfList: [],
  num_wide: 0,
  num_long: 0,
  width: 0,
  length: 0,
  total_width: 0,
  total_length: 0,
  cubic_usable: 0,
  rotated: false,
  extra_space: 1,
  sizes: [
    '8x16',
    '11x22',
    '11x23',
    '12x12',
    '12x24',
    '13x14',
    '13x26',
    '14x28',
    '16x16',
    '19x25',
    '20x20',
    '24x24',
    'Custom'
  ],
  populate() {
    $.each(shelves.sizes, function(size) {
      $('#shelf_sizes').append($('<option>', {
        value: shelves.sizes[size],
        text: shelves.sizes[size]
      }));
    })
  },
  draw() {
    // NOTE: All shelf calculations are done in inches because they are not bound to brick boundaries
    // Center shelves in chamber
    const shelf_x_offset = chamber.deadspace_front + chamber.offset;
    const shelf_y_offset = standardBrick.length + (chamber.width - shelves.total_width) / 2;
    // Canvas for main view
    const canvas = 'Layer2';
    const my_canvas = document.getElementById(canvas);
    const my_ctx = my_canvas.getContext('2d');

    // Canvas for thumbnail
    const birdseye_thumbnail_canvas = document.getElementById('birdseye_thumbnail_canvas');
    const birdseye_thumbnail_ctx = birdseye_thumbnail_canvas.getContext('2d');

    // Need to deal with if the shelves are rotated
    let shelf_length, shelf_width;
    if (!shelves.rotated) {
      [shelf_length, shelf_width] = [shelves.length, shelves.width];
    } else {
      [shelf_length, shelf_width] = [shelves.width, shelves.length];
    }

    // Iterate throught the shelves and draw them
    $.each(shelves.shelfList, function(i) {
      // Main Canvas
      my_ctx.globalAlpha = 0.75;
      my_ctx.strokeStyle = 'black';
      my_ctx.fillStyle = 'gray';
      my_ctx.beginPath();
      my_ctx.rect(
        (shelf_x_offset + shelves.shelfList[i][0]) * birdseye_scale,
        (shelf_y_offset + shelves.shelfList[i][1]) * birdseye_scale,
        shelf_length * birdseye_scale,
        shelf_width * birdseye_scale
      );
      my_ctx.closePath();
      my_ctx.fill();
      my_ctx.stroke();
      my_ctx.globalAlpha = 1;

      // Thumbnail Canvas
      birdseye_thumbnail_ctx.strokeStyle = 'none';
      birdseye_thumbnail_ctx.fillStyle = 'gray';
      birdseye_thumbnail_ctx.beginPath();
      birdseye_thumbnail_ctx.rect(
        (shelf_x_offset + shelves.shelfList[i][0]),
        (shelf_y_offset + shelves.shelfList[i][1]),
        shelf_length,
        shelf_width
      );
      birdseye_thumbnail_ctx.closePath();
      birdseye_thumbnail_ctx.fill();
    });
  },
  calculate() {
    'use strict';
    // NOTE: All shelf calculations are done in inches because they are not bound to brick boundaries
    // The chamber that they sit in will be calculated in bricks though.
    shelves.shelfList = [];
    let shelfnum = 0;
    let shelf_length, shelf_width;
    if (!shelves.rotated) {
      [shelf_length, shelf_width] = [shelves.length, shelves.width];
    } else {
      [shelf_length, shelf_width] = [shelves.width, shelves.length];
    }
    // Need space between each shelf
    shelves.total_width = shelves.num_wide * ((shelf_width + shelves.extra_space));
    console.debug('Shelves total width is: ' + shelves.total_width)
    shelves.total_length = (shelves.num_long * (shelf_length + shelves.extra_space))
    console.debug('Shelves total length is: ' + shelves.total_length)
    shelves.cubic_usable = Math.round(shelves.total_length * shelves.total_width / cubic_foot * 10) / 10;

    for (let col = 0; col < shelves.num_long; col++) {
      for (let row = 0; row < shelves.num_wide; row++) {
        shelves.shelfList[shelfnum++] = [
          col * (shelf_length + shelves.extra_space),
          row * (shelf_width + shelves.extra_space)
        ]
      }
    }
  }
};

// eslint-disable-next-line prefer-const
let chamber = {
  width: 0,
  length: 0,
  height: 0,
  square: 0,
  cubic: 0,
  layers: 0,
  offset: 0,
  deadspace_front: 9,
  deadspace_back: 4,
  deadspace_sides: 2,

  calculate() {
    'use strict';
    // We need to fit the shelves in the chamber and make sure that
    // the total size is rounded up the nearest whole brick.
    const estimated_length = chamber.deadspace_front + shelves.total_length + chamber.deadspace_back;
    let units_long = Math.ceil(estimated_length / unit);
    if (units_long % 2 !== 0) { units_long += 1 }
    chamber.length = units_long * unit;

    // Any extra space should be added to the front deadspace
    // TODO: Make the deadspace a modifiable variable 
    chamber.deadspace_front = 9 + chamber.length - estimated_length;
    let units_wide = Math.ceil((shelves.total_width + (chamber.deadspace_sides * 2)) / unit);
    if (units_wide % 2 !== 0) { units_wide += 1 }

    console.debug(`Rows and columns in chamber: ${units_long}x${units_wide}`)

    chamber.width = units_wide * unit;
    // TODO: Make the chanmber height something that can be varied
    chamber.height = chamber.width;
    chamber.square = chamber.width * chamber.length;
    chamber.cubic = Math.round(chamber.square * chamber.height / cubic_foot * 10) / 10;
    chamber.layers = chamber.height / standardBrick.height;
    console.debug(`Chamber length: ${chamber.length} and length of shelves: ${shelves.total_length}`)
  }
};
// eslint-disable-next-line prefer-const
let firebox = {
  depth: 0,
  length: 0,
  height: 0,
  square: 0,
  cubic: 0,
  layers: 0,
  offset: 0,
  calculate() {
    firebox.depth = 3 * standardBrick.length;
    firebox.height = chamber.height * 1.75;
    firebox.square = chamber.width * firebox.depth;
    firebox.cubic = Math.round(firebox.square * firebox.height / cubic_foot * 10) / 10;
    firebox.layers = firebox.height / standardBrick.height;
  }
};
// eslint-disable-next-line prefer-const
let chimney = {
  depth: 0,
  length: 0,
  height: 0,
  square: 0,
  cubic: 0,
  layers: 0,
  offset: 0,
  calculate() {
    chimney.depth = 2 * standardBrick.length;
    chimney.height = chamber.height * 3;
    chimney.square = chamber.width * chimney.depth;
    chimney.cubic = (chimney.square * chimney.height / cubic_foot).toFixed(1);
    chimney.layers = chimney.height / standardBrick.height;
    chimney.ratio = chimney.square / firebox.square
    console.log(`Optimal chimney size would be ${firebox.square / 10}-${firebox.square / 7}`)
    console.log(`Chimney ratio is ${chimney.ratio}`)
  }
};

function createLayer0(oriented, brickType) {
  // This creates the bottom solid layers with bricks either in portrait or landscape orientation
  'use strict';
  // eslint-disable-next-line prefer-const
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
        console.error('CreateLayer0 was called with an unknown orientation.')
      }
    }
    // Depending upon the orientation we either have to move one or 2 units
    // This will always be the inverse of waht we did for the row 
    if (oriented === 'landscape') {
      col += 2;
    } else if (oriented === 'portrait') {
      col += 1;
    } else {
      console.error('CreateLayer0 was called with an unknown orientation.')
    }
  }
  layers.push(layer)
}

function insertBrick(layer, col, row, new_brick) {
  const layerNum = layers.length + 1

  // Check if we are overwriting a brick
  // Note: this is normal on crosswise walls on layers where they interlace with the side walls.
  if (layer[col][row]) {
    // This will be overwritten so we don't need to remove it.
    console.debug(`Found overlapping brick at ${col}:${row} on layer ${layerNum}.`)
    console.debug(` -- Current Value is: ${JSON.stringify(layer[col][row])} and new value is: ${JSON.stringify(new_brick)}`)
  }
  // Check to see if the brick next the brick we will be creating needs to be removed.
  if (new_brick.orientation === 'portrait') {
    if (layer[col][(row + 1)]) {
      console.info(`Found adjacent overlapping brick at ${col}:${row + 1} on layer ${layerNum}.`)
      console.debug(` -- Current Value is: ${JSON.stringify(layer[col][(row + 1)])} and new value is: ${JSON.stringify(new_brick)}`)
      layer[col][(row + 1)] = undefined;
    }
  } else if (new_brick.orientation === 'landscape') {
    if (layer[(col + 1)][(row)]) {
      console.info(`Found adjacent overlapping brick at ${col + 1}:${row} on layer ${layerNum}.`)
      console.debug(` -- Current Value is: ${JSON.stringify(layer[(col + 1)][(row)])} and new value is: ${JSON.stringify(new_brick)}`)
      layer[(col + 1)][(row)] = undefined;
    }
  }

  layer[col][row] = new_brick;
}

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

function drawBrick(ctx, scale, x, y, brickType, brick_orientation) {
  'use strict';
  // console.debug('x: ' + x + ', y: ' + y + ', brickType: ' + brickType + ', brick_orientation: ' + brick_orientation)
  x = x * unit * scale;
  y = y * unit * scale;
  // const brick_label = standardBrick.types[brickType].initial;
  const brick_color = standardBrick.types[brickType].color;

  // If we are doing the thumbnail view we don't want to add those bricks
  if (scale > 1) {
    if (brickType === 'IFB') {
      num_IFBs++;
      layer_num_IFBs++;
    } else if (brickType === 'Medium') {
      num_mediums++;
      layer_num_mediums++;
    } else if (brickType === 'Super') {
      num_supers++;
      layer_num_supers++;
    } else { console.error('***unknown brick type***') }
  }

  let length, width;

  if (brick_orientation === 'landscape') {
    width = standardBrick.length * scale;
    length = standardBrick.width * scale;
  } else {
    width = standardBrick.width * scale;
    length = standardBrick.length * scale;
  }

  ctx.strokeStyle = 'gray';
  ctx.fillStyle = brick_color;
  ctx.beginPath();
  ctx.rect(x, y, width, length);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 1
  ctx.stroke();

  // ctx.fillStyle = 'Black';
  // ctx.fillText(brick_label, (x + (width / 2)), ((y + 3) + (length / 2)));
}

function drawBrickFromSide(ctx, scale, x, y, brickType, brick_orientation) {
  'use strict';
  // console.debug('x: ' + x + ', y: ' + y + ', brickType: ' + brickType + ', brick_orientation: ' + brick_orientation)
  x = x * unit * scale;
  y = y * unit * scale * (standardBrick.height / unit);
  const brick_color = standardBrick.types[brickType].color;
  let length, width;

  if (brick_orientation === 'landscape') {
    width = standardBrick.length * scale;
    length = standardBrick.height * scale;
  } else {
    width = standardBrick.width * scale;
    length = standardBrick.height * scale;
  }

  ctx.strokeStyle = 'gray';
  ctx.fillStyle = brick_color;
  ctx.beginPath();
  ctx.rect(x, y, width, length);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 1
  ctx.stroke();
}

function drawBirdseyeView(layers) {
  // Iterate through the layers
  $.each(layers, function(layerNum, layer) {
    let birdseye_thumbnail_canvas, birdseye_thumbnail_ctx;
    layer_num_IFBs = layer_num_mediums = layer_num_supers = 0

    // Create a canvas for the layer
    const canvas_name = ('Layer' + layerNum);
    console.debug('Creating canvas for: ' + canvas_name)
    $('<canvas>').attr({ id: canvas_name }).appendTo('#birds_eye_area');
    $('<span>&nbsp;</span>').appendTo('#birds_eye_area');
    const my_canvas = document.getElementById(canvas_name);
    const my_ctx = my_canvas.getContext('2d');
    my_canvas.height = (kiln.width) * birdseye_scale + 20;
    my_canvas.width = (kiln.length) * birdseye_scale + 20;
    if (layerNum === 2) {
      // We need to create a birdseye view of the shelf layer
      $('<canvas>').attr({ id: 'birdseye_thumbnail_canvas' }).appendTo('#birdseye_thumbnail_area');
      $('#birdseye_thumbnail_area').on('click', function() { $('#birdseye_tab_proxy').trigger('click') })
      birdseye_thumbnail_canvas = document.getElementById('birdseye_thumbnail_canvas');
      birdseye_thumbnail_canvas.height = kiln.width;
      birdseye_thumbnail_canvas.width = kiln.length;
      birdseye_thumbnail_ctx = birdseye_thumbnail_canvas.getContext('2d');
    }

    // Draw the bricks on the layer.
    for (let col = 0; col < layer.length; col++) {
      if (layer[col]) {
        // console.debug('Drawing column: ' + col)
        for (let row = 0; row < layer[col].length; row++) {
          // console.debug('Drawing row: ' + row)
          if (layer[col][row]) {
            const aBrick = layer[col][row];
            drawBrick(
              my_ctx,
              birdseye_scale,
              col,
              row,
              aBrick.type,
              aBrick.orientation
            );
            if (layerNum === 2) {
              // We need to create a birdseye view of the shelf layer
              drawBrick(
                birdseye_thumbnail_ctx,
                1,
                col,
                row,
                aBrick.type,
                aBrick.orientation
              );
            }
          }
        };
      }
    };
    console.info(`Layer ${layerNum} IFB: ${layer_num_IFBs} Super: ${layer_num_supers} Medium: ${layer_num_mediums}`)
  });
}

function drawSideView(layers, scale) {
  // Iterate through the layers and draw the visible bricks
  // For the side view we draw on 2 canvases one for the scaled up view and one for a thumbnail.
  // Although we could just copy a scaled back down version of the main view to a thumbnail
  // due to all the straight lines for the bricks it looks a lot better if we draw at the right scale

  // Scaled up canvas
  $('<canvas>').attr({ id: 'side_view_canvas' }).appendTo('#side_view_area');
  const side_view_canvas = document.getElementById('side_view_canvas');
  const side_view_ctx = side_view_canvas.getContext('2d');
  side_view_canvas.height = kiln.height * scale + 20;
  side_view_canvas.width = (kiln.length) * scale + 20;

  // Thumbnail canvas
  $('<canvas>').attr({ id: 'side_thumbnail' }).appendTo('#side_thumbnail_area');
  $('#side_thumbnail_area').on('click', function() { $('#sideview_tab_proxy').trigger('click') })

  const side_thumbnail = document.getElementById('side_thumbnail');
  const side_thumbnail_ctx = side_thumbnail.getContext('2d');
  side_thumbnail.height = kiln.height;
  side_thumbnail.width = kiln.length;

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
        drawBrickFromSide(
          side_view_ctx,
          scale,
          col,
          row_num_to_draw,
          aBrick.type,
          aBrick.orientation
        )
        drawBrickFromSide(
          side_thumbnail_ctx,
          1,
          col,
          row_num_to_draw,
          aBrick.type,
          aBrick.orientation
        )
      }
    }
  };
  createThumbnail(side_view_canvas, '#side_thumbnail', 0.2)
}

function readValuesFromPage() {
  shelves.rotated = $('#shelves_rotated').is(':checked');
  const shelf_size = $('#shelf_sizes option:selected').val();
  console.info('Shelf size is: ' + shelf_size)

  if (shelf_size !== 'Custom') {
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
    $('.non-custom-shelf').hide();
    $('.non-custom-shelf').children().hide();
    $('.custom-shelf').show();
    $('.custom-shelf').children().show();
  }

  shelves.width = parseInt($('#shelf_width').val());
  shelves.length = parseInt($('#shelf_length').val());
  shelves.num_wide = parseInt($('#shelves_wide').val());
  shelves.num_long = parseInt($('#shelves_long').val());
}

function createThumbnail(original_canvas, destination_id, scale) {
  const canvas = document.createElement('canvas');

  canvas.width = original_canvas.width * scale;
  canvas.height = original_canvas.height * scale;

  canvas.getContext('2d').drawImage(original_canvas, 0, 0, canvas.width, canvas.height);
  $(destination_id).append(canvas);
}

function updatePage() {
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

function refreshPage() {
  'use strict';
  console.info('Recalculating...');
  // Reset variables
  layers = [];
  num_IFBs = num_mediums = num_supers = 0

  // Clear the existing drawing areas
  $('#birds_eye_area').empty()
  $('#birdseye_thumbnail_area').empty()
  $('#side_view_area').empty()
  $('#side_thumbnail_area').empty()

  // Read variables from page
  readValuesFromPage();

  // Calculate the dimensions of the kiln areas
  shelves.calculate();
  chamber.calculate();
  firebox.calculate();
  chimney.calculate()
  kiln.calculate();

  // Create the base layers
  createLayer0('landscape', 'IFB');
  createLayer0('portrait', 'Super');

  // Create the layers up to the height of the chimney (override if you want to just check first few layers)
  // chimney.layers = 1;
  for (let index = 0; index < chimney.layers; index++) {
    if ((index + 2) % 6 === 0) {
      createLayer('header')
    } else if (index % 2 === 0) {
      createLayer('even');
    } else {
      createLayer('odd');
    }
  }
  // Now that all the layers are created we can determine the kiln total height
  kiln.height = layers.length * standardBrick.height

  drawSideView(layers, sideview_scale);
  drawBirdseyeView(layers);
  shelves.draw();
  updatePage()
}

env = 'staging';

function main() {
  if (env === 'production') {
    console.debug = function() {};
    console.info = function() {};
  } else if (env === 'staging') {
    console.debug = function() {};
  }

  // Initialize all the elements on the page
  $(function() {
    $('.controlgroup').controlgroup();
    $('.controlgroup').controlgroup('option', 'onlyVisible', true);
    $('#shelf_sizes').on('selectmenuchange', refreshPage);
    $('#shelves_rotated').on('change', refreshPage);
    $('#shelves_wide').on('spinstop', refreshPage);
    $('#shelves_long').on('spinstop', refreshPage);
    $('#shelf_width').on('spinstop', refreshPage);
    $('#shelf_length').on('spinstop', refreshPage);
    $('.custom-shelf').hide();
    $('.custom-shelf').children().hide();

    $('#tabs').tabs();
  });

  shelves.populate()
  refreshPage();
}

main();