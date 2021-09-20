import { FileSystem } from "./FileSystem";
import { AuthManager } from "./Google/AuthManager";
import { EventManager } from "./Google/EventManager";
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
    
    const { Timezone, Google: GoogleConfig, Reddit: RedditConfig } = JSON.parse(await FileSystem.readFile("config.json")) as Config;

    process.env.TZ = Timezone;

    const googleAuth = AuthManager.getAuth(GoogleConfig.AuthFile, GoogleConfig.Scopes); //key deliberately not in source control

    const eventManager = new EventManager(googleAuth, GoogleConfig.CalendarId);

    const snoowrap = new Snoowrap({
        clientId: RedditConfig.ClientId,
        clientSecret: RedditConfig.ClientSecret,
        userAgent: RedditConfig.UserAgent,
        username: RedditConfig.Username,
        password: RedditConfig.Password
    });

    let posts = await snoowrap.getNew("londonsocialclub", { limit: 100 });

    let count = 0;

    await Promise.allSettled(posts.map(async post => {
        try {
            await eventManager.publishEvent({
                description: post.selftext,
                link: `https://reddit.com${post.permalink}`,
                title: post.title,
                user: post.author.name
            });
            
            console.log(`Processed ${++count} events`);
        }
        catch(err) {
            console.error(err);
        }
    }));

})();

let timeoutHandle = setTimeout(() => process.exit(1), 60000); //Ensure process doesn't exit until timeout is reached or finished processing

run.then(() => process.exit(0), err => { console.error(err); process.exit(1); });