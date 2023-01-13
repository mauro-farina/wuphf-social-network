export async function getUserData() {
    const userData = {};
    try {
        let whoamiResponse = await fetch("/api/social/whoami");
        if(whoamiResponse.status === 200 || whoamiResponse.status === 400) {
            userData.user = await whoamiResponse.json();
        } else {
            somethingWentWrongAlert();
            throw new Error();
        }
    } catch(err) {
        somethingWentWrongAlert();
        throw new Error();
    }

    if(userData.user.authenticated){
        try {
            let feedResponse = await fetch('/api/social/feed');
            if(feedResponse.ok) {
                userData.feed = await feedResponse.json();
            } else {
                somethingWentWrongAlert();
                throw new Error();
            }
        } catch(err) {
            somethingWentWrongAlert();
            throw new Error();
        }
    } else {
        userData.feed = [];
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
        if(newWoof.trim().length === 0) {
            return;
        }
        try{
            let postNewWoofRequest = await fetch('/api/social/messages', {
                method: 'POST',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "message" : newWoof
                })
            });
            if(!postNewWoofRequest.ok) {
                somethingWentWrongAlert();
                // maybe parameter to pass the error
            }
        } catch(err) {
            somethingWentWrongAlert();
        }
        
        newMessageTextarea.value = ""; // erase textarea

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
        try {
            let toggleFollowReq = await fetch(`/api/social/followers/${userToggleFollow.username}`, { method: httpMethod });
            if(toggleFollowReq.ok) {
                if(userToggleFollowCurrentFollowers.includes(this.user.username)) {
                    userToggleFollowCurrentFollowers.splice(userToggleFollowCurrentFollowers.indexOf(this.user.username), 1);
                } else {
                    userToggleFollowCurrentFollowers.push(this.user.username);
                }
            } else {
                somethingWentWrongAlert();
            }
        } catch(err) {
            somethingWentWrongAlert();
        }
    },
    toggleLike: async function(message) {
        const likeIconElement = document.querySelector(`[data-like-icon-for="${message.messageID}"]`);
        const httpMethod = likeIconElement.classList.contains("bi-heart") ? 'POST' : 'DELETE';
        let updateLikeReq;
        try {
            updateLikeReq = await fetch(`/api/social/like/${message.messageID}`, { method: httpMethod });
            if(updateLikeReq.ok) {
                likeIconElement.classList.toggle("bi-heart");
                likeIconElement.classList.toggle("bi-heart-fill");
                try {
                    this.user.likedBy = (await getUserData()).user.likedMessages;
                } catch(err) {
                    console.error(err);
                }
            } else {
                somethingWentWrongAlert();
            }
        } catch(err) {
            somethingWentWrongAlert();
            return;
        }
        let updateLikeJson = await updateLikeReq.json();
        if(httpMethod === 'POST') {
            message.likedBy.push(updateLikeJson.likedToggledBy);
        } else {
            message.likedBy.splice(message.likedBy.indexOf(updateLikeJson.likedToggledBy), 1);
        }
    },
    searchUser: async function() {
        if(this.usernameToLookup.trim().length == 0) {
            this.goTo('/feed');
            this.closeNavIfViewportWidthSmall();
        }
        try {
            let queryResultsReq = await fetch(`/api/social/search?q=${this.usernameToLookup}`);
            if(queryResultsReq.ok){
                let queryResults = await queryResultsReq.json();
                if(queryResults.length === undefined) { return; }
                this.searchUserResults = queryResults;
                this.goTo(`/search?q=${this.usernameToLookup}`);
            } else {
                somethingWentWrongAlert();
            }
        } catch(err) {
            somethingWentWrongAlert();
        }
        this.closeNavIfViewportWidthSmall();
    },
    getProfileData: async function() {
        try{
            let userProfileResult = await (await fetch(`/api/social/users/${this.showProfileOf}`)).json();
            if(userProfileResult.found) {
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
    },
    goTo: async function(newAnchor) {
        window.location.hash = newAnchor;
    },
    closeNavIfViewportWidthSmall: function() {
        if(window.visualViewport.width < 975 && document.getElementById('navbarSupportedContent').classList.contains('show')) {
            document.getElementById('buttonTogglerContainer').firstElementChild.click();
        }
    },
}

function somethingWentWrongAlert() {
    const alertPlaceholder = document.getElementById('navLiveAlertPlaceholder');
    alertPlaceholder.classList.remove("d-none");
}