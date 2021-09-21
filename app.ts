import { FileSystem } from "./FileSystem";
import { AuthManager } from "./Google/AuthManager";
import { EventManager } from "./Google/EventManager";
import { linq } from "linq-fast";
import * as Snoowrap from "snoowrap";

/**
 * Describes the expected JSON structure of a config.json file that is required for this process to run
 */
interface Config {

    Timezone: string; 
    Google: {
        CalendarId: string;
        AuthFile: string;
        Scopes: string | string[];
    },
    Reddit: {
        ClientId: string;
        ClientSecret: string;
        UserAgent: string;
        Username: string;
        Password: string;
    }
}

let run = (async () => {
    
    const config = JSON.parse(process.env.CONFIG ?? await FileSystem.readFile("config.json")) as Config;
    const authKey = process.env.AUTHKEY;
    
    const { Timezone, Google: GoogleConfig, Reddit: RedditConfig } = config;
    
    process.env.TZ = Timezone;
    
    if(authKey) //If running in pipeline, write key file so it can be passed to Google client lib
        await FileSystem.writeFile(GoogleConfig.AuthFile, authKey);

    const googleAuth = AuthManager.getAuth(GoogleConfig.AuthFile, GoogleConfig.Scopes); //key deliberately not in source control

    const eventManager = new EventManager(googleAuth, GoogleConfig.CalendarId);

    const snoowrap = new Snoowrap({
        clientId: RedditConfig.ClientId,
        clientSecret: RedditConfig.ClientSecret,
        userAgent: RedditConfig.UserAgent,
        username: RedditConfig.Username,
        password: RedditConfig.Password
    });

    let posts = await snoowrap.getNew("londonsocialclub", { limit: 25 });

    let count = 0;

    let processQueue = linq(posts);

    const batchSize = 25;
    const timeBetweenBatches_ms = 5000;

    while(count < posts.length) {
        let batch = processQueue.skip(count).take(batchSize).select(async post => {
            try {
                await eventManager.publishEvent({
                    description: post.selftext,
                    link: `https://reddit.com${post.permalink}`,
                    title: post.title,
                    user: post.author.name
                });
            }
            catch(err) {
                console.error(err);
            }
            finally {
                console.log(`Processed ${++count} events`);
            }
        });

        await Promise.allSettled(batch.toArray());

        if(count < posts.length) //don't wait if single/final iteration
            await new Promise(r => setTimeout(r, timeBetweenBatches_ms));
    }
})();

let timeoutHandle = setTimeout(() => process.exit(1), 60000); //Ensure process doesn't exit until timeout is reached or finished processing

run.then(() => process.exit(0), err => { console.error(err); process.exit(1); });
