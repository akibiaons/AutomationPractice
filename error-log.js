// error-log.js

document.addEventListener("DOMContentLoaded", function () {
  const metadataContainer = document.getElementById("metadata");
  const errorLogContainer = document.getElementById("errorLog");

  // Function to update the metadata display
  function updateMetadata(metadata) {
    // Assuming metadata is an object with fileName, totalRows, etc.
    metadataContainer.innerHTML = `
        <div>File: ${metadata.fileName || "N/A"}</div>
        <div>Total Rows: ${metadata.totalRows || 0}</div>
        <div>Errors: ${metadata.errorLogs ? metadata.errorLogs.length : 0}</div>
        <div>Date: ${new Date().toLocaleDateString()}</div>
        <div>Successful Rows: ${metadata.successfulRows || 0}</div>
      `;
  }

  // Function to display errors
  function displayErrors(errors) {
    errorLogContainer.innerHTML = ""; // Clear existing logs
    if (errors && errors.length) {
      errors.forEach((error, index) => {
        const errorDiv = document.createElement("div");
        errorDiv.classList.add("error-container");
        errorDiv.textContent = `Error ${index + 1} at row ${error.rowIndex}: ${
          error.error
        }`;
        errorLogContainer.appendChild(errorDiv);
      });
    } else {
      errorLogContainer.textContent = "No errors logged.";
    }
  }

  // Fetch initial metadata and errors
  chrome.storage.local.get(["errorLogs", "metadata"], function (data) {
    const metadata = {
      fileName: data.metadata?.fileName,
      totalRows: data.metadata?.totalRows,
      successfulRows: data.metadata?.successfulRows,
      errorLogs: data.errorLogs,
    };
    updateMetadata(metadata);
    displayErrors(data.errorLogs);
  });

  // Listen for changes in storage
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === "local") {
      if (changes.metadata) {
        updateMetadata(changes.metadata.newValue);
      }
      if (changes.errorLogs) {
        displayErrors(changes.errorLogs.newValue);
      }
    }
  });
});
