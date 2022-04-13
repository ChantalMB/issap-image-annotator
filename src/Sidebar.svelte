<script>

import { infoStore, jumpToImgPanel, ctxtStore, pointlessStore, projName, selectDisplay, exifData, fileList, setImg, selectedID, changingPicture, artiStore, shpStore, rmImg, showImg } from './stores.js';
import ExifReader from 'exifreader';
import Grid20 from "carbon-icons-svelte/lib/Grid20";
import Image20 from "carbon-icons-svelte/lib/Image20";
import Cursor_116 from "carbon-icons-svelte/lib/Cursor_116";


let files = null; 
let flFilter;

let fileInputImgs, image;

$: ctxtCt = Object.keys($infoStore).length;
export const upload_images=(e)=> {
		for (let i = 0; i < e.target.files.length; i++) {
			image = e.target.files[i];

      let ctxtID = "ctxt_" + ctxtCt;
      console.log(ctxtID)
      $infoStore[ctxtID] = [{
                            filename: image.name,
                            filepath: "/iss_images/" + image.name,
                            exifInfo: {},
                            provenance: '', 
                            photographer: {"unknown":"Unknown"},
                            type: '',
                            square: '',
                            module: '',
                            orbital_seg: {"unknown":"Unknown"},
                            agency: {"unknown":"Unknown"},
                            ctxt_type: '',
                            desc: '',
                            interp: '',
                            problems: '',
                            artifacts: [],
                            }]

      let reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onload = e => {
        ExifReader.load(e.target.result).then(function (tags) {
                        $infoStore[ctxtID][0].exifInfo = tags;
                        if (tags['DateCreated'] !== undefined) {
                          $infoStore[ctxtID][0].provenance = tags['DateCreated']['description']
                        } else {
                          $infoStore[ctxtID][0].provenance = "Undetected";
                        }
        });
      }
      ctxtCt += 1;
		}
    $selectDisplay = "image_panel"
}
  
function jump_to_image(f) {
  $changingPicture = true;

  let key;
  for (let i = 0; i < Object.values($infoStore).length; i++) {
    if (Object.values($infoStore)[i][0].filename === f) {
      key = Object.keys($infoStore)[i];
    }
  }
  
  if ($selectedID !== key) {
    $selectedID = key;
  }

  $setImg = f;

  if ($selectDisplay !== "image_panel") {
    $selectDisplay = "image_panel"
    $jumpToImgPanel = true;

  }
}


function remove_file() {
  let currPos = Object.values($infoStore).flat().findIndex(p => p.filename === $setImg);

  if (confirm("Are you sure you would like to remove file " + $infoStore[$selectedID][0].filename + "?")) {
    $rmImg = true;
    const indexCtxt = Object.keys($infoStore).indexOf($selectedID);
    if (indexCtxt > -1) {
      let oc = Object.keys($infoStore)[indexCtxt]
      let os = Object.keys($shpStore)[indexCtxt]

      delete $infoStore[oc];
      delete $shpStore[os];

      $infoStore = $infoStore;
      $shpStore = $shpStore;
    }
    
    console.log($shpStore)
    console.log($infoStore)


    if (currPos >= 0 && Object.values($infoStore).flat().length > 0) {
      if (currPos > 0) {
        currPos -= 1;
      }
      $setImg = Object.values($infoStore).flat()[currPos].filename;
      $changingPicture = true;
      $selectedID = Object.keys($infoStore)[currPos]

    } else {
      // TO DO: NOT SURE HOW WELL THIS WILL WORK WITH PERSISTANT STORAGE
      // IF I WANT STORE VARIABLES TO PERSIST THEN RELOAD WILL DO NOTHING
      window.location.reload()

    }

  } else {
      text = "You cancelled!";
  }
}

function return_to_img_panel() {
  if ($selectDisplay !== "image_panel") {
    $selectDisplay = "image_panel"
    $jumpToImgPanel = true;
  }
}


