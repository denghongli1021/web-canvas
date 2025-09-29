var canvas = document.getElementById('paintCanvas');
var context = canvas.getContext('2d');
var penColor = 'black';
var bgColor = window.getComputedStyle(document.getElementById('paintCanvas')).backgroundColor;
var brushSize = 25;
var lastX = 0;
var lastY = 0;
var uploadedImage = null;
var imageX = 0;
var imageY = 0;
var imageWidth = 0;
var imageHeight = 0;
var currentTool = "brush";
const undoStack = [];
const redoStack = [];
let shape = 'rectangle';
let isDrawing = false;
let startX, startY;
let snapshot;
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);
// canvas.addEventListener('mousedown', startDrawingShape);
// canvas.addEventListener('mousemove', drawShape);
// canvas.addEventListener('mouseup', endDrawingShape);
// canvas.addEventListener('mouseleave', endDrawing);
// canvas.addEventListener('click', handleImageClick);
//// Image upload
var fileInput = document.getElementById('fileInput');
// fileInput.addEventListener('change', handleImageUpload);
function uploadImage() {
    var fileInput = document.getElementById('imageUpload');
    fileInput.click();
}
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                context.drawImage(img, 0, 0);
                imageWidth = img.width;
                imageHeight = img.height;
                imageX = (canvas.width - imageWidth) / 2;
                imageY = (canvas.height - imageHeight) / 2;
                uploadedImage = img;
                saveState();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        console.log("image upload finish");
    }
}
//// TODO Image move after click
// function handleImageClick(e) {
//     var mouseX = e.clientX - canvas.offsetLeft;
//     var mouseY = e.clientY - canvas.offsetTop;

//     if (mouseX >= imageX && mouseX <= imageX + imageWidth &&
//         mouseY >= imageY && mouseY <= imageY + imageHeight) {
//         // Add your logic here for when the image is clicked
//     }
// }
// function Update() {
//     const img = new Image();
//     img.onload = function () {
//         context.clearRect(0, 0, canvas.width, canvas.height);
//         context.drawImage(img, 0, 0);
//     }
//     img.src = undoStack[undoStack.length - 1];
// }
// Update();
//// Draw
const drawRectangle = (e) => {
    context.fillStyle = context.strokeStyle;
    // if fillColor isn't checked draw a rect with border else draw rect with background
    var checkbox = document.getElementById("myCheckbox");
    if(!checkbox.checked) {
        // creating circle according to the mouse pointer
        return context.strokeRect(e.offsetX, e.offsetY, startX - e.offsetX, startY - e.offsetY);
    }
    else {
        context.fillRect(e.offsetX, e.offsetY, startX - e.offsetX, startY - e.offsetY);
    }
}
const drawCircle = (e) => {
    context.fillStyle = context.strokeStyle;
    var checkbox = document.getElementById("myCheckbox");
    context.beginPath(); // creating new path to draw circle
    // getting radius for circle according to the mouse pointer
    let radius = Math.sqrt(Math.pow((startX - e.offsetX), 2) + Math.pow((startY - e.offsetY), 2));
    context.arc(startX, startY, radius, 0, 2 * Math.PI); // creating circle according to the mouse pointer
    checkbox.checked ? context.fill() : context.stroke(); // if fillColor is checked fill circle else draw border circle
}
const drawTriangle = (e) => {
    context.fillStyle = context.strokeStyle;
    var checkbox = document.getElementById("myCheckbox");
    context.beginPath(); // creating new path to draw circle
    context.moveTo(startX, startY); // moving triangle to the mouse pointer
    context.lineTo(e.offsetX, e.offsetY); // creating first line according to the mouse pointer
    context.lineTo(startX * 2 - e.offsetX, e.offsetY); // creating bottom line of triangle
    context.closePath(); // closing path of a triangle so the third line draw automatically
    checkbox.checked ? context.fill() : context.stroke(); // if fillColor is checked fill triangle else draw border
}
function drawLine(startX, startY, endX, endY) {
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY); 
    context.stroke(); 
}
function drawStraightLine(e) {
    context.fillStyle = context.strokeStyle; 

    var checkbox = document.getElementById("myCheckbox"); 

    if (!isDrawing) return;

    const x = e.clientX - canvas.getBoundingClientRect().left; 
    const y = e.clientY - canvas.getBoundingClientRect().top; 

    context.clearRect(0, 0, canvas.width, canvas.height); 
    context.putImageData(snapshot, 0, 0); 

    drawLine(startX, startY, x, y); 

    if (checkbox.checked) {
        context.fill(); 
    } else {
        context.stroke(); 
    }
}
function startDrawing(e) {
    if (currentTool !== 'text'  && (currentTool == "brush" || currentTool == "eraser")) {
        [lastX, lastY] = [e.clientX - canvas.getBoundingClientRect().left, e.clientY - canvas.getBoundingClientRect().top];
        context.beginPath();
        context.moveTo(lastX, lastY);
    } else if (currentTool == 'text'){
        createTextInput(e);
    }
    else {
        isDrawing = true;
        startX = e.clientX - canvas.getBoundingClientRect().left;
        startY = e.clientY - canvas.getBoundingClientRect().top;
        snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
    }
}

