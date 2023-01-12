import {methodsFunctions, computedFunctions} from './vueAppFunctions.js';

export const FeedContainer = {
    props: {
        user : Object,
        messages : Array,
        currentPath : String
    },
    template: 
        `<div v-if="user.authenticated && (currentView === 'feed' || currentView === '')" v-cloak class="row row-cols-1">
            <article class="col" id="newMessage">
                <form>
                    <div class="mb-3">
                        <textarea class="form-control" id="newMessageTextArea" rows="3" placeholder="What's barking through your mind?"></textarea>
                    </div>
                    <button id="woofNewMessageButton" class="btn btn-dark" type="submit" @click.prevent="postNewMessage">Woof it!</button>
                </form>
            </article>
            <message-container :messages="messages" :user="user"></message-container>
        </div>`,
    methods: {
        postNewMessage : methodsFunctions.postNewMessage
    },
    computed: {
        currentView : computedFunctions.currentView
    }
};

export const MessageContainer = {
    props: {
        user : Object,
        messages : Array
    },
    template: 
        `<div v-for="msg in messages" class="col">
            <article class="message" :id="msg.messageID">
                <message-body :user="user" :message="msg"></message-body>
            </article>
        </div>`
};

export const MessageBody = {
    props: {
        user : Object,
        message : Object
    },
    template:
        `<div class="row justify-content-start">
            <span class="col-auto align-self-start">
                <img :src="'https://api.dicebear.com/5.x/avataaars-neutral/svg?radius=50&seed='.concat(message.username)" width="40" height="40" />
            </span>
            <span class="col-8 align-self-start text-start">
                <a @click.prevent="goTo('user/'.concat(message.username))" class="fw-bold pointerOnHover local-primary-text link-no-underline">@{{message.username}}</a>
            </span>
        </div>
        <p class="pt-3 px-2">
            {{message.message}}
        </p>
        <div class="row row-cols-2">
            <span class="col-xs- align-self-start">
                <button class="btn" @click.prevent="toggleLike(message)" type="submit">
                    <i v-if="message.likedBy.includes(user.username)" class="bi bi-heart-fill" :data-like-icon-for="message.messageID"></i>
                    <i v-if="!message.likedBy.includes(user.username)" class="bi bi-heart" :data-like-icon-for="message.messageID"></i>
                </button>
                <span class="text-muted">{{message.likedBy.length}}</span>
            </span>
            <span class="col align-self-end text-muted text-end">{{convertDate(message.date)}}</span>
        </div>`,
    methods: {
        convertDate : methodsFunctions.convertDate,
        toggleFollow : methodsFunctions.toggleFollow,
        toggleLike : methodsFunctions.toggleLike,
        goTo : methodsFunctions.goTo
    },
};

export const LoginSignupMessage = {
    props: {
        user : Object
    },
    template: 
        `<article v-if="!user.authenticated" v-cloak>
            Create an account to start following users and personalize your feed!
        </article>`
};

export const SearchUsersContainer = {
    props: {
        user : Object,
        usernameToLookup : String,
        searchUserResults : Array,
        currentPath : String
    },
    template: 
        `<div v-if="currentView.includes('search?q=')" class="container-fluid row row-cols-1" v-cloak>
            <article class="padding-20">{{searchUserResults.length}} results found</article>
            <article class="profile-preview-search col" v-for="foundUser in searchUserResults">
                <div class="row justify-content-start">
                    <span class="col-auto align-self-start">
                        <img :src="'https://api.dicebear.com/5.x/avataaars-neutral/svg?radius=50&seed='.concat(foundUser.username)" width="40" height="40" />
                    </span>
                    <span class="col-8 fw-bold align-self-start text-start pointerOnHover">
                        <span v-if="foundUser.username === user.username" class="text-muted pe-2">
                            (you)
                        </span>
                        <a @click.prevent="goTo('user/'.concat(foundUser.username))">@{{foundUser.username}}</a>
                    </span>
                </div>
                <p class="px-4 py-1">
                    {{foundUser.bio}}
                </p>
            </article>
        </div>`,
    methods: {
        toggleFollow : methodsFunctions.toggleFollow,
        goTo : methodsFunctions.goTo
    },
    computed: {
        currentView : computedFunctions.currentView
    }
}

export const UserProfileContainer = {
    props: {
        user : Object,
        currentPath : String,
        showProfileOf : String
    },
    data() {
        return {
            profileReady : false,
            profileExists : false
        }
    },
    template:
        `<div v-if="profileReady && currentView.includes('user')" v-cloak>
            <article class="container-fluid padding-20" v-if="!profileExists">
                '{{showProfileOf}}' is not registered on WUPHF.com.
            </article>
            <article class="container-fluid" v-if="profileExists">
                <img :src="'https://api.dicebear.com/5.x/pixel-art/svg?seed='.concat(userProfile.username)" width="80" height="80" />
                <span v-if="userProfile.username === user.username" class="text-muted pe-2">(you)</span>
                <button class="btn" @click.prevent="toggleFollow(userProfile.username)" type="submit" v-if="user.authenticated && userProfile.username !== user.username">
                    <i v-if="user.followedUsers.includes(userProfile.username)" class="bi bi-person-check-fill" :data-follow-icon-for="userProfile.username"></i>
                    <i v-if="!user.followedUsers.includes(userProfile.username)" class="bi bi-person-fill-add" :data-follow-icon-for="userProfile.username"></i>
                </button>
                <span><a :href="'/api/social/users/'.concat(userProfile.username)">@{{userProfile.username}}</a> - {{userProfile.firstName}} {{userProfile.lastName}}</span> 
                <p>
                    {{userProfile.bio}}
                </p>
                <p>
                    WUPHF.com member since {{convertDate(userProfile.signUpDate).split("GMT ")[1]}}
                </p>
            </article>
            <message-container v-if="user.authenticated && profileExists" :user="user" :messages="userMessages"></message-container>
        </div>`,
    methods: {
        postNewMessage : methodsFunctions.postNewMessage,
        getProfileData : methodsFunctions.getProfileData,
        convertDate : methodsFunctions.convertDate,
        toggleFollow : methodsFunctions.toggleFollow
    },
    watch: {
        showProfileOf(newValue, oldValue) {
            this.profileReady = false;
            if(newValue !== '') {
                this.getProfileData();
            }
        }
    },
    computed: {
        currentView : computedFunctions.currentView
    }
};