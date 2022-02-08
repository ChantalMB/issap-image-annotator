<script>

import { infoStore, jumpToImgPanel, ctxtStore, pointlessStore, projName, selectDisplay, exifData, fileList, setImg, selectedID, changingPicture, artiStore, shpStore, rmImg, showImg } from './stores.js';
import ExifReader from 'exifreader';
import Grid20 from "carbon-icons-svelte/lib/Grid20";
import Image20 from "carbon-icons-svelte/lib/Image20";


let files = null; 
let flFilter;

let fileInputImgs, image;

let ctxtCt = 0;
export const upload_images=(e)=> {
		for (let i = 0; i < e.target.files.length; i++) {
			image = e.target.files[i];

      let ctxtID = "ctxt_" + ctxtCt;
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
        });
      }
      ctxtCt += 1;
		}
    console.log($infoStore)
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

<div id="leftsidebar">

    <!-- Project -->
    <button class="leftsidebar_accordion active" id="project_panel_title">Project</button>
    <div class="leftsidebar_accordion_panel show" id="img_fn_list_panel show">
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

    <button class="leftsidebar_accordion">Keyboard Shortcuts</button>
    <div class="leftsidebar_accordion_panel">
      <div style="display:block; text-align:center; padding:1rem;">TODO: THESE ARE NOT RELEVANT YET</div>
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