function draw(e) {
    if (currentTool != "text" && (currentTool == "brush" || currentTool == "eraser")) {
        if (e.buttons !== 1) return; // Only draw when the mouse button is clicked
        var x = e.clientX - canvas.offsetLeft;
        var y = e.clientY - canvas.offsetTop;
        context.lineTo(x, y);
        if (currentTool == "brush") {
            context.strokeStyle = penColor;
        }
        else if (currentTool == "eraser") {
            context.strokeStyle = bgColor;
        }
        context.lineWidth = brushSize;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.stroke();
        [lastX, lastY] = [x, y];
    }else {
        if (!isDrawing) return;
        const x = e.clientX - canvas.getBoundingClientRect().left;
        const y = e.clientY - canvas.getBoundingClientRect().top;
        const width = x - startX;
        const height = y - startY;
        context.lineWidth = brushSize;
        context.strokeStyle = penColor;
        //context.clearRect(0, 0, canvas.width, canvas.height);
        context.putImageData(snapshot, 0, 0);
        if (shape === 'circle') {
            drawCircle(e);
        } else if (shape === 'rectangle') {
            drawRectangle(e);
        } else if (shape === 'triangle') {
            drawTriangle(e);
        } else if (shape == 'line') {
            drawStraightLine(e);
        }
    }
}
function endDrawing() {
    isDrawing = false;
    console.log("endDrawing");
    saveState();
}
function saveState() {
    if (canvas.toDataURL() == undoStack[undoStack.length-1]) {
        console.log("Same picture");
    }
    else {
        undoStack.push(canvas.toDataURL());
        redoStack.length = 0; // Clear redo stack
        console.log("saveState");
        console.log("Undo length:" + undoStack.length);
    }
    
}
function undo() {
    if (undoStack.length > 1) { 
        redoStack.push(undoStack.pop());
        const img = new Image();
        img.onload = function () {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0);
        }
        img.src = undoStack[undoStack.length - 1];
        console.log("undo");
    }
    else if (undoStack.length == 1) {
        redoStack.push(undoStack.pop());
        context.clearRect(0, 0, canvas.width, canvas.height);
        console.log("only last one in undostack");
        console.log(undoStack.length);
    }
}
function redo() {
    if (redoStack.length > 0) {
        undoStack.push(redoStack.pop());
        const img = new Image();
        img.onload = function () {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0);
        }
        img.src = undoStack[undoStack.length - 1];
        console.log("redo");
        console.log("Redo length:" + redoStack.length);
    }
}
function drawDot(e) {
    if (currentTool !== 'text') {
        var x = e.clientX - canvas.offsetLeft;
        var y = e.clientY - canvas.offsetTop;
        context.fillStyle = penColor;
        context.fillRect(x, y, 1, 1);
        // No need for saveState() here as UNDO and REDO functionalities are removed
    }
}
//// #### Color function ####
function changeColor(color) {
    penColor = color;
}
function resetButtonBorders(id) {
    var c1 = document.getElementById('color_1');
    var c2 = document.getElementById('color_2');
    var c3 = document.getElementById('color_3');
    var c4 = document.getElementById('color_4');
    var c5 = document.getElementById('color_5');
    var c6 = document.getElementById('colorPickerButton');

    var t1 = document.getElementById('tool1');
    var t2 = document.getElementById('tool2');
    var t3 = document.getElementById('tool3');
    var t4 = document.getElementById('tool4');
    var t5 = document.getElementById('tool5');
    var t6 = document.getElementById('tool6');
    var t7 = document.getElementById('tool7');
    if (id == "color_1" || id == "color_2" || id == "color_3" || id == "color_4" || id == "color_5" || id == "colorPickerButton") {
        c1.style.borderColor = 'white';
        c2.style.borderColor = 'white';
        c3.style.borderColor = 'white';
        c4.style.borderColor = 'white';
        c5.style.borderColor = 'white';
        c6.style.borderColor = 'white';

        document.getElementById(id).style.borderColor = 'green';
    }
    else if (id == "tool1" || id == "tool2"|| id == "tool3"|| id == "tool4"|| id == "tool5"|| id == "tool6"|| id == "tool7") {
        t1.style.borderColor = 'white';
        t2.style.borderColor = 'white';
        t3.style.borderColor = 'white';
        t4.style.borderColor = 'white';
        t5.style.borderColor = 'white';
        t6.style.borderColor = 'white';
        t7.style.borderColor = 'white';

        document.getElementById(id).style.borderColor = 'green';
    }
}
function showColorPicker() {
    var colorPicker = document.getElementById('colorPicker');
    var colorPickerButton = document.getElementById('colorPickerButton');
    colorPicker.style.display = colorPickerButton.style.display;
    colorPicker.addEventListener('change', function() {
        colorPickerButton.style.backgroundColor = colorPicker.value;
        resetButtonBorders("colorPickerButton");
    });
}
function changeCustomColor(color) {
    changeColor(color);
    document.getElementById('colorPicker').style.display = 'none';
}

