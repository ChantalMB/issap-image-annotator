<script>
import { infoStore, showImg, shpStore, selectedID, os, ag, phg, ctxtInfo, rowCheck, typeCategory } from './stores.js';


let view;
let provenance;

// let os = [{"us":"USA"},{"eur":"ESA"},{"unknown":"Unknown"}];
// let ag = [{"esa":"ESA"},{"nasa":"NASA"},{"unknown":"Unknown"}];
// let phg = [{"unknown":"Unknown"}, {"kb":"Kayla Barron"}, {"rj":"Raja Chari"}, {"tm":"Thomas Marshburn"}, {"mm":"Matthias Maurer"}, {"mvh": "Mark Vande Hei"}];

let currentTable = [];
let artiHeaders = ["Artifact_ID", "Name", "Type", "Fixed", "Persistence", "Notes", "Recorded_by", "Date_Added"];
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
$: if ($ctxtInfo !== undefined) {
    if ($ctxtInfo[0].exifInfo['DateCreated'] !== undefined) {
        provenance = $ctxtInfo[0].exifInfo['DateCreated']['description'];
    } else {
        provenance = "Unspecified";
    }
}


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
                        provenance: provenance, 
                        photographer: {"unknown":"Unknown"},
                        type: 0,
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

function updateCategory(val) {
    if ($typeCategory.indexOf(val) === -1) {
        $typeCategory.push(val)
        $typeCategory = $typeCategory;
    }
}

</script>

<div class="button_panel">
    <span class="text_button" on:click={() => view=''} id="button_edit_region_metadata" title="Manual annotations of regions">Artifact Annotations</span>
    <span class="text_button" on:click={() => view='context'} id="button_edit_file_metadata" title="Manual annotations of a file">Context Annotations</span>

    <span class="button" style="float:right;margin-right:0.2rem;" on:click={() => annotation_editor_increase_content_size()} title="Increase size of contents in annotation editor">&plus;</span>
    <span class="button" style="float:right;margin-right:0.2rem;" on:click={() => annotation_editor_decrease_content_size()} title="Decrease size of contents in annotation editor">&minus;</span>
</div>

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
                {provenance}
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
        <!-- TO DO: FIX THE DATALISTS-->
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
                        <input list="ice-cream-flavors" id="ice-cream-choice" name="ice-cream-choice" on:change={()=> updateCategory($infoStore[$selectedID][0].artifacts[i].type)} bind:value={$infoStore[$selectedID][0].artifacts[i].type} />
                            <datalist id="ice-cream-flavors">
                                {#each $typeCategory as c}
                                    <option value={c}>
                                {/each}
                            </datalist>
                    </span>
                    <span class="col">
                        <label>
                            <input type=radio bind:group={$infoStore[$selectedID][0].artifacts[i].fixed} name="fixed1" value={"yes"}>
                            Yes
                        </label>
                
                        <label>
                            <input type=radio bind:group={$infoStore[$selectedID][0].artifacts[i].fixed} name="fixed2" value={"no"}>
                            No
                        </label>
                    </span>
                    <span class="col">
                        <label>
                            <input type=radio bind:group={$infoStore[$selectedID][0].artifacts[i].persistence} name="per1" value={"yes"}>
                            Yes
                        </label>
                
                        <label>
                            <input type=radio bind:group={$infoStore[$selectedID][0].artifacts[i].persistence} name="per2" value={"no"}>
                            No
                        </label>
                    </span>
                    <span class="col">
                        <textarea bind:value={$infoStore[$selectedID][0].artifacts[i].artiNotes}></textarea>
                    </span>
                    <span class="col">
                        <input value={$infoStore[$selectedID][0].artifacts[i].recorder} autocomplete="on">
                    </span>
                    <span class="col">
                        {$infoStore[$selectedID][0].artifacts[i].dateRecorded}
                    </span>
                </div>
            {/each}
            {/if}

        
    {/if}
</div>
