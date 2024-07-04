const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const sizeOf = require("image-size");
const { file } = require("babel-types");

// Define the path to your existing HTML file
const htmlFilePath = path.join(__dirname, "template.html");
const imageDirectory = path.join(__dirname, "images");

const images = [];

try {
  // Read the directory synchronously
  const files = fs.readdirSync(imageDirectory);

  // Filter files with .png and .jpg extensions
  const imageFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ext === ".jpg" || ext === ".jpeg";
  });

  // Process each image file to get dimensions
  imageFiles.forEach((file) => {
    const filePath = path.join(imageDirectory, file);
    try {
      const dimensions = sizeOf(filePath);
      const image = {
        file,
        heightRatio: dimensions.height / dimensions.width,
      };
      images.push(image);
    } catch (err) {
      console.error("Error getting dimensions:", err);
    }
  });
} catch (err) {
  console.error("Error reading directory:", err);
}

fs.readFile(htmlFilePath, "utf8", (err, htmlContent) => {
  if (err) {
    console.error("Error reading HTML file:", err);
    return;
  }

  // Create a new JSDOM instance with the existing HTML content
  const dom = new JSDOM(htmlContent);

  // Access the document object
  const document = dom.window.document;

  // Manipulate the DOM ====================================================================================
  const columnVariants = 4;

  for (n = 0; n < columnVariants; n++) {
    const numberOfColumns = n + 1;
    const cols = [];
    for (i = 0; i < numberOfColumns; i++) cols.push([]);
    const sum = (array) => array.reduce((a, b) => a + b, 0);

    let colIndex = 0;
    for (const image of images) {
      cols[colIndex].push(image);

      function callback(a, b, i) {
        const heightRatiosA = cols[a].map((map) => map.heightRatio);
        const heightRatiosB = b.map((map) => map.heightRatio);
        const sumA = sum(heightRatiosA);
        const sumB = sum(heightRatiosB);
        return sumA <= sumB ? a : i;
      }

      colIndex = cols.reduce(callback, colIndex);
    }

    const gridVariant = document.createElement("div");
    gridVariant.className = "grid";
    gridVariant.id = `grid-${numberOfColumns}`;

    cols.forEach((col) => {
      const gridColumn = document.createElement("div");
      gridColumn.className = "col";
      for (const image of col) {
        // const filenameText = document.createElement("h1");
        // filenameText.textContent = image.file;
        // gridColumn.appendChild(filenameText);

        const img = document.createElement("img");
        img.className = "image";
        img.src = `images/${image.file}`;
        gridColumn.appendChild(img);
      }
      gridVariant.appendChild(gridColumn);
    });

    document.body.appendChild(gridVariant);
  }
  // Serialize the DOM back to HTML ====================================================================================
  const updatedHtmlContent = dom.serialize();

  // Write the updated HTML content to a new file
  const outputFilePath = path.join(__dirname, "index.html");
  fs.writeFile(outputFilePath, updatedHtmlContent, "utf8", (err) => {
    if (err) {
      console.error("Error writing updated HTML file:", err);
      return;
    }
    console.log("Updated HTML file has been saved.");
  });
});

console.log(gridMediaQuery(5, 1, 768));

function gridMediaQuery(maxNumberOfColumns, gridIndex, minWidth) {
  let cssString = `
@media screen and (min-width: ${minWidth}px) {
  .grid {
    grid-template-columns: repeat(${gridIndex + 1}, 1fr);
  }
`;
  for (i = 0; i < maxNumberOfColumns; i++) {
    cssString += `
  #grid-${i + 1} {
    display: ${i === gridIndex ? "grid" : "none"};
  }
`;
  }
  cssString += "}";
  return cssString;
}
