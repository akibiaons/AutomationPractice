// NEWTABSCRIPT.JS **
// Step 4: running the scripts for the new tab **

// _DEV USE ONLY
// Just to confirm its running n shit
console.log("New tab script running!");
// utility functions defined here below:

//Clicks a certain button that says "Create household"
function clickSpan() {
  let success = false; // flag to indicate if click was successful
  // let wasClicked = false;  // Boolean to track if the desired span was clicked. another way of reading above^

  // Fetch all span elements in the document.
  let spans = document.querySelectorAll("span");

  // Loop through each span and click if it matches the desired text.
  spans.forEach((span) => {
    if (span.textContent.includes("Create a new household")) {
      // Create a new mouse event
      let event = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      // Dispatch the event on the target element...
      span.dispatchEvent(event);
      success = true; // Return whether the desired span was clicked or not.
    }
  });
  return success; // Return the status
}

// Helper function to fetch an element by its aria-label attribute.
function findElementByAriaLabel(label) {
  return document.querySelector(`[aria-label="${label}"]`);
}

// Set input value based on its aria-label attribute.
function setInputValueByAriaLabel(label, value) {
  const element = findElementByAriaLabel(label);
  if (element) {
    element.value = value;
  }
}

function findElementByAriaLabel(label) {
  return document.querySelector(`[aria-label="${label}"]`);
}

function setupMutationObserver(data) {
  // Select the node that will be observed for mutations
  const targetNode = document.body; //Assuming that we want to observe the entire body for changes....
  // Options for the observer (which mutations to observe)
  const config = { attributes: false, childList: true, subTree: true };
  // Callback function to execute when mutations are observed
  const callback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // Check if the added node is the modal or contains the modal
        // You might need to adjust the condition based on your modal's characteristics
        if (mutation.target.querySelector(".modal-draggable-handle")) {
          console.log("Modal detected!"); // Confirming modal detection
          // Replace '.modal-selector' with an actual selector for your modal
          processExcelData(data);
          observer.disconnect(); // Stop observing after successful data injection..
        }
      }
    }
  };
  //Create an instance of the observer with the callback function
  const observer = new MutationObserver(callback);
  // Start observing the target node for configured mutations
  observer.observe(targetNode, config);
}
// Utility functions defined above...

// Listener to act upon receiving messages from the Chrome extension.
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "automateData") {
    console.log("Received Excel Data:", message.data);

    // Ensure webpage content (DOM) is fully loaded before taking action.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        const openName = clickSpan(); // call the autoclicker here
        setupMutationObserver(message.data);
        sendResponse({ status: openName ? "success" : "error" });
      });
    } else {
      //DOMContentLoaded already has fired
      const openName = clickSpan(); // Calling the span clicker here...
      setupMutationObserver(message.data);
      sendResponse({ status: openName ? "success" : "error" });
    }
    return true;
  }
});

// Process the provided Excel data to fill input fields.
function processExcelData(data) {
  // GUALBERTO BRANCH
  // Assuming data is an array of objects with keys corresponding to aria labels
  data.forEach((item) => {
    for (const key in item) {
      setInputValueByAriaLabel(key, item[key]); // or setTextByAriaLabel, as appropriate
    }
  });
  //......

  //   MAIN BRANCH
  console.log("Processing data", data);
  // Add checks for data structure here
  if (typeof data === "object" && data !== null) {
    const clientTitle = data.CLIENT_TITLE || "Default Title"; // Fallback value
    const firstName = data.FIRST_NAME || "Default Name"; // Fallback as well
    setInputValueByAriaLabel("Enter household name", clientTitle);
    setInputValueByAriaLabel("First name", firstName);
    // Additional processing...
  } else {
    console.error("Invalid data format");
  }
}
