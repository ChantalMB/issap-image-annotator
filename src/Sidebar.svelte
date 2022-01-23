<script>

import { ctxtStore, infoStore, projName, select_display, exifData, fileList, setImg, selectedID, changingPicture, artiStore } from './stores.js';
import ExifReader from 'exifreader';

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
    //  create_struct();
    console.log($exifData)
    $select_display = "image_panel"
}

let allTags = [];
export const upload_images=(e)=> {
		for (let i = 0; i < e.target.files.length; i++) {
			image = e.target.files[i];

      $fileList[image.name] = URL.createObjectURL(image);

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
    if (confirm("Are you sure you would like to remove file [TO-DO]?")) {
        text = "You pressed OK!";
    } else {
        text = "You cancelled!";
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
            <option value="files_without_region">Show files without regions</option>
            <option value="files_missing_region_annotations">Show files missing region annotations</option>
            <option value="files_missing_file_annotations">Show files missing file annotations</option>
            <option value="files_error_loading">Files that could not be loaded</option>
          </select>
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

    <!-- Attributes -->
    <button class="leftsidebar_accordion">Modify Attributes</button>
    <div class="leftsidebar_accordion_panel" id="attributes_editor_panel">
      <div class="button_panel" style="padding:1rem 0;">
        <span class="text_button" on:click={() => show_region_attributes_update_panel()} id="button_show_region_attributes" title="Show region attributes">Artifact Attributes</span>
        <span class="text_button" on:click={() => show_file_attributes_update_panel()} id="button_show_file_attributes" title="Show file attributes">Context Attributes</span>
      </div>
      <div id="attributes_update_panel">
        <div class="button_panel" style="margin:0.1rem 0;" >
          <select style="width:100%" id="attributes_name_list" onchange="update_current_attribute_id(this)" title="List of existing attributes"></select>
        </div>
        <div id="attribute_properties"></div>
        <div id="attribute_options"></div>
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