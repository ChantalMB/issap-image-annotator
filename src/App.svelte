<script>

import { onMount } from 'svelte';
import { tick } from 'svelte';

import Save20 from "carbon-icons-svelte/lib/Save20";


import { pointlessStore, infoStore, projName, selectDisplay, setImg, exifData, selectedID, artiStore, fileList, ctxtStore, shpStore, rowCheck, changingPicture, jumpToImgPanel } from './stores.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';


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

$: if ($infoStore === {}) {
  curr_display("page_start_info")
}

$: if ($selectDisplay) {
  console.log($selectDisplay)
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
  $selectDisplay = selection;
}

let files, fileInput, image;
let allFiles = [];

$: if (allFiles.length > 0) {
    accessFunc.create_struct();

}

let scrollToDiv;

async function autoScroll() {
		await tick(); // Wait until DOM was updated
		scrollToDiv.scrollTo({ top: scrollToDiv.scrollHeight, behavior: 'smooth' }); // Scroll to the bottom of the container
	}

$: if ($rowCheck) {
    autoScroll();
}

function jump_to_image(f) {
  $selectDisplay = "image_panel"
  $jumpToImgPanel = true;

  let key;
  for (let i = 0; i < Object.values($infoStore).length; i++) {
    if (Object.values($infoStore)[i][0].filename === f) {
      key = Object.keys($infoStore)[i];
    }
  }
  console.log(key)

  if ($selectedID !== key) {
    if ($selectedID === "") {
      $selectedID = key;
    } else {
      document.getElementById($infoStore[$selectedID][0].filename).style.borderLeft = "";
      document.getElementById($infoStore[$selectedID][0].filename).style.fontWeight = "";
      $selectedID = key;
    }
  }

  $setImg = f;
}

function download_as_csv() {
  let ctxtCSV = "Filename|Context_Number|Provenance|Photographer|Square|Module|Orbital_Segment|Agency|Context_Type|Description|Interpretation|Problems\n"

  for (let i = 0; i < Object.keys($infoStore).length; i++) {
    let ctxtRef = Object.keys($infoStore)[i] 
    let currRow = $infoStore[ctxtRef][0].filename + "|" + ctxtRef + "|" + $infoStore[ctxtRef][0].provenance + "|" + Object.values($infoStore[ctxtRef][0].photographer) + "|" + $infoStore[ctxtRef][0].square + "|" + $infoStore[ctxtRef][0].module + "|" + Object.values($infoStore[ctxtRef][0].orbital_seg) + "|" + Object.values($infoStore[ctxtRef][0].agency) + "|" + $infoStore[ctxtRef][0].ctxt_type + "|" + $infoStore[ctxtRef][0].desc + "|" + $infoStore[ctxtRef][0].interp + "|" + $infoStore[ctxtRef][0].problems + "\n";
    ctxtCSV += currRow
  }
  
  let artiCSVs = [];
  let ctxtForFilename = [];
  
  for (let i = 0; i < Object.keys($infoStore).length; i++) {
    let ctxt = "Context_Number|Artifact_ID|Name|Type|Fixed|Persistence|Notes|Recorded_by|Date_Added\n"
    let ctxtRef = Object.keys($infoStore)[i]
    ctxtForFilename.push(ctxtRef)
    console.log(ctxtRef)
    for (let j = 0; j < $infoStore[ctxtRef][0].artifacts.length; j++) {
      console.log($infoStore[ctxtRef][0].artifacts[j])
      let row = ctxtRef + "|" + $infoStore[ctxtRef][0].artifacts[j].arti_id + "|" + $infoStore[ctxtRef][0].artifacts[j].name + "|" + $infoStore[ctxtRef][0].artifacts[j].type + "|" + $infoStore[ctxtRef][0].artifacts[j].fixed + "|" + $infoStore[ctxtRef][0].artifacts[j].persistence + "|" + $infoStore[ctxtRef][0].artifacts[j].artiNotes + "|" + $infoStore[ctxtRef][0].artifacts[j].recorder + "|" + $infoStore[ctxtRef][0].artifacts[j].dateRecorded + "\n"
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
      saveAs(content, "ISSAP_project_data_csv.zip");
  });

}

function download_as_coco() {
  saveAs($fileList[$setImg], 'pic.jpg');  
}

