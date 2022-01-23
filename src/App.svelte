<script>

import { onMount } from 'svelte';
import { infoStore, projName, select_display, exifData, selectedID } from './stores.js';
import ExifReader from 'exifreader';

import Sidebar from './Sidebar.svelte';
let accessFunc;

import Annotation_Editor from './Annotation_Editor.svelte';
import Annotation_Canvas from './Annotation_Canvas.svelte'
import Toolbar from './Toolbar.svelte';


var VERSION      = '1.0';
var NAME         = 'ISSAP Image Excavation Tool';
var SHORT_NAME   = 'ISSAP';
var REGION_SHAPE = { RECT:'rect',
                         CIRCLE:'circle',
                         ELLIPSE:'ellipse',
                         POLYGON:'polygon',
                         POINT:'point',
                         POLYLINE:'polyline'
                       };

var ATTRIBUTE_TYPE = { TEXT:'text',
                           CHECKBOX:'checkbox',
                           RADIO:'radio',
                           IMAGE:'image',
                           DROPDOWN:'dropdown'
                         };

var DISPLAY_AREA_CONTENT_NAME = {IMAGE:'image_panel',
                                     IMAGE_GRID:'image_grid_panel',
                                     SETTINGS:'settings_panel',
                                     PAGE_404:'page_404',
                                     PAGE_ABOUT:'page_about',
                                     PAGE_START_INFO:'page_start_info',
                                     PAGE_LICENSE:'page_license'
                                    };

var ANNOTATION_EDITOR_MODE    = {SINGLE_REGION:'single_region',
                                     ALL_REGIONS:'all_regions'};
var ANNOTATION_EDITOR_PLACEMENT = {NEAR_REGION:'NEAR_REGION',
                                       IMAGE_BOTTOM:'IMAGE_BOTTOM',
                                       DISABLE:'DISABLE'};

var REGION_EDGE_TOL           = 5;   // pixel
var REGION_CONTROL_POINT_SIZE = 2;
var POLYGON_VERTEX_MATCH_TOL  = 5;
var REGION_MIN_DIM            = 3;
var MOUSE_CLICK_TOL           = 2;
var ELLIPSE_EDGE_TOL          = 0.2; // euclidean distance
var THETA_TOL                 = Math.PI/18; // 10 degrees
var POLYGON_RESIZE_VERTEX_OFFSET  = 100;
var CANVAS_DEFAULT_ZOOM_LEVEL_INDEX = 3;
var CANVAS_ZOOM_LEVELS = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 4, 5, 6, 7, 8, 9, 10];
var REGION_COLOR_LIST = ["#E69F00", "#56B4E9", "#009E73", "#D55E00", "#CC79A7", "#F0E442", "#ffffff"];
// radius of control points in all shapes
var REGION_SHAPES_POINTS_RADIUS = 3;
// radius of control points in a point
var REGION_POINT_RADIUS         = 3;
var REGION_POINT_RADIUS_DEFAULT = 3;

var THEME_REGION_BOUNDARY_WIDTH = 3;
var THEME_BOUNDARY_LINE_COLOR   = "black";
var THEME_BOUNDARY_FILL_COLOR   = "yellow";
var THEME_SEL_REGION_FILL_COLOR = "#808080";
var THEME_SEL_REGION_FILL_BOUNDARY_COLOR = "yellow";
var THEME_SEL_REGION_OPACITY    = 0.5;
var THEME_MESSAGE_TIMEOUT_MS    = 6000;
var THEME_CONTROL_POINT_COLOR   = '#ff0000';

var CSV_SEP        = ',';
var CSV_QUOTE_CHAR = '"';
var CSV_KEYVAL_SEP = ':';

var img_metadata = {};   // data structure to store loaded images metadata
var img_src      = {};   // image content {abs. path, url, base64 data, etc}
var img_fileref  = {};   // reference to local images selected by using browser file selector
var img_count    = 0;    // count of the loaded images
var canvas_regions = []; // image regions spec. in canvas space
var canvas_scale   = 1.0;// current scale of canvas image

var image_id       = ''; // id={filename+length} of current image
var image_index    = -1; // index

var current_image_filename;
var current_image;
var current_image_width;
var current_image_height;

// a record of image statistics (e.g. width, height)
var img_stat     = {};
var is_all_img_stat_read_ongoing = false;
var img_stat_current_img_index = false;

// image canvas
var display_area = document.getElementById('display_area');
var img_panel    = document.getElementById('image_panel');
var reg_canvas   = document.getElementById('region_canvas');
var reg_ctx; // initialized in init()
var canvas_width, canvas_height;