</script>

<div id="sidebar">

    <!-- Project -->
    <button class="sidebar_accordion active" id="project_panel_title">Project</button>
    <div class="sidebar_accordion_panel show" id="img_fn_list_panel show">
      <div id="project_info_panel">
        <div class="row">
          <span class="col"><label for="project_name">Name: </label></span>
          <span class="col"><input bind:value={$projName} type="text" id="project_name" title="project name"></span>
        </div>
      </div>
      <div id="project_tools_panel">
        <div class="button_panel" style="margin:0.1rem 0;" >
          <select bind:value={flFilter} style="width:48%" id="infoStore_preset_filters_list" title="Filter file list">
            <option value="all">All files</option>
            <option value="missingAnno">Show files missing annotations</option>
          </select>
          <div on:click={() => ($selectDisplay = "image_grid_panel")} style="font-size: 2em;" id="img_toggle"><Grid20 /><title>Switch to Image Grid View</title></div>
          <div on:click={() => return_to_img_panel()} style="font-size: 2em;" id="img_toggle"><Image20 /><title>Switch to Image Panel</title></div>
        </div>
      </div>
      <div id="img_fn_list">
        <ul>
            {#each Object.entries($infoStore) as ctxt}
              {#if flFilter === "missingAnno" && ctxt[1][0].artifacts.length === 0 && ctxt[0] === $selectedID}
                <li style="background-color: yellow; border-left: 0.2rem solid black; font-weight: bold;" id={ctxt[1][0].filename} on:click={()=> jump_to_image(ctxt[1][0].filename)} title={ctxt[1][0].filename} class="buffered">{ctxt[1][0].filename}</li>
              {:else if flFilter === "missingAnno" && ctxt[1][0].artifacts.length === 0}
                <li style="background-color: yellow;" id={ctxt[1][0].filename} on:click={()=> jump_to_image(ctxt[1][0].filename)} title={ctxt[1][0].filename} class="buffered">{ctxt[1][0].filename}</li>
              {:else if ctxt[0] === $selectedID}
                <li style="border-left: 0.2rem solid black; font-weight: bold;" id={ctxt[1][0].filename} on:click={()=> jump_to_image(ctxt[1][0].filename)} title={ctxt[1][0].filename} class="buffered">{ctxt[1][0].filename}</li>
              {:else}
                <li id={ctxt[1][0].filename} on:click={()=> jump_to_image(ctxt[1][0].filename)} title={ctxt[1][0].filename} class="buffered">{ctxt[1][0].filename}</li>
              {/if}
            {/each}
        </ul>
      </div>
      
        <div class="button_panel">
          <span class="button" on:click={()=>{fileInputImgs.click();}} title="Add new file from local disk">Add Files</span>
            <input bind:files style="display:none" type="file" accept="image/*" multiple on:change={(e)=>upload_images(e)} bind:this={fileInputImgs} >
          <span class="button" on:click={() => remove_file()} title="Remove selected file (i.e. file currently being shown) from project">Remove</span>
        </div>
    </div>

    <button class="sidebar_accordion">Keyboard Shortcuts</button>
    <div class="sidebar_accordion_panel">
      <table>
        <tr>
          <td style="width:8em;"><span class="key">&larr;</span>&nbsp;<span class="key">&rarr;</span></td>
          <td>Move to next/previous image</td>
        </tr>
        <tr>
          <td><span class="key">Backspace</span></td>
          <td>Delete selected annotation</td>
        </tr>
        <tr>
          <td><span class="key">Shift</span> + <Cursor_116 /> </td>
          <td>Draw annotation</td>
        </tr>
        <tr>
          <td>Scroll</td>
          <td>Zoom in/out (mouse cursor is over image)</td>
        </tr>
        <tr>
          <td><Cursor_116 /></td>
          <td>Pan across image</td>
        </tr>
      </table>      
    </div>
</div>