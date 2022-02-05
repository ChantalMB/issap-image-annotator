<script>

import { onMount } from 'svelte';
import { tick } from 'svelte';

import Save20 from "carbon-icons-svelte/lib/Save20";


import { infoStore, projName, select_display, setImg, exifData, selectedID, artiStore, fileList, ctxtStore, shpStore, rowCheck, changingPicture, jumpToImgPanel } from './stores.js';
import JSZip from 'jszip';

import Sidebar from './Sidebar.svelte';
let accessFunc;

import Annotation_Editor from './Annotation_Editor.svelte';

import Annotation_Canvas from './Annotation_Canvas.svelte'
import Toolbar from './Toolbar.svelte';


onMount(async () => {
  console.log("ISSAP Image Excavation Tool");
  init_leftsidebar_accordion();
  init_anno_accordion();
  curr_display("page_start_info");

});

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

$: if ($fileList === {}) {
  curr_display("page_start_info")
}

$: if ($select_display) {
  console.log($select_display)
}


function init_leftsidebar_accordion() {
  var leftsidebar = document.getElementById('leftsidebar');
  leftsidebar.style.width = '18rem';

  var acc = document.getElementsByClassName('leftsidebar_accordion');
  var i;
  for ( i = 0; i < acc.length; ++i ) {
    acc[i].addEventListener('click', function() {
      this.classList.toggle('active');
      this.nextElementSibling.classList.toggle('show');

      switch( this.innerHTML ) {
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

let scrollToDiv;

async function autoScroll() {
  console.log("autoscroll")
		await tick(); // Wait until DOM was updated
		scrollToDiv.scrollTo({ top: scrollToDiv.scrollHeight, behavior: 'smooth' }); // Scroll to the bottom of the container
	}

$: if ($rowCheck) {
    autoScroll();
}

$: console.log($ctxtStore)

function jump_to_image(f) {
  $select_display = "image_panel"
  $jumpToImgPanel = true;
  if ($selectedID !== $infoStore[f]["Context_Number"]) {
    if ($selectedID === "") {
      $selectedID = $infoStore[f]["Context_Number"];
      if ($artiStore[$selectedID] === undefined) {
        $artiStore[$selectedID] = []
      }
      if ($ctxtStore[$selectedID] === undefined) {
        $ctxtStore[$selectedID] = []
      }
    } else {
      document.getElementById($selectedID).style.borderLeft = "";
      document.getElementById($selectedID).style.fontWeight = "";
      $selectedID = $infoStore[f]["Context_Number"];
      if ($artiStore[$selectedID] === undefined) {
        $artiStore[$selectedID] = []
      }
      if ($ctxtStore[$selectedID] === undefined) {
        $ctxtStore[$selectedID] = []
      }
    }
  }

  $setImg = f;
}

function download_as_csv() {
  let ctxtCSV = "Filename|Context_Number|Provenance|Photographer|Square|Module|Orbital_Segment|Agency|Context_Type|Description|Interpretation|Problems\n"

  for (let i = 0; i < Object.keys($ctxtStore).length; i++) {
    let ctxtRef = Object.keys($ctxtStore)[i] 
    let currRow = $ctxtStore[ctxtRef][0].file + "|" + ctxtRef + "|" + $ctxtStore[ctxtRef][1].provenance + "|" + Object.values($ctxtStore[ctxtRef][1].photographer) + "|" + $ctxtStore[ctxtRef][1].square + "|" + $ctxtStore[ctxtRef][1].module + "|" + Object.values($ctxtStore[ctxtRef][1].orbital_seg) + "|" + Object.values($ctxtStore[ctxtRef][1].agency) + "|" + $ctxtStore[ctxtRef][1].ctxt_type + "|" + $ctxtStore[ctxtRef][1].desc + "|" + $ctxtStore[ctxtRef][1].interp + "|" + $ctxtStore[ctxtRef][1].problems + "\n";
    ctxtCSV += currRow
  }
  
  let artiCSVs = [];
  let ctxtForFilename = [];
  
  for (let i = 0; i < Object.keys($artiStore).length; i++) {
    let ctxt = "Context_Number|Artifact_ID|Name|Type|Fixed|Persistence|Notes|Recorded_by|Date_Added\n"
    let currCtxt = Object.keys($artiStore)[i]
    ctxtForFilename.push(currCtxt)
    for (let j = 0; j < $artiStore[currCtxt].length; j++) {
      let row = currCtxt + "|" + $artiStore[currCtxt][j].arti_id + "|" + $artiStore[currCtxt][j].name + "|" + $artiStore[currCtxt][j].type + "|" + $artiStore[currCtxt][j].fixed + "|" + $artiStore[currCtxt][j].persistence + "|" + $artiStore[currCtxt][j].artiNotes + "|" + $artiStore[currCtxt][j].recorder + "|" + $artiStore[currCtxt][j].dateRecorded + "\n"
      ctxt += row
    }
    artiCSVs.push(ctxt)
  }

  var zip = new JSZip();

  zip.file("contexts.csv", ctxtCSV);

  var artis = zip.folder("artifacts");
  for (let i = 0; i < artiCSVs.length; i++) {
    let fn = ctxtForFilename[i] + "_annotations"
    artis.file(fn + ".csv",  artiCSVs[i]);
  }

  zip.generateAsync({type:"blob"}).then(function(content) {
      saveAs(content, "ctxt.zip");
  });

}

function download_as_coco() {
  saveAs($fileList[$setImg], 'pic.jpg');  
}

function download_as_voc() {
  let ctxtForFilename = [];
  let totalImgs = [];

  for (let i = 0; i < Object.keys($ctxtStore).length; i++) {
    let ref = Object.keys($ctxtStore)[i]
    ctxtForFilename.push($ctxtStore[ref][0].file)

    let base = `<annotation>
  <folder>iss_images</folder>
  <filename>${$ctxtStore[ref][0].file}</filename>
  <path>${$fileList[$ctxtStore[ref][0].file]}</path>
  <source>
    <database>Unknown</database>
  </source>
  <size>
    <width>${$exifData[$ctxtStore[ref][0].file]["Image Width"].value}</width>
    <height>${$exifData[$ctxtStore[ref][0].file]["Image Height"].value}</height>
    <depth>3</depth>
  </size>
  <segmented>0</segmented>`;
    
    if ($artiStore[ref] !== undefined) {
      for (let j = 0; j < Object.keys($artiStore[ref]).length; j++) {
        
        let coords = Object.values($shpStore[ref])[j].target.selector.value
        let obj;
        if (Object.values($shpStore[ref])[j].target.selector.type === "FragmentSelector") {
          coords = coords.replace(/[^0-9\.]+/g," ");
          coords = coords.split(" ");
          coords.shift()

          let xmax = Number(coords[0]) + Number(coords[2])
          let ymax = Number(coords[1]) + Number(coords[3])
          coords[2] = xmax;
          coords[3] = ymax;
        
        } else {
          let x = [];
          let y = [];
          coords = coords.replace(/[^0-9.,]/g," ");
          coords = coords.split(" ");
          coords = coords.filter(Boolean);

          for (let n = 0; n < coords.length; n++) {
            let sep = coords[n].split(",")
            x.push(sep[0])
            y.push(sep[1])

          }    
          coords = [Math.min(...x), Math.min(...y), Math.max(...x), Math.max(...y)]
        }

        obj = `
  <object>
    <name>${$artiStore[ref][j].arti_id}</name>
    <pose>Unspecified</pose>
    <truncated>0</truncated>
    <difficult>0</difficult>
    <bndbox>
      <xmin>${coords[0]}</xmin>
      <ymin>${coords[1]}</ymin>
      <xmax>${coords[2]}</xmax>
      <ymax>${coords[3]}</ymax>
    </bndbox>
  </object>`;  

        base += obj;
      }
    }
  
    base += `
</annotation>`;
    totalImgs.push(base)
  }

  var zip = new JSZip();

  var annotatedData = zip.folder("annotations");
  for (let i = 0; i < totalImgs.length; i++) {
    let fn = ctxtForFilename[i] + ".xml"
    annotatedData.file(fn, totalImgs[i]);
  }

  var baseImgs = zip.folder("images");
  for (let i = 0; i < totalImgs.length; i++) {
    baseImgs.file(ctxtForFilename[i], $fileList[ctxtForFilename[i]]);
  }

  zip.generateAsync({type:"blob"}).then(function(content) {
      saveAs(content, "pascal_voc.zip");
  });             
}

function save_project() {
  let fullSave = [];
  for (let i = 0; i < Object.keys($ctxtStore).length; i++) {
    let currInfo = {}
    let ref = Object.keys($ctxtStore)[i]
    currInfo[ref] = { 
                      file: Object.values($ctxtStore)[i][0].file,
                      provenance: Object.values($ctxtStore)[i][1].provenance, 
                      photographer: Object.values($ctxtStore[ref][1].photographer)[0],
                      type: Object.values($ctxtStore)[i][1].type,
                      square: Object.values($ctxtStore)[i][1].square,
                      module: Object.values($ctxtStore)[i][1].module,
                      orbital_seg: Object.values($ctxtStore[ref][1].orbital_seg)[0],
                      agency: Object.values($ctxtStore[ref][1].agency)[0],
                      ctxt_type: Object.values($ctxtStore)[i][1].ctxt_type,
                      desc: Object.values($ctxtStore)[i][1].desc,
                      interp: Object.values($ctxtStore)[i][1].interp,
                      problems: Object.values($ctxtStore)[i][1].problems,
                      exifInfo: JSON.stringify($exifData[Object.values($ctxtStore)[i][0].file]),
                      artifacts: [],
                    }

    for (let j = 0; j < Object.keys($artiStore[ref]).length; j++) {
      currInfo[ref].artifacts.push({
                                  arti_id: $artiStore[ref][j].arti_id, 
                                  name: $artiStore[ref][j].name, 
                                  type: $artiStore[ref][j].type,
                                  fixed: $artiStore[ref][j].fixed,
                                  persistence: $artiStore[ref][j].persistence,
                                  artiNotes: $artiStore[ref][j].artiNotes,
                                  recorder: $artiStore[ref][j].recorder,
                                  dateRecorded: $artiStore[ref][j].dateRecorded,
                                  shapeInfo: Object.values($shpStore[ref])[j]
                                });      
    }

    currInfo[ref].artifacts = JSON.stringify(currInfo[ref].artifacts);
    fullSave.push(currInfo);  
  }

  write_to_json(fullSave);

}


async function write_to_json(data) {
  await fetch(`/`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers:{
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(res => console.log(res)); 
}

function load_project() {

}

</script>

  <svelte:head>
    <meta charset="UTF-8">
    <title>ISSAP Image Excavation Tool</title>
  </svelte:head>

  <body>
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
              <li on:click={() => load_project()} title="Load project (from a JSON file)">Load</li>
              <li on:click={() => save_project()} title="Save this project (as a JSON file)">Save</li>
              <li on:click={() => curr_display("settings_panel")} title="Show/edit project settings">Settings</li>
              <li class="submenu_divider"></li>
              <li on:click={() => {fileInput.click();}} title="Add images locally stored in this computer">Add local files</li>
                <input bind:files style="display:none" type="file" accept="image/*" multiple on:change={(e)=>accessFunc.upload_images(e)} bind:this={fileInput} >
              <!-- <li on:click={() => project_file_add_url_with_input()} title="Add images from a web URL (e.g. http://www.robots.ox.ac.uk/~vgg/software/via/images/swan.jpg)">Add files from URL</li>
              <li on:click={() => project_file_add_abs_path_with_input()} title="Add images using absolute path of file (e.g. /home/abhishek/image1.jpg)">Add file using absolute path</li>
              <li on:click={() => sel_local_data_file('files_url')} title="Add images from a list of web url or absolute path stored in a text file (one url or path per line)">Add url or path from text file</li> -->
            </ul>
          </li>

          <li>Annotation
            <ul>
              <li on:click={() => download_as_csv()} title="Export annotations to a CSV file">Export Annotations (as csv)</li>
              <li on:click={() => download_as_coco()} title="Export annotations to COCO (http://cocodataset.org) format">Export Annotations (COCO format)</li>
              <li on:click={() => download_as_voc()} title="Export annotations to Pascal VOC format">Export Annotations (Pascal VOC format)</li>
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
      <div class="toolbar" id="right_toolbar">
        <Save20 on:click={() => save_project()}/>
      </div>
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

            <div class="img_grid">
              {#each Object.keys($fileList) as ctxt}
        
                    <!-- svelte-ignore a11y-img-redundant-alt -->
                    <img on:click={()=> jump_to_image(ctxt)} src={$fileList[ctxt]} alt="ISS photo">
                
              {:else}
                <p>loading...</p>
              {/each}
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
                <select ></select>
              </div>
            </div>

            <div class="row">
              <div class="variable">
                <div class="name">Region Colour</div>
                <div class="desc">By default, each region is drawn using a single colour. Using this setting, you can assign a unique colour to regions grouped according to a region attribute.</div>
              </div>

              <div class="value">
                <select></select>
              </div>
            </div>

            <div class="row">
              <div class="variable">
                <div class="name">Region Label Font</div>
                <div class="desc">Font size and font family for showing region labels.</div>
              </div>

              <div class="value">
                <input placeholder="12px Arial"/>
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
                <select>
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
              <li><b>BEFORE YOU BEGIN:</b> Ensure the images you want to upload are in the "public/iss_images/" folder.</li>
              <li>To start annotation, go to "Project" tab in the menu OR in the sidebar on the right of the screen to load in some image files. Hold down the SHIFT key + click and drag to draw an annotation (NOTE: When drawing polygons, double click to close the shape). You can use the toolbar on the left to change the shape which you use to annotate, zoom in/out of the selected image, and modify the regions you're creating when annotating.</li>
              <li>For each annotation you create, use the annotation editor at the bottom of the screen to add information. To add more categorizations/options to any of the attributes, use "Modify Attributes" located in the sidebar on the right of the screen.</li>
              <li>Remember to <span class="text_button" on:click={() => save_project()}>save</span> your project before closing this application so that you can <span class="text_button" on:click={() => load_project()}>load</span> it later to continue annotation.</li>
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

      <div bind:this="{scrollToDiv}" id="container__bottom">
        <Annotation_Editor/>
      </div>
    
      <!-- end of middle_panel -->
    </div> 

    <!-- leftsidebar -->
    <div id="container__left">
      <Sidebar bind:this={accessFunc}/>
    </div>

  </body>