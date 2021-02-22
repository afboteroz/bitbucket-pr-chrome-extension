chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab && !!tab.active && changeInfo.status === 'complete' && isBitBucketPRUrl(tab.url)) {
    chrome.tabs.query({active: true, currentWindow: true}, () => {
      chrome.tabs.sendMessage(tabId, {showPrApprovedCount: true});
    });
    return true;
  }
})

function isBitBucketPRUrl(url) {
  if (!url) {
    return false;
  }
  return /https:\/\/bitbucket.org\/(.*)\/pull-requests\/*\w+/g.test(url)
}