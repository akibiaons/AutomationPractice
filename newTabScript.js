// NEWTABSCRIPT.JS **
// Step 4: running the scripts for the new tab **

// Utility functions defined here below:

// Step one, get data... data obtained, start automation
// Listener to act upon receiving messages from the Chrome extension.
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "automateData") {
    // Ensure webpage content (DOM) is fully loaded before taking action.
    const index = message.currentIndex;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        const openName = clickSpan(); // call the autoclicker here
        if (openName) {
          startFirstModalPopulation(message.data, index); // replace with your new function
          sendResponse({ status: "success" });
        } else {
          sendResponse({ status: "error" });
        }
      });
    } else {
      //DOMContentLoaded already has fired
      const openName = clickSpan(); // Calling the span clicker here...
      if (openName) {
        startFirstModalPopulation(message.data, index); // replace with your new function
        sendResponse({ status: "success" });
      } else {
        sendResponse({ status: "error" });
      }
    }
    return true; // Keep the channel open for the async response
  }
});

// Step two, click "Create household" button
function clickSpan() {
  let success = false; // flag to indicate if click was successful

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
      // _DEV USE
      console.log("Creating new household button...");
    }
  });
  return success; // Return the status
}

// Step three-one
const riskToleranceToPercentage = {
  "Capital Preservation": 7,
  Conservative: 21.5,
  "Conservative Growth": 36,
  Moderate: 50,
  "Moderate Growth": 64,
  Growth: 78.5,
  Aggressive: 93,
};

let globalRegistrationType = "";
let globalCustodianType = "";
let globalProposalAmount = 0;
let globalProgram = "";
let globalRiskTolerance = "";
let nameOnPortfolio = "";
let feeSchedule = "";
let feeTemplate = "";
let jointFirst = "";
let jointLast = "";
// Find modal

function startFirstModalPopulation(data, index) {
  const observerConfig = { attributes: false, childList: true, subtree: true };

  const modalObserverCallback = (mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        if (mutation.target.querySelector(".modal-draggable-handle")) {
          console.log("MODAL_DETECTED");
          processExcelData(data, index);
          observer.disconnect(); // Disconnect after modal is found
        }
      }
    }
  };

  const observer = new MutationObserver(modalObserverCallback);
  observer.observe(document.body, observerConfig);
}

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

// Step three-three
// Now Run processExcelData()