//// #### custom cursor ####
function useTool(tool) {
    //resettoolborder();
    currentTool = tool;
    if (tool == "brush") {
        document.body.style.cursor = "url('cur/icons8-paintbrush-24.png'), auto";
        console.log("change to brush tool");
        currentTool = "brush";
    }
    else if (tool == "eraser"){
        document.body.style.cursor = "url('cur/icons8-pencil-eraser-24.png'), auto"; 
        console.log("change to erser tool");
        currentTool = "eraser";
    }
    else if (tool == "text") {
        document.body.style.cursor = "url('cur/icons8-text-cursor-24.png'), auto"; 
        console.log("change to text tool");
        currentTool = "text";
    }
    else if (tool == "circle" ||tool == "rectangle" ||tool == "triangle" || tool =="line"){
        switch (tool) {
            case 'circle' :
                shape = "circle";
                currentTool = "circle";
                document.body.style.cursor = "url('cur/circle.png'), auto"; 
                break;
            case 'rectangle' :
                shape = "rectangle";
                currentTool = "rectangle";
                document.body.style.cursor = "url('cur/rectangle.png'), auto"; 
                break;
            case 'triangle' :
                shape = "triangle";
                currentTool = "triangle";
                document.body.style.cursor = "url('cur/triangle.png'), auto"; 
                break;
            case 'line' :
                shape = "line";
                currentTool = "line";
                document.body.style.cursor = "url('cur/line.png'), auto"; 
                break;
            default :
                shape = "circle";
                currentTool = "circle";
        } 
        console.log("Switched to " + currentTool);
    }
}
function changeBrushSize(size) {
    brushSize = size;
}
//// #### Clear all / Refresh ####
function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
    // No need to reset history and historyIndex as UNDO and REDO functionalities are removed
}
//// #### Text ####
function createTextInput(e) {
    var input = document.createElement('input');
    input.type = 'text';
    input.style.position = 'absolute';
    input.style.left = e.clientX + 'px';
    input.style.top = e.clientY + 'px';
    input.style.zIndex = '100';
    document.body.appendChild(input);
    input.focus();
    input.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            var text = input.value;
            context.fillStyle = penColor;
            context.fillText(text, e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
            if (document.body.contains(input)) {
                document.body.removeChild(input);
            }
            saveState();
        }
    });
    document.addEventListener('click', function(event) {
        var rect = input.getBoundingClientRect();
        var isInInput = (
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom
        );
        if (!isInInput && document.body.contains(input)) {
            document.body.removeChild(input);
        }
    });
}
function changeFont(font) {
    context.font = `${document.getElementById('fontSize').value}px ${font}`;
}
function changeFontSize(size) {
    context.font = `${size}px ${document.getElementById('fontSelect').value}`;
}
//// #### Download ####
function downloadCanvas() {
    var downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', 'canvas_image.png');
    var dataURL = canvas.toDataURL('image/png');
    var url = dataURL.replace(/^data:image\/png/, 'data:application/octet-stream');
    downloadLink.setAttribute('href', url);
    downloadLink.click();
}

