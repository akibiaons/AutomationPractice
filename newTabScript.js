// NEWTABSCRIPT.JS **
// Step 4: running the scripts for the new tab **

// utility functions defined here below:
// let hasProcessedModal = false;

if (window.hasInjectedScript) {
  throw new Error("Script already injected");
}
window.hasInjectedScript = true;

// Define the mapping for styles

// Find elements with style attribute containing 'left:'

// HERE LIES ALL THE CLICKS //
function clickRiskAssessmentDropdown() {
  console.log("Risk assessment function executed");

  // Here we're specifically selecting the element with aria-haspopup='listbox'
  const dropdown = document.querySelector(
    "div.MuiSelect-root[aria-haspopup='listbox']"
  );

  if (dropdown) {
    // aria-haspopup does not change, so we need to check aria-expanded instead
    const isExpanded = dropdown.getAttribute("aria-expanded");
    console.log(`Dropdown found. aria-expanded is: ${isExpanded}`);

    // If the dropdown is not expanded or the attribute is not present
    if (isExpanded !== "true") {
      console.log("Dropdown is not expanded. Attempting to focus and click.");
      // Focus on dropdown
      dropdown.focus();
      // Delay the click sequence to ensure scripts have time to load...
      setTimeout(() => {
        // Simulate mouse events to mimic user interaction
        ["mousedown", "mouseup", "click"].forEach((eventType) => {
          dropdown.dispatchEvent(
            new MouseEvent(eventType, {
              bubbles: true,
              cancelable: true,
              view: window,
            })
          );
        });

        // Check if the dropdown opened after the events
        setTimeout(() => {
          const expandedStateAfterClick =
            dropdown.getAttribute("aria-expanded");
          if (expandedStateAfterClick === "true") {
            console.log("Dropdown has been expanded successfully");
          } else {
            console.error("Dropdown did not expand as expected");
          }
        }, 500); // Adjust this delay as necessary
      }, 500); // Adjust this delay as necessary
    } else {
      console.log(`Dropdown is already expanded. aria-expanded: ${isExpanded}`);
    }
  } else {
    console.error(
      "Unable to find the dropdown element with aria-haspopup='listbox'"
    );
  }
}

