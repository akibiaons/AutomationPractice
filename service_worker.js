// BACKGROUND.JS
// This is step 3 - after proposal button is clicked on the my.advisor page

// This part of the script monitors any navigation to certain URLS **
// As shown in the declaration for "targetURLS = [...]" **
// If matching URL is found, this will inject another js file (newTabScript.js) **
// into the tab (that its currently on) and sends some data over to the extensions local storage. **
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // Below I am defining all the url paths in the SPA for ENVESTNET form....
  const targetUrls = [
    "https://my.advisorlogin.com/secure/proposalapp/#/household",
    "https://my.advisorlogin.com/secure/proposalapp/#/riskAndObjective",
    "https://my.advisorlogin.com/secure/proposalapp/#/strategies",
    "https://my.advisorlogin.com/secure/proposalapp/#/accountSetup",
    "https://my.advisorlogin.com/secure/proposalapp/#/fees",
    "https://my.advisorlogin.com/secure/proposalapp/#/overview",
  ];

  // Check if any of the URLs is in the updated tab's URL
  const isTargetUrl = tab.url
    ? targetUrls.some((part) => tab.url.includes(part))
    : false;

  // Reacting to Complete Page Load for Target URL //
  // Check for updated tab to see if it is done loading ("status === 'complete'")
  if (changeInfo.status === "complete" && isTargetUrl) {
    // Stored and parsed excel data will be fetched
    chrome.storage.local.get("excelData", function (data) {
      // Error check
      if (chrome.runtime.lastError) {
        console.error("Error retreiving the data:", chrome.runtime.lastError);
        return;
      }
      // Declaration for extracted excelData
      const excelData = data.excelData;

      // Injecting a Script into a Tab:
      chrome.scripting.executeScript(
        // Parameters and its given data
        {
          target: { tabId: tabId },
          files: ["newTabScript.js"],
        },
        (injectionResults) => {
          // Iterating over Injection Results:
          for (const frameResult of injectionResults) {
            // Error check
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
              return;
            }

            // _DEV USE ONLY
            // Success log
            console.log("script injected test");

            // Sending Message After Delay:
            setTimeout(() => {
              chrome.tabs.sendMessage(tabId, {
                action: "automateData",
                data: excelData, // Passing the excelData here to newTabScript.js
              });
            }, 2000); // A 2 second delay
          }
        }
      );
    });
  }
});

// This extension listens for messages from other scripts to automate certain tasks, like populating fields in the active tab.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // When a message is received, the script checks if the action property of the message
  // is "populateFieldsFromNewTabScript". If it is, the nested code block is executed.
  if (message.action === "populateFieldsFromNewTabScript") {
    // Querying for the Active Tab:
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // Extracting the Active Tab:
      const activeTab = tabs[0];

      // Sending a Message to the Active Tab:
      chrome.tabs.sendMessage(
        activeTab.id,
        {
          action: "populateFields",
          data: message.data,
          mapping: message.mapping,
        },
        (response) => {
          sendResponse(response);
        }
      );
    });
    return true; // This is needed for async response
  }
});