// canvas zoom
var canvas_zoom_level_index   = CANVAS_DEFAULT_ZOOM_LEVEL_INDEX; // 1.0
var canvas_scale_without_zoom = 1.0;

// state of the application
var is_user_drawing_region  = false;
var current_image_loaded    = false;
var is_window_resized       = false;
var is_user_resizing_region = false;
var is_user_moving_region   = false;
var is_user_drawing_polygon = false;
var is_region_selected      = false;
var is_all_region_selected  = false;
var is_loaded_img_list_visible  = false;
var is_attributes_panel_visible = false;
var is_reg_attr_panel_visible   = false;
var is_file_attr_panel_visible  = false;
var is_canvas_zoomed            = false;
var is_loading_current_image    = false;
var is_region_id_visible        = true;
var is_region_boundary_visible  = true;
var is_region_info_visible      = false;
var is_ctrl_pressed             = false;
var is_debug_mode               = false;
var is_message_visible          = true;

// region
var current_shape             = REGION_SHAPE.RECT;
var current_polygon_region_id = -1;
var user_sel_region_id        = -1;
var click_x0 = 0; var click_y0 = 0;
var click_x1 = 0; var click_y1 = 0;
var region_click_x, region_click_y;
var region_edge          = [-1, -1];
var current_x = 0; var current_y = 0;

// region copy/paste
var region_selected_flag = []; // region select flag for current image
var copied_image_regions = [];
var paste_to_multiple_images_input;

// message
var message_clear_timer;

// attributes
var attribute_being_updated       = 'region'; // {region, file}
var attributes                    = {'region':{
                                              "Fixed":{"type":"radio","description":"","options":{"yes":"Yes","no":"No"},"default_options":{"no":true}},
                                              "Persistence":{"type":"radio","description":"","options":{"yes":"Yes","no":"No"},"default_options":{"no":true}},
                                              "Name":{"type":"text","description":"Name of artifact","default_value":"not_defined"},
                                              "Type":{"type":"dropdown","description":"Category","options":{"category":"[need categories]"},"default_options":{"unknown":true}},
                                              "Notes":{"type":"text","description":"Further comments","default_value":"not_defined"},
                                              "Recorded_by":{"type":"text","description":"Add your initials","default_value":"not_defined"}},
                                      'file':{
                                              "Context_Number":{"type":"text","description":"","default_value":""},
                                              "Square":{"type":"text","description":"","default_value":""},
                                              "Module":{"type":"text","description":"","default_value":""},
                                              "Orbital_Segment":{"type":"dropdown","description":"Orbital Segment","options":{"us":"USA","eur":"ESA","unknown":"Unknown"},"default_options":{"unknown":true}},
                                              "Agency":{"type":"dropdown","description":"Agency","options":{"esa":"ESA","nasa":"NASA","unknown":"Unknown"},"default_options":{"unknown":true}},
                                              "Context_Type":{"type":"text","description":"","default_value":""},
                                              "Description":{"type":"text","description":"","default_value":""},
                                              "Interpretation":{"type":"text","description":"","default_value":""},
                                              "Problems":{"type":"text","description":"","default_value":""}} };
var current_attribute_id          = '';

// region group color
var canvas_regions_group_color = {}; // color of each region

// invoke a method after receiving user input
var user_input_ok_handler     = null;
var user_input_cancel_handler = null;
var user_input_data           = {};

// annotation editor
var annotaion_editor_panel     = document.getElementById('container__bottom');
var metadata_being_updated     = 'region'; // {region, file}
var annotation_editor_mode     = ANNOTATION_EDITOR_MODE.SINGLE_REGION;

// persistence to local storage
var is_local_storage_available = false;
var is_save_ongoing            = false;

// all the image_id and image_filename of images added by the user is
// stored in image_id_list and image_filename_list
//
// Image filename list (img_fn_list) contains a filtered list of images
// currently accessible by the user. The img_fn_list is visible in the
// left side toolbar. image_grid, next/prev, etc operations depend on
// the contents of img_fn_list_img_index_list.
var image_id_list                 = []; // array of all image id (in order they were added by user)
var image_filename_list           = []; // array of all image filename
var image_load_error              = []; // {true, false}
var image_filepath_resolved       = []; // {true, false}
var image_filepath_id_list        = []; // path for each file

var reload_img_fn_list_table      = true;
var img_fn_list_img_index_list    = []; // image index list of images show in img_fn_list
var img_fn_list_html              = []; // html representation of image filename list

