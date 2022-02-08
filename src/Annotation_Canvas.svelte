<script>
import { onMount } from 'svelte';

import OpenSeadragon from 'openseadragon';
import Annotorious from '@recogito/annotorious-openseadragon';

import SelectorPack from '@recogito/annotorious-selector-pack';
import ShpLbl from '@recogito/annotorious-shape-labels';
import '@recogito/annotorious-openseadragon/dist/annotorious.min.css';

import { viewer, pointlessStore, selectedID, infoStore, exifData, selectedShape, fileList, setImg, showImg, shpStore, artiStore, ctxtStore, zoomIn, zoomOut, centreImg, rowCheck, jumpToImgPanel, rmImg} from './stores.js';



let anno;

let count = 0;

onMount( async () => {
    if ($viewer !== undefined) {
        console.log("viewer init")
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
			anno.addAnnotation($shpStore[$selectedID][i]);
            count += 1;

		}
	}
    $jumpToImgPanel = false;

    initDrawing();

    console.log("SHOW IMG CANVAS")
    console.log($showImg)

});

$: if ($rmImg) {
    console.log("rmImg")
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
    $shpStore[$selectedID] = annotations
    $rowCheck = true;
}

function onUpdate() {
    const annotations = anno.getAnnotations();
    // do something with annotations
    $shpStore[$selectedID] = annotations
}

$: if ($showImg) {
    console.log($jumpToImgPanel)
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

        console.log("SHOW IMG RS VIEW")
        console.log($showImg)

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
        $setImg = Object.entries($infoStore)[0][1][0].filename;
        $selectedID = Object.keys($infoStore)[0];
        $showImg = Object.entries($infoStore)[0][1][0].filepath;
    } else {
        let key;
        for (let i = 0; i < Object.values($infoStore).length; i++) {
            if (Object.values($infoStore)[i][0].filename === $setImg) {
                key = Object.keys($infoStore)[i];
            }
        }

        $selectedID = key;
        $showImg = $infoStore[$selectedID][0].filepath;

    }

let key;

function handleKeypress(event) {
    key = event.key;
    
    if (key === 'Backspace' && anno.getSelected() !== undefined) {
        const selected = anno.getSelected();

        var resultShp = $shpStore[$selectedID].find(obj => {
            return obj.id === selected.id
        })

        var resultArti = $infoStore[$selectedID][0].artifacts.find(obj => {
            return obj.arti_id === selected.body[0].value
        })
        
        anno.removeAnnotation(selected);

        const indexShp = $shpStore[$selectedID].indexOf(resultShp);
        if (indexShp > -1) {
            $shpStore[$selectedID].splice(indexShp, 1);
            $shpStore[$selectedID] = $shpStore[$selectedID];
        }

        const indexArti = $infoStore[$selectedID][0].artifacts.indexOf(resultArti);
        if (indexArti > -1) {
            $infoStore[$selectedID][0].artifacts.splice(indexArti, 1); 
            $infoStore[$selectedID][0].artifacts = $infoStore[$selectedID][0].artifacts;
        }

        count = 0

        for (let i = 0; i < $shpStore[$selectedID].length; i++) {
            $shpStore[$selectedID][i].body[0].value = "arti_" + count;
            $infoStore[$selectedID][0].artifacts[i].arti_id = "arti_" + count;
            count += 1;
        }
        anno.setAnnotations($shpStore[$selectedID]);  
    }		

}

</script>

<svelte:window on:keydown={handleKeypress}/>

<div id="image_panel" class="display_area_content" style="height: 75.7vh; width: 67vw;">

    <div id='openseadragon' style="height: 75.7vh; width: 67vw;"></div>

</div>
