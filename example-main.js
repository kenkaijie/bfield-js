'use strict';

/**
 * Returns true if a === b
 * 
 * @param {Array} a 
 * @param {Array} b 
 */
function arrayExactEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let idx = 0; idx < a.length; ++idx) {
    if (a[idx] !== b[idx]) {
      return false;
    }
  }
  return true;
}


/**
 * Validates the bitfields for their typing and structural composition.
 * 
 * @param {Array} bitfieldList 
 */
function validateBitfieldList(bitfieldList)
{
  let isValid=true;

  // Validate Structure
  const bitfieldFields = ['name', 'bitStart', 'bitEnd', 'access', 'shaded'];
  try {
    isValid &= (bitfieldList.length > 0);
    bitfieldList.map((item)=> {
      isValid &=  arrayExactEqual(Object.keys(item).sort(),bitfieldFields.sort());
      isValid &= typeof item.name === "string"
      isValid &= typeof item.bitStart === "number"
      isValid &= typeof item.bitEnd === "number"
      isValid &= typeof item.access === "string"
      isValid &= typeof item.shaded === "boolean"
    });
  } catch (error) {
    isValid = false;
  }

  // Validate Values
  let bitCounter = 0;
  for (const bitfield of bitfieldList) {
    isValid &= (bitfield.bitStart === bitCounter);
    isValid &= (bitfield.bitEnd >= bitfield.bitStart);
    if (isValid) {
      bitCounter = bitfield.bitEnd + 1;
    } else {
      break;
    }
  }

  return isValid;
}

