<script>

import { onMount } from 'svelte';
import { tick } from 'svelte';

import Save20 from "carbon-icons-svelte/lib/Save20";
import { Diamonds } from 'svelte-loading-spinners'



import { typeCategory, infoStore, projName, selectDisplay, setImg, exifData, selectedID, artiStore, fileList, ctxtStore, shpStore, rowCheck, changingPicture, jumpToImgPanel, astroCategory } from './stores.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import area from 'area-polygon';


import Sidebar from './Sidebar.svelte';

import Annotation_Editor from './Annotation_Editor.svelte';

import Annotation_Canvas from './Annotation_Canvas.svelte'
import Toolbar from './Toolbar.svelte';
import Image_Grid from './Image_Grid.svelte'


let accessFunc;

let files, fileInputImgs;
let allFiles = [];

let scrollToDiv;

let dataLoading = false;

let fileInputJSON;
let chckFilelist = false;


onMount(async () => {
  console.log("ISSAP Image Excavation Tool");
  init_sidebar_accordion();
  init_anno_accordion();
  curr_display("page_start_info");

});

// if there are no pictures show start page
$: if ($infoStore === {}) {
  curr_display("page_start_info")
}

$: if ($selectDisplay) {
  console.log($selectDisplay)
}


// accordion dropdown for sidebar
function init_sidebar_accordion() {
  var sidebar = document.getElementById('sidebar');
  sidebar.style.width = '18rem';

  var acc = document.getElementsByClassName('sidebar_accordion');
  var i;
  for ( i = 0; i < acc.length; ++i ) {
    acc[i].addEventListener('click', function() {
      this.classList.toggle('active');
      this.nextElementSibling.classList.toggle('show');
    });
  }
}

// accordion dropdown for toolbar
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

// sets the main editor window
function curr_display(selection) {
  $selectDisplay = selection;
}

$: if (allFiles.length > 0) {
    accessFunc.create_struct();

}

// autoscroller when annotation is added to annotation editor
async function autoScroll() {
		await tick(); // Wait until DOM is updated
		scrollToDiv.scrollTo({ top: scrollToDiv.scrollHeight, behavior: 'smooth' }); // Scroll to the bottom of the container
}

$: if ($rowCheck) {
    autoScroll();
}

// jumps to selected image file
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
    $selectedID = key;
  }

  $setImg = f;
}