// Pre defining addNameClick()
function addNameClick() {
  let success = false; // Flag to indicate if click was successful.
  let container = document.querySelector(".MuiDialogContent-root");
  if (!container) {
    console.log("MODAL_NOT_FOUND");
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

function processExcelData(data, index) {
  console.log("Processing data for index: ", index);
  console.log("Received data:", data);
  console.log("Data array length:", data.length);
  console.log("Received index:", index);

  if (Array.isArray(data) && index < data.length) {
    const formData = data[index];
    const clientTitle = formData.CLIENT_TITLE || "Default Title"; // Fallback value
    const firstName = formData.FIRST_NAME || "Default FName"; // Fallback value for name
    const lastName = formData.LAST_NAME || "Default LNAME"; //Fallback for last name
    setInputValueByAriaLabel("Enter household name", clientTitle);
    setInputValueByAriaLabel("First name", firstName);
    setInputValueByAriaLabel("Last name", lastName);

    globalRegistrationType = formData.REGISTRATION || "Default Registration";
    globalCustodianType = formData.CUSTODIAN || "Default Registration";
    globalProposalAmount = formData.ACCOUNT_VALUE || 0;
    globalProgram = formData.PROGRAM || "";
    globalRiskTolerance = formData.PORTFOLIO_RISK || "";
    nameOnPortfolio = formData.NAME_ON_PORTFOLIO || "";
    feeSchedule = formData.BILLING_FFREQUENCY || "Monthly";
    feeTemplate = formData.ADVISOR_FEE || "Standard";
    jointFirst = formData.JOINT_OWNER_FIRST_NAME || "";
    jointLast = formData.JOINT_OWNER_LAST_NAME || "";

    setTimeout(() => {
      const addClicked = addNameClick();
      if (addClicked && globalRegistrationType.includes("Joint")) {
        // Handle joint owner details
        setTimeout(() => {
          clickAddMemberButton();
        }, 3000);
      } else {
        // If not a joint account or Add wasn't clicked
        setupObserverForModalRemoval();
      }
    }, 3000);
  } else {
    console.error("Invalid data format or index out of bounds");
  }
}

function clickAddMemberButton() {
  const addMemberButton = document.querySelector(
    'button[aria-label="add-member"]'
  );
  if (addMemberButton) {
    addMemberButton.click();
    console.log("Clicked 'Add member' button");
    setTimeout(() => {
      fillJointOwnerDetails();
    }, 3000);

    // Continue with the next step
    // setTimeout(() => {
    //   setupObserverForModalRemoval();
    // }, 4000);
  } else {
    console.log("'Add member' button not found");
  }
}

function fillJointOwnerDetails() {
  const firstNameInput = document.querySelector(
    'input[aria-label="First name"]'
  );
  const lastNameInput = document.querySelector('input[aria-label="Last name"]');

  function triggerInputEvents(input) {
    input.dispatchEvent(new Event("focus"));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("blur"));
  }

  if (firstNameInput && lastNameInput) {
    firstNameInput.value = jointFirst;
    triggerInputEvents(firstNameInput);

    setTimeout(() => {
      lastNameInput.value = jointLast;
      triggerInputEvents(lastNameInput);
      setTimeout(() => {
        clickRelationshipDropdown();
      }, 500);
    }, 1000); // Delay for lastNameInput

    console.log("Joint owner names set");
  } else {
    console.log("Joint owner name inputs not found");
  }
}

function clickRelationshipDropdown() {
  const dropdown = document.querySelector(
    'div.MuiSelect-root[aria-haspopup="listbox"]'
  );
  if (dropdown) {
    // Simulate focusing on the dropdown
    dropdown.focus();
    console.log("Focused on relationship dropdown");

    // Simulate clicking the dropdown to open options
    dropdown.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    dropdown.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    dropdown.click();
    console.log("Clicked relationship dropdown");

    // Select a relationship option after a delay
    setTimeout(() => {
      selectRelationshipOption();
    }, 2000);
  } else {
    console.log("Relationship dropdown not found");
  }
}

function selectRelationshipOption() {
  // Example: Selecting 'Spouse' as the relationship
  // Update the selector or text content based on actual options available
  const optionText = "Other"; // Update this based on your needs
  const options = document.querySelectorAll(
    "ul.MuiList-root li.MuiMenuItem-root"
  );
  const targetOption = Array.from(options).find(
    (option) => option.textContent === optionText
  );

  if (targetOption) {
    targetOption.click();
    console.log("Selected relationship:", optionText);
    setTimeout(() => {
      addNameClick();
      setTimeout(() => {
        clickSaveAndContinue();
      }, 500);
    }, 500);

    // Continue with the next step after selecting the relationship
    // setTimeout(() => {
    //   setupObserverForModalRemoval();
    // }, 2000);
  } else {
    console.log("Relationship option not found");
  }
}

// Step three-six
// Close modal
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
          // Once the setupObserverForModalRemoval() is ran it will start the next function clickSaveAndContinue()
          setTimeout(() => {
            clickSaveAndContinue();
          }, 4000);

          // Disconnect the observer since we detected the removal of the modal
          observer.disconnect();
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}
// Step four-one save and continue into the new risk and objective functions sections....
function clickSaveAndContinue() {
  // Look for the button with text "Save and continue"
  let buttons = document.querySelectorAll("button");
  for (let button of buttons) {
    if (button.textContent.includes("Save and continue")) {
      console.log(`BUTTON FOUND WITH STRING "SAVE AND CONTINUE"`, button);

      setTimeout(() => {
        // Create a new mouse event
        let event = new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        // Dispatch the event on the button
        button.dispatchEvent(event);

        // Step four-one
        // Click "I know my clients risk tolerance" button
        clickRiskToleranceButtonAfterDelay();
      }, 3000);

      return;
    }
  }
  console.log("Save and continue button not found");
}
// Step four-two
// Click that we know our client's risks...
function adjustRiskToleranceSlider() {
  const percentage = riskToleranceToPercentage[globalRiskTolerance] || 50; // Default to 50 if no match is found
  clickSliderAtPosition(percentage);
}

function clickRiskToleranceButtonAfterDelay() {
  setTimeout(() => {
    const button = document.querySelector(
      'button[aria-label="I already know my client\'s risk tolerance"]'
    );
    if (button) {
      button.click();
      console.log("Clicked the 'I already know the risk tolerance' button.");

      // Introduce a delay after clicking the risk tolerance button and then adjust the slider
      setTimeout(() => {
        // Step four-two
        // Click slider to its proper location
        adjustRiskToleranceSlider();
      }, 2000); // Delay of 2 seconds (2000 milliseconds) to adjust the slider after clicking the button
    }
  }, 5000); // Delay of 5 seconds (5000 milliseconds) to click the button
}

