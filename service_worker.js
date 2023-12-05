// BACKGROUND.JS
// This is step 3 - after proposal button is clicked on the my.advisor page

const injectedTabs = new Set();
let currentIndex = 29; // Starting index
let excelData;
let errorLogs = [];
let totalIndexes;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "setTotalIndexes") {
    totalIndexes = message.totalIndexes;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "logError") {
    errorLogs.push({ tabId: sender.tab.id, error: message.error });
    console.log(`Error logged for index ${currentIndex}:`, message.error);
  }
});

// Load current index from storage
chrome.storage.local.get("currentIndex", function (data) {
  currentIndex = data.currentIndex || 29; // Default to 29 if not set
  console.log("Current index from storage:", currentIndex);
});

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
    // Check if the script has already been injected into this tab
    if (injectedTabs.has(tabId)) {
      return; // If already injected, exit early
    }
    // Stored and parsed excel data will be fetched
    chrome.storage.local.get(["excelData", "currentIndex"], function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error retrieving the data:", chrome.runtime.lastError);
        return;
      }

      const excelData = data.excelData;
      currentIndex = data.currentIndex || currentIndex; // Update from storage

      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          files: ["newTabScript.js"],
        },
        (injectionResults) => {
          injectedTabs.add(tabId); // Add tabId to the set after successful injection
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
              console.log("Sending automateData message to tab");
              chrome.tabs.sendMessage(tabId, {
                action: "automateData",
                data: excelData, // The entire data array
                currentIndex: currentIndex, // Current index
              });
            }, 2000); // A 2 second delay
          }
        }
      );
    });
  }
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  injectedTabs.delete(tabId);
});

// background.js
function sendStartNextProposalMessage() {
  // Add a timeout to wait before checking for the target tab
  setTimeout(function () {
    chrome.tabs.query(
      { url: "https://my.advisorlogin.com/*" },
      function (tabs) {
        if (tabs.length > 0) {
          const targetTabId = tabs[0].id;
          chrome.tabs.sendMessage(targetTabId, {
            action: "startNextProposal",
            currentIndex: currentIndex,
          });
        } else {
          console.error("Target tab not found after waiting.");
          // Handle the case where the target tab is still not found
          // Optionally, you can open the tab here if it's critical for the next step
        }
      }
    );
  }, 3000); // Wait for 3000 milliseconds (3 seconds) before checking
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "closeTab") {
    // Increment currentIndex only when the tab is closed
    currentIndex++;
    checkIfProcessingComplete();
    // Save the new currentIndex immediately
    chrome.storage.local.set({ currentIndex: currentIndex }, function () {
      if (chrome.runtime.lastError) {
        console.error("Error setting currentIndex:", chrome.runtime.lastError);
      } else {
        console.log("Index saved to storage:", currentIndex);
        sendStartNextProposalMessage();
      }
    });

    // Close the tab as before
    chrome.tabs.remove(sender.tab.id);
  }
});

function openErrorLogTab() {
  const errorData = JSON.stringify(errorLogs, null, 2);
  chrome.tabs.create({
    url: "data:text/plain;charset=utf-8," + encodeURIComponent(errorData),
  });
}

function checkIfProcessingComplete() {
  chrome.storage.local.get(["currentIndex", "totalIndexes"], function (data) {
    if (data.currentIndex >= data.totalIndexes) {
      openErrorLogTab();
    }
  });
}
