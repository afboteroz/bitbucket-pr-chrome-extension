chrome.runtime.onMessage.addListener(async(request, sender, sendResponse) => {
  if (!!request.showPrApprovedCount) {
    await showApproved();
  }
});

async function getItemAndAwaitUntilLoaded(selector) {
  let retries = 5
  while (document.querySelectorAll(selector).length === 0 || retries === 0) {
    --retries;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return document.querySelectorAll(selector);
}

async function getCommits() {
  return getItemAndAwaitUntilLoaded('[data-qa^=commit-hash-wrapper]');
}

async function hasLoadMoreCommitsButton() {
  const [moreCommitsBtn] = await getItemAndAwaitUntilLoaded('button.css-52e3e4');
  if (moreCommitsBtn) {
    moreCommitsBtn.addEventListener('click', () => {
      setTimeout(showApproved, 2000);
    });
  }
}

async function showApproved() {
  getCommits().then(elements => {
    elements.forEach(async element => {
      const commitLinkParts = element.firstElementChild.href.split('/');
      const workspace = commitLinkParts[3]
      const project = commitLinkParts[4]
      const commitHash = commitLinkParts[6]

      const response = await fetch(`https://bitbucket.org/!api/2.0/repositories/${workspace}/${project}/commit/${commitHash}?fields=participants`);
      const result = await response.json();

      let approvedCount = 0
      if (result && result.participants) {
        approvedCount = result.participants.filter(participant => !!participant.approved).length
      }
      const divContainer = document.createElement('div')
      divContainer.id = 'approvedCount'
      divContainer.style = 'padding: 0 1rem; display: flex; align-items: center; justify-content: center;'
      divContainer.innerHTML = `<span class="dCzFuw" role="img"><svg width="18" height="18" viewBox="0 0 24 24" focusable="false" role="presentation"><g fill-rule="evenodd"><circle fill="currentColor" cx="12" cy="12" r="10"></circle><path d="M9.707 11.293a1 1 0 1 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 1 0-1.414-1.414L11 12.586l-1.293-1.293z" fill="inherit"></path></g></svg></span>`
      const spanCount = document.createElement('span')
      spanCount.innerText = approvedCount
      divContainer.prepend(spanCount)

      element.appendChild(divContainer)
    })
  });

  await hasLoadMoreCommitsButton();
}