// Step four-three
// Slide the correlating client risks, based on RISK_ASSESSMENT::
function clickSliderAtPosition(percentage) {
  const sliderContainers = document.querySelectorAll('div[role="button"]');

  const slider = Array.from(sliderContainers).find((container) => {
    return Array.from(container.children).some((child) =>
      child.style.left.includes("calc")
    );
  });

  if (slider) {
    const rect = slider.getBoundingClientRect();
    const clickX = rect.left + rect.width * (percentage / 100);
    const clickY = rect.top + rect.height / 2;

    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: clickX,
      clientY: clickY,
    });

    slider.dispatchEvent(clickEvent);
    setTimeout(() => {
      // Step four-two
      // Click slider to its proper location
      clickRiskAssessmentDropdown();
      console.log("Clicked assessment dropdown");
    }, 2000);
  }
}

// Step four-four
// Open the dropdown after the slider
function clickRiskAssessmentDropdown() {
  const dropdown = document.querySelector(
    "div.MuiSelect-root[aria-haspopup='listbox']"
  );

  if (dropdown) {
    dropdown.focus();
    ["mousedown", "mouseup", "click"].forEach((eventType) => {
      dropdown.dispatchEvent(
        new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
    });
    setTimeout(() => {
      console.log("going to click n ext options");
      clickRiskAssessmentOption();
    }, 2000);
  }
}

// Step four-five
// Click the option after dropdown is clicked and opened...
function clickRiskAssessmentOption() {
  const optionText =
    "Existing client (Current risk-tolerance questionnaire is on file)";

  // Define a function to click the target option when it's available
  const tryClickOption = () => {
    const options = Array.from(
      document.querySelectorAll("ul.MuiList-root li.MuiMenuItem-root")
    );
    const targetOption = options.find((option) =>
      option.textContent.includes(optionText)
    );

    if (targetOption) {
      targetOption.click();
      console.log("Clicked option - MAIN FUNC");
      clickTermsCheckbox();
      return true; // Indicate success
    }
    return false; // Indicate failure
  };

  // Create an observer instance
  const observer = new MutationObserver((mutations, obs) => {
    if (tryClickOption()) {
      // Try to click the option
      obs.disconnect(); // If successful, disconnect the observer
    }
  });

  // Start observing the body for changes in the DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Try to click the option immediately in case it's already there
  if (!tryClickOption()) {
    // If the option was not clicked successfully, trigger the dropdown to show options
    setTimeout(() => {
      const dropdown = document.querySelector("div.MuiSelect-root");
      if (dropdown) {
        dropdown.click();
        console.log("Clicked option - BACKUP FUNC");
        clickTermsCheckbox();
      }
    }, 300); // Adjust the timeout as necessary
  } else {
    observer.disconnect(); // If we clicked the option, disconnect the observer
  }
}
// Step four-six
// Click the terms dropdown...
function clickTermsCheckbox() {
  // Find button by its role and aria-label attributes
  const checkBoxButton = document.querySelector(
    'button[role="checkbox"][aria-label="I confirm the terms and conditions for selecting my client\'s risk"]'
  );

  if (checkBoxButton) {
    checkBoxButton.click();
    console.log("Checkbox button clicked!");
    setTimeout(() => {
      console.log("Clicking agree to terms button");
      termsCheckboxConfirmation();
    }, 2000);
  }
}
// Step four-seven
// Click the checkbox to accept current clients risk and investment objective...
function termsCheckboxConfirmation() {
  // Use XPath to find the button based on its text content
  var xpath = "//button[.//span[contains(text(), 'I agree')]]";
  var agreeButton = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;

  if (agreeButton) {
    agreeButton.click();
    console.log("Agree button clicked!");
    setTimeout(() => {
      // Timeout to kickstart the saveandcontinue button
      console.log("Clicking agree to terms button");
      saveAndContinueRandO();
    }, 1000);
  } else {
    console.log("Agree button not found!");
  }
}

// Step four-eight: Confirm selected options, save and continue...
function saveAndContinueRandO() {
  let spanFound = false;
  let spans = document.querySelectorAll("span");

  for (let span of spans) {
    if (span.textContent.includes("Save and continue")) {
      console.log(`SPAN FOUND WITH STRING "SAVE AND CONTINUE"`, span);
      spanFound = true;

      setTimeout(() => {
        span.click(); // Simpler way to click without creating a MouseEvent
        console.log("Clicked 'Save and continue'");

        setTimeout(() => {
          // This delay waits for the page to process the save and continue action
          clickAddAccountButton();
        }, 7000); // The delay might need adjustment based on actual page behavior
      }, 5000); // Waiting for animations to complete

      break; // Exit the loop as we've found and clicked the span
    }
  }

  if (!spanFound) {
    console.log("Save and continue span not found");
    // Handle the error case appropriately, possibly retrying or alerting the user
  }
}

// BELOW ARE THE FUNCTIONS TO MANIPULATE THE ACCOUNT STRATEGY SECTION

//Version 0.39.1 - Nov 7 2023
// step five-one: Click the add account button
function clickAddAccountButton() {
  let spans = document.querySelectorAll("span");

  for (let span of spans) {
    if (span.textContent.trim() === "Add account") {
      // Using trim() to remove any leading/trailing whitespace
      let button = span.closest("button");
      if (button) {
        button.click();
        console.log('Clicked "Add account" button.');
        return true;
      }
    }
    setTimeout(() => {
      console.log("Inputting proposal amount...");
      setProposalAmount();
    }, 5000);
  }

  console.log("Add account button not found.");
  // Similar to above, handle the error case appropriately
  return false;
}

function setProposalAmount() {
  // Find the input field for the proposal amount by its aria-label
  const proposalAmountInput = document.querySelector(
    'input[aria-label="Proposal amount"]'
  );

  if (proposalAmountInput) {
    // Parse the globalProposalAmount as a float number and ensure it's a finite number
    const amount = parseFloat(globalProposalAmount);
    if (isFinite(amount)) {
      // Set the value of the input to the numeric globalProposalAmount
      proposalAmountInput.value = amount;

      // Simulate a change event to notify any JavaScript listening to this event
      const event = new Event("change", { bubbles: true });
      proposalAmountInput.dispatchEvent(event);

      console.log(`Proposal amount set to ${amount}`);
    }
  }
  setTimeout(() => {
    console.log("Clicking registration dropdown...");
    clickRegistrationTypeDropdown();
  }, 2000);
}

// step five-three: Click select registration type
function clickRegistrationTypeDropdown() {
  const dropdown = document.querySelector(
    'div.MuiSelect-root[aria-haspopup="listbox"]'
  );

  if (dropdown) {
    dropdown.focus();
    ["mousedown", "mouseup", "click"].forEach((eventType) => {
      dropdown.dispatchEvent(
        new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
    });

    setTimeout(() => {
      console.log("Preparing to select an option...");
      clickRegistrationTypeOption();
    }, 2000); // 2-second delay
  }
}

function clickRegistrationTypeOption() {
  // Define a function to click the target option when it's available
  const tryClickOption = () => {
    const options = Array.from(
      document.querySelectorAll("ul.MuiList-root li.MuiMenuItem-root")
    );
    const targetOption = options.find((option) =>
      option.textContent.includes(globalRegistrationType)
    );

    if (targetOption) {
      targetOption.click();
      console.log(
        `Clicked registration type option: ${globalRegistrationType}`
      );

      setTimeout(() => {
        if (globalRegistrationType.includes("Joint")) {
          clickSelectOwnerButton();
        } else {
          setTimeout(() => {
            clickCustodianDropdown();
          }, 2000);
        }
      }, 2000);

      return true; // Indicate success
    }
    return false; // Indicate failure
  };
  function clickSelectOwnerButton() {
    // Find and click the "select owner" button
    const selectOwnerButton = document.querySelector(
      'button[aria-label="select owner"]'
    );
    if (selectOwnerButton) {
      selectOwnerButton.click();
      console.log("Clicked 'select owner' button");

      // Wait for the secondary owner options to appear, then click
      setTimeout(() => {
        clickSecondaryOwnerDropdown();
      }, 3000); // Adjust the delay as necessary
    } else {
      console.log("'select owner' button not found");
    }
  }

  function clickSecondaryOwnerDropdown() {
    // Define the text that will help us find the "Secondary owner" dropdown
    const optionText = "Secondary owner";

    // Define a function to try clicking the target dropdown when it's available
    const interactWithDropdown = (dropdown) => {
      dropdown.focus();
      ["mousedown", "mouseup"].forEach((eventType) =>
        dropdown.dispatchEvent(new MouseEvent(eventType, { bubbles: true }))
      );
      dropdown.click();
      console.log("Interacted with 'Secondary owner' dropdown like a human");
      setTimeout(() => {
        clickAddMemberOption();
      }, 1000);
    };
    const tryClickDropdown = () => {
      const labels = Array.from(document.querySelectorAll("div"));
      const targetLabel = labels.find(
        (div) => div.textContent.trim() === optionText
      );
      const dropdown = targetLabel?.nextElementSibling.querySelector(
        'div[role="button"][aria-haspopup="listbox"]'
      );

      if (dropdown) {
        interactWithDropdown(dropdown);
        return true; // Indicate success
      }
      return false; // Indicate failure
    };

    // Create an observer instance to watch for changes in the DOM
    const observer = new MutationObserver((mutations, obs) => {
      if (tryClickDropdown()) {
        obs.disconnect(); // If successful, disconnect the observer
      }
    });

    // Start observing the body for changes in the DOM
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Attempt to click the dropdown immediately in case it's already there
    if (!tryClickDropdown()) {
      // If the dropdown wasn't clicked successfully, it might be because the modal hasn't appeared yet
      // Find and click the button or element that triggers the modal to open
      const triggerElementSelector = 'button[aria-haspopup="dialog"]'; // Update this selector to match the element that opens the modal
      const triggerElement = document.querySelector(triggerElementSelector);

      if (triggerElement) {
        triggerElement.click();
        console.log("Triggered the modal to open");

        // Since the modal opening is likely to be animated and take some time, set a timeout before trying to click the dropdown again
        setTimeout(() => {
          if (!tryClickDropdown()) {
            console.error(
              "Failed to click the 'Secondary owner' dropdown after opening the modal"
            );
            // Handle the failure as appropriate for your application
          }
        }, 1000); // Adjust the timeout as necessary to allow for the modal to fully open and render
      } else {
        console.error(
          "Unable to find the element that triggers the modal to open"
        );
        // Handle this situation as appropriate for your application
      }
    } else {
      observer.disconnect();
    }
  }

  function clickAddMemberOption() {
    const fullName = jointFirst + " " + jointLast;

    // Function to find and click the option
    const tryClickMemberOption = () => {
      const options = Array.from(
        document.querySelectorAll("ul.MuiList-root li.MuiMenuItem-root")
      );
      const targetOption = options.find((option) =>
        option.textContent.includes(fullName)
      );

      if (targetOption) {
        targetOption.click();
        console.log(`Clicked on member: ${fullName}`);
        setTimeout(() => {
          clickSaveButton();
        }, 1000);

        return true; // Indicate success
      }
      return false; // Indicate failure
    };

    // Try to click the member option immediately
    if (!tryClickMemberOption()) {
      console.error(`Member with name ${fullName} not found`);
      // Handle the failure as appropriate for your application
    }
  }

  function clickSaveButton() {
    // Find all buttons on the page
    const buttons = Array.from(document.querySelectorAll("button"));

    // Find the save button by its text content
    const saveButton = buttons.find(
      (button) => button.textContent.trim() === "Save"
    );

    if (saveButton) {
      saveButton.click();
      console.log("Clicked the 'Save' button");
      setTimeout(() => {
        clickCustodianDropdown();
      }, 1000);
    } else {
      console.error("Save button not found");
      // Handle the situation where the button is not found
    }
  }

  // Create an observer instance
  const observer = new MutationObserver((mutations, obs) => {
    if (tryClickOption()) {
      // Try to click the option
      obs.disconnect(); // If successful, disconnect the observer
    }
  });

  // Start observing the body for changes in the DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Try to click the option immediately in case it's already there
  if (!tryClickOption()) {
    // If the option was not clicked successfully, trigger the dropdown to show options
    setTimeout(() => {
      const dropdown = document.querySelector("div.MuiSelect-root");
      if (dropdown) {
        dropdown.click();
        console.log("Opened dropdown - waiting for options...");
      }
    }, 300); // Adjust the timeout as necessary
  } else {
    observer.disconnect(); // If we clicked the option, disconnect the observer
  }
}

// step five-three: Click select registration type
function clickCustodianDropdown() {
  // Query the document for the dropdown element
  const dropdownSpans = Array.from(
    document.querySelectorAll(
      'div.MuiSelect-root[aria-haspopup="listbox"] > span'
    )
  );
  const custodianDropdown = dropdownSpans.find(
    (span) => span.textContent === "Select a custodian"
  )?.parentNode;

  if (custodianDropdown) {
    // Focus on the dropdown element
    custodianDropdown.focus();

    // Dispatch mouse events to mimic the user's actions
    ["mousedown", "mouseup", "click"].forEach((eventType) => {
      custodianDropdown.dispatchEvent(
        new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
    });

    // Set a timeout to handle subsequent actions
    setTimeout(() => {
      console.log("Preparing to select an option...");
      clickCustodianOption();
    }, 4000); // 2-second delay
  }
}

function clickCustodianOption() {
  // Define a function to click the target option when it's available
  const tryClickOption = () => {
    const options = Array.from(
      document.querySelectorAll("ul.MuiList-root li.MuiMenuItem-root")
    );
    const targetOption = options.find((option) =>
      option.textContent.includes(globalCustodianType)
    );

    if (targetOption) {
      targetOption.click();
      console.log(`Clicked registration type option: ${globalCustodianType}`);
      // Add any additional logic you need after clicking the option
      setTimeout(() => {
        console.log("Preparing to select an option...");
        selectExistingStrategy();
      }, 4000); // 2-second delay
      return true; // Indicate success
    }
    return false; // Indicate failure
  };

  // Create an observer instance
  const observer = new MutationObserver((mutations, obs) => {
    if (tryClickOption()) {
      // Try to click the option
      obs.disconnect(); // If successful, disconnect the observer
    }
  });

  // Start observing the body for changes in the DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Try to click the option immediately in case it's already there
  if (!tryClickOption()) {
    // If the option was not clicked successfully, trigger the dropdown to show options
    setTimeout(() => {
      const dropdown = document.querySelector("div.MuiSelect-root");
      if (dropdown) {
        dropdown.click();
        console.log("Opened dropdown - waiting for options...");
      }
    }, 4000); // Adjust the timeout as necessary
  } else {
    observer.disconnect(); // If we clicked the option, disconnect the observer
  }
}

// // Function to find and click on the span that opens the modal for selecting an existing strategy
function selectExistingStrategy() {
  let spans = document.querySelectorAll("span");

  for (let span of spans) {
    // Using trim() to ensure there are no leading/trailing spaces
    if (span.textContent.trim() === "Select an existing strategy") {
      // Simulate a click on this span
      span.click();
      console.log('Clicked "Select an existing strategy" span.');
      setTimeout(() => {
        console.log("Preparing to select an option...");
        clickProgramOptionByContent(globalProgram);
      }, 2000); // 2-second delay
      return true; // Indicate that the span was found and clicked
    }
  }

  console.log("Select an existing strategy span not found.");
  return false; // Indicate that the span was not found
}

function clickProgramOptionByContent(programString) {
  // Define a function to click the target option when it's available
  const tryClickProgramOption = () => {
    const options = Array.from(
      document.querySelectorAll("button[role='radio']")
    );
    const targetOption = options.find((option) => {
      const labelSpan = option.nextElementSibling;
      return labelSpan && labelSpan.textContent.includes(programString);
    });

    if (targetOption) {
      targetOption.click();
      console.log(`Clicked program option with string "${programString}"`);

      setTimeout(() => {
        console.log("Preparing to select an option...");
        clickStartSelectingButton();
      }, 15000);
      return true; // Indicate success
    }
    return false; // Indicate failure if the target option wasn't found
  };

  // Create an observer instance to watch for when the modal is added to the DOM
  const observer = new MutationObserver((mutations, obs) => {
    if (tryClickProgramOption()) {
      obs.disconnect(); // If successful, disconnect the observer
    }
  });

  // Start observing the body for changes in the DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Try to click the program option immediately in case it's already visible
  if (!tryClickProgramOption()) {
    console.log("Waiting for modal to appear...");
  }
}

function clickStartSelectingButton() {
  // Look for the button with the aria-label "Start Button"
  let buttons = document.querySelectorAll('button[aria-label="Start Button"]');
  for (let button of buttons) {
    button.click();
    setTimeout(() => {
      setInputValueForNameFilterWhenModalAppears(nameOnPortfolio);
    }, 5000);

    return; // Exit the function after clicking the button
  }
}

function setInputValueForNameFilterWhenModalAppears(inputValue) {
  const trySetInputValue = () => {
    const input = document.querySelector(
      `.MuiDrawer-root input[placeholder="Filter by name"]`
    );

    if (input) {
      input.focus();
      input.value = inputValue;
      ["change", "input"].forEach((event) => {
        input.dispatchEvent(new Event(event, { bubbles: true }));
      });

      console.log(`Set input value to "${inputValue}"`);

      setTimeout(() => {
        findRowAndClickRadioButton(nameOnPortfolio);
      }, 3000);

      return true; // Indicate success
    }
    return false; // Indicate failure if the input field wasn't found
  };

  // This observer looks for changes in the DOM that indicate the modal has been added
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        // Check if the modal is now present
        const modalExists = Array.from(mutation.addedNodes).some(
          (node) => node.matches && node.matches(".MuiDrawer-root")
        );
        if (modalExists && trySetInputValue()) {
          observer.disconnect(); // Disconnect the observer if successful
          break; // Exit the loop
        }
      }
    }
  });

  // Start observing the body for when elements are added to the DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Try to set the input value immediately in case the modal is already visible
  if (!trySetInputValue()) {
    console.log("Waiting for the modal to appear...");
  }
}