// download current project as line-separated CSV
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
    let ctxt = "Context_Number|Artifact_ID|xmin|ymin|xmax|ymax|Name|Type|Fixed|Persistence|Notes|Recorded_by|Date_Added\n"
    let ctxtRef = Object.keys($infoStore)[i]
    ctxtForFilename.push(ctxtRef)
    console.log(ctxtRef)
    for (let j = 0; j < $infoStore[ctxtRef][0].artifacts.length; j++) {
      let coords = Object.values($shpStore[ctxtRef])[j].target.selector.value

      let obj;
      if (Object.values($shpStore[ctxtRef])[j].target.selector.type === "FragmentSelector") {
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

      console.log($infoStore[ctxtRef][0].artifacts[j])
      
      let row = ctxtRef + "|" + $infoStore[ctxtRef][0].artifacts[j].arti_id + "|" + coords[0] + "|" + coords[1] + "|" + coords[2] + "|" + coords[3] + "|" + $infoStore[ctxtRef][0].artifacts[j].name + "|" + $infoStore[ctxtRef][0].artifacts[j].type + "|" + $infoStore[ctxtRef][0].artifacts[j].fixed + "|" + $infoStore[ctxtRef][0].artifacts[j].persistence + "|" + $infoStore[ctxtRef][0].artifacts[j].artiNotes + "|" + $infoStore[ctxtRef][0].artifacts[j].recorder + "|" + $infoStore[ctxtRef][0].artifacts[j].dateRecorded + "\n"
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


// download current projected in COCO format
function download_as_coco() {
  let saveCOCO = {
                  'info': {},
                  'licenses': [],
                  'images': [],
                  'categories': [],
                  'annotations': [],
                };

  saveCOCO['info'] = {
                      'year': 2022,
                      'version': 'v1.0',
                      'description': 'ISSAP object detection dataset',
                      'contributor': 'ISSAP',
                      'url': 'https://github.com/ChantalMB/issap-image-annotator',
                      'date_created': '2022-01-12T02:29'
                    };

  saveCOCO['licenses'].push({
                            'url': 'https://creativecommons.org/licenses/by-nc/4.0/',
                            'id': 1,
                            'name': 'Attribution-NonCommercial'
                            });

  let uniqueCates = new Set(); 
  let annoCount = 0;                         
  for (let i = 0; i < Object.keys($infoStore).length; i++) {
    let ref = Object.keys($infoStore)[i];
    saveCOCO['images'].push({
                            "id": Number(ref.split('_')[1]), 
                            "width": $infoStore[ref][0].exifInfo["Image Width"].value, 
                            "height": $infoStore[ref][0].exifInfo["Image Width"].value, 
                            "file_name": $infoStore[ref][0].filename, 
                            "license": 1, 
                            "date_captured": $infoStore[ref][0].provenance,
                            })

    if ($infoStore[ref][0].artifacts !== []) {
      for (let j = 0; j < $infoStore[ref][0].artifacts.length; j++) {
        uniqueCates.add([$infoStore[ref][0].artifacts[j].name, $infoStore[ref][0].artifacts[j].type].toString())
        let coords = Object.values($shpStore[ref])[j].target.selector.value
        if (Object.values($shpStore[ref])[j].target.selector.type === "FragmentSelector") {
          coords = coords.replace(/[^0-9\.]+/g," ");
          coords = coords.split(" ");
          coords.shift()

          let bbox = [];
          for (let n = 0; n < coords.length; n++) {
            coords[n] = Number(coords[n]);
            bbox.push(Number(coords[n]));
          }
           

          let xmax = Number(coords[0]) + Number(coords[2])
          let ymax = Number(coords[1]) + Number(coords[3])
          coords[2] = xmax;
          coords[3] = ymax;

          let calcArea = [[coords[0], coords[1]], [coords[0], coords[2]], [coords[3], coords[2]], [coords[3], coords[1]]];
          let segmentation = [coords[0], coords[1], coords[0], coords[2], coords[3], coords[2], coords[3], coords[1]];
          saveCOCO['annotations'].push({
                                      "segmentation": [segmentation],
                                      "area": area(calcArea),
                                      "iscrowd": 0,
                                      "image_id": Number(ref.split('_')[1]),
                                      "bbox": bbox,
                                      "category_id": 0,
                                      "id": annoCount,
                                      'tempNm': $infoStore[ref][0].artifacts[j].name,
                                    });
        
        } else {
          let x = [];
          let y = [];
          coords = coords.replace(/[^0-9.,]/g," ");
          coords = coords.split(" ");
          coords = coords.filter(Boolean);

          let segmentation = [];
          let calcArea = [];
          for (let n = 0; n < coords.length; n++) {
            let sep = coords[n].split(",")
            x.push(sep[0])
            y.push(sep[1])

            segmentation.push(Number(sep[0]));           
            segmentation.push(Number(sep[1]));

            calcArea.push([Number(sep[0]), Number(sep[1])])
          }


          let w = Math.max(...x) - Math.min(...x)
          let h = Math.max(...y) - Math.min(...y)

          let bbox = [Math.min(...x), Math.min(...y), w, h]

          saveCOCO['annotations'].push({
                                      "segmentation": [segmentation],
                                      "area": area(calcArea),
                                      "iscrowd": 0,
                                      "image_id": Number(ref.split('_')[1]),
                                      "bbox": bbox,
                                      "category_id": 0,
                                      "id": annoCount,
                                      'tempNm': $infoStore[ref][0].artifacts[j].name,
                                    });
        }
        annoCount += 1;
      }
    } 
  }

  let cateCount = 0
  for (let item of uniqueCates) {
    let cateRef = item.split(",");
    saveCOCO['categories'].push({
                                'supercategory': cateRef[1], 
                                'id': cateCount, 
                                'name': cateRef[0],
                               })
    cateCount += 1;                           
  }

  for (let c = 0; c < saveCOCO['annotations'].length; c++) {
    let obj = saveCOCO['categories'].find(o => o.name === saveCOCO['annotations'][c].tempNm);
    saveCOCO['annotations'][c].category_id = obj.id;

    delete saveCOCO['annotations'][c].tempNm;
  }

  
  var zip = new JSZip();

  var annotatedData = zip.folder("annotations");
  annotatedData.file('ISSAP_COCO_annotation_data.json', JSON.stringify(saveCOCO))
  for (let i = 0; i < Object.keys($infoStore).length; i++) {
    annotatedData.file($infoStore[Object.keys($infoStore)[i]][0].filename, create_img_file($infoStore[Object.keys($infoStore)[i]][0].filepath));
  }

  zip.generateAsync({type:"blob"}).then(function(content) {
      saveAs(content, "ISSAP_project_data_COCO.zip");
  }); 
}

// download current projected in Pascal VOC format
function download_as_voc() {
  let ctxtForFilename = [];
  let totalImgs = [];

  for (let i = 0; i < Object.keys($infoStore).length; i++) {
    let ref = Object.keys($infoStore)[i]
    ctxtForFilename.push($infoStore[ref][0].filename)

    // why yes I AM creating XML the dirty way
    // we don't talk about it
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
    baseImgs.file($infoStore[Object.keys($infoStore)[i]][0].filename, create_img_file($infoStore[Object.keys($infoStore)[i]][0].filename));
  }

  zip.generateAsync({type:"blob"}).then(function(content) {
      saveAs(content, "ISSAP_project_data_pascal_voc.zip");
  });             
}

// TO DO: trying to get the image to output with the ML formats
async function create_img_file(pathName){
  let response = await fetch(pathName);
  let data = await response.blob();
  let metadata = {
    type: 'image/jpeg'
  };
  let file = new File([data], "test.jpg", metadata);
  return file;
}

// autosave
setInterval(function() {
  save_project();
}, 900000)

function save_project() {
  dataLoading = true;
  let fullSave = JSON.parse(JSON.stringify($infoStore));
  for (let i = 0; i < Object.keys(fullSave).length; i++) {
    let ref = Object.keys(fullSave)[i]
    if (i === 0) {
      console.log("added")
      fullSave[ref][0].categories = $typeCategory
    }
    for (let j = 0; j < fullSave[ref][0].artifacts.length; j++) {
      if ($shpStore[ref] !== undefined) {
        console.log("here")
        fullSave[ref][0].artifacts[j].shpInfo = {};
        fullSave[ref][0].artifacts[j].shpInfo = Object.values($shpStore[ref])[j]
      }
    }
    fullSave[ref][0].artifacts = JSON.stringify(fullSave[ref][0].artifacts);
  }
  let formatSave = JSON.stringify(fullSave)
  let fname = $projName + ".json"
  let blob = new Blob([formatSave], {type: "application/json"});
  saveAs(blob, fname);

  // rm once JSON error fixed?
  console.log("saving...")
  setTimeout(function(){
    dataLoading = false;
    console.log("save complete!")
  }, 1500);
  // write_to_json(fullSave);
}

// CURRENTLY NOT CALLED
// save current project
async function write_to_json(data) {
  // TO DO: PASS NAME FOR FILE SAVE NAME
  let req = {}
  req[$projName] = data

  await fetch(`/`, {
    method: 'POST',
    body: JSON.stringify(req),
    headers:{
      'Content-Type': 'application/json'
    },
  })
  .then(res => res.json())
  .then(res => console.log(res)); 

  console.log("saving...")
  setTimeout(function(){
    dataLoading = false;
    console.log("save complete!")
  }, 1000);

}

// load previous project
const get_project_file=(e)=> {
  let json;
  let reader = new FileReader();

  reader.readAsText(e.target.files[0]);
  reader.onload = e => {
    json = JSON.parse(e.target.result)
    if (typeof(json[Object.keys(json)[0]][0].artifacts) == "string") { 
      for (let i = 0; i < Object.keys(json).length; i++) {
        json[Object.keys(json)[i]][0].artifacts = JSON.parse(json[Object.keys(json)[i]][0].artifacts)
      }
    } 
    console.log(json)
    load_project(json)
  }
}

function load_project(f) {
  let tempShpStore = {}
  let tempTypes = [];

  for ( let i = 0; i < Object.keys(f).length; ++i ) {
    let ctxtRef = Object.keys(f)[i];
    if (i === 0) {
      tempTypes = f[ctxtRef][0].categories
      console.log(tempTypes)
    }
    tempShpStore[ctxtRef] = [];
    for ( let j = 0; j < f[ctxtRef][0].artifacts.length; ++j ) {
      if (f[ctxtRef][0].artifacts[j].shpInfo !== undefined) {
        tempShpStore[ctxtRef].push(f[ctxtRef][0].artifacts[j].shpInfo)
        delete f[ctxtRef][0].artifacts[j].shpInfo;
      }
    }
  }

  $infoStore = f;

  for ( let i = 0; i < Object.keys($infoStore).length; ++i ) {
    let ctxtRef = Object.keys(f)[i]
    if ($infoStore[ctxtRef][0].provenance === '') {
      $infoStore[ctxtRef][0].provenance = $infoStore[ctxtRef][0].exifInfo['DateCreated']['description']
    }
  }

  // $infoStore[ctxtID][0].provenance = tags['DateCreated']['description']

  $shpStore = tempShpStore;
  $typeCategory = tempTypes;
  
  jump_to_image($infoStore[Object.keys($infoStore)[0]][0].filename)
  chckFilelist = true;
}



</script>

  <svelte:head>
    <meta charset="UTF-8">
    <title>ISSAP Image Excavation Tool</title>
  </svelte:head>

  <body>
    <!-- used by invoke_with_user_inputs() to gather user inputs -->
    <div id="user_input_panel"></div>

    <!-- spreadsheet like editor for annotations -->

    <div class="top_panel" id="ui_top_panel">
      <!-- menu bar -->
      <div class="menubar">
        <ul>
          <li>Project
            <ul>
              <li on:click={() => {fileInputJSON.click()}} title="Load project (from a JSON file)">Load Project</li>
                <input bind:files style="display:none" type="file" accept=".json" on:change={(e)=>get_project_file(e)} bind:this={fileInputJSON} >
              <li on:click={() => save_project()} title="Save this project (as a JSON file)">Save</li>
              <li on:click={() => curr_display("settings_panel")} title="Show/edit project settings">Settings</li>
              <li class="submenu_divider"></li>
              <li on:click={() => {fileInputImgs.click()}} title="Add images locally stored in this computer">Add local files</li>
                <input bind:files style="display:none" type="file" accept="image/*" multiple on:change={(e)=>accessFunc.upload_images(e)} bind:this={fileInputImgs} >
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
      {#if dataLoading === true}
        <div class="toolbar" id="right_toolbar" style="margin-top: 1%;">
          <Diamonds size="25" color="white" unit="px" duration="1s"></Diamonds>
        </div>
      {:else}
        <div class="toolbar" id="right_toolbar" style="margin-top: 0.25%;">
          <Save20 on:click={() => save_project()}/>
        </div>
      {/if}
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
          <Image_Grid />


        {:else if $selectDisplay === "settings_panel"}
          <div id="settings_panel" class="display_area_content">
            <h2>Settings</h2>
            <div class="row">
              <div class="variable">
                <div class="name">Project Name</div>
              </div>

              <div class="value">
                <input type="text" id={$projName} placeholder={$projName}/>
              </div>
            </div>

            <!-- CHANGING THIS CURRENTLY DOES NOT DO ANYTHING-->
            <div class="row">
              <div class="variable">
                <div class="name">Default Path</div>
                <div class="desc">If all images in your project are saved in a single folder, set the default path to the location of this folder. The application will load images from this folder by default. Note: a default path of <code>"./"</code> indicates that the folder containing <code>issap.html</code> application file also contains the images in this project. For example: <code>/datasets/VOC2012/JPEGImages/</code> or <code>C:\Documents\data\</code>&nbsp;<strong>(note the trailing <code>/</code> and <code>\</code></strong>)</div>
              </div>
              <div class="value">
                <input type="text" placeholder="/iss_images/"/>
              </div>
            </div>

          </div> <!-- end of settings panel -->

        {:else if $selectDisplay === "page_404"}
          <div id="page_404" class="display_area_content narrow_page_content">
            <h2>File Not Found</h2>
            <p>Filename: <span style="font-family:Mono;" id="page_404_filename"></span></p>

            <p>We recommend that you update the default path in <span class="text_button" title="Show Project Settings" on:click={() => ($selectDisplay === "settings_panel")}>project settings</span> to the folder which contains this image.</p>

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

    <!-- sidebar -->
    <div id="container__left">
      <Sidebar bind:this={accessFunc}/>
    </div>

  </body>