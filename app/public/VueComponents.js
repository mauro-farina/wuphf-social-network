import {methodsFunctions, computedFunctions} from './vueAppFunctions.js';

export const FeedContainer = {
    props: {
        user : Object,
        messages : Array,
        currentPath : String
    },
    template: 
        `<div v-if="user.authenticated && (currentView === '/feed' || currentView === '/feed/' || currentView === '/' || currentView === '')" v-cloak class="row row-cols-1">
            <article class="col text-end mb-3" id="newMessage">
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
        `<div class="row justify-content-start pointerOnHover">
            <span class="col-auto align-self-start pointerOnHover" @click="openProfile(message.username)">
                <img class="message-pfp" :src="'https://api.dicebear.com/5.x/bottts-neutral/svg?radius=50&seed='.concat(message.username)" />
            </span>
            <span class="col align-self-start text-start pointerOnHover" @click="openProfile(message.username)">
                <a class="fw-bold local-primary-text link-no-underline">@{{message.username}}</a>
            </span>
            <span class="col align-self-end text-end flex-grow-1">
                <button class="btn" @click="copyMessageUrlToClipboard(message)" title="Copy message URL to clipboard">
                    <i class="bi bi-link"></i>
                </button>
            </span>
        </div>
        <p class="pt-3 px-2 pointerOnHover" v-html="addLinkToTaggedUsers(message.message)" @click.self="openSingleMessage(message)">
        </p>
        <div class="row row-cols-2">
            <span class="col-xs- align-self-start">
                <button v-if="user.authenticated" class="btn btn-lg" @click.prevent="toggleLike(message)" type="submit">
                    <i v-if="message.likedBy.includes(user.username)" class="bi bi-heart-fill" :data-like-icon-for="message.messageID"></i>
                    <i v-if="!message.likedBy.includes(user.username)" class="bi bi-heart" :data-like-icon-for="message.messageID"></i>
                </button>
                <button v-if="!user.authenticated" class="btn btn-lg">
                    <i class="bi bi-heart-fill"></i>
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
        addLinkToTaggedUsers : methodsFunctions.addLinkToTaggedUsers,
        copyMessageUrlToClipboard : methodsFunctions.copyMessageUrlToClipboard,
        openProfile : methodsFunctions.openProfile
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
                <message-container :user="user" :messages="messages"></message-container>
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
        `<div v-if="user.authenticated && user.followedUsers.length === 0 && (currentView === '/feed' || currentView === '/feed/' || currentView === '/' || currentView === '')"  v-cloak>
            <hr>
            <article>
                <p>Start following users to personalize your feed!</p>
            </article>
            <div v-if="messages.length > 0">
                <p>Here are some random <em>Woofs</em> to get you started: </p>
                <message-container :user="user" :messages="messages"></message-container>
            </div>
        </div>`,
    computed: {
        currentView : computedFunctions.currentView
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
            <article class="profile-preview-search col pointerOnHover" v-for="foundUser in searchUserResults" @click="openProfile(foundUser.username)">
                <div class="row row-cols-2 text-start align-self-start font-l">
                    <div class="col mx-1 pfp-preview">
                        <img class="pointerOnHover" :src="'https://api.dicebear.com/5.x/bottts-neutral/svg?radius=5&seed='.concat(foundUser.username)" />
                    </div>
                    <div class="col row row-cols-1 flex-grow-1">
                        <span class="col"> 
                            <a class="link-no-underline text-bg-dark">{{foundUser.firstName}} {{foundUser.lastName}}</a>
                        </span>
                        <span class="col px-3">
                           <a class="fw-bold local-primary-text link-no-underline"> @{{foundUser.username}} </a>
                        </span>
                    </div>
                </div>
                <p class="px-4 py-1 font-m">
                    {{foundUser.bio}}
                </p>
            </article>
        </div>`,
    methods: {
        toggleFollow : methodsFunctions.toggleFollow,
        openProfile : methodsFunctions.openProfile
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
                            <span v-if="!userFollowers.includes(user.username)"><i class="bi bi-person-plus-fill"></i> FOLLOW</span>
                            <span v-if="userFollowers.includes(user.username)"><i class="bi bi-person-check-fill"></i> FOLLOWING</span>
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
        currentPath(newValue, oldValue) {
            /* Why does this piece of code even exist? 
                ... To solve the following problem: 
                    - view single message
                    - click username to go to profile
                    - currentPath changed, showProfileOf DOESNT
                    - no fetching for updated info => inconsistency */
            if(oldValue.includes('/user/') && newValue.includes('/user/') && !newValue.includes('/msg/')) {
                this.profileReady = false;
                if(this.showProfileOf !== '') {
                    this.getProfileData();
                }
            }
        },
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
        getSingleMessage : methodsFunctions.getSingleMessage
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