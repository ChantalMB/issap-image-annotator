<script>
import { onMount } from 'svelte';

import { fabric } from 'fabric';

import { infoStore, selectedID, exifData, selectedShape, fileList, setImg, showImg, shpStore, artiStore, ctxtStore} from './stores.js';
export let files;
var rectangle, rect, isDown, origX, origY;

var circ;
var pt;
var min = 99;
var max = 999999;
var polygonMode = true;
var pointArray = new Array();
var lineArray = new Array();
var activeLine;
var activeShape = false;
var line;
var polygon;

let canvas;
let c;

var polygonGenerated = false;

var LabeledPoly = fabric.util.createClass(fabric.Polygon, {
        type: 'labeledPoly',
        // initialize can be of type function(options) or function(property, options), like for text.
        // no other signatures allowed.
        initialize: function(points, options) {
        points || (points = {});

        options || (options = { });

        this.callSuper('initialize', points, options);
        this.set('label', options.label || '');
    },

    toObject: function() {
        return fabric.util.object.extend(this.callSuper('toObject'), {
            label: this.get('label')
        });
    },

    _render: function(ctx) {
        this.callSuper('_render', ctx);

        ctx.font = '11px Helvetica';
        ctx.fillStyle = 'red';
        ctx.textAlign = "left";
        ctx.fillText(this.label, -this.width/9, -this.height/2);

    }
        
});


var LabeledRect = fabric.util.createClass(fabric.Rect, {
        type: 'labeledRect',
        // initialize can be of type function(options) or function(property, options), like for text.
        // no other signatures allowed.
        initialize: function(options) {
        options || (options = { });

        this.callSuper('initialize', options);
        this.set('label', options.label || '');
    },

    toObject: function() {
        return fabric.util.object.extend(this.callSuper('toObject'), {
            label: this.get('label')
        });
    },

    _render: function(ctx) {
        this.callSuper('_render', ctx);

        ctx.font = '11px Helvetica';
        ctx.fillStyle = 'red';
        ctx.fillText(this.label, -this.width/2 + 3, -this.height/2 + 11);

    }

});

var LabeledPt = fabric.util.createClass(fabric.Circle, {
        type: 'labeledPt',

        initialize: function(options) {
        options || (options = { });

        this.callSuper('initialize', options);
        this.set('label', options.label || '');
    },

    toObject: function() {
        return fabric.util.object.extend(this.callSuper('toObject'), {
            label: this.get('label')
        });
    },

    _render: function(ctx) {
        this.callSuper('_render', ctx);

        ctx.font = '11px Helvetica';
        ctx.fillStyle = 'red';
        ctx.fillText(this.label, -this.width/2, this.height/2 + 13);

    }
    
});

onMount(() => {
    c = new fabric.Canvas(canvas);
    $selectedShape = "rect";
});


let count = 0;
let poly;

$: if (poly) {
    update_arti()
}

$: if (rect) {
    update_arti()
}

$: if (pt) {
    update_arti()
}

$: if ($showImg) {
    check_if_exists()

}

function check_if_exists() {
    if (c !== undefined) {
        c.clear()
    }

    if ($selectedID in $shpStore) {
        for (let i = 0; i < $shpStore[$selectedID].objects.length; i++) {
            if ($shpStore[$selectedID].objects[i].type === "labeledRect") {
                    rectangle = new LabeledRect({
                    width: $shpStore[$selectedID].objects[i]['width'],
                    height: $shpStore[$selectedID].objects[i]['height'],
                    left: $shpStore[$selectedID].objects[i]['left'],
                    top: $shpStore[$selectedID].objects[i]['top'],
                    fill: $shpStore[$selectedID].objects[i]['fill'],
                    stroke: $shpStore[$selectedID].objects[i]['stroke'],
                    label: $shpStore[$selectedID].objects[i]['label'],
                    strokeWidth: $shpStore[$selectedID].objects[i]['strokeWidth'],
                    selectable: false,
                });
                // console.log(rectangle)
                c.add(rectangle);

            } else if ($shpStore[$selectedID].objects[i].type === "labeledPoly") {
                polygon = new LabeledPoly( $shpStore[$selectedID].objects[i]['points'],
                {
                    width: $shpStore[$selectedID].objects[i]['width'],
                    height: $shpStore[$selectedID].objects[i]['height'],
                    left: $shpStore[$selectedID].objects[i]['left'],
                    top: $shpStore[$selectedID].objects[i]['top'],
                    fill: $shpStore[$selectedID].objects[i]['fill'],
                    stroke: $shpStore[$selectedID].objects[i]['stroke'],
                    label: $shpStore[$selectedID].objects[i]['label'],
                    strokeWidth: $shpStore[$selectedID].objects[i]['strokeWidth'],
                    selectable: false,
                });
                // console.log(polygon)
                c.add(polygon);

            } else if ($shpStore[$selectedID].objects[i].type === "labeledPt") {
                    circ = new LabeledPt({
                        radius: $shpStore[$selectedID].objects[i]['radius'],
                        hasBorders: false,
                        hasControls: false,
                        originX: $shpStore[$selectedID].objects[i]['originX'],
                        originY: $shpStore[$selectedID].objects[i]['originY'],
                        left: $shpStore[$selectedID].objects[i]['left'],
                        top: $shpStore[$selectedID].objects[i]['top'],
                        fill: $shpStore[$selectedID].objects[i]['fill'],
                        stroke: $shpStore[$selectedID].objects[i]['stroke'],
                        label: $shpStore[$selectedID].objects[i]['label'],
                        strokeWidth: $shpStore[$selectedID].objects[i]['strokeWidth'],
                        selectable: false,
                });
                // console.log(circ)
                c.add(circ); 
            }
        }
        count = $shpStore[$selectedID].objects.length;
    } else {
        count = 0;
    }
}

