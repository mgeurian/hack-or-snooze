$(async function() {
  // cache some selectors we'll be using quite a bit

  // navbar selectors
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navSubmit = $("#nav-submit");
  const $navFavorites = $("#nav-favorites");
  const $navMyStories = $("#nav-my-stories");
  const $navWelcome = $("#nav-welcome");
  const $navUserProfile = $("#nav-user-profile")
  
  // form selectors
  const $submitForm = $("#submit-form");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  
  // article selectors
  const $allStoriesList = $("#all-articles-list");
  const $filteredArticles = $("#filtered-articles");
  const $ownStories = $("#my-articles");
  const $favoritedStories = $("#favorited-articles");
  
  const $userProfile = $("#user-profile");
  const $profileName = $("#profile-name");
  const $profileUsername = $("#profile-username");
  const $profileAccountDate = $("#profile-account-date");

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /* hide all elements in elementsArr */
  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $favoritedStories,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $userProfile,
    ];
    elementsArr.forEach($elem => $elem.hide());
  }


  
  async function checkIfLoggedIn() {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    currentUser = await User.getLoggedInUser(token, username);

    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  async function showAllStories() {
    hideElements();

    await generateStories();

    $allStoriesList.show();
  }

  function navLogin() {
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  }
  async function loginForm(evt) {
    evt.preventDefault(); 
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    const userInstance = await User.login(username, password);

    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  }

  async function createAcctForm(evt) {
    evt.preventDefault(); 
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();


    const newUser = await User.create(username, password, name);

    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  }

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }


  function loginAndSubmitForm() {
    $loginForm.hide();
    $createAccountForm.hide();
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");
    $allStoriesList.show();
    showNavForLoggedInUser();
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $userProfile.hide();
    $(".main-nav-links").toggleClass("hidden");
    $navWelcome.show()
    $navUserProfile.text(`${currentUser.username}`);
    $navLogOut.show();
  }


  function navBarSubmit(){
    hideElements()
    $submitForm.slideToggle();
    $allStoriesList.show();
  }

  async function submitFormAddStory(evt) {
    evt.preventDefault();
    let author = $("#author").val();
    let title = $("#title").val();
    let url = $("#url").val();
    
    const story = await storyList.addStory(currentUser, {author,title,url});

    generateStories(story);
    $submitForm.trigger("reset");
    $submitForm.slideToggle()
  }
  


  function navBarFavorites(){
    hideElements()

    $favoritedStories.empty();
    if(currentUser.favorites.length === 0){
      $favoritedStories.append("<h3>You don't have any favorites!")
    } else {
      generateFavorites();
    }
    $favoritedStories.show();
  }
  

  function generateFavorites() {
    for(let story of currentUser.favorites){
      let favoritesHTML = generateStoryHTML(story);
      $favoritedStories.prepend(favoritesHTML);
    }
  }


  function navBarMyStories(){
    hideElements()
    $ownStories.empty();
    if(currentUser.ownStories.length === 0){
      $ownStories.prepend("<h3>You haven't created any stories!")
    } else {
      generateMyStories();
    }
    $ownStories.show()
  }
  
 
  function generateMyStories() {
    for(let story of currentUser.ownStories){
      let ownStoriesHTML = generateStoryHTML(story, true);
      $ownStories.prepend(ownStoriesHTML);
    }
    $ownStories.show()
  }


  async function removeStory(e){
    if(currentUser){
      const articleLi = e.target.closest("li")
      const storyId = articleLi.getAttribute("id");

      await storyList.removeStory(currentUser, storyId)
      articleLi.remove()
      $ownStories.hide()
    }
    await generateStories()
    $allStoriesList.show()
  }


  function navBarProfile(){
    hideElements();
    $profileName.text(`Name:  ${currentUser.name}`);
    $profileUsername.text(`Username:  ${currentUser.username}`);
    $profileAccountDate.text(`Account Created:  ${currentUser.createdAt.slice(0,10)}`);

    $userProfile.show();
  }

  function navLogOut() {
    localStorage.clear();
    location.reload();
  }

  async function generateStories() {

    const storyListInstance = await StoryList.getStories();

    storyList = storyListInstance;

    $allStoriesList.empty();
   
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }


  function generateStoryHTML(story, isOwnStory) {
    let hostName = getHostName(story.url);
    let starType = isFavorite(story) ? "fas" : "far";

    const trashCanIcon = isOwnStory
      ? `<span class="trash-can">
          <i class="fas fa-trash-alt"></i>
        </span>`
      : "";

      const storyMarkup = $(`
      <li id="${story.storyId}">
        ${trashCanIcon}
        <span class="star">
        <i class="${starType} fa-star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
    return storyMarkup;
  }
  



  async function toggleFavorite(e) {
    if (currentUser) {
      const $tgt = $(e.target);
      const $closestLi = $tgt.closest("li");
      const storyId = $closestLi.attr("id");

      if ($tgt.hasClass("fas")) {

        await currentUser.removeFavorite(storyId);

        $tgt.closest("i").toggleClass("fas far");
      } else {

        await currentUser.addFavorite(storyId);

        $tgt.closest("i").toggleClass("fas far");
      }
    }
  }


  function isFavorite(story) {
    let favStoryIds = new Set();
    if (currentUser) {
      favStoryIds = new Set(currentUser.favorites.map(obj => obj.storyId));
    }
    return favStoryIds.has(story.storyId);
  }
  
  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }



  $("body").on("click", "#nav-all", showAllStories);

  $navLogin.on("click", navLogin);

  $loginForm.on("submit", loginForm);

  $createAccountForm.on("submit", createAcctForm);

  $navLogOut.on("click", navLogOut);



  $navSubmit.on("click", navBarSubmit)
  // show favorited stories 
  $navFavorites.on("click", navBarFavorites)
  // show my stories 
  $navMyStories.on("click", navBarMyStories)
  // show User Profile 
  $navUserProfile.on("click", navBarProfile )



  $submitForm.on("submit", submitFormAddStory)

  $(".articles-container").on("click", ".star", toggleFavorite);

  $ownStories.on("click", ".trash-can", removeStory)
});

