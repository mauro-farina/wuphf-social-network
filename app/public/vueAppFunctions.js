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
            // followedUsers
            let followedUsersQuery = await fetch(`/api/social/following/${userData.user.username}`);
            if(followedUsersQuery.ok) {
                userData.user.followedUsers = (await followedUsersQuery.json()).followedUsers;
            } else {
                somethingWentWrongAlert();
                throw new Error();
            }
            // feed-messages
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
        userData.user.followedUsers = [];
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
        const dateLocalTZ = new Date(date);
        if(Math.abs(new Date() - dateLocalTZ) / 36e5 < 12) {
            return dateLocalTZ.toTimeString().split(" GMT")[0].substring(0, 5); //19:35
        } else {
            return dateLocalTZ.toDateString().substring(4,10)
                        .concat(", '")
                        .concat(dateLocalTZ.toDateString().substring(13)); //Jan 13, '23
        }
    },
    addLinkToTaggedUsers: function(msg) {
        if(!msg.includes('@')) { return msg; }
        const commonSymbols = ["'", ",", ";", ":", "?", "!"]
        for(let submsg of msg.split('@')) {
            let possibleUsername = submsg.split(' ')[0];
            for(let symbol of commonSymbols) {
                if(possibleUsername.includes(symbol)) { 
                    possibleUsername = possibleUsername.split(symbol)[0];
                }
            }
            if(possibleUsername.length === 0) { continue; }
            msg = msg.replaceAll(
                '@'.concat(possibleUsername),
                `<a href="#/user/${possibleUsername}" class="pointerOnHover local-primary-text link-no-underline">@${possibleUsername}</a>`
                );
        }
        return msg;
    },
    copyMessageUrlToClipboard : function(msg) {
        navigator.clipboard.writeText(`http://localhost:8080/#/user/${msg.username}/msg/${msg.messageID}`);
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
            if(updateLikeReq.status !== 400 && updateLikeReq.status !== 200) {
                somethingWentWrongAlert();
                return;
            }
            likeIconElement.classList.toggle("bi-heart");
            likeIconElement.classList.toggle("bi-heart-fill");
        } catch(err) {
            somethingWentWrongAlert();
            return;
        }
        try{
            let updateLikeJson = await updateLikeReq.json();
            if(updateLikeJson.error === undefined){
                if(httpMethod === 'POST') {
                    message.likedBy.push(updateLikeJson.likedToggledBy);
                } else {
                    message.likedBy.splice(message.likedBy.indexOf(updateLikeJson.likedToggledBy), 1);
                }
            }
        } catch(err) {
            somethingWentWrongAlert();
            return;
        }
    },
    getSingleMessage: async function() {
        this.messageReady = false;
        this.messageExists = false;
        this.messageToShow = {};
        try{
            let messageQuery = await fetch(`/api/social/messages/${this.showProfileOf}/${this.messageId}`);
            if(messageQuery.ok) {
                this.messageToShow = await messageQuery.json();
                this.messageExists = true;
            } else if (messageQuery.status === 400) {
                this.messageExists = false;
                this.userProfile = {};
            } else {
                somethingWentWrongAlert();
                this.messageExists = false;
                return;
            }
            this.messageReady = true;
        } catch {
            this.messageReady = false;
            this.messageExists = false;
            this.messageToShow = {};
            return;
        }
    },
    searchUser: async function() {
        if(this.usernameToLookup.trim().length == 0) {
            goTo('/feed');
            this.closeNavIfViewportWidthSmall();
        }
        try {
            let queryResultsReq = await fetch(`/api/social/search?q=${this.usernameToLookup}`);
            if(queryResultsReq.ok){
                let queryResults = await queryResultsReq.json();
                if(queryResults.length === undefined) { return; }
                this.searchUserResults = queryResults;
                goTo(`/search?q=${this.usernameToLookup}`);
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
    closeNavIfViewportWidthSmall: function() {
        if(window.visualViewport.width < 975 && document.getElementById('navbarSupportedContent').classList.contains('show')) {
            document.getElementById('buttonTogglerContainer').firstElementChild.click();
        }
    },
    openSingleMessage: function(message) {
        window.location.href = `/#/user/${message.username}/msg/${message.messageID}`;
    },
    openProfile: function(goToProfileOf) {
        goTo(`/user/${goToProfileOf}`);
    }
}

function goTo(newAnchor) {
    window.location.hash = newAnchor;
}

export function somethingWentWrongAlert() {
    const alertPlaceholder = document.getElementById('navLiveAlertPlaceholder');
    alertPlaceholder.classList.remove("d-none");
}