$: if (polygonGenerated) {
    // console.log("generated, draw the poly")
    drawPoly();
    polygonGenerated = false;
}

function drawRect() {
    // console.log('rect called')
    c.__eventListeners = {};


    c.on('mouse:down', function(o){
        var pointer = c.getPointer(o.e);

        isDown = true;
        origX = pointer.x;
        origY = pointer.y;

        rectangle = new LabeledRect({
            left: origX,
            top: origY,
            fill: 'transparent',
            stroke: 'red',
            label: 'arti_' + count,
            strokeWidth: 1.5,
            selectable: false,
        });
        c.add(rectangle);
    });

    c.on('mouse:move', function(o){
        if (!isDown) return;

        var pointer = c.getPointer(o.e);
        if(origX>pointer.x){
            rectangle.set({ left: Math.abs(pointer.x) });
        }
        if(origY>pointer.y){
            rectangle.set({ top: Math.abs(pointer.y) });
        }
        
        rectangle.set({ width: Math.abs(origX - pointer.x) });
        rectangle.set({ height: Math.abs(origY - pointer.y) });

        c.renderAll();
    });

    c.on('mouse:up', function(o){
        isDown = false;
        count += 1;


        if (rectangle.width === 0 || rectangle.height === 0) {
            c.remove(rectangle);
            count -= 1;
        } else {
            rect = c.toJSON();
        }

    });
    
}


function drawPoly() {
    // console.log('poly called')
    c.__eventListeners = {};
    polygonMode = true;
    pointArray = new Array();
    lineArray = new Array();
    activeLine;

    c.on('mouse:down', function (options) {
        if(options.target && options.target.id == pointArray[0].id){
            // console.log("calling generate")
            generatePolygon(pointArray);
        }

        if(polygonMode) {
            // console.log("adding pt")
            addPoint(options);
        }
    });

    c.on('mouse:up', function (options) {

    });

    c.on('mouse:move', function (options) {
        if(activeLine && activeLine.class == "line"){
            var pointer = c.getPointer(options.e);
            activeLine.set({ x2: pointer.x, y2: pointer.y });

            var points = activeShape.get("points");
            points[pointArray.length] = {
                x:pointer.x,
                y:pointer.y
            }
            activeShape.set({
                points: points
            });
            c.renderAll();
        }
        c.renderAll();
    });
    
} 

