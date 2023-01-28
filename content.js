(async () => {
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function waitForReady() {
    if (!$(".init-loading").is(":visible")) {
      chrome.runtime.sendMessage(
        { getStorage: "exportedTime" },
        function (response) {
          if (Date.now() / 1000 - response.data / 1000 < 300) init();
        }
      );
    } else {
      setTimeout(waitForReady, 500);
    }
  }

  waitForReady();

  async function init() {
    chrome.runtime.sendMessage(
      { getStorage: "accounts" },
      async function (response) {
        const numAccounts = response.data.length;
        chrome.runtime.sendMessage({ setStorage: "exportedTime", data: 0 });
        const accountLinks = document.querySelectorAll(
          ".onBudget a[draggable=true] .nav-account-name"
        );

        let accountsImported = 0;
        for (const link of accountLinks) {
          const accountName = link.innerText.trim();
          try {
            if (
              accountsImported < numAccounts &&
              confirm(`Import ${accountName}?`)
            ) {
              accountsImported += 1;
              link.click();
              await delay(1000);
              importSheet();
              let checks = 0;
              let keepChecking = true;
              while (keepChecking) {
                if (
                  document.getElementsByClassName("modal-overlay").length == 0
                )
                  checks += 1;
                else checks = 0;
                if (checks == 5) keepChecking = false;
                else await delay(100);
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    );
  }

  function importSheet() {
    document
      .getElementsByClassName("accounts-toolbar-file-import-transactions")[0]
      .click();
  }
})();