// #### bonus function ####
var changeIndex = 0;
function ChangeisBackgroundChanged() {
    changeIndex = (changeIndex==2) ? 0 : changeIndex+1;
    ChangeStyle();
}
// function rgbToHex(r, g, b) {
//     return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
// }

// function componentToHex(c) {
//     var hex = c.toString(16); 
//     return hex.length == 1 ? '0' + hex : hex; 
// }

// var r = 92, g = 85, b = 85;
// var hexColor = rgbToHex(r, g, b);
// console.log(hexColor);
function showStatus() {
    var statusDisplay = document.getElementById('statusDisplay');

    switch (changeIndex) {
        case 0:
            statusDisplay.textContent = 'Normal';
            break;
        case 1:
            statusDisplay.textContent = 'Crazy';
            break;
        case 2:
            statusDisplay.textContent = 'Super Crazy';
            break;
        default:
            statusDisplay.textContent = '';
    }

    statusDisplay.style.display = 'block';
}
setInterval(showStatus ,10);
function ChangeStyle() {
    const colors = ['#5c5555','#ff5733', '#33ff57', '#5733ff']; 
    let currentIndex = 1; 
    if(changeIndex == 1) {
        function changeColor() {
            console.log("Changing color" + currentIndex);
            document.body.style.backgroundColor = colors[currentIndex]; 
            currentIndex = (currentIndex + 1) % colors.length; 
        }

        const intervalId = setInterval(changeColor, 500); // 0.5 sec to change

        function stopBackgroundColorChange() {
            if (changeIndex != 1) {
                clearInterval(intervalId); 
                clearInterval(intervalId2); 
                document.body.style.backgroundColor = colors[0];
            }
        };
        const intervalId2 = setInterval(stopBackgroundColorChange, 250);
    }
    else if (changeIndex == 2) {
        function changeColor() {
            console.log("Changing color" + currentIndex);
            document.body.style.backgroundColor = colors[currentIndex]; 
            currentIndex = (currentIndex + 1) % colors.length; 
        }

        const intervalId = setInterval(changeColor, 50); // 0.5 sec to change

        function stopBackgroundColorChange() {
            if (changeIndex != 2) {
                clearInterval(intervalId); 
                clearInterval(intervalId2); 
                document.body.style.backgroundColor = colors[0];
            }
        };
        const intervalId2 = setInterval(stopBackgroundColorChange, 25);
    }
}
// time display
function updateDateTime() {
    const currentDateTimeElement = document.getElementById('currentDateTime');
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const currentDateTimeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    currentDateTimeElement.textContent = currentDateTimeString;
}

setInterval(updateDateTime, 100);
updateDateTime();

function updateLocation() {
    const currentLocationElement = document.getElementById('currentLocation');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const latitude = position.coords.latitude.toFixed(6);
            const longitude = position.coords.longitude.toFixed(6);
            const currentLocationString = `Latitude: ${latitude}, Longitude: ${longitude}`;
            currentLocationElement.textContent = currentLocationString;
        }, error => {
            currentLocationElement.textContent = 'Unable to retrieve location.';
            console.error('Error getting location:', error);
        });
    } else {
        currentLocationElement.textContent = 'Geolocation is not supported by this browser.';
        console.error('Geolocation is not supported.');
    }
}
updateLocation();