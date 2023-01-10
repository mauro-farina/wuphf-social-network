import {methodsFunctions, computedFunctions, getUserData} from './vueAppFunctions.js';

export const FeedContainer = {
    props: {
        user : Object,
        messages : Array,
        currentPath : String
    },
    template: 
        `<div v-if="user.authenticated && (currentView === 'feed' || currentView === '')" v-cloak>
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
        `<div v-for="msg in messages" class="container-fluid col message-container">
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
        `<div class="container-fluid">
            <button class="btn" @click.prevent="toggleFollow(message.username)" v-if="message.username !== user.username" type="submit">
                <i class="bi bi-person-check-fill" :data-follow-icon-for="message.username"></i>
            </button>
            <span><a @click.prevent="showProfile(message.username)">@{{message.username}}</a> {{convertDate(message.date)}}</span> 
            <p>
                {{message.message}}
            </p>
            <button class="btn" @click.prevent="toggleLike(message.messageID)" type="submit">
                <i v-if="user.likedMessages.includes(message.messageID)" class="bi bi-heart-fill" :data-like-icon-for="message.messageID"></i>
                <i v-if="!user.likedMessages.includes(message.messageID)" class="bi bi-heart" :data-like-icon-for="message.messageID"></i>
            </button>
        </div>`,
    methods: {
        convertDate : methodsFunctions.convertDate,
        toggleFollow : methodsFunctions.toggleFollow,
        toggleLike : methodsFunctions.toggleLike,
        showProfile : methodsFunctions.showProfile
    },
};

export const LoginSignupMessage = {
    props: {
        user : Object
    },
    template: 
        `<article v-if="!user.authenticated" class="col" v-cloak>
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
        `<div v-if="currentView.includes('search')" v-for="foundUser in searchUserResults" class="container-fluid col" v-cloak>
            <article class="message">
                <div class="container-fluid">
                    <span v-if="foundUser.username === user.username" class="text-muted pe-2">(you)</span>
                    <button class="btn" @click.prevent="toggleFollow(foundUser.username)" type="submit" v-if="user.authenticated && foundUser.username !== user.username">
                        <i v-if="user.followedUsers.includes(foundUser.username)" class="bi bi-person-check-fill" :data-follow-icon-for="foundUser.username"></i>
                        <i v-if="!user.followedUsers.includes(foundUser.username)" class="bi bi-person-fill-add" :data-follow-icon-for="foundUser.username"></i>
                    </button>
                    <!-- <a :href="'/api/social/users/'.concat(foundUser.username)"> -->
                    <span><a @click.prevent="showProfile(foundUser.username)">@{{foundUser.username}}</a> - {{foundUser.firstName}} {{foundUser.lastName}}</span> 
                    <p>
                        {{foundUser.bio}}
                    </p>
                </div>
            </article>
        </div>`,
    methods: {
        searchUser : methodsFunctions.searchUser,
        toggleFollow : methodsFunctions.toggleFollow,
        showProfile : methodsFunctions.showProfile
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
            profileReady : false
        }
    },
    template:
        `<div v-if="profileReady && currentView.includes('user')" v-cloak>
            <article class="message" :data-user="userProfile.username">
                <div class="container-fluid">
                    <img :src="'https://api.dicebear.com/5.x/pixel-art/svg?seed='.concat(userProfile)" width="80" height="80" />
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
                        Signup up on {{convertDate(userProfile.signUpDate).split("GMT ")[1]}}
                    </p>
                </div>
            </article>
            <message-container :user="user" :messages="userMessages"></message-container>
        </div>`,
    methods: {
        postNewMessage : methodsFunctions.postNewMessage,
        getProfileData: async function() {
            try{
                this.userProfile = await (await fetch(`/api/social/users/${this.showProfileOf}`)).json();
                this.userMessages = await (await fetch(`/api/social/messages/${this.showProfileOf}`)).json();
                this.profileReady = true;
            } catch {
                this.profileReady = false;
                return;
            }
        },
        convertDate : methodsFunctions.convertDate,
        toggleFollow : methodsFunctions.toggleFollow
    },
    watch: {
        showProfileOf(newValue, oldValue) {
            this.profileReady = false;
            if(newValue !== '') {
                console.log("new value! new value!");
                this.getProfileData(newValue);
            }
        }
    },
    computed: {
        currentView : computedFunctions.currentView
    }
};