/**
* Generates a bitfield from the given field and it's options
* @param {Object} bitfield 
* @param {Object} bitfieldOptions 
*/
function generateSVG(rootNode, bitfieldsList, bitfieldOptions)
{

  if (!validateBitfieldList(bitfieldsList))
  {
    return undefined;
  }

let xOffset = 100;
let yOffset = 100;

let bitWidth = bitfieldOptions.bitWidth;
let bitHeight = bitfieldOptions.bitHeight;

let oversizeTextAdditionalOffsetY = 0; // Used to compensate if an access is specified and the text width is too small (makes all angle text start at same height)
let angleTextOffset = 0; // used to compensate when the height of the image is too thin to see full text

let bitfields = (!bitfieldOptions.msbRight)? bitfieldsList.slice().reverse() : bitfieldsList.slice();

// create the main document
rootNode.innerHTML = ''; // we clear, we dont have to remove listeners because this is just an svg image
const bitfieldImage = document.createElementNS("http://www.w3.org/2000/svg", "svg");
rootNode.appendChild(bitfieldImage);
bitfieldImage.setAttribute("xmlns", "http://www.w3.org/2000/svg");
bitfieldImage.setAttribute("class", "bfield");

const svg1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
bitfieldImage.appendChild(svg1);

// append stylesheet
let stylesheet = document.createElementNS("http://www.w3.org/2000/svg", "style");
stylesheet.innerHTML = 
`
.bfield-rect {
stroke: #000000;
stroke-width: 2;
}

.bfield-shaded {
fill: #bed0e0;
}

.bfield-unshaded {
fill: none;
}

.bfield-text {
font-family: sans-serif;
font-size: 14px;
text-anchor: middle;
dominant-baseline: middle;
}

.bfield-text-angled {
text-anchor: end;
}

.bfield-line {
stroke:#000000;
stroke-width:1;
}

.bfield-line-dotted {
stroke-dasharray: 2;
}

`;
svg1.appendChild(stylesheet);

// create bitfields
let currentX = xOffset;
let bitCount = 0;
for (let bitfield of bitfields)
{
  bitCount = Math.max(bitCount, bitfield.bitEnd);
let bitfieldGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
svg1.appendChild(bitfieldGroup);

let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
bitfieldGroup.appendChild(rect);

let bitfieldWidth = bitWidth * (1 + bitfield.bitEnd - bitfield.bitStart);
let initialX = currentX;
rect.setAttribute("x", currentX);
rect.setAttribute("y", yOffset);
rect.setAttribute("width", bitfieldWidth);
rect.setAttribute("height", bitHeight);
rect.setAttribute("class", "bfield-rect "+ ((bitfield.shaded)? "bfield-shaded" : "bfield-unshaded"));
currentX += bitfieldWidth;

if (bitfieldOptions.showBitTick) {
  let minorGridTicks = document.createElementNS("http://www.w3.org/2000/svg", "g");
  bitfieldGroup.appendChild(minorGridTicks);

  for (let i=initialX+bitWidth;i<(initialX+bitfieldWidth);i+=bitWidth)
  {
    let minorGridTop = document.createElementNS("http://www.w3.org/2000/svg", "line");
    minorGridTicks.appendChild(minorGridTop);

    minorGridTop.setAttribute("x1", i);
    minorGridTop.setAttribute("y1", yOffset);
    minorGridTop.setAttribute("x2", i);
    minorGridTop.setAttribute("y2", yOffset + bitHeight/5);
    minorGridTop.setAttribute("class", "bfield-line-dotted bfield-line");
    
    let minorGridBottom = document.createElementNS("http://www.w3.org/2000/svg", "line");
    minorGridTicks.appendChild(minorGridBottom);

    minorGridBottom.setAttribute("x1", i);
    minorGridBottom.setAttribute("y1", yOffset + bitHeight);
    minorGridBottom.setAttribute("x2", i);
    minorGridBottom.setAttribute("y2", yOffset + 4*bitHeight/5);
    minorGridBottom.setAttribute("class", "bfield-line-dotted bfield-line");
  }
}
if (bitfieldOptions.showAccess && bitfield.access)
{
  // write the bottom text
  let accessText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  bitfieldGroup.appendChild(accessText);
  
  accessText.textContent = bitfield.access;
  accessText.setAttribute("class", "bfield-text");
  // now that it's set in the document, we will check it's size
  let accessBBox = accessText.getBBox();
  accessText.setAttribute("x", initialX + bitfieldWidth/2);
  accessText.setAttribute("y", yOffset + bitHeight + accessBBox.height);

  oversizeTextAdditionalOffsetY = Math.max(oversizeTextAdditionalOffsetY, accessBBox.height);
}

// write the start and ends at the proper places
let leftIndex = document.createElementNS("http://www.w3.org/2000/svg", "text");
bitfieldGroup.appendChild(leftIndex);

leftIndex.textContent = (!bitfieldOptions.msbRight)? bitfield.bitEnd : bitfield.bitStart;
leftIndex.setAttribute("class", "bfield-text");
// now that it's set in the document, we will check it's size
let leftBBox = leftIndex.getBBox();
leftIndex.setAttribute("x", initialX + bitWidth/2);
leftIndex.setAttribute("y", yOffset - leftBBox.height/2);

if (bitfield.bitEnd !== bitfield.bitStart)
{
// write the start and ends at the proper places
let rightIndex = document.createElementNS("http://www.w3.org/2000/svg", "text");
bitfieldGroup.appendChild(rightIndex);

rightIndex.textContent = (!bitfieldOptions.msbRight)? bitfield.bitStart : bitfield.bitEnd;
rightIndex.setAttribute("class", "bfield-text");
// now that it's set in the document, we will check it's size
let rightBBox = rightIndex.getBBox();
rightIndex.setAttribute("x", currentX - bitWidth/2);
rightIndex.setAttribute("y", yOffset - rightBBox.height/2);
}

// if we can fit the text, we do so, or else we add it to the list for later addition
let nameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
bitfieldGroup.appendChild(nameText);

nameText.textContent = bitfield.name;
nameText.setAttribute("class", "bfield-text");
// now that it's set in the document, we will check it's size
let nameBBox = nameText.getBBox();
nameText.setAttribute("x", initialX + bitfieldWidth/2);
nameText.setAttribute("y", yOffset + bitHeight/2);

// shift the text
if ((nameBBox.width > bitfieldWidth) || (nameBBox.height > bitHeight))
{
  let targetx = initialX + bitfieldWidth/2;
  let targety = yOffset + bitHeight;
  let additionaly = ((bitfield.access) ? oversizeTextAdditionalOffsetY : 0);

  let lineStartY = 0.5*nameBBox.height;
  let lineEndY = 2.5*nameBBox.height;
  let nameStartY = lineEndY + 0.5*nameBBox.height

  let nameLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  bitfieldGroup.appendChild(nameLine);

  nameLine.setAttribute("x1", targetx);
  nameLine.setAttribute("y1", targety + lineStartY + + additionaly);
  nameLine.setAttribute("x2", targetx);
  nameLine.setAttribute("y2", targety + lineEndY );
  nameLine.setAttribute("class", "bfield-line");

  nameText.setAttribute("class", "bfield-text-angled bfield-text");
  nameText.setAttribute("x", targetx);
  nameText.setAttribute("y", targety + nameStartY);
  nameText.setAttribute("transform", `rotate(-45 ${targetx} ${targety + nameStartY})`);
  angleTextOffset = Math.max(angleTextOffset, nameText.getBBox().height);
}
}

bitCount += 1; // index start from 1

let majorGridLines =  document.createElementNS("http://www.w3.org/2000/svg", "g");
svg1.appendChild(majorGridLines);
// create the major ticks, starting from the end
for (let idx=0; (idx <= bitCount) && (bitCount!==0); ++idx)
{
  let cursor = (!bitfieldOptions.msbRight)? bitCount-idx: idx;
if (cursor % bitfieldOptions.majorTick === 0)
{
  let majorGridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  majorGridLines.appendChild(majorGridLine);

  majorGridLine.setAttribute("x1", xOffset + idx*bitWidth);
  majorGridLine.setAttribute("y1", yOffset);
  majorGridLine.setAttribute("x2", xOffset + idx*bitWidth);
  majorGridLine.setAttribute("y2", yOffset - 3*bitHeight/5);
  majorGridLine.setAttribute("class", "bfield-line-dotted bfield-line");
}
}


// we clip and scale the SVG now
var svgBBox = svg1.getBBox();
svg1.setAttribute('style',`transform:translate(${-1*svgBBox.x}px, ${-1*svgBBox.y}px);`);
bitfieldImage.setAttribute("viewBox",`0 0 ${svgBBox.width} ${svgBBox.height}` );

console.log("done");
return bitfieldImage.outerHTML;
}