function addPoint(options) {
    var random = Math.floor(Math.random() * (max - min + 1)) + min;
    var id = new Date().getTime() + random;
    var circle = new fabric.Circle({
        radius: 5,
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 0.5,
        left: (options.e.layerX/c.getZoom()),
        top: (options.e.layerY/c.getZoom()),
        selectable: false,
        hasBorders: false,
        hasControls: false,
        originX:'center',
        originY:'center',
        id:id,
            objectCaching:false
    });

    if(pointArray.length == 0){
        circle.set({
            fill:'red',
        })
    }

    var points = [(options.e.layerX/c.getZoom()),(options.e.layerY/c.getZoom()),(options.e.layerX/c.getZoom()),(options.e.layerY/c.getZoom())];
    line = new fabric.Line(points, {
        strokeWidth: 2,
        fill: '#999999',
        stroke: '#999999',
        class:'line',
        originX:'center',
        originY:'center',
        selectable: false,
        hasBorders: false,
        hasControls: false,
        evented: false,
            objectCaching:false
    });

    if(activeShape){
        var pos = c.getPointer(options.e);
        var points = activeShape.get("points");
        points.push({
            x: pos.x,
            y: pos.y
        });

        polygon = new fabric.Polygon(points,{
            stroke:'#333333',
            strokeWidth:1,
            fill: '#cccccc',
            opacity: 0.3,
            selectable: false,
            hasBorders: false,
            hasControls: false,
            evented: false,
            objectCaching:false
        });

        c.remove(activeShape);
        c.add(polygon);
        activeShape = polygon;
        c.renderAll();
    }

    else{
        var polyPoint = [{x:(options.e.layerX/c.getZoom()),y:(options.e.layerY/c.getZoom())}];
        polygon = new fabric.Polygon(polyPoint,{
            stroke:'#333333',
            strokeWidth:1,
            fill: '#cccccc',
            opacity: 0.3,
            selectable: false,
            hasBorders: false,
            hasControls: false,
            evented: false,
            objectCaching:false
        });
        activeShape = polygon;
        c.add(polygon);
    }

    activeLine = line;

    pointArray.push(circle);
    lineArray.push(line);

    c.add(line);
    c.add(circle);
    c.selection = false;

}

function generatePolygon(pointArray) {
    var points = new Array();
    for (let i = 0; i < pointArray.length; i++) {
        points.push({
            x:pointArray[i].left,
            y:pointArray[i].top
        });
        c.remove(pointArray[i]);

    }

    for (let i = 0; i < lineArray.length; i++) {
        c.remove(lineArray[i]);
    }
    
    c.remove(activeShape).remove(activeLine);

    polygon = new LabeledPoly(points,{
        stroke:'red',
        label:'arti_' + count,
        strokeWidth:1.5,
        fill: 'transparent',
        opacity: 1,
        hasBorders: false,
        hasControls: false,
        selectable: false,
    });
    c.add(polygon);

    count += 1;
    poly = c.toJSON();

    activeLine = null;
    activeShape = null;
    polygonMode = false;
    polygonGenerated = true;


}

function drawPt() {
    // console.log('pt called')
    c.__eventListeners = {};

    c.on('mouse:down', function(o){
        var pointer = c.getPointer(o.e);

        origX = pointer.x;
        origY = pointer.y;

        circ = new LabeledPt({
            radius: 3,
            fill: 'transparent',
            stroke: 'red',
            strokeWidth: 2,
            left: origX,
            top: origY,
            selectable: false,
            hasBorders: false,
            hasControls: false,
            originX:'center',
            originY:'center',
            label:'arti_' + count,

        });
        c.add(circ);
        c.renderAll();

    });


    c.on('mouse:up', function(o){
        count += 1;
        pt = c.toJSON();
    });

}

function update_arti() {
    if ($selectedShape === "rect") {
        $shpStore[$selectedID] = rect;
    } else if ($selectedShape === "polygon") {
        $shpStore[$selectedID] = poly;
    } else if ($selectedShape === "point") {
        $shpStore[$selectedID] = pt;
    }

    // console.log($shpStore)

}

function select_annotation_tool() {
    if ($selectedShape === "rect") {
        drawRect();
    } else if ($selectedShape === "polygon") {
        drawPoly();
    } else if ($selectedShape === "point") {
        drawPt();
    }
}

$:  if ($selectedShape !== "") {
        // console.log($selectedShape)
        select_annotation_tool();
    }

$: if ($setImg === "") {
        $setImg = Object.keys($fileList)[0];
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


$: {
    console.log($exifData[$ctxtStore[$selectedID][0].file]["Image Height"])
}
let w;
let h;
$: if ($exifData[$ctxtStore[$selectedID][0].file]) {
    h = $exifData[$ctxtStore[$selectedID][0].file]["Image Height"].description;
    w = $exifData[$ctxtStore[$selectedID][0].file]["Image Width"].description;
}

</script>

<div id="image_panel" class="display_area_content" style="height: {h}; width: {w};">

    <!-- svelte-ignore a11y-img-redundant-alt -->
    <img id="bim" src={$showImg} alt="Image loaded from base64 data of a local file selected by user." >
    
    <canvas bind:this={canvas} id="region_canvas" width={w} height={h} tabindex="1">Sorry, your browser does not support HTML5 Canvas functionality which is required for this application.</canvas>

</div>