function clickRiskAssessmentOption() {
  console.log("Selecting the risk assessment option.");

  // Since we want to wait for a few seconds before executing,
  // you might want to call this function after a setTimeout where you handle the timing.

  // Select the <li> element with the specific data-value
  const option = document.querySelector(
    'li[data-value="Existing client (Current risk-tolerance questionnaire is on file)"]'
  );

  if (option && !option.getAttribute("aria-disabled")) {
    console.log("Option found. Attempting to click.");

    // Focus on the option
    option.focus();

    // Delay the click sequence to ensure scripts have time to react to the focus
    setTimeout(() => {
      // Simulate mouse events to mimic user interaction
      ["mousedown", "mouseup", "click"].forEach((eventType) => {
        option.dispatchEvent(
          new MouseEvent(eventType, {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
      });

      // After clicking, you might want to check if the option got selected
      // This is usually indicated by a class change or an attribute change
      setTimeout(() => {
        // Implement the check based on how your UI indicates selection
        // For example:
        // if (option.classList.contains('selected-class')) {
        //   console.log("Option has been selected successfully");
        // } else {
        //   console.error("Option did not get selected as expected");
        // }

        // Placeholder for actual check
        console.log("Clicked on the option. Implement actual check as needed.");
      }, 500); // Adjust this delay as necessary
    }, 500); // Adjust this delay as necessary
  } else if (option) {
    console.error("Option is disabled and cannot be clicked.");
  } else {
    console.error("Unable to find the option element");
  }
}

function clickSaveAndContinue() {
  // Look for the button with text "Save and continue"
  let buttons = document.querySelectorAll("button");
  for (let button of buttons) {
    if (button.textContent.includes("Save and continue")) {
      console.log(`BUTTON FOUND WITH STRING "SAVE AND CONTINUE"`, button);

      // Introduce a 2-second delay (2000 milliseconds) before clicking the button
      setTimeout(() => {
        // Create a new mouse event
        let event = new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        // Dispatch the event on the button
        button.dispatchEvent(event);
        clickRiskToleranceButtonAfterDelay();
      }, 2000);
      return;
    }
  }
  console.log("Save and continue button not found");
}

function clickRiskToleranceButtonAfterDelay() {
  setTimeout(() => {
    const button = document.querySelector(
      'button[aria-label="I already know my client\'s risk tolerance"]'
    );
    if (button) {
      button.click();
      console.log("Clicked the 'I already know the risk tolerance' button.");

      // Introduce a delay after clicking the risk tolerance button and then run adjustStyles
      setTimeout(() => {
        // Use the function to click the slider at 93%.
        clickSliderAtPosition(93);
        console.log("Adjusted the slider position after a delay.");
      }, 1200); // Delay of 2 seconds (2000 milliseconds) to adjust the slider after clicking the button
    }
  }, 3000); // Delay of 5 seconds (5000 milliseconds) to click the button
}
function clickSliderAtPosition(percentage) {
  // This function will click the slider at a specified percentage.

  // Find the container with a role of 'button' which might be your slider container.
  const sliderContainers = document.querySelectorAll('div[role="button"]');

  // Use the Array find method to identify the correct slider container based on some unique property
  // Here we assume that the slider is the only one that has children with the 'left' style set
  const slider = Array.from(sliderContainers).find((container) => {
    return Array.from(container.children).some((child) =>
      child.style.left.includes("calc")
    );
  });

  // If we have identified the slider, we can simulate a click.
  if (slider) {
    // Calculate where the click should be based on the percentage.
    const rect = slider.getBoundingClientRect();
    const clickX = rect.left + rect.width * (percentage / 100);
    const clickY = rect.top + rect.height / 2;

    // Create a new mouse event.
    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: clickX,
      clientY: clickY,
    });

    // Dispatch the event on the slider.
    slider.dispatchEvent(clickEvent);

    // A 1 second delay before simulating a click on the dropdown...
    setTimeout(() => {
      clickRiskAssessmentDropdown();
    }, 900);
  }
}

function addNameClick() {
  let success = false; // Flag to indicate if click was successful.
  let container = document.querySelector(".MuiDialogContent-root");
  if (!container) {
    console.log("Container not found");
    return false;
  }
  console.log("MODAL FOUND: Searching <SPANS> 🔎");
  let spans = container.querySelectorAll("span");
  spans.forEach((span) => {
    if (span.textContent.includes("Add")) {
      console.log(`SPAN FOUND WITH STRING "ADD"`, span);
      // Create a new mouse event
      let event = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      // Dispatch the event on the target element...
      span.dispatchEvent(event);
      success = true;
    }
  });
  return success; // Return the status
}

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
// Below is the function to click the add button span element in order to submit name data to the database...
function addNameClick() {
  let success = false; // Flag to indicate if click was successful.
  let container = document.querySelector(".MuiDialogContent-root");
  if (!container) {
    console.error("Container not found");
    return false;
  }
  console.log("Modal container found, searching for spans");
  let spans = container.querySelectorAll("span");
  spans.forEach((span) => {
    console.log("Checking span:", span);
    if (span.textContent.includes("Add")) {
      console.log("Add span found, attempting click...");
      // Create a new mouse event
      let event = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      // Dispatch the event on the target element...
      span.dispatchEvent(event);
      success = true;
    }
  });
  return success; // Return the status
}

// Below is the function to click the add button span element in order to submit name data to the database...

function setInputValueByAriaLabel(label, value) {
  const element = findElementByAriaLabel(label);
  if (element) {
    element.value = value;
    // Manually trigger a change event
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function findElementByAriaLabel(label) {
  return document.querySelector(`[aria-label="${label}"]`);
}

function setupMutationObserverForModal(data) {
  const targetNode = document.body;
  const config = { attributes: false, childList: true, subTree: true };

  const callback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        if (mutation.target.querySelector(".modal-draggable-handle")) {
          console.log("MODAL DETECTED");

          processExcelData(data);

          // Disconnect the current observer since we found the modal
          observer.disconnect();

          // Setup another observer to detect the removal of the modal
          setupObserverForModalRemoval();
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

function setupObserverForModalRemoval() {
  const targetNode = document.body;
  const config = { attributes: false, childList: true, subTree: true };
  const callback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
        const modalRemoved = Array.from(mutation.removedNodes).some(
          (node) =>
            node.querySelector && node.querySelector(".modal-draggable-handle")
        );
        if (modalRemoved) {
          console.log("MODAL REMOVED");
          clickSaveAndContinue();

          // Disconnect the observer since we detected the removal of the modal
          observer.disconnect();
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

// Listener to act upon receiving messages from the Chrome extension.
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "automateData") {
    console.log("Excel data retrieved:", message.data);

    // Ensure webpage content (DOM) is fully loaded before taking action.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        const openName = clickSpan(); // call the autoclicker here
        setupMutationObserverForModal(message.data);
        sendResponse({ status: openName ? "success" : "error" });
      });
    } else {
      // DOMContentLoaded already has fired
      const openName = clickSpan(); // Calling the span clicker here...
      setupMutationObserverForModal(message.data);
      sendResponse({ status: openName ? "success" : "error" });
    }
    return true;
  }
});

function processExcelData(data) {
  console.log("Processing data: ", data);

  // Check if data is an array and has the required index
  if (Array.isArray(data) && data.length > 29) {
    const formData = data[29]; // For example, using the 30th item in the array
    const clientTitle = formData.CLIENT_TITLE || "Default Title"; // Fallback value
    const firstName = formData.FIRST_NAME || "Default FName"; // Fallback value for name
    const lastName = formData.LAST_NAME || "Default LNAME"; //Fallback for last name
    setInputValueByAriaLabel("Enter household name", clientTitle);
    setInputValueByAriaLabel("First name", firstName);
    setInputValueByAriaLabel("Last name", lastName);
  } else {
    console.error("Invalid data format or index out of bounds");
  }
  // Additional processing...
  setTimeout(() => {
    const addClicked = addNameClick();
    console.log("Add button clicked? :", addClicked);
    if (addClicked) {
      setupObserverForModalRemoval(); // Set up the observer only if "Add" was clicked.
    }
  }, 2000);
}