function download_as_voc() {
  let ctxtForFilename = [];
  let totalImgs = [];

  for (let i = 0; i < Object.keys($infoStore).length; i++) {
    let ref = Object.keys($infoStore)[i]
    ctxtForFilename.push($infoStore[ref][0].filename)

    let base = `<annotation>
  <folder>iss_images</folder>
  <filename>${$infoStore[ref][0].filename}</filename>
  <path>${$infoStore[ref][0].filepath}</path>
  <source>
    <database>Unknown</database>
  </source>
  <size>
    <width>${$infoStore[ref][0].exifInfo["Image Width"].value}</width>
    <height>${$infoStore[ref][0].exifInfo["Image Height"].value}</height>
    <depth>3</depth>
  </size>
  <segmented>0</segmented>`;
    
    if ($infoStore[ref][0].artifacts !== []) {
      for (let j = 0; j < $infoStore[ref][0].artifacts.length; j++) {
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
    <name>${$infoStore[ref][0].artifacts[j].type}</name>
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
    baseImgs.file(ctxtForFilename[i], $infoStore[Object.keys($infoStore)[i]][0].filename);
  }

  zip.generateAsync({type:"blob"}).then(function(content) {
      saveAs(content, "ISSAP_project_data_pascal_voc.zip");
  });             
}

function save_project() {
  let fullSave = $infoStore;
  for (let i = 0; i < Object.keys(fullSave).length; i++) {
    let ref = Object.keys(fullSave)[i]
    for (let j = 0; j < fullSave[ref][0].artifacts.length; j++) {
      if ($shpStore[ref] !== undefined) {
        fullSave[ref][0].artifacts[j].shpInfo = Object.values($shpStore[ref])[j]
      }
    }
    fullSave[ref][0].artifacts = JSON.stringify(fullSave[ref][0].artifacts);
  }

  console.log(fullSave)

  write_to_json(fullSave);

  fullSave = {};

}


async function write_to_json(data) {
  // TO DO: PASS $NAME FOR FILE SAVE NAME
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

        {#if $selectDisplay === "image_panel"}
          <Annotation_Canvas files={files} />

        {:else if $selectDisplay === "image_grid_panel"}
          <div id="image_grid_panel" class="display_area_content">

            <div id="image_grid_group_panel">
              <span class="tool">Group by&nbsp; <select id="image_grid_toolbar_group_by_select" onchange="image_grid_toolbar_onchange_group_by_select(this)"></select></span>
            </div>

            <div class="img_grid">
              {#each Object.entries($infoStore) as ctxt}
        
                    <!-- svelte-ignore a11y-img-redundant-alt -->
                    <img on:click={()=> jump_to_image(ctxt[1][0].filename)} src={ctxt[1][0].filepath} alt="ISS photo">
                
              {:else}
                <p>loading...</p>
              {/each}
            </div>

            
          </div> <!-- end of image grid panel -->

        {:else if $selectDisplay === "settings_panel"}
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

        {:else if $selectDisplay === "page_404"}
          <div id="page_404" class="display_area_content narrow_page_content">
            <h2>File Not Found</h2>
            <p>Filename: <span style="font-family:Mono;" id="page_404_filename"></span></p>

            <p>We recommend that you update the default path in <span class="text_button" title="Show Project Settings" on:click={() => settings_panel_toggle()}>project settings</span> to the folder which contains this image.</p>

            <p>A temporary fix is to use <span class="text_button" title="Load or Add Images" on:click={(e)=>accessFunc.upload_images(e)}>browser's file selector</span> to manually locate and add this file. We do not recommend this approach because it requires you to repeat this process every time your load this project in the application.</p>
          </div> <!-- end of file not found panel -->

        {:else if $selectDisplay === "page_start_info"}
          <div id="page_start_info" class="display_area_content narrow_page_content">
            <ul>
              <li><b>BEFORE YOU BEGIN:</b> Ensure the images you want to upload are in the "public/iss_images/" folder.</li>
              <li>To start annotation, go to "Project" tab in the menu OR in the sidebar on the right of the screen to load in some image files. Hold down the SHIFT key + click and drag to draw an annotation (NOTE: When drawing polygons, double click to close the shape). You can use the toolbar on the left to change the shape which you use to annotate, zoom in/out of the selected image, and modify the regions you're creating when annotating.</li>
              <li>For each annotation you create, use the annotation editor at the bottom of the screen to add information. To add more categorizations/options to any of the attributes, use "Modify Attributes" located in the sidebar on the right of the screen.</li>
              <li>Remember to <span class="text_button" on:click={() => save_project()}>save</span> your project before closing this application so that you can <span class="text_button" on:click={() => load_project()}>load</span> it later to continue annotation.</li>
            </ul>
          </div>

        {:else if $selectDisplay === "page_load_ongoing"}
          <div id="page_load_ongoing" class="display_area_content narrow_page_content">
            <div style="text-align:center">
              <div style="margin-top:4rem">Loading ...</div>
            </div>
          </div>

        {:else if $selectDisplay === "page_about"}
          <div id="page_about" class="display_area_content" style="width:40rem !important">
            <div style="text-align:center">
              <div style="margin-top:4rem">Guide</div>
            </div>
            <p style="font-family:mono; font-size:0.8em;text-align:center;">//TO DO</p>
          </div> 
          <!-- end of page_about -->

        {:else if $selectDisplay === "page_license"}

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