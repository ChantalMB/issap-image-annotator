<script>

import { jumpToImgPanel, ctxtStore, infoStore, projName, select_display, exifData, fileList, setImg, selectedID, changingPicture, artiStore, shpStore, rmImg, showImg } from './stores.js';
import ExifReader from 'exifreader';
import Grid20 from "carbon-icons-svelte/lib/Grid20";
import Image20 from "carbon-icons-svelte/lib/Image20";


let files = null; 
let fileInput, image, template;
let allFiles = [];
let p;

$: if (p) {
    $projName = p;
}


function create_struct() {
    if (Object.keys($infoStore).length > 0) {
        for (let i = 0; i < allFiles.length; i++) {
            if (Object.keys($infoStore).indexOf(allFiles[i]) === -1) {
                let ctxtNum = "ctxt_" + i;
                $infoStore[allFiles[i]] = { 
                    "Context_Number":{},
                    "Square":{"type":"text","description":"","default_value":""},
                    "Module":{"type":"text","description":"","default_value":""},
                    "Orbital_Segment":{"type":"dropdown","description":"Orbital Segment","options":{"us":"USA","eur":"ESA","unknown":"Unknown"},"default_options":{"unknown":true}},
                    "Agency":{"type":"dropdown","description":"Agency","options":{"esa":"ESA","nasa":"NASA","unknown":"Unknown"},"default_options":{"unknown":true}},
                    "Context_type":{"type":"text","description":"","default_value":""},
                    "Description":{"type":"text","description":"","default_value":""},
                    "Interpretation":{"type":"text","description":"","default_value":""},
                    "Problems":{"type":"text","description":"","default_value":""},
                    "Artifacts":{},
                };
                $infoStore[allFiles[i]]["Context_Number"] = ctxtNum;


                $ctxtStore[ctxtNum] =[{"file": allFiles[i]}]
            }
        }

    } else {
        let tempObj = {};
        for (let i = 0; i < allFiles.length; i++) {
            let ctxtNum = "ctxt_" + i;
            tempObj[allFiles[i]] = {
                "Context_Number":{},
                "Square":{"type":"text","description":"","default_value":""},
                "Module":{"type":"text","description":"","default_value":""},
                "Orbital_Segment":{"type":"dropdown","description":"Orbital Segment","options":{"us":"USA","eur":"ESA","unknown":"Unknown"},"default_options":{"unknown":true}},
                "Agency":{"type":"dropdown","description":"Agency","options":{"esa":"ESA","nasa":"NASA","unknown":"Unknown"},"default_options":{"unknown":true}},
                "Context_type":{"type":"text","description":"","default_value":""},
                "Description":{"type":"text","description":"","default_value":""},
                "Interpretation":{"type":"text","description":"","default_value":""},
                "Problems":{"type":"text","description":"","default_value":""},
                "Artifacts":{},
                };

            tempObj[allFiles[i]]["Context_Number"] = ctxtNum;

            $ctxtStore[ctxtNum] =[{"file": allFiles[i]}]

        }
        $infoStore = tempObj;
    }
    console.log("INFO STORE SET")
}

$: if (allFiles.length > 0) {
  create_struct();
}

$: if (allTags.length > 0) {
    for (let i = 0; i < allFiles.length; i++) {
        $exifData[allFiles[i]] = allTags[i]
    }
    console.log($exifData)
    $select_display = "image_panel"
}

let allTags = [];
export const upload_images=(e)=> {
		for (let i = 0; i < e.target.files.length; i++) {
			image = e.target.files[i];
      $fileList[image.name] = "/iss_images/" + image.name;

      allFiles = [...allFiles, image.name]

      let reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onload = e => {
        ExifReader.load(e.target.result).then(function (tags) {
                        allTags = [...allTags, tags];
        });
      }
		}
}