function findRowAndClickRadioButton(nameOnPortfolio) {
  const rows = document.querySelectorAll('.MuiDrawer-root [role="row"]');
  rows.forEach((row) => {
    const nameCell = Array.from(row.querySelectorAll('div[role="cell"]')).find(
      (cell) => cell.textContent.includes(nameOnPortfolio)
    );

    if (nameCell) {
      console.log("Found row with portfolio name:", nameOnPortfolio);
      const radioButton = nameCell.parentNode.querySelector(
        'button[role="radio"]'
      );
      if (radioButton) {
        radioButton.click();
        console.log("Clicked the radio button for", nameOnPortfolio);
        // Now proceed to click the "Select product" button after a delay
        setTimeout(() => {
          clickSelectProductButton();
        }, 3000);
      }
    }
  });
}

function clickSelectProductButton() {
  function clickAddButtonByText() {
    var buttons = document.querySelectorAll("button");
    buttons.forEach(function (button) {
      if (button.textContent.trim() === "Add") {
        button.click();
        console.log("Add button clicked");

        clickQuarterlyRadioButton();
      }
    });
  }

  function clickQuarterlyRadioButton() {
    const quarterlyButton = document.querySelector(
      'button[aria-label="select Quarterly"]'
    );
    if (quarterlyButton) {
      quarterlyButton.click();
      setTimeout(() => {
        clickSaveButton();
      }, 3000);
      console.log('Clicked the "Quarterly" radio button.');
    } else {
      console.error("Quarterly radio button not found.");
    }
  }
  function clickSaveButton() {
    // Find all buttons, then filter by text content
    const buttons = Array.from(document.querySelectorAll("button"));
    const saveButton = buttons.find(
      (button) => button.textContent.trim() === "Save"
    );

    if (saveButton) {
      saveButton.click();
      setTimeout(() => {
        rebalanceSave();
      }, 1000);
      console.log('Clicked the "Save" button.');
    } else {
      console.error("Save button not found.");
    }
  }

  // Query for the button based on class name and content
  const buttons = Array.from(document.querySelectorAll("button"));
  const selectProductButton = buttons.find((button) => {
    return button.textContent.includes("Select product");
  });

  if (selectProductButton && !selectProductButton.disabled) {
    // Check if the button exists and is not disabled
    selectProductButton.click();
    console.log('Clicked the "Select product" button.');
    setTimeout(() => {
      saveContinue();
      if (globalProgram === "UMA") {
        setTimeout(() => {
          clickAddButtonByText();
          console.log("referenceting");
        }, 7000);
      }
      if (globalProgram !== "UMA") {
        setTimeout(() => {
          saveContinue();
          setTimeout(() => {
            clickFeeScheduleDropdownAndSelectOption();
          }, 11000);
        }, 5000);
      }
    }, 3000);
  } else {
    console.log("Button not found or it is disabled.");
  }
}

