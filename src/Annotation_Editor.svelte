<script>
import { infoStore, showImg, shpStore, selectedID, os, ag, phg, ctxtInfo, rowCheck, typeCategory } from './stores.js';


let view = '';
let provenance;

let currentTable = [];
let artiHeaders = ["Artifact_ID", "Name", "Type", "Material", "Colour", "Fixed", "Persistence", "Notes", "Recorded_by", "Date_Added"];
let ctxtHeaders = ["Context_Number", "Provenance", "Photographer", "Square", "Module", "Orbital_Segment", "Agency", "Context_Type", "Description", "Interpretation", "Problems"];

function get_curr_date() {
    var currentdate = new Date(); 
    var dateRecorded = currentdate.getFullYear()  + "-" 
                    + (currentdate.getMonth()+1) + '-'
                    + currentdate.getDate() + " "  
                    + currentdate.getHours() + ":"  
                    + currentdate.getMinutes() + ":" 
                    + currentdate.getSeconds();
    
    return dateRecorded;
}
                
$: if ($infoStore[$selectedID] !== undefined) {
    currentTable = $infoStore[$selectedID][0].artifacts;
}


$: $ctxtInfo = $infoStore[$selectedID];


$: if ($showImg) {
    addTable()
}

const addTable = () => (infoStore.update(s => {
    if (s[$selectedID] === undefined) {
        s[$selectedID]=[];
    }
    return $infoStore; }))


$: if ($shpStore) {
    if (Object.keys($shpStore).length !== 0) {
        if ($rowCheck){
            console.log(currentTable)

            addArtiRow()
            $rowCheck = false;
        }
    }
}

const addArtiRow = () => (currentTable.push({ 
                        arti_id: $shpStore[$selectedID][$shpStore[$selectedID].length - 1].body[0].value, 
                        name: '', 
                        type: '',
                        material: '',
                        colour: '',
                        fixed: 'y',
                        persistence: 'y',
                        artiNotes: '',
                        recorder: '',
                        dateRecorded: get_curr_date(),
                        }), $infoStore[$selectedID][0].artifacts = currentTable)


const addCtxtRow = () => ($ctxtInfo.push({
                        filename: $infoStore[$selectedID][0].filename,
                        filepath: $infoStore[$selectedID][0].filepath,
                        exifInfo: $infoStore[$selectedID][0].exifInfo,
                        provenance: $infoStore[$selectedID][0].provenance, 
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
                        artifacts: $infoStore[$selectedID][0].artifacts,
                        }), $infoStore[$selectedID] = $ctxtInfo)


$: console.log($infoStore)

$: if ($infoStore[$selectedID]) {console.log("ADDING CTXT")}

function updateCategory(val) {
    if ($typeCategory.indexOf(val) === -1) {
        $typeCategory.push(val)
        $typeCategory = $typeCategory;
    }
}

</script>

<div class="sticky_container">
    <ul class="metadata_editor">
        <li class="me_tab" class:selected="{view === ''}" on:click={() => view = ''}>
            <span class="selected_view" id="arti_metadata" title="Manual annotations of artifacts">Artifact Annotations</span>
        </li>
        <li class="me_tab" class:selected="{view === 'context'}" on:click={() => view = 'context'}>
            <span class="selected_view" id="context_metadata" title="Manual annotations of contexts">Context Annotations</span>
        </li>
    </ul>
</div>

