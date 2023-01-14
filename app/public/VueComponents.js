import {methodsFunctions, computedFunctions} from './vueAppFunctions.js';

export const FeedContainer = {
    props: {
        user : Object,
        messages : Array,
        currentPath : String
    },
    template: 
        `<div v-if="user.authenticated && (currentView === '/feed' || currentView === '/feed/' || currentView === '/' || currentView === '')" v-cloak class="row row-cols-1">
            <article class="col text-end" id="newMessage">
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
                <a :href="'/#/user/'.concat(message.username)"><img :src="'https://api.dicebear.com/5.x/bottts-neutral/svg?radius=50&seed='.concat(message.username)" width="40" height="40" /></a>
            </span>
            <span class="col-8 align-self-start text-start">
                <a :href="'/#/user/'.concat(message.username)" class="fw-bold pointerOnHover local-primary-text link-no-underline">@{{message.username}}</a>
            </span>
        </div>
        <p class="pt-3 px-2 pointerOnHover" v-html="addLinkToTaggedUsers(message.message)" @click="openSingleMessage(message)">
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
        openSingleMessage: methodsFunctions.openSingleMessage,
        convertDate : methodsFunctions.convertDate,
        toggleFollow : methodsFunctions.toggleFollow,
        toggleLike : methodsFunctions.toggleLike,
        addLinkToTaggedUsers : methodsFunctions.addLinkToTaggedUsers
    }
};

export const LoginSignupMessage = {
    props: {
        user : Object,
        messages : Array,
        currentPath : String
    },
    template: 
        `<div v-if="!user.authenticated" v-cloak>
            <article v-if="!user.authenticated" class="my-3" v-cloak>
                Create an account to start following users and personalize your feed!
                <hr v-if="!currentView.includes('feed')">
            </article>
            <div v-if="messages.length > 0 && (currentView === '/feed' || currentView === '/feed/' || currentView === '/' || currentView === '')">
                <p>In the meantime, enjoy some <em>Woofs</em></p>
                <random-messages :messages="messages"></random-messages>
            </div>
        </div>`,
    computed: {
        currentView : computedFunctions.currentView
    }
};

export const NewUser = {
    props: {
        user : Object,
        messages : Array,
        currentPath : String
    },
    template: 
        `<div v-if="user.authenticated && user.followedUsers.length === 0 && messages.length > 0 && (currentView === '/feed' || currentView === '/feed/' || currentView === '/' || currentView === '')">
            <hr>
            <article v-cloak>
                <p>Start following users to personalize your feed!</p>
            </article>
            <div>
                <p>Here are some random <em>Woofs</em> to get you started: </p>
                <random-messages :messages="messages"></random-messages>
            </div>
        </div>`,
    computed: {
        currentView : computedFunctions.currentView
    }
}


export const RandomMessages = {
    props: {
        messages : Array
    },
    template: 
        `<div v-for="msg in messages" class="col">
            <article class="message" :id="msg.messageID">
                <div class="row justify-content-start">
                    <span class="col-auto align-self-start">
                        <img :src="'https://api.dicebear.com/5.x/bottts-neutral/svg?radius=50&seed='.concat(msg.username)" width="40" height="40" />
                    </span>
                    <span class="col-8 align-self-start text-start">
                        <a :href="'/#/user/'.concat(msg.username)" class="fw-bold pointerOnHover local-primary-text link-no-underline">@{{msg.username}}</a>
                    </span>
                </div>
                <p class="pt-3 px-2" v-html="addLinkToTaggedUsers(msg.message)" @click="openSingleMessage(message)">
                </p>
            </article>
        </div>`,
    methods: {
        addLinkToTaggedUsers : methodsFunctions.addLinkToTaggedUsers,
        openSingleMessage : methodsFunctions.openSingleMessage
    }
}


export const SearchUsersContainer = {
    props: {
        user : Object,
        usernameToLookup : String,
        searchUserResults : Array,
        currentPath : String
    },
    template: 
        `<div v-if="currentView.includes('search?q=')" class="container-fluid row row-cols-1" v-cloak>
            <article class="px-5 py-4">
                <div>
                    {{searchUserResults.length}} results found
                </div>
                <div v-if="searchUserResults.length === 0" class="row justify-content-center my-3">
                    <img src="./imgs/escobar.jpg" class="not-found-img"/>
                </div>
            </article>
            <article class="profile-preview-search col" v-for="foundUser in searchUserResults">
                <div class="row row-cols-2 text-start align-self-start font-l">
                    <div class="col mx-1 pfp-preview">
                        <a :href="'/#/user/'.concat(foundUser.username)">
                            <img class="pointerOnHover" :src="'https://api.dicebear.com/5.x/bottts-neutral/svg?radius=5&seed='.concat(foundUser.username)" />
                        </a>
                    </div>
                    <div class="col row row-cols-1 flex-grow-1">
                        <span class="col"> 
                            <a :href="'/#/user/'.concat(foundUser.username)" class="link-no-underline pointerOnHover">{{foundUser.firstName}} {{foundUser.lastName}}</a>
                        </span>
                        <span class="col px-3">
                           <a :href="'/#/user/'.concat(foundUser.username)" class="fw-bold local-primary-text link-no-underline pointerOnHover"> @{{foundUser.username}} </a>
                        </span>
                    </div>
                </div>
                <p class="px-4 py-1 font-m">
                    {{foundUser.bio}}
                </p>
            </article>
        </div>`,
    methods: {
        toggleFollow : methodsFunctions.toggleFollow
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
            profileExists : false,
            userProfile : {},
            userFollowers : [],
            userFollowing : [],
            userMessages : []
        }
    },
    template:
        `<div v-if="profileReady && currentView.includes('user/') && !currentView.includes('/msg/')" v-cloak>
            <article class="px-5 py-4" v-if="!profileExists">
                No one on WUPHF.com has username '{{showProfileOf}}'
                <div class="row justify-content-center my-3">
                    <img src="./imgs/spongebob.jpg" class="not-found-img"/>
                </div>
            </article>

            <article class="profile-infos container-fluid" v-if="profileExists">
                <div class="row row-cols-1 justify-content-start">
                    <div class="col row row-cols-2 row-cols-md-3 text-start align-self-start font-xl">
                        <img class="col pfp mx-1" :src="'https://api.dicebear.com/5.x/bottts-neutral/svg?radius=5&seed='.concat(userProfile.username)" />
                        <div class="col row row-cols-1 flex-grow-1">
                            <span class="col"> 
                                {{userProfile.firstName}} {{userProfile.lastName}}
                            </span>
                            <span class="col fw-bold local-primary-text px-3">@{{userProfile.username}}</span>
                        </div>
                        <div class="col flex-grow-1">
                            <ul class="list-group list-group-horizontal font-l">
                                <li class="list-group-item">followers: {{userFollowers.length}}</li>
                                <li class="list-group-item">following: {{userFollowing.length}}</li>
                            </ul>
                        </div>
                    </div>
                    <div class="col">
                        <button class="btn" @click.prevent="toggleFollow(userProfile, userFollowers)" type="submit" v-if="user.authenticated && userProfile.username !== user.username">
                            <span v-if="!userFollowers.includes(user.username)">FOLLOW</span>
                            <span v-if="userFollowers.includes(user.username)">FOLLOWING</span>
                        </button>
                    </div>
                    <div class="col mt-3 mt-1 text-start align-self-start font-l flex-grow-1">
                        <p>
                            {{userProfile.bio}}
                        </p>
                        <p class="text-start text-muted font-m">
                            WUPHF.com member since {{convertDate(userProfile.signUpDate)}}
                        </p>
                    </div>
                </div>
            </article>

            <message-container v-if="profileExists" :user="user" :messages="userMessages"></message-container>
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


export const SingleMessage = {
    props: {
        user : Object,
        messageId : String,
        showProfileOf : String,
        currentPath : String
    },
    data() {
        return {
            messageReady : false,
            messageExists : false,
            messageToShow : {}
        };
    },
    template:
        `<div v-if="currentView.includes('user/') && currentView.includes('/msg/') && messageReady" v-cloak>
            <!-- message does not exist -->
            <div v-if="!messageExists">
                <p>
                    Looks like the message you were looking for does not exist
                </p>
                <div class="row justify-content-center my-3">
                    <img src="./imgs/confused-cat.jpg" class="not-found-img">
                </div>
            </div>

            <!-- message -->
            <div v-if="messageExists" class="my-5">
                <message-body :user="user" :message="messageToShow"></message-body>
            </div>
        </div>`,
    methods: {
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
                    // something went wrong!
                    this.messageExists = false;
                    console.log("uhm")
                    return;
                }
                this.messageReady = true;
            } catch {
                this.messageReady = false;
                this.messageExists = false;
                this.messageToShow = {};
                return;
            }
        }
    },
    watch: {
        messageId(newValue, oldValue) {
            this.messageReady = false;
            if(newValue !== '') {
                this.getSingleMessage();
            }
        }
    },
    computed: {
        currentView : computedFunctions.currentView
    }
};