chrome.runtime.onMessage.addListener(async(request, sender, sendResponse) => {
  if (!!request.showPrApprovedCount) {
    await showApprovedAndComments();
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
      setTimeout(showApprovedAndComments, 2000);
    });
  }
}

async function showApproved(element) {
  const td = element.parentNode
  if (td.querySelector("#approvedCount")) {
    return
  }

  const commitLinkParts = element.firstElementChild.href.split('/');
  const workspace = commitLinkParts[3]
  const project = commitLinkParts[4]
  const commitHash = commitLinkParts[6]

  const userResponse = await fetch(`https://bitbucket.org/!api/2.0/user?fields=account_id`);
  const userResult = await userResponse.json();

  let response = await fetch(`https://bitbucket.org/!api/2.0/repositories/${workspace}/${project}/commit/${commitHash}?fields=participants&c=${new Date().getTime()}`);
  let participantsResult = await response.json();

  let approvedCount = 0
  let approvedByMe = false
  if (participantsResult && participantsResult.participants && participantsResult.participants.length > 0) {
    approvedCount = participantsResult.participants.filter(participant => !!participant.approved).length

    const myParticipant = participantsResult.participants
      .filter(participant => participant.user.account_id === userResult.account_id)[0]
    approvedByMe = myParticipant ? myParticipant.approved : false
  }
  const divContainer = document.createElement('div')
  divContainer.id = 'approvedCount'
  divContainer.style = 'padding: 0 1rem; display: flex; align-items: center; justify-content: center;'
  if (approvedByMe) {
    divContainer.innerHTML = `<span class="dCzFuw" role="img"><svg width="18" height="18" viewBox="0 0 24 24" focusable="false" role="presentation"><g fill-rule="evenodd"><circle fill="currentColor" cx="12" cy="12" r="10"></circle><path d="M9.707 11.293a1 1 0 1 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 1 0-1.414-1.414L11 12.586l-1.293-1.293z" fill="inherit"></path></g></svg></span>`
  } else {
    divContainer.innerHTML = `<span class="dCzFuw" role="img" style="color: grey;"><svg width="18" height="18" viewBox="0 0 24 24" focusable="false" role="presentation"><g fill-rule="evenodd"><circle fill="currentColor" cx="12" cy="12" r="10"></circle><path d="M9.707 11.293a1 1 0 1 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 1 0-1.414-1.414L11 12.586l-1.293-1.293z" fill="inherit"></path></g></svg></span>`
  }
  const spanCount = document.createElement('span')
  spanCount.innerText = approvedCount
  divContainer.prepend(spanCount)

  element.appendChild(divContainer)
}

async function showComments(element) {
  const td = element.parentNode
  const nextTd = td.nextSibling.nextSibling.nextSibling
  if (nextTd.querySelector("#commentsCount")) {
    return
  }

  const commitLinkParts = element.firstElementChild.href.split('/');
  const workspace = commitLinkParts[3]
  const project = commitLinkParts[4]
  const commitHash = commitLinkParts[6]

  const response = await fetch(`https://bitbucket.org/!api/2.0/repositories/${workspace}/${project}/commit/${commitHash}/comments?c=${new Date().getTime()}`);
  const result = await response.json();

  let commentsCount = 0
  if (result && result.values) {
    commentsCount = result.values.length
  }

  const divContainer = document.createElement('div')
  divContainer.id = 'commentsCount'
  divContainer.className = 'count-badge'
  divContainer.innerHTML = '<span class="dcTkON" role="presentation"><svg width="18" height="16" viewBox="0 0 22 22" focusable="false" role="presentation"><g fill="currentColor" fill-rule="evenodd"><path d="M4.998 11.513c0-3.038 3.141-5.51 7.002-5.51 3.861 0 7.002 2.472 7.002 5.51 0 3.039-3.141 5.51-7.002 5.51-3.861 0-7.002-2.471-7.002-5.51zm14.84 7.771v-.002s-1.564-2.26-.767-3.116l-.037.02C20.261 14.902 21 13.279 21 11.513 21 7.371 16.963 4 12 4s-9 3.37-9 7.513 4.037 7.514 9 7.514c1.42 0 2.76-.285 3.957-.776 1.003 1.022 2.287 1.572 3.24 1.719l.002-.003a.524.524 0 0 0 .164.033.515.515 0 0 0 .474-.716z"></path></g></svg></span>'
  const spanCount = document.createElement('span')
  spanCount.innerText = commentsCount
  divContainer.prepend(spanCount)

  nextTd.prepend(divContainer)
}

async function showApprovedAndComments() {
  getCommits().then(elements => {
    elements.forEach(async element => {
      await showApproved(element);
      await showComments(element);
    })
  });

  await hasLoadMoreCommitsButton();
}
