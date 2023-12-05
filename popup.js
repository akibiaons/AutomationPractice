// POPUP.JS **
// This is ran/opened at my.adivsor portal **
// This is step 1: Excel sheet is processed here and the "Start Button" sends **
// messages to the other scripts to run actions (functions) **

// Exvcel sheet processor, JSONify's and console.logs err + succ

document
  .getElementById("fileinput")
  .addEventListener("change", function (event) {
    // Declaration for target file
    const file = event.target.files[0];

    // IF file exists (if file uploaded)
    if (file) {
      // Declaration for function that async read contents of file given
      const reader = new FileReader();

      let excelData;

      reader.onload = function (e) {
        // Shortened declaration
        const data = e.target.result;

        // Data process step 2 goes here
        const workbook = XLSX.read(data, { type: "binary" });

        // Title of worksheet
        const sheetName = workbook.SheetNames[0];

        // Title of worksheet
        const worksheet = workbook.Sheets[sheetName];

        // Turns provided file into json (readable data)
        excelData = XLSX.utils.sheet_to_json(worksheet, { raw: true });

        function isInvalidData(item) {
          // Replace the logic below with whatever makes an item "invalid" for your context
          return !item.CLIENT_TITLE || !item.FIRST_NAME || !item.LAST_NAME;
        }

        const lastValidIndex = excelData.findIndex((item) =>
          isInvalidData(item)
        ); // Implement isInvalidData to determine invalid or header rows
        const validExcelData = excelData.slice(0, lastValidIndex + 1); // Adjust this based on how you detect valid entries

        chrome.storage.local.set(
          {
            excelData: validExcelData,
            totalIndexes: lastValidIndex + 1, // Store the count of valid data entries
          },
          () => {
            console.log(
              "Excel data and total indexes stored in chrome storage"
            );
          }
        );

        chrome.storage.local.set({ currentIndex: 29 }, function () {
          console.log("currentIndex reset to 29");
        });

        // _DEV USE ONLY
        console.log(excelData);

        // Storing the excelData below with chrome storage api
        chrome.storage.local.set({ excelData: excelData }, function () {
          // _DEV US ONLY
          console.log("Excel data stored in chrome storage");
        });
      };

      // XLXS method
      reader.readAsBinaryString(file);
    }
  });

// Below is the logic to start the automation injection process by opening a new window. As well as sending the
// - parsed data to the newTabScript, via the service_worker.js.....
document.getElementById("start").addEventListener("click", () => {
  // Below is the code that sends a message to start the injection process.
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    // Send message to "service_worker.js" to start the injection process
    chrome.tabs.sendMessage(activeTab.id, { action: "startInjection" });
  });
});