function rebalanceSave() {
  setTimeout(() => {
    saveContinue();
    setTimeout(() => {
      clickFeeScheduleDropdownAndSelectOption();
    }, 11000);
  }, 5000);
}

function saveContinue() {
  let spanFound = false;
  let spans = document.querySelectorAll("span");

  for (let span of spans) {
    if (span.textContent.includes("Save and continue")) {
      console.log(`SPAN FOUND WITH STRING "SAVE AND CONTINUE"`, span);
      spanFound = true;

      setTimeout(() => {
        span.click(); // Simpler way to click without creating a MouseEvent
        console.log("Clicked 'Save and continue'");
      }, 2000); // Waiting for animations to complete

      break; // Exit the loop as we've found and clicked the span
    }
  }
}

function clickFeeScheduleDropdownAndSelectOption() {
  // First, click the dropdown to reveal the options
  const dropdown = document.querySelector(".MuiSelect-selectMenu");
  if (dropdown) {
    dropdown.focus();
    ["mousedown", "mouseup", "click"].forEach((eventType) => {
      dropdown.dispatchEvent(
        new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
    });
    // Wait for the options to appear
    setTimeout(() => {
      // Look for the options in the list
      const optionText = feeSchedule === "quarterly" ? "Quarterly" : "Monthly";
      const listItems = document.querySelectorAll(
        "ul.MuiList-root li.MuiMenuItem-root"
      );

      // Find the specific option
      const optionToSelect = Array.from(listItems).find((item) => {
        return item.innerText.includes(optionText);
      });

      if (optionToSelect) {
        optionToSelect.click();
        console.log(`Option "${optionText}" has been clicked.`);
        setTimeout(() => {
          clickEditAdvisorFeeButton();
        }, 8000);
      } else {
        console.log(`Option "${optionText}" not found.`);
      }
    }, 500); // Adjust this timeout to match the time it takes for the options to appear
  } else {
    console.log("Dropdown for fee schedule not found.");
  }
}

function clickEditAdvisorFeeButton() {
  // Query the document for the button with the specific aria-label
  const button = document.querySelector(
    'button[aria-label="edit-advisor-fee"]'
  );

  // Check if the button exists
  if (button) {
    button.click(); // Click the button
    console.log('Clicked the "edit-advisor-fee" button.');
    setTimeout(() => {
      setupModalObserverAndClickDropdown();
      setTimeout(() => {
        clickDropdownMenu();
      }, 5000);
    }, 5000);
  }
}

function setupModalObserverAndClickDropdown() {
  // Define the observer
  const observer = new MutationObserver((mutations, obs) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        // Check for the specific modal class
        const modalExists = Array.from(mutation.addedNodes).some(
          (node) => node.matches && node.matches(".MuiDialog-scrollPaper")
        );

        if (modalExists) {
          console.log("Modal detected, clicking dropdown...");
          setTimeout(() => {
            clickDropdownMenu();
          }, 5000);
          obs.disconnect(); // Disconnect the observer after clicking the dropdown
          break;
        }
      }
    }
  });

  // Start observing the document body for added nodes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function clickDropdownMenu() {
  // Select all dropdowns
  const dropdowns = document.querySelectorAll(
    "div.MuiSelect-root[aria-haspopup='listbox']"
  );

  // Find the dropdown that contains the specific span text
  const targetDropdown = Array.from(dropdowns).find((dropdown) => {
    const span = dropdown.querySelector("span");
    return span && span.textContent === "Select a fee template";
  });

  if (targetDropdown) {
    targetDropdown.focus();
    ["mousedown", "mouseup", "click"].forEach((eventType) => {
      targetDropdown.dispatchEvent(
        new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
    });
    console.log("Dropdown with 'Select a fee template' clicked.");
    setTimeout(() => {
      clickFeeTemplateOption(feeTemplate);
    }, 5000);
  } else {
    console.log("Specific dropdown not found.");
  }
}

