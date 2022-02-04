<script>
import { onMount } from 'svelte';

import OpenSeadragon from 'openseadragon';
import Annotorious from '@recogito/annotorious-openseadragon';

import SelectorPack from '@recogito/annotorious-selector-pack';
import ShpLbl from '@recogito/annotorious-shape-labels';
import '@recogito/annotorious-openseadragon/dist/annotorious.min.css';

import { viewer, infoStore, selectedID, exifData, selectedShape, fileList, setImg, showImg, shpStore, artiStore, ctxtStore, zoomIn, zoomOut, centreImg, rowCheck, jumpToImgPanel, rmImg} from './stores.js';



let anno;

let count = 0;

onMount( async () => {
    // GOING FROM IMG PANEL TO IMG GRID BREAKS ZOOM FUNCITONALITY
    if ($viewer !== undefined) {
        $viewer.destroy()
        $viewer = null;
    }

    $viewer = OpenSeadragon({
        id: 'openseadragon',
        prefixUrl: "//openseadragon.github.io/openseadragon/images/",
        visibilityRatio: 1,
        constrainDuringPan: true,
        zoomInButton:   $zoomIn,
        zoomOutButton:  $zoomOut,
        homeButton:     $centreImg,
        tileSources: {
            type: 'image',
            url: $showImg,
        },
    });
    
    const config = {
        formatter: ShpLbl(),
        allowEmpty: true,
        disableEditor: true,
    }; 
    
    anno = Annotorious($viewer, config);
    
    new SelectorPack(anno, { 
        tools: ['polygon']
    });

    if (Object.keys($shpStore).indexOf($selectedID) !== -1) {
		for (let i = 0; i < Object.keys($shpStore[$selectedID]).length; i++) {
            console.log(anno)
			anno.addAnnotation($shpStore[$selectedID][i]);
            count += 1;

		}
        $jumpToImgPanel = false;
	}

    initDrawing();
});

$: if ($rmImg) {
    anno.clearAnnotations();
    $rmImg = false;
}



function initDrawing() {
    let newId;
    anno.setDrawingTool('rect');

    anno.on('startSelection', function(point) {
        newId = 'arti_' + count;
        count += 1;
        
    });

	anno.on('createAnnotation', function(annotation, overrideId) {
        // overrideId(newId);
        // annotation.id = newId;
        // anno.addAnnotation(annotation);
        onCreate();

    });

    anno.on('createSelection', async function(selection) {
        selection.body = [{
            type: 'TextualBody',
            purpose: 'tagging',
            value: newId
        }];

  // Make sure to wait before saving!
        await anno.updateSelected(selection);
        anno.saveSelected();
    });

	anno.on("updateAnnotation", onUpdate);

    anno.on('clickAnnotation', function(annotation, element) {
        console.log(annotation) 
    });

}

function onCreate() {
    const annotations = anno.getAnnotations();
    // do something with annotations
    console.log(annotations)
    $shpStore[$selectedID] = annotations
    $rowCheck = true;
    console.log($shpStore);
}

function onUpdate() {
    const annotations = anno.getAnnotations();
    // do something with annotations
    console.log(annotations)
    $shpStore[$selectedID] = annotations
    console.log($shpStore);
}

$: if ($showImg) {
    if ($jumpToImgPanel === false) {
        resetView()

    }
}

function resetView() {
    count = 0;	
	if ($viewer !== undefined) {
		$viewer.open({
            type: 'image',
            url: $showImg,
        });
        
		if (anno !== undefined) {
			anno.clearAnnotations();
		}

	}
	checkAnno()
}

function checkAnno() {
	if (Object.keys($shpStore).indexOf($selectedID) !== -1) {
		for (let i = 0; i < Object.keys($shpStore[$selectedID]).length; i++) {
			anno.addAnnotation($shpStore[$selectedID][i]);
            count += 1;

		}
	}
}


function select_annotation_tool() {
    if ($selectedShape === "rect") {
        anno.setDrawingTool('rect');
    } else if ($selectedShape === "polygon") {
        anno.setDrawingTool('polygon');
    } 
}

$:  if ($selectedShape !== "") {
        select_annotation_tool();
    }

$: if ($setImg === "") {
        $setImg = Object.keys($fileList)[0];
        console.log($setImg)
        $selectedID = $infoStore[$setImg]["Context_Number"];
        if ($artiStore[$selectedID] === undefined) {
            $artiStore[$selectedID] = []
        }
        if ($ctxtStore[$selectedID] === undefined) {
            $ctxtStore[$selectedID] = []
        }
        $showImg = Object.values($fileList)[0];
    } else {
        if ($selectedID === "") {
            $selectedID = $infoStore[$setImg]["Context_Number"];
            if ($artiStore[$selectedID] === undefined) {
                $artiStore[$selectedID] = []
            }
            if ($ctxtStore[$selectedID] === undefined) {
                $ctxtStore[$selectedID] = []
            }
        } else if ($selectedID !== $infoStore[$setImg]["Context_Number"]) {
            document.getElementById($selectedID).style.borderLeft = "";
            document.getElementById($selectedID).style.fontWeight = "";
            $selectedID = $infoStore[$setImg]["Context_Number"];
            if ($artiStore[$selectedID] === undefined) {
                $artiStore[$selectedID] = []
            }
            if ($ctxtStore[$selectedID] === undefined) {
                $ctxtStore[$selectedID] = []
            }
        }
        
        $showImg = $fileList[$setImg];
    }

let w;
let h;
$: if ($exifData[$ctxtStore[$selectedID][0].file]) {
    h = $exifData[$ctxtStore[$selectedID][0].file]["Image Height"].description;
    w = $exifData[$ctxtStore[$selectedID][0].file]["Image Width"].description;
}

let key;

function handleKeydown(event) {
    key = event.key;

    if (key === 'Backspace' && anno.getSelected() !== undefined) {
        const selected = anno.getSelected();

        var resultShp = $shpStore[$selectedID].find(obj => {
            return obj.id === selected.id
        })

        var resultArti = $artiStore[$selectedID].find(obj => {
            return obj.arti_id === selected.body[0].value
        })
        
        anno.removeAnnotation(selected);

        const indexShp = $shpStore[$selectedID].indexOf(resultShp);
        if (indexShp > -1) {
            $shpStore[$selectedID].splice(indexShp, 1);
            $shpStore[$selectedID] = $shpStore[$selectedID];
        }

        const indexArti = $artiStore[$selectedID].indexOf(resultArti);
        if (indexArti > -1) {
            $artiStore[$selectedID].splice(indexArti, 1); 
            $artiStore[$selectedID] = $artiStore[$selectedID];
        }

        count = 0

        for (let i = 0; i < $shpStore[$selectedID].length; i++) {
            $shpStore[$selectedID][i].body[0].value = "arti_" + count;
            $artiStore[$selectedID][i].arti_id = "arti_" + count;
            count += 1;
        }

        anno.setAnnotations($shpStore[$selectedID]);        

    }
		

}

</script>

<svelte:window on:keydown={handleKeydown}/>

<div id="image_panel" class="display_area_content" style="height: 75.7vh; width: 67vw;">

    <div id='openseadragon' style="height: 75.7vh; width: 67vw;"></div>

</div>
