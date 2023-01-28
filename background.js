chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: function () {
      window.location =
        "https://global.americanexpress.com/dashboard/?download";
    },
  });
});

chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    const headers = details.requestHeaders;
    const newHeaders = {};
    for (const header of headers) {
      newHeaders[header["name"]] = header["value"];
    }
    fetch("https://global.americanexpress.com/dashboard", {
      method: "GET",
      mode: "same-origin",
      cache: "no-cache",
      credentials: "same-origin",
      headers: newHeaders,
    })
      .then((response) => response.text())
      .then((html) => {
        const initialState =
          html
            .split('window.__INITIAL_STATE__ = "')[1]
            .split(']";')[0]
            .trim()
            .replaceAll('\\"', '"') + "]";
        let productsList =
          initialState.split('"productsList",')[1].split("]]]]]")[0] + "]]]";
        productsList = JSON.parse(productsList);
        let accounts = {};
        for (const arr of productsList) {
          if (
            Array.isArray(arr) &&
            arr[16] !== undefined &&
            arr[16].length == 32
          ) {
            const accountType = arr[6][4];
            const key = arr[16];
            accounts[accountType] = key;
            chrome.downloads.download({
              url: `https://global.americanexpress.com/api/servicing/v1/financials/documents?file_format=quicken&limit=30&status=posted&account_key=${key}&client_id=AmexAPI`,
              filename: `${accountType}.qfx`,
            });
          }
        }
      });
  },
  {
    urls: ["https://global.americanexpress.com/dashboard/?download"],
  },
  ["requestHeaders"]
);
