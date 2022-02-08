<script>
import { onMount } from 'svelte';

import { Annotorious } from '@recogito/annotorious';
import '@recogito/annotorious/dist/annotorious.min.css';

import { infoStore, selectDisplay, setImg, selectedID, shpStore, jumpToImgPanel, os, ag, phg } from './stores.js';
let ctxtFilter;
let secondaryFilter;
let anno;

$: console.log($shpStore)

// TO DO: Inquire about how to approach drawing annotations when images are in grid

function jump_to_image(f) {
  $selectDisplay = "image_panel"
  $jumpToImgPanel = true;

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
}

$: console.log(ctxtFilter)

</script>
<div id="image_grid_panel" class="display_area_content">
    <div id="image_grid_group_panel">
        <span class="tool"> 
            Group by 
            <select bind:value={ctxtFilter}>
                <option>All</option>
                <option>Annotated</option>
                <option>Photographer</option>
                <option>Orbital Segment</option>
                <option>Agency</option>
            </select>

            {#if ctxtFilter === "Photographer"}
                <select bind:value={secondaryFilter}>
                    {#each $phg as p}
                        <option value={p}>
                            {Object.values(p)}
                        </option>
                    {/each}
                </select>
            {:else if ctxtFilter === "Orbital Segment"}
                <select bind:value={secondaryFilter}>
                    {#each $os as loc}
                        <option value={loc}>
                            {Object.values(loc)}
                        </option>
                    {/each}
                </select>
            {:else if ctxtFilter === "Agency"}
                <select bind:value={secondaryFilter}>
                    {#each $ag as org}
                        <option value={org}>
                            {Object.values(org)}
                        </option>
                    {/each}
                </select>
            {/if}
        
        </span>
    </div>

    {#if ctxtFilter === "Annotated"}
        <h3>Annotated</h3>
        <div class="img_grid">
            {#each Object.entries($infoStore) as ctxt}
                {#if ctxt[1][0].artifacts.length !== 0}
                    <img on:click={()=> jump_to_image(ctxt[1][0].filename)} src={ctxt[1][0].filepath} alt="ISS context">
                {/if}
            {/each}
        </div>

        <h3>Unannotated</h3>
        <div class="img_grid">
            {#each Object.entries($infoStore) as ctxt}
                {#if ctxt[1][0].artifacts.length === 0}
                    <img on:click={()=> jump_to_image(ctxt[1][0].filename)} src={ctxt[1][0].filepath} alt="ISS context">
                {/if}
            {/each}
        </div>
    {:else if ctxtFilter === "Photographer"}
        <div class="img_grid">
            {#each Object.entries($infoStore) as ctxt}
                {#if ctxt[1][0].photographer === secondaryFilter}
                    <img on:click={()=> jump_to_image(ctxt[1][0].filename)} src={ctxt[1][0].filepath} alt="ISS context">
                {/if}
            {/each}
        </div>
    {:else if ctxtFilter === "Orbital Segment"}
        <div class="img_grid">
            {#each Object.entries($infoStore) as ctxt}
                {#if ctxt[1][0].orbital_seg === secondaryFilter}
                    <img on:click={()=> jump_to_image(ctxt[1][0].filename)} src={ctxt[1][0].filepath} alt="ISS context">
                {/if}
            {/each}
        </div>
    {:else if ctxtFilter === "Agency"}
        <div class="img_grid">
            {#each Object.entries($infoStore) as ctxt}
                {#if ctxt[1][0].agency === secondaryFilter}
                    <img on:click={()=> jump_to_image(ctxt[1][0].filename)} src={ctxt[1][0].filepath} alt="ISS context">
                {/if}
            {/each}
        </div>
    {:else}
        <div class="img_grid">
            {#each Object.entries($infoStore) as ctxt}
                <img on:click={()=> jump_to_image(ctxt[1][0].filename)} src={ctxt[1][0].filepath} alt="ISS context">
            {/each}
        </div>
    {/if}
    </div>