<div class="annotation_table">
<div id ="annotation_editor">
    {#if view === "context"}
        <div class="row" id="annotation_editor_header">
            {#each ctxtHeaders as i}
                <span class="col header">{i}</span>
            {/each}
        </div>

        {#if $ctxtInfo !== undefined}
        <div class="row">
            <span class="col">
                {$selectedID}
            </span>
            <span class="col">
                <textarea bind:value={$infoStore[$selectedID][0].provenance} placeholder={$infoStore[$selectedID][0].provenance}></textarea>
            </span>
            <span class="col">
                <select bind:value={$infoStore[$selectedID][0].photographer}>
                    {#each $phg as p}
                        <option value={p}>
                            {Object.values(p)}
                        </option>
                    {/each}
                </select>
            </span>
            <span class="col">
                <textarea bind:value={$infoStore[$selectedID][0].square}></textarea>
            </span>
            <span class="col">
                <textarea bind:value={$infoStore[$selectedID][0].module}></textarea>
            </span>
            <span class="col">
                <select bind:value={$infoStore[$selectedID][0].orbital_seg}>
                    {#each $os as loc}
                        <option value={loc}>
                            {Object.values(loc)}
                        </option>
                    {/each}
                </select>
            </span>
            <span class="col">
                <select bind:value={$infoStore[$selectedID][0].agency}>
                    {#each $ag as org}
                        <option value={org}>
                            {Object.values(org)}
                        </option>
                    {/each}
                </select>
            </span>
            <span class="col">
                <textarea bind:value={$infoStore[$selectedID][0].ctxt_type}></textarea>
            </span>
            <span class="col">
                <textarea bind:value={$infoStore[$selectedID][0].description}></textarea>
            </span>
            <span class="col">
                <textarea bind:value={$infoStore[$selectedID][0].interp}></textarea>
            </span>
            <span class="col">
                <textarea bind:value={$infoStore[$selectedID][0].problems}></textarea>
            </span>
        </div>
        {/if}

    {:else}
        <div class="row" id="annotation_editor_header">
            {#each artiHeaders as i}
                <span class="col header">{i}</span>
            {/each}
        </div>
        {#if currentTable !== undefined}
            {#each currentTable as item, i}
                <div class="row" id={i}>
                    <span class="col">
                        {$infoStore[$selectedID][0].artifacts[i].arti_id}
                    </span>
                    <span class="col">
                        <textarea bind:value={$infoStore[$selectedID][0].artifacts[i].name}></textarea>
                    </span>
                    <span class="col">
                        <!-- there is no ice cream in this project, it's just that whenever I change any of these labels it breaks and I have no idea why-->
                        <input list="ice-cream-flavors" id="ice-cream-choice" name="ice-cream-choice" on:change={()=> updateCategory($infoStore[$selectedID][0].artifacts[i].type)} bind:value={$infoStore[$selectedID][0].artifacts[i].type} />
                            <datalist id="ice-cream-flavors">
                                {#each $typeCategory as c}
                                    <option value={c}>
                                {/each}
                            </datalist>
                    </span>
                    <span class=col>
                        <textarea bind:value={$infoStore[$selectedID][0].artifacts[i].material}></textarea>
                    </span>
                    <span class=col>
                        <textarea bind:value={$infoStore[$selectedID][0].artifacts[i].colour}></textarea>
                    </span>
                    <span class="col">
                        <label>
                            <input type=radio bind:group={$infoStore[$selectedID][0].artifacts[i].fixed} value={"yes"}>
                            Yes
                        </label>
                
                        <label>
                            <input type=radio bind:group={$infoStore[$selectedID][0].artifacts[i].fixed} value={"no"}>
                            No
                        </label>
                    </span>
                    <span class="col">
                        <label>
                            <input type=radio bind:group={$infoStore[$selectedID][0].artifacts[i].persistence} value={"yes"}>
                            Yes
                        </label>
                
                        <label>
                            <input type=radio bind:group={$infoStore[$selectedID][0].artifacts[i].persistence} value={"no"}>
                            No
                        </label>
                    </span>
                    <span class="col">
                        <textarea bind:value={$infoStore[$selectedID][0].artifacts[i].artiNotes}></textarea>
                    </span>
                    <span class="col">
                        <input bind:value={$infoStore[$selectedID][0].artifacts[i].recorder}>
                    </span>
                    <span class="col">
                        {$infoStore[$selectedID][0].artifacts[i].dateRecorded}
                    </span>
                </div>
            {/each}
            {/if}

        
    {/if}
</div>
</div>