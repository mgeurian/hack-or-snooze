const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";


class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  
  static async getStories() {
    const response = await axios.get(`${BASE_URL}/stories`);

 
    const stories = response.data.stories.map(story => new Story(story));

   
    const storyList = new StoryList(stories);
    return storyList;
  }


  async addStory(user, newStory) {

    const response = await axios.post(`${BASE_URL}/stories`, {    
      token: user.loginToken,
      story: newStory
    // TODO - Implement this function!
   
    })
    const newStoryObj = new Story(response.data.story)
    user.ownStories.unshift(newStoryObj)
    return newStoryObj;
  }

 
  async removeStory(user, storyId){

    await axios.delete(`${BASE_URL}/stories/${storyId}`, {
      params: {
        token: user.loginToken,
      }
    })
    // updates stories
    this.stories = this.stories.filter( story => story.storyId !== storyId)
    // updates currentUser favorites array
    user.favorites = user.favorites.filter( story => story.storyId !== storyId)
    // updates currentUser ownStories array
    user.ownStories = user.ownStories.filter( story => story.storyId !== storyId)

    return user;
  }
} 


class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;


    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }


  static async create(username, password, name) {
    const response = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    });

    const newUser = new User(response.data.user);
  
    
    newUser.loginToken = response.data.token;
    return newUser;
  }


  static async login(username, password) {
    const response = await axios.post(`${BASE_URL}/login`, {
      user: {
        username,
        password
      }
    });

    const existingUser = new User(response.data.user);

  
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));

   
    existingUser.loginToken = response.data.token;

    return existingUser;
  }


  static async getLoggedInUser(token, username) {

    if (!token || !username) return null;

    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token
      }
    });

    const existingUser = new User(response.data.user);

  
    existingUser.loginToken = token;

   
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    return existingUser;
  }

  async userDetails() {
    const response = await axios.get(`${BASE_URL}/users/${this.username}`, {
      params: {
        token: this.loginToken
      }
    })
    this.favorites = response.data.user.favorites.map(newStory => new Story(newStory));
    this.ownStories = response.data.user.stories.map(newStory => new Story(newStory));

    return this;
  }

  async addFavorite(storyId){
    return this._toggleFavorite(storyId, "POST");
  }

  async removeFavorite(storyId){
    return this._toggleFavorite(storyId, "DELETE");
  }

  async _toggleFavorite(storyId, httpVerb) {

    await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: httpVerb,
      data: {
        token: this.loginToken
      }
    });

    await this.userDetails();
    return this;
  }
}



class Story {



  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
}