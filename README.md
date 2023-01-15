# WUPHF.com - The place to _bark_ your thoughts

## Somewhat useful informations
- It's a Twitter rip-off, with less features and no cookie banners
- Built with [Express](https://expressjs.com/) (Node), [Vue.js](https://vuejs.org/), [Bootstrap](https://getbootstrap.com/) and [MongoDB](https://www.mongodb.com/)
- `docker-compose` ready to go
- Yes, it's a [The Office](https://theoffice.fandom.com/wiki/WUPHF.com_(Website)) reference

## How to
- With docker-compose:
    1. `git clone`
    2. `cd ./wuphf-social-network`
    3. `docker-compose up`
- Without Docker (requires Mongo installed and running locally):
    1. `git clone`
    2. `cd ./wuphf-social-network/app`
    3. `npm install`
    4. `node app.js`
    5. Make sure `MONGODB_URI` from `settings.env` is configured accordingly

## Docker
- You should probably change username and password for mongoDB root user (`docker-compose.yml`)
```
    environment:
        - MONGO_INITDB_ROOT_USERNAME=FramedEmeraldItem
        - MONGO_INITDB_ROOT_PASSWORD=ShineBrightLike4Diamond
```
- Make sure that the exposed port in `Dockerfile` matches the ones in `docker-compose.yml`

## Settings
- File `./app/private/settings.env` contains a couple parameters you should change
    - `MONGODB_URI`: has to match the `username:password` of the MongoDB container in `docker-compose.yml`
        - for more information visit [MongoDB official documentation](https://www.mongodb.com/compatibility/docker#using-mongodb-with-docker-compose)
    - `JWT_SECRET_KEY`: secret cryptographic key used by the [jsonwebtoken library](https://www.npmjs.com/package/jsonwebtoken)
    - `PORT`: has to match `app` ports in `docker-compose.yml` and `Dockerfile`. By default the app will listen to port 8080.
    - `BCRYPT_ROUNDS_FOR_SALT`: number of rounds to create the salt for user's password hashing; for more information see [bcryptjs documentation](https://www.npmjs.com/package/bcryptjs)

## Special thanks
![Thank you JS console.log and CSS borders](./app/public/imgs/special-thanks.jpg)