$: if ($selectedID !== "") {
    document.getElementById($selectedID).style.borderLeft = "0.2rem solid black";
    document.getElementById($selectedID).style.fontWeight = "bold";
  } 
  
function jump_to_image(f) {
  $changingPicture = true;
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

function remove_file() {
  let currPos = Object.keys($fileList).indexOf($setImg);

  let byCtxt = $selectedID;
  var result = Object.values($infoStore).find(obj => {
            return obj.Context_Number === byCtxt
        })
  let byFile = Object.keys($infoStore)[Object.values($infoStore).indexOf(result)]

  if (confirm("Are you sure you would like to remove file " + $ctxtStore[$selectedID][0].file + "?")) {
    $rmImg = true;
    const indexCtxt = Object.keys($ctxtStore).indexOf($selectedID);
    if (indexCtxt > -1) {
      let oc = Object.keys($ctxtStore)[indexCtxt]
      let oa = Object.keys($artiStore)[indexCtxt]
      let os = Object.keys($shpStore)[indexCtxt]
      delete $ctxtStore[oc];
      delete $artiStore[oa];
      delete $shpStore[os];


      $ctxtStore = $ctxtStore;
      $artiStore = $artiStore;
      $shpStore = $shpStore;
    }    

    const indexInfo = Object.keys($infoStore).indexOf(byFile);
    if (indexInfo > -1) {
      let oi = Object.keys($infoStore)[indexInfo]
      let oe = Object.keys($exifData)[indexInfo]
      let of = Object.keys($fileList)[indexInfo]


      delete $infoStore[oi];
      delete $exifData[oe];
      delete $fileList[of];


      $infoStore = $infoStore;
      $exifData = $exifData;
      $fileList = $fileList;
    }

    console.log(Object.keys($fileList).length > 0)
    if (currPos >= 0 && Object.keys($fileList).length > 0) {
      if (currPos > 0) {
        currPos -= 1;
      }
      console.log("pos op1")
      $setImg = Object.keys($fileList)[currPos];
      $changingPicture = true;
      $selectedID = Object.keys($ctxtStore)[currPos]

    } else {
      // TO DO: NOT SURE HOW WELL THIS WILL WORK WITH PERSISTANT STORAGE
      // IF I WANT STORE VARIABLES TO PERSIST THEN RELOAD WILL DO NOTHING
      window.location.reload()

    }
    
    console.log($infoStore)
    console.log($ctxtStore)
    console.log($artiStore)
    console.log($shpStore)
    console.log($exifData)
    console.log($fileList)




  } else {
      text = "You cancelled!";
  }
}

function return_to_img_panel(f) {
  if ($select_display !== "image_panel") {
    $select_display = "image_panel"
    $jumpToImgPanel = true;
  }
}


</script>

<div id="leftsidebar">

    <!-- Project -->
    <button class="leftsidebar_accordion active" id="project_panel_title">Project</button>
    <div class="leftsidebar_accordion_panel show" id="img_fn_list_panel show">
      <div id="project_info_panel">
        <div class="row">
          <span class="col"><label for="project_name">Name: </label></span>
          <span class="col"><input bind:value={p} type="text" id="project_name" title="project name"></span>
        </div>
      </div>
      <div id="project_tools_panel">
        <div class="button_panel" style="margin:0.1rem 0;" >
          <select style="width:48%" id="infoStore_preset_filters_list" onchange="img_fn_list_onpresetfilter_select()" title="Filter file list using predefined filters">
            <option value="all">All files</option>
            <option value="files_missing_file_annotations">Show files missing annotations</option>
          </select>
          <div on:click={() => ($select_display = "image_grid_panel")} style="font-size: 2em;" id="img_toggle"><Grid20 /><title>Switch to Image Grid View</title></div>
          <div on:click={() => return_to_img_panel($selectedID)} style="font-size: 2em;" id="img_toggle"><Image20 /><title>Switch to Image Grid View</title></div>
        </div>
      </div>
      <div id="img_fn_list">
        <ul>
          {#each Object.keys($infoStore) as file}
            <li id={$infoStore[file]["Context_Number"]} on:click={()=> jump_to_image(file)} title={file} class="buffered">{file}</li>
          {/each}
        </ul>
      </div>
      <p>
        <div class="button_panel">
          <span class="button" on:click={()=>{fileInput.click();}} title="Add new file from local disk">Add Files</span>
            <input bind:files style="display:none" type="file" accept="image/*" multiple on:change={(e)=>upload_images(e)} bind:this={fileInput} >
          <span class="button" on:click={() => remove_file()} title="Remove selected file (i.e. file currently being shown) from project">Remove</span>
        </div>
    </div>

    <button class="leftsidebar_accordion">Keyboard Shortcuts</button>
    <div class="leftsidebar_accordion_panel">
      <div style="display:block; text-align:center; padding:1rem;">Available only on image focus</div>
      <table>
        <tr>
          <td style="width:8em;"><span class="key">&larr;</span>&nbsp;<span class="key">&uarr;</span>&nbsp;<span class="key">&rarr;</span>&nbsp;<span class="key">&darr;</span></td>
          <td>Move selected region by 1 px (Shift to jump)</td>
        </tr>
        <tr>
          <td><span class="key">a</span></td>
          <td>Select all regions</td>
        </tr>

        <tr>
          <td><span class="key">c</span></td>
          <td>Copy selected regions</td>
        </tr>
        <tr>
          <td><span class="key">v</span></td>
          <td>Paste selected regions</td>
        </tr>
        <tr>
          <td><span class="key">Backspace</span></td>
          <td>Delete selected regions</td>
        </tr>
        <tr>
          <td><span class="key">Ctrl</span> + Wheel</td>
          <td>Zoom in/out (mouse cursor is over image)</td>
        </tr>
        <tr>
          <td><span class="key">l</span></td>
          <td>Toggle region label</td>
        </tr>
        <tr>
          <td><span class="key">b</span></td>
          <td>Toggle region boundary</td>
        </tr>
        <tr>
          <td><span class="key">Enter</span></td>
          <td>Finish drawing polyshape</td>
        </tr>
        <tr>
          <td><span class="key">d</span></td>
          <td>Delete last polyshape vertex</td>
        </tr>
      </table>

      <div style="display:block; text-align:center; padding:1rem;">Always Available</div>
      <table>
        <tr>
          <td style="width:8em;"><span class="key">&larr;</span>&nbsp;<span class="key">&rarr;</span></td>
          <td>Move to next/previous image</td>
        </tr>
        <tr>
          <td><span class="key">+</span>&nbsp;<span class="key">-</span>&nbsp;<span class="key">=</span></td>
          <td>Zoom in/out/reset</td>
        </tr>
        <tr>
          <td><span class="key">&uarr;</span></td>
          <td>Update region label</td>
        </tr>
        <tr>
          <td><span class="key">&darr;</span></td>
          <td>Update region colour</td>
        </tr>
        <tr>
          <td><span class="key">Spacebar</span></td>
          <td>Toggle annotation editor (Ctrl to toggle on image editor)</td>
        </tr>
        <tr>
          <td><span class="key">Home</span> / <span class="key">h</span></td>
          <td>Jump to first image</td>
        </tr>
        <tr>
          <td><span class="key">End</span> / <span class="key">e</span></td>
          <td>Jump to last image</td>
        </tr>
        <tr>
          <td><span class="key">PgUp</span> / <span class="key">u</span></td>
          <td>Jump several images</td>
        </tr>
        <tr>
          <td><span class="key">PgDown</span> / <span class="key">d</span></td>
          <td>Jump several images</td>
        </tr>

        <tr>
          <td><span class="key">Esc</span></td>
          <td>Cancel ongoing task</td>
        </tr>
      </table>
    </div>
</div>