function clickFeeTemplateOption(feeTemplate) {
  // Wait for the dropdown to be opened and rendered in the DOM
  const interval = setInterval(() => {
    const options = document.querySelectorAll(
      ".MuiMenu-paper .MuiMenuItem-root"
    );
    if (options.length > 0) {
      clearInterval(interval);

      // Find the option that includes the fee template text
      const targetOption = Array.from(options).find((option) =>
        option.textContent.includes(feeTemplate)
      );

      if (targetOption) {
        targetOption.click();
        console.log(`Clicked fee template option: ${feeTemplate}`);
        setTimeout(() => {
          clickApplyButton(feeTemplate);
        }, 1000);
      } else {
        console.log(`Fee template option '${feeTemplate}' not found.`);
      }
    }
  }, 500); // Check every 500 milliseconds
}
function clickApplyButton() {
  // Select all buttons
  const buttons = document.querySelectorAll('button[type="button"]');

  // Find the button with the text "Apply"
  const targetButton = Array.from(buttons).find((button) =>
    button.textContent.includes("Apply")
  );

  if (targetButton) {
    targetButton.click();
    console.log("Clicked 'Apply' button.");
    setTimeout(() => {
      clickAgreeButton();
    }, 5000);
  } else {
    console.log("'Apply' button not found.");
  }
}

