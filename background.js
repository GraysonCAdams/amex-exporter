chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: "https://global.americanexpress.com/dashboard/?download",
    active: true,
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
    urls: ["https://global.americanexpress.com/dashboard/?download*"],
  },
  ["requestHeaders"]
);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if ("setStorage" in request) {
    chrome.storage.local
      .set({ [request.setStorage]: request.data })
      .then(() => {
        sendResponse({
          data: request.data,
        });
      });
  } else if ("getStorage" in request) {
    try {
      chrome.storage.local.get(request.getStorage).then((result) => {
        sendResponse({
          data: result[request.getStorage],
        });
      });
    } catch (e) {
      console.error(e);
      sendResponse({
        data: null,
      });
    }
  }
  return true;
});
