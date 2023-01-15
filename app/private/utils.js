const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: './settings.env' });
const mongoManager = require("../mongodb-manager.js");

router.get("/mongo-loader", async (req, res) => {
    const mongo = mongoManager.getDB();
    const users = [
        {
            "username": "maurofari",
            "password": "panda84-sterlina",
            "firstName": "Mauro",
            "lastName": "Farina",
            "bio": "some say i created this very social network"
        },
        {
            "username": "terminator123",
            "password": "cane-gatto-topo",
            "firstName": "Luca",
            "lastName": "Toni",
            "bio": "my very informative bio"
        },
        {
            "username": "jack",
            "password": "elon-stole-my-social",
            "firstName": "Jack",
            "lastName": "Dorsey",
            "bio": "i created twitter now i use WUPHF.com"
        },
        {
            "username": "mario.rossi",
            "password": "buzz-lightyear752",
            "firstName": "Mario",
            "lastName": "Rossi",
            "bio": "L'esempio di ogni sito web italiano."
        },
        {
            "username": "elonmusk",
            "password": "twitter-is-not-even-that-better",
            "firstName": "Elon",
            "lastName": "Musk",
            "bio": "Maybe i will buy WUPHF.com as well"
        },
        {
            "username": "michaelscott",
            "password": "dunder-mufflin",
            "firstName": "Michael",
            "lastName": "Scott",
            "bio": "Best Boss at Dunder Mufflin, Scranton, PA"
        },
        {
            "username": "the-zuck",
            "password": "pwd-fb-forever",
            "firstName": "Mark",
            "lastName": "Zuckerberg",
            "bio": "I am a human and enjoy human activities and food"
        },
        {
            "username": "bill.gates",
            "password": "pwd-microsoft-gigahard",
            "firstName": "Bill",
            "lastName": "Gates",
            "bio": "I actually don't use Windows lol"
        },
        {
            "username": "we_are_number_one",
            "password": "pwd-music234",
            "firstName": "",
            "lastName": "",
            "bio": "Lazy Town vibes"
        },
        {
            "username": "Netflix",
            "password": "share-your-password",
            "firstName": "Netflix",
            "lastName": "",
            "bio": "Share your password! ( but it now comes with a fee xD )"
        }
    ];
    for(let u of users) {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS_FOR_SALT));
        hashedPassword = await bcrypt.hash(u.password, salt);
        const newUser = {
            username : u.username,
            password : hashedPassword,
            firstName : u.firstName,
            lastName : u.lastName,
            bio : u.bio,
            signUpDate : new Date()
        };
        await mongo.collection("users").insertOne(newUser);
        await mongo.collection("follows")
                .insertOne( { 
                    username : u.username,
                    followers : []
                } );
    }

    // MESSAGES

    const messages = [
        {
            username: "maurofari",
            userMessages: [
                {
                    "message" : "Hello world!",
                    "likes": ["jack", "elonmusk", "bill.gates", "Netflix", "the-zuck", "terminator123", "mario.rossi"]
                },
                {
                    "message" : "WUPHF.com stocks go brr",
                    "likes": ["jack", "bill.gates", "terminator123", "mario.rossi"]
                },
                {
                    "message" : "So no one told you life was gonna be this way *clap of hands*x4",
                    "likes": ["jack", "bill.gates", "Netflix", "the-zuck", "terminator123", "mario.rossi",]
                },
                {
                    "message" : "Front-end is easy they said, definitely won't make you lose your mind they said",
                    "likes": ["jack", "elonmusk", "bill.gates", "the-zuck"]
                },
                {
                    "message" : "what do you say @jack you liking this? less toxic than twitter for sure",
                    "likes": ["jack", "mario.rossi"]
                },
                {
                    "message" : "I don't even know if someone has the right for the domain 'WUPHF.com'",
                    "likes": ["terminator123", "mario.rossi"]
                },
                {
                    "message" : "@elonmusk i will sell you wuphf.com for 2 million dollars $$",
                    "likes": ["elonmusk", "bill.gates", "mario.rossi"]
                },
                {
                    "message" : "why are you getting so expensive @netflix?",
                    "likes": ["jack", "elonmusk", "bill.gates", "the-zuck", "terminator123", "mario.rossi"]
                }
            ]
        },
        {
            username: "jack",
            userMessages: [
                {
                    "message" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                    "likes": ["maurofari"]
                },
                {
                    "message" : "hey @maurofari good job here, looks quite good ngl",
                    "likes": ["bill.gates", "the-zuck", "maurofari"]
                },
                {
                    "message" : "Nothing puts a smile on my face like watching Twitter stocks fall as @elonmusk keeps running it",
                    "likes": ["bill.gates", "Netflix", "the-zuck", "terminator123", "mario.rossi", "maurofari"]
                }
            ]
        },
        {
            username: "michaelscott",
            userMessages: [
                {
                    "message" : "I. DECLARE. BANKRUPTCYYYY!!",
                    "likes": ["elonmusk", "bill.gates", "Netflix", "mario.rossi", "maurofari", "jack"]
                },
                {
                    "message" : "Why don't you explain it to me like i'm five?",
                    "likes": ["elonmusk", "Netflix", "the-zuck", "maurofari", "jack"]
                },
                {
                    "message" : "That's what she said!",
                    "likes": ["elonmusk", "bill.gates", "Netflix", "the-zuck", "terminator123", "mario.rossi", "maurofari", "jack"]
                },
                {
                    "message" : "I knew exactly what to do. But in a much more real sense, I had no idea what to do",
                    "likes": ["elonmusk", "Netflix", "the-zuck", "terminator123", "mario.rossi", "maurofari", "jack"]
                },
                {
                    "message" : "Sometimes I'll start a sentence, and I don't even know where it's going. I just hope I find it along the way",
                    "likes": ["Netflix", "the-zuck", "terminator123", "mario.rossi", "maurofari", "jack"]
                },
                {
                    "message" : "Wikipedia is the best thing ever. Anyone in the world can write anything they want about any subject. So you know you are getting the best possible information",
                    "likes": ["elonmusk", "bill.gates", "Netflix", "the-zuck", "terminator123", "mario.rossi", "maurofari", "jack"]
                },
                {
                    "message" : "I'm not superstitious but I am a little stitious",
                    "likes": ["elonmusk", "bill.gates", "Netflix", "the-zuck", "terminator123", "mario.rossi", "maurofari", "jack"]
                },
                {
                    "message" : "Do I need to be liked? Absolutely not. I like to be liked. I enjoy being liked. I have to be liked, but it's not like this compulsive need to be liked, like my need to be praised",
                    "likes" : ["terminator123", "mario.rossi", "maurofari"]
                },
                {
                    "message" : "There's no such thing as an appropriate joke. That's why it's called a joke",
                    "likes": ["elonmusk", "Netflix", ]
                },
                {
                    "message" : "I am running away from my responsibilities. And it feels good",
                    "likes": ["elonmusk", "Netflix", "terminator123"]
                },
                {
                    "message" : "I'm dead inside.",
                    "likes": ["Netflix", "the-zuck", "terminator123", "mario.rossi"]
                },
                {
                    "message" : "I don't hate it. I just don't like it at all and it's terrible",
                    "likes": ["elonmusk", "bill.gates", "Netflix", "mario.rossi", "maurofari"]
                },
                {
                    "message" : "When I discovered YouTube, I didn't work for five days",
                    "likes": ["elonmusk", "bill.gates", "Netflix", "the-zuck", "terminator123", "mario.rossi", "maurofari", "jack"]
                },
                {
                    "message" : "Would I rather be feared or loved? Easy. Both. I want people to be afraid of how much they love me",
                    "likes": ["elonmusk", "bill.gates", "Netflix", "the-zuck", "terminator123", "mario.rossi", "maurofari", "jack"]
                }
            ]
        },
        {
            username: "the-zuck",
            userMessages: [
                {
                    "message": "stop asking i am not a lizard man",
                    "likes": ["terminator123", "mario.rossi"]
                },
                {
                    "message": "Hey wuphers please remember to visit your FB profile every once in a while and accept the cookies thx",
                    "likes": []
                }
            ]
        },
        {
            username: "Netflix",
            userMessages: [
                {
                    "message": "Love is sharing your netflix password...",
                    "likes": ["elonmusk", "bill.gates", "Netflix", "the-zuck", "terminator123", "mario.rossi", "maurofari", "jack"]
                },
                {
                    "message": "SIKE now pwd sharing will cost you extra",
                    "likes": []
                },
                {
                    "message": "@maurofari nice social btw",
                    "likes": ["maurofari"]
                },
                {
                    "message": "Trying to think of ideas for tv series to drop after 1 season... we might be out of ideas, tags us and let us know thanks",
                    "likes": ["the-zuck", "terminator123"]
                }
            ]
        },
        {
            username: "elonmusk",
            userMessages: [
                {
                    "message": "i created PayPal, Tesla, SpaceX, OpenAI and now own Twitter... if only i could buy Mars.",
                    "likes": ["the-zuck", "terminator123", "mario.rossi", "maurofari"]
                },
                {
                    "message": "why is everyone moving from twitter to wuphf?? you cant even retweet or send dms @maurofari this is lame",
                    "likes": ["the-zuck"]
                },
                {
                    "message": "might buy the full stocks of wuphf, also i will rename it to woof",
                    "likes": ["the-zuck", "maurofari"]
                }
            ]
        }
    ];

    let lastMessage = await mongo.collection("messages").findOne({},{ sort: {messageID: -1}});
    let msgID = lastMessage !== null ? lastMessage.messageID+1 : 0;
    for(let item of messages) {
        let user = item.username;
        let msgsByUser = item.userMessages;
        for(let msg of msgsByUser) {
            let newMessage = {
                messageID : msgID,
                message : msg.message,
                username : user,
                date : new Date(),
                likedBy : msg.likes
            }
            await mongo.collection("messages").insertOne(newMessage);
            msgID++;
        }
    }



    // FOLLOWS
    const follows = [
        {
            username: "maurofari",
            followers: ["jack", "elonmusk", "the-zuck", "mario.rossi"]
        },
        {
            username: "jack",
            followers: ["maurofari", "the-zuck", "Netflix", "bill.gates"]
        },
        {
            username: "michaelscott",
            followers: ["jack", "elonmusk", "the-zuck", "maurofari", "Netflix", "terminator123", "mario.rossi"]
        },
        {
            username: "Netflix",
            followers: ["maurofari", "michaelscott", "the-zuck", "terminator123", "mario.rossi"]
        },
        {
            username: "bill.gates",
            followers: ["maurofari", "the-zuck", "Netflix", "jack", "mario.rossi"]
        },
        {
            username: "the-zuck",
            followers: ["Netflix", "jack", "mario.rossi", "bill.gates"]
        },
        {
            username: "elonmusk",
            followers: ["terminator123", "mario.rossi", "bill.gates"]
        },
        {
            username: "terminator123",
            followers: ["mario.rossi"]
        },
        {
            username: "mario.rossi",
            followers: ["terminator123"]
        }
    ]

    for(let f of follows) {
        for(let _follower of f.followers) {
            await mongo.collection("follows").updateOne( {username : f.username}, { $push: {followers: _follower} } );
        }
    }

    res.send("MongoDB has been loaded with some data");

});

module.exports = router;