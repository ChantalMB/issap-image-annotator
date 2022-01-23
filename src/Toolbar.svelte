<script>
    import { selectedShape, fileList, setImg, changingPicture } from './stores.js';
    import Fa from 'svelte-fa';
    import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons'


    let panel = "anno_accordion_panel";

    function select_region_shape(s) {
       $selectedShape = s;
    }

    function get_image(d) {
        let position = Object.keys($fileList).indexOf($setImg);

        if (d === "prev") {
            if (position !== 0) {
                position -= 1;
                $setImg = Object.keys($fileList)[position];
                $changingPicture = true;
            }
        } else if (d === "next")  {
            if (position !== Object.keys($fileList).length - 1) {
                position += 1;
                $setImg = Object.keys($fileList)[position];
                $changingPicture = true;
            }
        }
    }

$: if ($fileList.length > 5) {
    console.log($fileList[7])
}

</script>

<div id="anno_toolbar">
    <button class="anno_accordion" id="anno_toolbar_style"><svg viewbox="0 0 24 24" ><use xlink:href="#icon_edit"></use><title>Select annotation shape</title></svg></button>
      <div class="anno_accordion_panel">
        <ul class="region_shape">
          <li id="region_shape_rect" on:click={() => select_region_shape('rect')} title="Rectangle (Shortcut key 1)"><svg height="35" viewbox="0 0 35 35"><use xlink:href="#shape_rectangle"></use></svg></li>
          <li id="region_shape_polygon" on:click={() => select_region_shape('polygon')} title="Polygon (Shortcut key 4)"><svg height="35" viewbox="0 0 35 35"><use xlink:href="#shape_polygon"></use></svg></li>
          <li id="region_shape_point" on:click={() => select_region_shape('point')} title="Point (Shortcut key 5)"><svg height="35" viewbox="0 0 35 35"><use xlink:href="#shape_point"></use></svg></li>
        </ul>
        <div id="region_info" class="display_none">&nbsp;</div>
      </div>

    <button id="anno_toolbar_style"><svg height="95%" width="95%" on:click={() => zoom_in()} viewbox="0 0 24 24"><use xlink:href="#icon_zoomin"></use><title>Zoom In</title></svg></button>
    <button id="anno_toolbar_style"><svg height="95%" width="95%" on:click={() => zoom_out()} viewbox="0 0 24 24"><use xlink:href="#icon_zoomout"></use><title>Zoom In</title></svg></button>
    <button id="anno_toolbar_style" on:click={() => get_image("prev")}><Fa icon={faArrowLeft}/></button>
    <button id="anno_toolbar_style" on:click={() => get_image("next")}><Fa icon={faArrowRight}/></button>

</div>