// image grid
var image_grid_panel                        = document.getElementById('image_grid_panel');
var display_area_content_name          = ''; // describes what is currently shown in display area
var display_area_content_name_prev     = '';
var image_grid_requires_update         = false;
var image_grid_content_overflow        = false;
var image_grid_load_ongoing            = false;
var image_grid_page_first_index        = 0; // array index in img_fn_list_img_index_list[]
var image_grid_page_last_index         = -1;
var image_grid_selected_img_index_list = [];
var image_grid_page_img_index_list     = []; // list of all image index in current page of image grid
var image_grid_visible_img_index_list  = []; // list of images currently visible in grid
var image_grid_mousedown_img_index     = -1;
var image_grid_mouseup_img_index       = -1;
var image_grid_img_index_list          = []; // list of all image index in the image grid
var image_grid_region_index_list       = []; // list of all image index in the image grid
var image_grid_group                   = {}; // {'value':[image_index_list]}
var image_grid_group_var               = []; // {type, name, value}
var image_grid_group_show_all          = false;
var image_grid_stack_prev_page         = []; // stack of first img index of every page navigated so far

// image buffer
var IMG_PRELOAD_INDICES         = [1, -1, 2, 3, -2, 4]; // for any image, preload previous 2 and next 4 images
var IMG_PRELOAD_COUNT           = 4;
var buffer_preload_img_index   = -1;
var buffer_img_index_list      = [];
var buffer_img_shown_timestamp = [];
var preload_img_promise_list   = [];

// settings
var settings = {};
settings.ui  = {};
settings.ui.annotation_editor_height   = 25; // in percent of the height of browser window
settings.ui.annotation_editor_fontsize = 0.8;// in rem
settings.ui.leftsidebar_width          = 18;  // in rem

settings.ui.image_grid = {};
settings.ui.image_grid.img_height          = 80;  // in pixel
settings.ui.image_grid.rshape_fill         = 'none';
settings.ui.image_grid.rshape_fill_opacity = 0.3;
settings.ui.image_grid.rshape_stroke       = 'yellow';
settings.ui.image_grid.rshape_stroke_width = 2;
settings.ui.image_grid.show_region_shape   = true;
settings.ui.image_grid.show_image_policy   = 'all';

settings.ui.image = {};
settings.ui.image.region_label      = '_region_id__'; // default: region_id
settings.ui.image.region_color      = '_default_region_color__'; // default color: yellow
settings.ui.image.region_label_font = '10px Sans';
settings.ui.image.on_image_annotation_editor_placement = ANNOTATION_EDITOR_PLACEMENT.NEAR_REGION;

settings.core                  = {};
settings.core.buffer_size      = 4*IMG_PRELOAD_COUNT + 2;
settings.core.filepath         = {};
settings.core.default_filepath = '';

// UI html elements
var invisible_file_input = document.getElementById("invisible_file_input");
var display_area    = document.getElementById("display_area");
var ui_top_panel    = document.getElementById("ui_top_panel");
var image_panel     = document.getElementById("image_panel");
var img_buffer_now  = document.getElementById("img_buffer_now");

var annotation_list_snippet = document.getElementById("annotation_list_snippet");
var annotation_textarea     = document.getElementById("annotation_textarea");

var img_fn_list_panel     = document.getElementById('img_fn_list_panel');
var img_fn_list           = document.getElementById('img_fn_list');
var attributes_panel      = document.getElementById('attributes_panel');
var leftsidebar           = document.getElementById('leftsidebar');

var BBOX_LINE_WIDTH       = 4;
var BBOX_SELECTED_OPACITY = 0.3;
var BBOX_BOUNDARY_FILL_COLOR_ANNOTATED = "#f2f2f2";
var BBOX_BOUNDARY_FILL_COLOR_NEW       = "#aaeeff";
var BBOX_BOUNDARY_LINE_COLOR           = "#1a1a1a";
var BBOX_SELECTED_FILL_COLOR           = "#ffffff";

var ANNOTATION_EDITOR_HEIGHT_CHANGE   = 5;   // in percent
var ANNOTATION_EDITOR_FONTSIZE_CHANGE = 0.1; // in rem
var IMAGE_GRID_IMG_HEIGHT_CHANGE      = 20;  // in percent
var LEFTSIDEBAR_WIDTH_CHANGE          = 1;   // in rem
var POLYGON_SEGMENT_SUBTENDED_ANGLE   = 5;   // in degree (used to approximate shapes using polygon)
var FLOAT_PRECISION = 3; // number of decimal places to include in float values

// COCO Export
var COCO_EXPORT_RSHAPE = ['rect', 'circle', 'ellipse', 'polygon', 'point'];
var COCO_EXPORT_ATTRIBUTE_TYPE = [ATTRIBUTE_TYPE.DROPDOWN,
                                      ATTRIBUTE_TYPE.RADIO];


