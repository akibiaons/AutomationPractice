// NEWTABSCRIPT.JS **
// Step 4: running the scripts for the new tab **

// Utility functions defined here below:

// make note for users to keep running and open in new window  it opens the new tab and may interfere woth someomes work flow

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

function isRowDataValid(formData) {
  // List of required fields that must have data
  const requiredFields = [
    "CLIENT_TITLE",
    "FIRST_NAME",
    "LAST_NAME",
    "ACCOUNT_VALUE",
    "ADVISOR_FEE",
    "CUSTODIAN",
    "NAME_ON_PORTFOLIO",
    "PORTFOLIO_RISK",
    "PROGRAM",
    "PROPOSAL_TITLE",
    "REGISTRATION",
  ];
  return requiredFields.every((field) => formData[field]);
}

// Step two, click "Create household" button
function clickSpan() {
  let success = false; // flag to indicate if click was successful

  // Fetch all span elements in the document.
  let spans = document.querySelectorAll("span");

  // Loop through each span and click if it matches the desired text.
  spans.forEach((span) => {
    try {
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
      }
    } catch (error) {
      chrome.runtime.sendMessage({
        type: "logError",
        error: `Error at step: Click "Create new household +"` + error.message,
      });
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

function clickAddMemberButton() {
  const addMemberButton = document.querySelector(
    'button[aria-label="add-member"]'
  );
  if (addMemberButton) {
    addMemberButton.click();

    setTimeout(() => {
      fillJointOwnerDetails();
    }, 3000);
  } else {
  }
}

function addNameClick() {
  let success = false; // Flag to indicate if click was successful.
  let container = document.querySelector(".MuiDialogContent-root");
  if (!container) {
    return false;
  }

  let spans = container.querySelectorAll("span");
  spans.forEach((span) => {
    if (span.textContent.includes("Add")) {
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

function startFirstModalPopulation(data, index) {
  const observerConfig = { attributes: false, childList: true, subtree: true };

  const modalObserverCallback = (mutationsList, observer) => {
    try {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          if (mutation.target.querySelector(".modal-draggable-handle")) {
          }
        }
      }
    } catch (error) {
      chrome.runtime.sendMessage({
        type: "logError",
        error: "Error inside of Modal Population: " + error.message,
      });
    } finally {
      processExcelData(data, index);
      observer.disconnect(); // Disconnect after modal is found
    }
  };

  const observer = new MutationObserver(modalObserverCallback);
  observer.observe(document.body, observerConfig);
}

function processExcelData(data, index) {
  const formData = data[index];

  console.log("Here are all the indece", data);
  console.log("Here is the current index:", index);

  chrome.runtime.sendMessage({ action: index });

  if (index === data.length - 1) {
    chrome.runtime.sendMessage({ action: "closeTab" });
  }

  if (!isRowDataValid(formData)) {
    console.error(`Row ${index} is missing required data. Skipping.`);
    processExcelData(data, index + 1); // Skip to the next row
    return;
  }

  try {
    if (!Array.isArray(data) || index >= data.length) {
      throw new Error("Invalid data format or index out of bounds");
    }

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
    globalRiskTolerance = formData.PORTFOLIO_RISK || "Moderate";
    nameOnPortfolio = formData.NAME_ON_PORTFOLIO || "";
    feeSchedule = formData.BILLING_FFREQUENCY || "Monthly";
    feeTemplate = formData.ADVISOR_FEE || "Standard";
    jointFirst = formData.JOINT_OWNER_FIRST_NAME || "";
    jointLast = formData.JOINT_OWNER_LAST_NAME || "";
  } catch (error) {
    // Log the error and potentially handle it

    chrome.runtime.sendMessage({
      type: "logError",
      error: "Error in process excel data function:" + error.message,
    });
  } finally {
    // Schedule the following actions if not the last index
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
    try {
      firstNameInput.value = jointFirst;
      triggerInputEvents(firstNameInput);
      lastNameInput.value = jointLast;
      triggerInputEvents(lastNameInput);
    } catch (error) {
      chrome.runtime.sendMessage({
        type: "logError",
        error: "Error in function XYZ: " + error.message,
      });
    } finally {
      setTimeout(() => {
        clickRelationshipDropdown();
      }, 500);
    }
  }
}

function clickRelationshipDropdown() {
  const dropdown = document.querySelector(
    'div.MuiSelect-root[aria-haspopup="listbox"]'
  );
  if (dropdown) {
    // Simulate focusing on the dropdown
    dropdown.focus();

    // Simulate clicking the dropdown to open options
    dropdown.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    dropdown.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    dropdown.click();

    // Select a relationship option after a delay
    setTimeout(() => {
      selectRelationshipOption();
    }, 2000);
  } else {
  }
}

function selectRelationshipOption() {
  const optionText = "Other"; // Update this based on your needs
  const options = document.querySelectorAll(
    "ul.MuiList-root li.MuiMenuItem-root"
  );
  const targetOption = Array.from(options).find(
    (option) => option.textContent === optionText
  );

  if (targetOption) {
    try {
      targetOption.click();
    } catch (error) {
      chrome.runtime.sendMessage({
        type: "logError",
        error: "Error in function XYZ: " + error.message,
      });
    } finally {
      setTimeout(() => {
        addNameClick();
        setTimeout(() => {
          clickSaveAndContinue();
        }, 500);
      }, 500);
    }
  }
}

function setupObserverForModalRemoval() {
  const targetNode = document.body;
  const config = { attributes: false, childList: true, subTree: true };

  const callback = function (mutationsList, observer) {
    try {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
          const modalRemoved = Array.from(mutation.removedNodes).some(
            (node) =>
              node.querySelector &&
              node.querySelector(".modal-draggable-handle")
          );
          if (modalRemoved) {
            // If you need to do anything after the modal is removed, do it here
            // For example:
            // performSomeActionAfterModalRemoval();
          }
        }
      }
    } catch (error) {
      chrome.runtime.sendMessage({
        type: "logError",
        error: "Error in setupObserverForModalRemoval: " + error.message,
      });
    } finally {
      // Disconnect the observer since we detected the removal of the modal
      observer.disconnect();
      // If you need to do something after disconnecting the observer, do it here
      // For example, you might want to continue the workflow after the modal is gone:
      setTimeout(() => {
        clickSaveAndContinue();
      }, 4000);
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

function clickSaveAndContinue() {
  let buttons = document.querySelectorAll("button");

  try {
    for (let button of buttons) {
      if (button.textContent.includes("Save and continue")) {
        setTimeout(() => {
          let event = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          });

          button.dispatchEvent(event);
        }, 1000);

        return;
      }
    }
  } catch (error) {
    chrome.runtime.sendMessage({
      type: "logError",
      error: "Error in function XYZ: " + error.message,
    });
  } finally {
    setTimeout(() => {
      clickRiskToleranceButtonAfterDelay();
    }, 4000);
  }
}
// Step four-two
// Click that we know our client's risks...
function adjustRiskToleranceSlider() {
  const percentage = riskToleranceToPercentage[globalRiskTolerance] || 50; // Default to 50 if no match is found
  clickSliderAtPosition(percentage);
}

function clickRiskToleranceButtonAfterDelay() {
  const button = document.querySelector(
    'button[aria-label="I already know my client\'s risk tolerance"]'
  );
  setTimeout(() => {
    if (button) {
      try {
        button.click();
      } catch (error) {
        chrome.runtime.sendMessage({
          type: "logError",
          error: "Error in function XYZ: " + error.message,
        });
      } finally {
        setTimeout(() => {
          adjustRiskToleranceSlider();
        }, 2000);
      }
    }
  }, 5000);
}

function clickSliderAtPosition(percentage) {
  const sliderContainers = document.querySelectorAll('div[role="button"]');
  const slider = Array.from(sliderContainers).find((container) => {
    return Array.from(container.children).some((child) =>
      child.style.left.includes("calc")
    );
  });

  const rect = slider.getBoundingClientRect();
  const clickX = rect.left + rect.width * (percentage / 100);
  const clickY = rect.top + rect.height / 2;

  if (slider) {
    try {
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: clickX,
        clientY: clickY,
      });

      slider.dispatchEvent(clickEvent);
    } catch (error) {
      chrome.runtime.sendMessage({
        type: "logError",
        error: "Error in function XYZ: " + error.message,
      });
    } finally {
      setTimeout(() => {
        // Step four-two
        // Click slider to its proper location
        clickRiskAssessmentDropdown();
      }, 2000);
    }
  }
}

function clickRiskAssessmentDropdown() {
  const dropdown = document.querySelector(
    "div.MuiSelect-root[aria-haspopup='listbox']"
  );

  if (dropdown) {
    try {
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
    } catch (error) {
      chrome.runtime.sendMessage({
        type: "logError",
        error: "Error in function XYZ: " + error.message,
      });
    } finally {
      setTimeout(() => {
        clickRiskAssessmentOption();
      }, 2000);
    }
  }
}

function clickRiskAssessmentOption() {
  try {
    const tryClickOption = () => {
      const options = Array.from(
        document.querySelectorAll("ul.MuiList-root li.MuiMenuItem-root")
      );
      const targetOption = options.find((option) =>
        option.textContent.includes(optionText)
      );

      if (targetOption) {
        targetOption.click();
        clickTermsCheckbox();
        return true; // Indicate success
      }
      return false; // Indicate failure
    };

    const optionText =
      "Existing client (Current risk-tolerance questionnaire is on file)";

    const observer = new MutationObserver((mutations, obs) => {
      if (tryClickOption()) {
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
          clickTermsCheckbox();
        }
      }, 300); // Adjust the timeout as necessary
    } else {
      observer.disconnect(); // If we clicked the option, disconnect the observer
    }
  } catch (error) {
    chrome.runtime.sendMessage({
      type: "logError",
      error: "Error in clickRiskAssessmentOption(): " + error.message,
    });
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
    try {
      checkBoxButton.click();
    } catch (error) {
      chrome.runtime.sendMessage({
        type: "logError",
        error: "Error in function clickTermsCheckbox(): " + error.message,
      });
    } finally {
      setTimeout(() => {
        termsCheckboxConfirmation();
      }, 2000);
    }
  }
}

function termsCheckboxConfirmation() {
  var xpath = "//button[.//span[contains(text(), 'I agree')]]";
  var agreeButton = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;

  if (agreeButton) {
    try {
      agreeButton.click();
    } catch (error) {
      chrome.runtime.sendMessage({
        type: "logError",
        error: "Error in function XYZ: " + error.message,
      });
    } finally {
      setTimeout(() => {
        // Timeout to kickstart the saveandcontinue button

        saveAndContinueRandO();
      }, 1000);
    }
  }
}

// Step four-eight: Confirm selected options, save and continue...
function saveAndContinueRandO() {
  let spanFound = false;
  let spans = document.querySelectorAll("span");

  for (let span of spans) {
    if (span.textContent.includes("Save and continue")) {
      spanFound = true;

      setTimeout(() => {
        try {
          span.click(); // Simpler way to click without creating a MouseEvent
        } catch (error) {
          chrome.runtime.sendMessage({
            type: "logError",
            error: "Error in function saveAndContinueRandO(): " + error.message,
          });
        } finally {
          setTimeout(() => {
            clickAddAccountButton();
          }, 7000);
        }
      }, 5000); // Waiting for animations to complete

      break; // Exit the loop as we've found and clicked the span
    }
  }
}

//Version 0.39.1 - Nov 7 2023
// step five-one: Click the add account button
function clickAddAccountButton() {
  let spans = document.querySelectorAll("span");

  for (let span of spans) {
    if (span.textContent.trim() === "Add account") {
      // Using trim() to remove any leading/trailing whitespace
      let button = span.closest("button");

      if (button) {
        try {
          button.click();
          return true;
        } catch (error) {
          chrome.runtime.sendMessage({
            type: "logError",
            error: "Error in function XYZ: " + error.message,
          });
        } finally {
          setTimeout(() => {
            setProposalAmount();
          }, 5000);
        }
      }
    }
  }

  return false;
}

//  TRY AND CATCH
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
    }
  }
  setTimeout(() => {
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

      // Wait for the secondary owner options to appear, then click
      setTimeout(() => {
        clickSecondaryOwnerDropdown();
      }, 3000); // Adjust the delay as necessary
    } else {
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

      // Add any additional logic you need after clicking the option
      setTimeout(() => {
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

      setTimeout(() => {
        clickProgramOptionByContent(globalProgram);
      }, 2000); // 2-second delay
      return true; // Indicate that the span was found and clicked
    }
  }

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

      setTimeout(() => {
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
  }
}

function findRowAndClickRadioButton(nameOnPortfolio) {
  const rows = document.querySelectorAll('.MuiDrawer-root [role="row"]');
  rows.forEach((row) => {
    const nameCell = Array.from(row.querySelectorAll('div[role="cell"]')).find(
      (cell) => cell.textContent.includes(nameOnPortfolio)
    );

    if (nameCell) {
      const radioButton = nameCell.parentNode.querySelector(
        'button[role="radio"]'
      );
      if (radioButton) {
        radioButton.click();

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

    setTimeout(() => {
      saveContinue();
      if (globalProgram === "UMA") {
        setTimeout(() => {
          clickAddButtonByText();
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
      spanFound = true;

      setTimeout(() => {
        span.click(); // Simpler way to click without creating a MouseEvent
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

        setTimeout(() => {
          clickEditAdvisorFeeButton();
        }, 8000);
      } else {
      }
    }, 500); // Adjust this timeout to match the time it takes for the options to appear
  } else {
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

    setTimeout(() => {
      clickFeeTemplateOption(feeTemplate);
    }, 5000);
  } else {
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

        setTimeout(() => {
          clickApplyButton(feeTemplate);
        }, 1000);
      } else {
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

    setTimeout(() => {
      clickAgreeButton();
    }, 5000);
  } else {
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

      setTimeout(() => {
        clickContinueButton();
      }, 5000);
    } else {
    }
  } else {
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

      setTimeout(() => {
        closeCurrentTab();
      }, 2000);
    } else {
    }
  } else {
  }
}

//NEWTABSCRIPT
function closeCurrentTab() {
  // Send a message to the background script
  chrome.runtime.sendMessage({ action: "closeTab" });
}