function clickAgreeButton() {
  // Find the span containing the specific text
  const span = Array.from(document.querySelectorAll("span")).find((span) =>
    span.textContent.includes("I agree to the fee schedules shown above")
  );

  if (span) {
    // Find the button within the parent of the span
    const button = span.parentElement.querySelector('button[role="checkbox"]');
    if (button) {
      button.click();
      console.log("Clicked 'I agree' checkbox button.");
      setTimeout(() => {
        clickContinueButton();
      }, 5000);
    } else {
      console.log("'I agree' checkbox button not found.");
    }
  } else {
    console.log("Span with 'I agree' text not found.");
  }
}

function clickContinueButton() {
  // Find the span containing the specific text "Continue"
  const span = Array.from(document.querySelectorAll("button span")).find(
    (span) => span.textContent.includes("Continue")
  );

  if (span) {
    // Get the button that is the ancestor of the span
    const button = span.closest("button");
    if (button) {
      if (!button.disabled) {
        button.click();
        console.log("Clicked 'Continue' button.");
        setTimeout(() => {
          clickGenerateDocumentsButton();
        }, 5000);
      }
    }
  }
}

function clickGenerateDocumentsButton() {
  // Find the span containing the specific text "Generate documents"
  const span = Array.from(document.querySelectorAll("button span")).find(
    (span) => span.textContent.includes("Generate documents")
  );

  if (span) {
    // Get the button that is the ancestor of the span
    const button = span.closest("button");
    if (button) {
      button.click();
      console.log("Clicked 'Generate documents' button.");
      setTimeout(() => {
        closeCurrentTab();
      }, 2000);
    } else {
      console.log("'Generate documents' button not found.");
    }
  } else {
    console.log("Span with 'Generate documents' text not found.");
  }
}

//NEWTABSCRIPT
function closeCurrentTab() {
  // Send a message to the background script
  chrome.runtime.sendMessage({ action: "closeTab" });
}
