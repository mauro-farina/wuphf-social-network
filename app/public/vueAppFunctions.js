export async function getUserData() {
    const userData = {};
    let whoamiResponse = await fetch("/api/social/whoami");
    userData.user = await whoamiResponse.json();

    let feedResponse = await fetch('/api/social/feed');
    if (!feedResponse.ok) {
        userData.feed = [];
    } else {
        userData.feed = await feedResponse.json();
    }

    return userData;
}

export const computedFunctions = {
    currentView: function() {
        return this.currentPath.substring(1, this.currentPath.length);
    }
}

export const methodsFunctions = {
    postNewMessage: async function() {
        const newMessageTextarea = document.getElementById('newMessageTextArea');
        const newWoof = newMessageTextarea.value;

        // check length != 0 ---
        let postNewWoof = await fetch('/api/social/messages', {
            method: 'POST',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "message" : newWoof
            })
        }).catch(err => console.err(err));

        // erase textarea
        newMessageTextarea.value = "";
        // add new message to the feed without reloading!
        await fetch(`/api/social/messages/${this.user.username}`)
            .then(res => res.json()).then(msgs => this.messages.unshift(msgs[0])).catch(err => console.error(err));
    },
    convertDate: function(date) {
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const dateSplit = date.split('T');
        const dateYYYYMMDD = dateSplit[0].split('-'); 
        // 2023-01-07 -> January 7, 2023
        const datemmDDYYYY = months[parseInt(dateYYYYMMDD[1])-1] 
                                + " " + dateYYYYMMDD[2]
                                + ", " + dateYYYYMMDD[0];
        const dateTime = dateSplit[1].split('.')[0].substring(0,5);
        const now = new Date();
        if(Math.abs(now - new Date(date)) / 36e5 < 12) {
            return dateTime + " GMT";
        } else {
            return datemmDDYYYY;
        }
    },
    toggleFollow: async function(userToggleFollow, userToggleFollowCurrentFollowers) {
        const httpMethod = userToggleFollowCurrentFollowers.includes(this.user.username) ? 'DELETE' : 'POST';
        await fetch(`/api/social/followers/${userToggleFollow.username}`, { method: httpMethod });
        if(userToggleFollowCurrentFollowers.includes(this.user.username)) {
            userToggleFollowCurrentFollowers.splice(userToggleFollowCurrentFollowers.indexOf(this.user.username), 1);
        } else {
            userToggleFollowCurrentFollowers.push(this.user.username);
        }
    },
    toggleLike: async function(message) {
        const likeIconElement = document.querySelector(`[data-like-icon-for="${message.messageID}"]`);
        const httpMethod = likeIconElement.classList.contains("bi-heart") ? 'POST' : 'DELETE';
        let updateLike = await (await (await fetch(`/api/social/like/${message.messageID}`, { method: httpMethod })).json());
        likeIconElement.classList.toggle("bi-heart-fill");
        likeIconElement.classList.toggle("bi-heart");
        this.user.likedBy = (await getUserData()).user.likedMessages;

        if(httpMethod === 'POST') {
            message.likedBy.push(updateLike.likedToggledBy);
            console.log(`add ${updateLike.likedToggledBy}`);
            console.log(`current (local) likes : ${message.likedBy}`);
        } else {
            message.likedBy.splice(message.likedBy.indexOf(updateLike.likedToggledBy), 1);
            console.log(`remove ${updateLike.likedToggledBy}`);
            console.log(`current (local) likes : ${message.likedBy}`);
        }
    },
    searchUser: async function() {
        if(this.usernameToLookup.trim().length == 0) {
            this.goTo('feed');
        }
        let queryResults = await fetch(`/api/social/search?q=${this.usernameToLookup}`).then(res => res.json()).catch(err => console.err(err));
        if(queryResults.length === undefined) { return; }
        this.searchUserResults = queryResults;
        this.goTo(`search?q=${this.usernameToLookup}`);
        closeNavIfViewportWidthSmall();
    },
    getProfileData: async function() {
        try{
            let userProfileResult = await (await fetch(`/api/social/users/${this.showProfileOf}`)).json();
            if(userProfileResult.found) {
                // update this.user
                //this.user = await getUserData();
                this.userMessages = await (await fetch(`/api/social/messages/${this.showProfileOf}`)).json();
                this.userFollowers = (await (await fetch(`/api/social/followers/${this.showProfileOf}`)).json()).followers;
                this.userFollowing = (await (await fetch(`/api/social/following/${this.showProfileOf}`)).json()).followedUsers;
                this.userProfile = userProfileResult.user;
                this.profileExists = true;
            } else {
                this.profileExists = false;
                this.userProfile = {};
            }
            this.profileReady = true;
        } catch {
            this.profileReady = false;
            this.profileExists = false;
            this.userProfile = {};
            return;
        }
    },
    backToTop: function() {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        closeNavIfViewportWidthSmall();
    },
    goTo: async function(newAnchor) {
        window.location.hash = newAnchor;
        if(newAnchor === 'feed') {
            closeNavIfViewportWidthSmall();
        }
    }
}

function closeNavIfViewportWidthSmall() {
    if(window.visualViewport.width < 975) {
        document.getElementById('buttonTogglerContainer').firstElementChild.click();
    }
}
