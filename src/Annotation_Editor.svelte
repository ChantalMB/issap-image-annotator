<script>
import { showImg, shpStore, selectedID, artiStore, ctxtStore, exifData, ctxtInfo, rowCheck, typeCategory } from './stores.js';


let view;
let provenance;


$: if ($ctxtInfo !== undefined){
    provenance = $exifData[$ctxtInfo[0].file]['DateCreated']['description'];
    }

let os = [{"us":"USA"},{"eur":"ESA"},{"unknown":"Unknown"}]
let ag = [{"esa":"ESA"},{"nasa":"NASA"},{"unknown":"Unknown"}]
let phg = [{"unknown":"Unknown"}, {"kb":"Kayla Barron"}, {"rj":"Raja Chari"}, {"tm":"Thomas Marshburn"}, {"mm":"Matthias Maurer"}, {"mvh": "Mark Vande Hei"}]

let currentTable = [];
let artiHeaders = ["Artifact_ID", "Name", "Type", "Fixed", "Persistence", "Notes", "Recorded_by", "Date_Added"]
let ctxtHeaders = ["Context_Number", "Provenance", "Photographer", "Square", "Module", "Orbital_Segment", "Agency", "Context_Type", "Description", "Interpretation", "Problems"]
var currentdate = new Date(); 
var dateRecorded = currentdate.getFullYear()  + "-" 
                + (currentdate.getMonth()+1) + '-'
                + currentdate.getDate() + " "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();

// CURRENT TABLE IS SETTING TO UNDEFINED
$: currentTable = $artiStore[$selectedID];
$: $ctxtInfo = $ctxtStore[$selectedID];

$: if ($showImg) {
    addTable()
}

const addTable = () => (artiStore.update(s => {
    if (s[$selectedID] === undefined) {
        s[$selectedID]=[];
    }
    return $artiStore; }))


$: if ($shpStore) {
    if (Object.keys($shpStore).length !== 0) {
        if ($rowCheck){
            addArtiRow()
            $rowCheck = false;
        }
    }
}

const addArtiRow = () => (currentTable.push({ 
                        arti_id: $shpStore[$selectedID][$shpStore[$selectedID].length - 1].body[0].value, 
                        name: 'Unnamed', 
                        type: '',
                        fixed: 'y',
                        persistence: 'y',
                        artiNotes: '',
                        recorder: 'Initials',
                        dateRecorded: dateRecorded,
                     }), $artiStore[$selectedID] = currentTable)




$: if ($selectedID){
    if ($ctxtStore[$selectedID].length < 2) {
        addCtxtRow();
    }
}

const addCtxtRow = () => ($ctxtInfo.push({
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
                     }), $ctxtStore[$selectedID] = $ctxtInfo)

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
                <select bind:value={$ctxtStore[$selectedID][1].photographer}>
                    {#each phg as p}
                        <option value={p}>
                            {Object.values(p)}
                        </option>
                    {/each}
                </select>
            </span>
            <span class="col">
                <textarea bind:value={$ctxtStore[$selectedID][1].square}></textarea>
            </span>
            <span class="col">
                <textarea bind:value={$ctxtStore[$selectedID][1].module}></textarea>
            </span>
            <span class="col">
                <select bind:value={$ctxtStore[$selectedID][1].orbital_seg}>
                    {#each os as loc}
                        <option value={loc}>
                            {Object.values(loc)}
                        </option>
                    {/each}
                </select>
            </span>
            <span class="col">
                <select bind:value={$ctxtStore[$selectedID][1].agency}>
                    {#each ag as org}
                        <option value={org}>
                            {Object.values(org)}
                        </option>
                    {/each}
                </select>
            </span>
            <span class="col">
                <textarea bind:value={$ctxtStore[$selectedID][1].ctxt_type}></textarea>
            </span>
            <span class="col">
                <textarea bind:value={$ctxtStore[$selectedID][1].description}></textarea>
            </span>
            <span class="col">
                <textarea bind:value={$ctxtStore[$selectedID][1].interp}></textarea>
            </span>
            <span class="col">
                <textarea bind:value={$ctxtStore[$selectedID][1].problems}></textarea>
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
        {#if $artiStore[$selectedID] !== undefined}
            {#each currentTable as item, i}
                <div class="row" id={i}>
                    <span class="col">
                        {$artiStore[$selectedID][i].arti_id}
                    </span>
                    <span class="col">
                        <textarea bind:value={$artiStore[$selectedID][i].name}></textarea>
                    </span>
                    <span class="col">
                        <input list="ice-cream-flavors" id="ice-cream-choice" name="ice-cream-choice" on:change={()=> updateCategory($artiStore[$selectedID][i].type)} bind:value={$artiStore[$selectedID][i].type} />
                            <datalist id="ice-cream-flavors">
                                {#each $typeCategory as c}
                                    <option value={c}>
                                {/each}
                            </datalist>
                    </span>
                    <span class="col">
                        <label>
                            <input type=radio bind:group={$artiStore[$selectedID][i].fixed} name="fixed1" value={"yes"}>
                            Yes
                        </label>
                
                        <label>
                            <input type=radio bind:group={$artiStore[$selectedID][i].fixed} name="fixed2" value={"no"}>
                            No
                        </label>
                    </span>
                    <span class="col">
                        <label>
                            <input type=radio bind:group={$artiStore[$selectedID][i].persistence} name="per1" value={"yes"}>
                            Yes
                        </label>
                
                        <label>
                            <input type=radio bind:group={$artiStore[$selectedID][i].persistence} name="per2" value={"no"}>
                            No
                        </label>
                    </span>
                    <span class="col">
                        <textarea bind:value={$artiStore[$selectedID][i].artiNotes}></textarea>
                    </span>
                    <span class="col">
                        <input value={$artiStore[$selectedID][i].recorder} autocomplete="on">
                    </span>
                    <span class="col">
                        {$artiStore[$selectedID][i].dateRecorded}
                    </span>
                </div>
            {/each}
            {/if}

        
    {/if}
</div>
