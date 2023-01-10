export async function getUserData() {
    const fetchOptions = {
        redirect: 'follow'
    };
    let whoamiResponse = await fetch("/api/social/whoami", fetchOptions);
    if (!whoamiResponse.ok) {
        throw new Error(`HTTP error: ${whoamiResponse.status}`);
    }
    const user = await whoamiResponse.json();

    let feedResponse = await fetch('/api/social/feed', fetchOptions);
    if (!feedResponse.ok) {
        throw new Error(`HTTP error: ${feedResponse.status}`);
    }
    const feed = await feedResponse.json();
    return {
        user : user,
        feed : feed
    };
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
        return dateTime + " GMT " + datemmDDYYYY;
    },
    toggleFollow: async function(usernameToggleFollow) {
        const usernameLogged = this.user.username;
        const followIconElement = document.querySelector(`[data-follow-icon-for="${usernameToggleFollow}"]`);
        const httpMethod = followIconElement.classList.contains("bi-person-fill-add") ? 'POST' : 'DELETE';
        let toggleFollowFetch = await fetch(`/api/social/followers/${usernameToggleFollow}`, { method: httpMethod });
        document.querySelectorAll(`[data-follow-icon-for="${usernameToggleFollow}"]`)
            .forEach(el => {
                el.classList.toggle('bi-person-check-fill');
                el.classList.toggle('bi-person-fill-add');
            });
    },
    toggleLike: async function(messageID) {
        const usernameLogged = this.user.username;
        const likeIconElement = document.querySelector(`[data-like-icon-for="${messageID}"]`);
        const httpMethod = likeIconElement.classList.contains("bi-heart") ? 'POST' : 'DELETE';
        await fetch(`/api/social/like/${messageID}`, { method: httpMethod });
        likeIconElement.classList.toggle("bi-heart-fill");
        likeIconElement.classList.toggle("bi-heart");
    },
    searchUser: async function() {
        if(this.usernameToLookup.trim().length == 0) {
            window.location.hash = `feed`;
        }
        let queryResults = await fetch(`/api/social/search?q=${this.usernameToLookup}`).then(res => res.json()).catch(err => console.err(err));
        if(queryResults.length === undefined) { return; }
        this.searchUserResults = queryResults;
        
        window.location.hash = `search?q=${this.usernameToLookup}`;

        if(window.visualViewport.width < 991.5) {
            console.log(`${window.visualViewport.width} < 972`);
            document.getElementById('buttonTogglerContainer').firstElementChild.click();
        }
    },
    backToTop: function() {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    },
    showProfile: async function(profileOfUsername) {
        window.location.hash = `user/${profileOfUsername}`;
    }
}