document.addEventListener('DOMContentLoaded', function() {
    const resizable = function(resizer) {
    const direction = resizer.getAttribute('data-direction') || 'horizontal';
    const prevSibling = resizer.previousElementSibling;
    const nextSibling = resizer.nextElementSibling;

    // The current position of mouse
    let x = 0;
    let y = 0;
    let prevSiblingHeight = 0;
    let prevSiblingWidth = 0;

    // Handle the mousedown event
    // that's triggered when user drags the resizer
    const mouseDownHandler = function(e) {
      // Get the current mouse position
      x = e.clientX;
      y = e.clientY;
      const rect = prevSibling.getBoundingClientRect();
      prevSiblingHeight = rect.height;
      prevSiblingWidth = rect.width;

      // Attach the listeners to `document`
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = function(e) {
      // How far the mouse has been moved
      const dx = e.clientX - x;
      const dy = e.clientY - y;

      switch (direction) {
        case 'vertical':
          const h =
            ((prevSiblingHeight + dy) * 100) /
            resizer.parentNode.getBoundingClientRect().height;
          prevSibling.style.height = `${h}%`;
          break;
        case 'horizontal':
        default:
          const w =
            ((prevSiblingWidth + dx) * 100) / resizer.parentNode.getBoundingClientRect().width;
          prevSibling.style.width = `${w}%`;
          break;
      }

      const cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      resizer.style.cursor = cursor;
      document.body.style.cursor = cursor;

      prevSibling.style.userSelect = 'none';
      prevSibling.style.pointerEvents = 'none';

      nextSibling.style.userSelect = 'none';
      nextSibling.style.pointerEvents = 'none';
    };

    const mouseUpHandler = function() {
      resizer.style.removeProperty('cursor');
      document.body.style.removeProperty('cursor');

      prevSibling.style.removeProperty('user-select');
      prevSibling.style.removeProperty('pointer-events');

      nextSibling.style.removeProperty('user-select');
      nextSibling.style.removeProperty('pointer-events');

      // Remove the handlers of `mousemove` and `mouseup`
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };

    // Attach the handler
    resizer.addEventListener('mousedown', mouseDownHandler);
  };

  // Query all resizers
  document.querySelectorAll('.resizer').forEach(function(ele) {
    resizable(ele);
  });
});

//
// Data structure to store metadata about file and regions
//
function file_metadata(filename, size) {
  this.filename = filename;
  this.size     = size;         // file size in bytes
  this.regions  = [];           // array of file_region()
  this.file_attributes = {};    // image attributes
}

function file_region() {
  this.shape_attributes  = {}; // region shape attributes
  this.region_attributes = {}; // region attributes
}

//
// Initialization routine
//

onMount(() => {
  console.log(NAME);
  init_leftsidebar_accordion();
  init_anno_accordion();

  curr_display("page_start_info");

  
  // show_message(NAME + ' (' + SHORT_NAME + ') version ' + VERSION +
  //              '. Ready !', 2*THEME_MESSAGE_TIMEOUT_MS);

  // if ( is_debug_mode ) {
  //   document.getElementById('ui_top_panel').innerHTML += '<span>DEBUG MODE</span>';
  // }

  // document.getElementById('img_fn_list').style.display = 'block';
  // document.getElementById('leftsidebar').style.display = 'table-cell';
  // // document.getElementById('anno_toolbar').style.display = 'table-cell';


  // annotation_editor_toggle_all_regions_editor()

  // // initialize default project
  // project_init_default_project();

  // // initialize region canvas 2D context
  // init_reg_canvas_context();

  // // initialize user input handlers (for both window and reg_canvas)
  // // handles drawing of regions by user over the image
  // init_keyboard_handlers();
  // init_mouse_handlers();

  // // initialize image grid
  // image_grid_init();

  // show_single_image_view();
  // init_leftsidebar_accordion();
  // init_anno_accordion();
  // attribute_update_panel_set_active_button();
  // annotation_editor_set_active_button();
  // init_message_panel();

  // // run attached sub-modules (if any)
  // // e.g. demo modules
  // if (typeof load_submodules === 'function') {
  //   console.log('Loading submodule');
  //   setTimeout( async function() {
  //     await load_submodules();
  //   }, 100);
  // }

});


$: if ($select_display) {
  console.log($select_display)
}


function init_leftsidebar_accordion() {
  var leftsidebar = document.getElementById('leftsidebar');
  leftsidebar.style.width = settings.ui.leftsidebar_width + 'rem';

  var acc = document.getElementsByClassName('leftsidebar_accordion');
  var i;
  for ( i = 0; i < acc.length; ++i ) {
    acc[i].addEventListener('click', function() {
      this.classList.toggle('active');
      this.nextElementSibling.classList.toggle('show');

      switch( this.innerHTML ) {
      case 'Modify Attributes':
        update_attributes_update_panel();
        break;
      case 'Project':
        update_img_fn_list();
        break;
      }
    });
  }
}

function init_anno_accordion() {
  var acc = document.getElementsByClassName('anno_accordion');
  var i;
  for ( i = 0; i < acc.length; ++i ) {
    acc[i].addEventListener('click', function() {
      this.classList.toggle('active');
      this.nextElementSibling.classList.toggle('show');

    });
  }

}

function curr_display(selection) {
  $select_display = selection;
}

let files, fileInput, image;
let allFiles = [];

$: if (allFiles.length > 0) {
    accessFunc.create_struct();

}

</script>

  <svelte:head>
    <meta charset="UTF-8">
    <title>ISSAP Image Excavation Tool</title>
  </svelte:head>

  <body>
    <!--
        SVG icon set definitions
        Material icons downloaded from https://material.io/icons
      -->
    <svg style="display:none;" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <symbol id="shape_rectangle">
          <title>Rectangular region shape</title>
          <rect width="20" height="12" x="6" y="10" stroke-width="2"></rect>
        </symbol>
        <symbol id="shape_circle">
          <title>Circular region shape</title>
          <circle r="10" cx="16" cy="16" stroke-width="2"></circle>
        </symbol>
        <symbol id="shape_ellipse">
          <title>Elliptical region shape</title>
          <ellipse rx="12" ry="8" cx="16" cy="16" stroke-width="2"></ellipse>
        </symbol>
        <symbol id="shape_polygon">
          <title>Polygon region shape</title>
          <path d="M 15.25,2.2372 3.625,11.6122 6,29.9872 l 20.75,-9.625 2.375,-14.75 z" stroke-width="2"></path>
        </symbol>
        <symbol id="shape_point">
          <title>Point region shape</title>
          <circle r="3" cx="16" cy="16" stroke-width="2"></circle>
        </symbol>
        <symbol id="shape_polyline">
          <title>Polyline region shape</title>
          <path d="M 2,12 10,24 18,12 24,18" stroke-width="2"></path>
          <circle r="1" cx="2" cy="12" stroke-width="2"></circle>
          <circle r="1" cx="10" cy="24" stroke-width="2"></circle>
          <circle r="1" cx="18" cy="12" stroke-width="2"></circle>
          <circle r="1" cx="24" cy="18" stroke-width="2"></circle>
        </symbol>

        <!-- Material icons downloaded from https://material.io/icons -->
        <symbol id="icon_settings">
          <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"></path>
        </symbol>
        <symbol id="icon_save">
          <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"></path>
        </symbol>
        <symbol id="icon_open">
          <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"></path>
        </symbol>
        <symbol id="icon_gridon">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z"></path>
        </symbol>
        <symbol id="icon_gridoff">
          <path d="M8 4v1.45l2 2V4h4v4h-3.45l2 2H14v1.45l2 2V10h4v4h-3.45l2 2H20v1.45l2 2V4c0-1.1-.9-2-2-2H4.55l2 2H8zm8 0h4v4h-4V4zM1.27 1.27L0 2.55l2 2V20c0 1.1.9 2 2 2h15.46l2 2 1.27-1.27L1.27 1.27zM10 12.55L11.45 14H10v-1.45zm-6-6L5.45 8H4V6.55zM8 20H4v-4h4v4zm0-6H4v-4h3.45l.55.55V14zm6 6h-4v-4h3.45l.55.54V20zm2 0v-1.46L17.46 20H16z"></path>
        </symbol>
        <symbol id="icon_next">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
        </symbol>
        <symbol id="icon_prev">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
        </symbol>
        <symbol id="icon_list">
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"></path>
        </symbol>
        <symbol id="icon_zoomin">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
          <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
        </symbol>
        <symbol id="icon_zoomout">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z"></path>
        </symbol>
        <symbol id="icon_copy">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path>
        </symbol>
        <symbol id="icon_paste">
          <path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"></path>
        </symbol>
        <symbol id="icon_pasten">
          <path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"></path>
          <text x="8" y="18">n</text>
        </symbol>
        <symbol id="icon_pasteundo">
          <path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"></path>
          <text x="8" y="18">x</text>
        </symbol>
        <symbol id="icon_selectall">
          <path d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2zM7 17h10V7H7v10zm2-8h6v6H9V9z"></path>
        </symbol>
        <symbol id="icon_close">
          <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/>
        </symbol>
        <symbol id="icon_insertcomment">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path>
        </symbol>
        <symbol id="icon_checkbox">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
        </symbol>
        <symbol id="icon_fileupload">
          <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path>
        </symbol>
        <symbol id="icon_filedownload">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path>
        </symbol>
        <symbol id="icon_edit">
          <path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"/>
        </symbol>
      </defs>
    </svg>

    <!-- used by invoke_with_user_inputs() to gather user inputs -->
    <div id="user_input_panel"></div>

    <!-- to show status messages -->
    <div id="message_panel">
      <div id="message_panel_content" class="content"></div>
    </div>

    <!-- spreadsheet like editor for annotations -->

    <div class="top_panel" id="ui_top_panel">
      <!-- menu bar -->
      <div class="menubar">
        <ul>
          <li>Project
            <ul>
              <li on:click={() => project_open_select_project_file()} title="Load project (from a JSON file)">Load</li>
              <li on:click={() => project_save_with_confirm()} title="Save this project (as a JSON file)">Save</li>
              <li on:click={() => curr_display("settings_panel")} title="Show/edit project settings">Settings</li>
              <li class="submenu_divider"></li>
              <li on:click={() => {fileInput.click();}} title="Add images locally stored in this computer">Add local files</li>
                <input bind:files style="display:none" type="file" accept="image/*" multiple on:change={(e)=>accessFunc.upload_images(e)} bind:this={fileInput} >
              <!-- <li on:click={() => project_file_add_url_with_input()} title="Add images from a web URL (e.g. http://www.robots.ox.ac.uk/~vgg/software/via/images/swan.jpg)">Add files from URL</li>
              <li on:click={() => project_file_add_abs_path_with_input()} title="Add images using absolute path of file (e.g. /home/abhishek/image1.jpg)">Add file using absolute path</li>
              <li on:click={() => sel_local_data_file('files_url')} title="Add images from a list of web url or absolute path stored in a text file (one url or path per line)">Add url or path from text file</li> -->
              <li class="submenu_divider"></li>
              <li on:click={() => sel_local_data_file('attributes')} title="Import region and file attributes from a JSON file">Import region/file attributes</li>
              <li on:click={() => project_save_attributes()} title="Export region and file attributes to a JSON file">Export region/file attributes</li>
            </ul>
          </li>

          <li>Annotation
            <ul>
              <li on:click={() => download_all_region_data('csv')} title="Export annotations to a CSV file">Export Annotations (as csv)</li>
              <li on:click={() => download_all_region_data('json')} title="Export annotaitons to a JSON file">Export Annotations (as json)</li>
              <li on:click={() => download_all_region_data('coco', 'json')} title="Export annotaitons to COCO (http://cocodataset.org) format">Export Annotations (COCO format)</li>
              <li class="submenu_divider"></li>
              <li on:click={() => sel_local_data_file('annotations')} title="Import annotations from a CSV file">Import Annotations (from csv)</li>
              <li on:click={() => sel_local_data_file('annotations')} title="Import annotations from a JSON file">Import Annotations (from json)</li>
              <li on:click={() => sel_local_data_file('annotations_coco')} title="Import annotations from a COCO (http://cocodataset.org) formatted JSON file">Import Annotations (COCO format)</li>

              <li class="submenu_divider"></li>
              <li on:click={() => show_annotation_data()} title="Show a preview of annotations (opens in a new browser windows)">Preview Annotations</li>
              <li on:click={() => download_as_image()} title="Download an image containing the annotations">Download as Image</li>
            </ul>
          </li>

          <li>View
            <ul>
              <li on:click={() => toggle_message_visibility()} title="Show or hide status messages that appears at the bottom of the page">Toggle status message visibility</li>
              <li class="submenu_divider"></li>
              <li on:click={() => toggle_region_boundary_visibility()} title="Show or hide the region boundaries">Show/hide region boundaries (b)</li>
              <li on:click={() => toggle_region_id_visibility()} title="Show or hide the region id labels">Show/hide region labels (l)</li>
              <li on:click={() => toggle_region_info_visibility()} title="Show or hide the image coordinates">Show/hide region info.</li>
            </ul>
          </li>

          <li>Help
            <ul>
              <li on:click={() => curr_display("page_license")} title="View license of this application">License</li>
              <li on:click={() => curr_display("page_about")} title="Show more details about this application">App guide</li>
            </ul>
          </li>
        </ul>
      </div> <!-- end of menubar -->

      <!-- Shortcut toolbar -->
      <div class="toolbar" id="centre_toolbar">
        <svg on:click={() => move_to_prev_image()} viewbox="0 0 24 24"><use xlink:href="#icon_prev"></use><title>Previous</title></svg>
        <svg on:click={() => image_grid_toggle()} id="toolbar_image_grid_toggle" viewbox="0 0 24 24"><use xlink:href="#icon_gridon"></use><title>Switch to Image Grid View</title></svg>
        <svg on:click={() => move_to_next_image()} viewbox="0 0 24 24"><use xlink:href="#icon_next"></use><title>Next</title></svg>
      </div>

      <div class="toolbar" id="right_toolbar">
        <svg on:click={() => project_save_with_confirm()} viewbox="0 0 24 24"><use xlink:href="#icon_save"></use><title>Save Project</title></svg>
      </div>
      <!-- end of shortcut toolbar -->
      <input type="file" id="invisible_file_input" name="files[]" style="display:none">
    </div> <!-- endof #top_panel -->

    <!-- Middle Panel contains a left-sidebar and image display areas -->
    <div class="middle_panel">
      
      <!-- Main display area: contains image canvas, ... -->
      <div id="container__right">
      <div id="container__top">
        <Toolbar />

      <div id="display_area">

        {#if $select_display === "image_panel"}
          <Annotation_Canvas files={files} />

        {:else if $select_display === "image_grid_panel"}
          <div id="image_grid_panel" class="display_area_content">

            <div id="image_grid_group_panel">
              <span class="tool">Group by&nbsp; <select id="image_grid_toolbar_group_by_select" onchange="image_grid_toolbar_onchange_group_by_select(this)"></select></span>
            </div>

            <div id="image_grid_toolbar">
              <span>Selected</span>
              <span id="image_grid_group_by_sel_img_count">0</span>
              <span>of</span>
              <span id="image_grid_group_by_img_count">0</span>
              <span>images in current group, show</span>

              <span>
                <select id="image_grid_show_image_policy" onchange="image_grid_onchange_show_image_policy(this)">
                  <option value="all">all images (paginated)</option>
                  <option value="first_mid_last">only first, middle and last image</option>
                  <option value="even_indexed">even indexed images (i.e. 0,2,4,...)</option>
                  <option value="odd_indexed">odd indexed images (i.e. 1,3,5,...)</option>
                  <option value="gap5">images 1, 5, 10, 15,...</option>
                  <option value="gap25">images 1, 25, 50, 75, ...</option>
                  <option value="gap50">images 1, 50, 100, 150, ...</option>
                </select>
              </span>

              <div id="image_grid_nav"></div>
            </div>

            <div id="image_grid_content">
              <div id="image_grid_content_img"></div>
              <svg xmlns:xlink="http://www.w3.org/2000/svg" id="image_grid_content_rshape"></svg>
            </div>

            <div id="image_grid_info">
            </div>
          </div> <!-- end of image grid panel -->

        {:else if $select_display === "settings_panel"}
          <div id="settings_panel" class="display_area_content">
            <h2>Settings</h2>
            <div class="row">
              <div class="variable">
                <div class="name">Project Name</div>
              </div>

              <div class="value">
                <input type="text" id={$projName}/>
              </div>
            </div>

            <div class="row">
              <div class="variable">
                <div class="name">Default Path</div>
                <div class="desc">If all images in your project are saved in a single folder, set the default path to the location of this folder. The application will load images from this folder by default. Note: a default path of <code>"./"</code> indicates that the folder containing <code>issap.html</code> application file also contains the images in this project. For example: <code>/datasets/VOC2012/JPEGImages/</code> or <code>C:\Documents\data\</code>&nbsp;<strong>(note the trailing <code>/</code> and <code>\</code></strong>)</div>
              </div>

              <div class="value">
                <input type="text" id="settings.core.default_filepath" placeholder="/datasets/pascal/voc2012/VOCdevkit/VOC2012/JPEGImages/"/>
              </div>
            </div>

            <div class="row">
              <div class="variable">
                <div class="name">Region Label</div>
                <div class="desc">By default, each region in an image is labelled using the region-id. Here, you can select a more descriptive labelling of regions.</div>
              </div>

              <div class="value">
                <select id="settings.ui.image.region_label"></select>
              </div>
            </div>

            <div class="row">
              <div class="variable">
                <div class="name">Region Colour</div>
                <div class="desc">By default, each region is drawn using a single colour. Using this setting, you can assign a unique colour to regions grouped according to a region attribute.</div>
              </div>

              <div class="value">
                <select id="settings.ui.image.region_color"></select>
              </div>
            </div>

            <div class="row">
              <div class="variable">
                <div class="name">Region Label Font</div>
                <div class="desc">Font size and font family for showing region labels.</div>
              </div>

              <div class="value">
                <input id="settings.ui.image.region_label_font" placeholder="12px Arial"/>
              </div>
            </div>

            <div class="row">
              <div class="variable">
                <div class="name">Preload Buffer Size</div>
                <div class="desc">Images are preloaded in buffer to allow smoother navigation of next/prev images. A large buffer size may slow down the overall browser performance. To disable preloading, set buffer size to 0.</div>
              </div>
              <div class="value">
                <input type="text" id="settings.core.buffer_size" />
              </div>
            </div>

            <div class="row">
              <div class="variable">
                <div class="name">On-image Annotation Editor</div>
                <div class="desc">When a single region is selected, the on-image annotation editor is gets activated which the user to update annotations of this region. By default, this on-image annotation editor is placed near the selected region.</div>
              </div>

              <div class="value">
                <select id="settings.ui.image.on_image_annotation_editor_placement">
                  <option value="NEAR_REGION">close to selected region</option>
                  <option value="IMAGE_BOTTOM">at the bottom of image being annotated</option>
                  <option value="DISABLE">DISABLE on-image annotation editor</option>
                </select>
              </div>
            </div>

            <div class="row" style="border:none;">
              <button on:click={() => settings_save()} value="save_settings" style="margin-top:2rem">Save</button>
              <button on:click={() => settings_panel_toggle()} value="cancel_settings" style="margin-left:2rem;">Cancel</button>
            </div>
          </div> <!-- end of settings panel -->

        {:else if $select_display === "page_404"}
          <div id="page_404" class="display_area_content narrow_page_content">
            <h2>File Not Found</h2>
            <p>Filename: <span style="font-family:Mono;" id="page_404_filename"></span></p>

            <p>We recommend that you update the default path in <span class="text_button" title="Show Project Settings" on:click={() => settings_panel_toggle()}>project settings</span> to the folder which contains this image.</p>

            <p>A temporary fix is to use <span class="text_button" title="Load or Add Images" on:click={() => upload_images()}>browser's file selector</span> to manually locate and add this file. We do not recommend this approach because it requires you to repeat this process every time your load this project in the application.</p>
          </div> <!-- end of file not found panel -->

        {:else if $select_display === "page_start_info"}
          <div id="page_start_info" class="display_area_content narrow_page_content">
            <ul>
              <li>To start annotation, go to "Project" tab in the menu OR in the sidebar on the right of the screen to load in some image files. You can use the toolbar on the left to change the shape which you use to annotate, zoom in/out of the selected image, and modify the regions you're creating when annotating.</li>
              <li>For each annotation you create, use the annotation editor at the bottom of the screen to add information. To add more categorizations/options to any of the attributes, use "Modify Attributes" located in the sidebar on the right of the screen.</li>
              <li>Remember to <span class="text_button" on:click={() => project_save_with_confirm()}>save</span> your project before closing this application so that you can <span class="text_button" on:click={() => project_open_select_project_file()}>load</span> it later to continue annotation.</li>
            </ul>
          </div>

        {:else if $select_display === "page_load_ongoing"}
          <div id="page_load_ongoing" class="display_area_content narrow_page_content">
            <div style="text-align:center">
              <div style="margin-top:4rem">Loading ...</div>
            </div>
          </div>

        {:else if $select_display === "page_about"}
          <div id="page_about" class="display_area_content" style="width:40rem !important">
            <div style="text-align:center">
              <div style="margin-top:4rem">Guide</div>
            </div>
            <p style="font-family:mono; font-size:0.8em;text-align:center;">//TO DO</p>
          </div> 
          <!-- end of page_about -->

        {:else if $select_display === "page_license"}

          <div id="page_license" class="display_area_content narrow_page_content">
            <pre>
                  Copyright (c) 2016-2021, Abhishek Dutta, Visual Geometry Group, Oxford University and VIA Contributors.
                  All rights reserved.

                  Redistribution and use in source and binary forms, with or without
                  modification, are permitted provided that the following conditions are met:

                  Redistributions of source code must retain the above copyright notice, this
                  list of conditions and the following disclaimer.
                  Redistributions in binary form must reproduce the above copyright notice,
                  this list of conditions and the following disclaimer in the documentation
                  and/or other materials provided with the distribution.
                  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS &quot;AS IS&quot;
                  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
                  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
                  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
                  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
                  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
                  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
                  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
                  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
                  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
                  POSSIBILITY OF SUCH DAMAGE.
            </pre>
          </div>
        {/if}
      </div> <!-- end of display_area -->
      </div>
      <div class="resizer" data-direction="vertical"></div>

      <div id="container__bottom">
        <Annotation_Editor/>
      </div>
    
      <!-- end of middle_panel -->
    </div> 

    <!-- leftsidebar -->
    <div id="container__left">
      <Sidebar bind:this={accessFunc}/>
    </div>

  </body>