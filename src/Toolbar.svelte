<script>
    import { selectedShape, fileList, setImg, changingPicture, zoomIn, zoomOut, centreImg, selectDisplay, jumpToImgPanel, selectedID, infoStore } from './stores.js';
    import Edit24 from "carbon-icons-svelte/lib/Edit24";
    import VirtualPrivateCloudAlt20 from "carbon-icons-svelte/lib/VirtualPrivateCloudAlt20";
    import AreaCustom20 from "carbon-icons-svelte/lib/AreaCustom20";
    import ArrowLeft24 from "carbon-icons-svelte/lib/ArrowLeft24";
    import ArrowRight24 from "carbon-icons-svelte/lib/ArrowRight24";
    import CenterSquare24 from "carbon-icons-svelte/lib/CenterSquare24";
    import ZoomInArea24 from "carbon-icons-svelte/lib/ZoomInArea24";
    import ZoomOutArea24 from "carbon-icons-svelte/lib/ZoomOutArea24";


    function select_region_shape(s) {
       $selectedShape = s;
    }

    function get_image(d) {
        let position = Object.values($infoStore).flat().findIndex(p => p.filename === $setImg);

        if (d === "prev") {
            if (position !== 0) {
                position -= 1;
                $setImg = Object.values($infoStore).flat()[position].filename;
                console.log($setImg)
                $changingPicture = true;
            }
        } else if (d === "next")  {
            if (position !== Object.values($infoStore).flat().length - 1) {
                position += 1;
                $setImg = Object.values($infoStore).flat()[position].filename;
                console.log($setImg)
                $changingPicture = true;
            }
        }

        if ($selectDisplay !== "image_panel") {
            $selectDisplay = "image_panel"
            $jumpToImgPanel = true;
        }
    }

</script>

<div id="anno_toolbar">
    <button class="anno_accordion" id="anno_toolbar_style"><Edit24 /><title>Select annotation shape</title></button>
      <div class="anno_accordion_panel">
        <ul class="region_shape">
          <li id="region_shape_rect" on:click={() => select_region_shape('rect')} title="Draw rectangle"><VirtualPrivateCloudAlt20 /></li>
          <li id="region_shape_polygon" on:click={() => select_region_shape('polygon')} title="Draw polygon"><AreaCustom20 /></li>
        </ul>
        <div id="region_info" class="display_none">&nbsp;</div>
      </div>

    <button id="anno_toolbar_style" bind:this={$zoomIn}><ZoomInArea24 /><title>Zoom In</title></button>
    <button id="anno_toolbar_style" bind:this={$zoomOut}><ZoomOutArea24 /><title>Zoom In</title></button>
    <button id="anno_toolbar_style" bind:this={$centreImg}><CenterSquare24 /><title>Centre Image</title></button>
    <button id="anno_toolbar_style" on:click={() => get_image("prev")}><ArrowLeft24 /></button>
    <button id="anno_toolbar_style" on:click={() => get_image("next")}><ArrowRight24 /></button>

</div>