import { FileSystem } from "./FileSystem";
import { AuthManager } from "./Google/AuthManager";
import { EventManager } from "./Google/EventManager";
import { linq } from "linq-fast";
import * as Snoowrap from "snoowrap";
import { EventAdapter, LscEvent } from "./EventAdapter";

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

const batchSize = 25;
const numEventsToAdd = 25;
const timeBetweenBatches_ms = 5000;

const handleNewEvents = async (snoowrap: Snoowrap, eventManager: EventManager) => {
    let posts = await snoowrap.getNew("londonsocialclub", { limit: numEventsToAdd });
    let count = 0;
    let processQueue = linq(posts);

    while(count < posts.length) {
        let batch = processQueue.skip(count).take(batchSize)
        .select(post => ({
            description: post.selftext,
            link: `https://reddit.com${post.permalink}`,
            title: post.title,
            user: post.author.name
        } as LscEvent))
        .select(async lscEvent => {
            try {
                let calendarEvent = EventAdapter.mapLscEventToCalendarEvent(lscEvent);

                await eventManager.publishEvent(calendarEvent);
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
};

const getDetailsFromDescription = (description: string) => {
    //posts should look like https://reddit.com/r/londonsocialclub/comments/{submissionId}/.....

    let startMarker = description.indexOf("/comments/") + "/comments/".length;
    let endMarker = description.indexOf('/', startMarker);
    
    return { postDetail: description.substring(0, description.indexOf('\n')), submissionId: description.substring(startMarker, endMarker) };
} 

const deleteRemovedEvents = async (snoowrap: Snoowrap, eventManager: EventManager) => {
    let posts = linq(await eventManager.getWeeksPosts());
    
    posts = posts.take(10); //Let's keep this low so Reddit doesn't come after my wallet
    
    let submissions = posts.select(({eventId, description}) => ({ eventId, ...getDetailsFromDescription(description) }));
    for (let {eventId, postDetail, submissionId } of submissions) {
        let removal = (await snoowrap.getSubmission(submissionId).removed_by_category)?.toString() ?? "";
        if(removal === "")
            continue;
    
        console.log(`Post was removed: ${postDetail} with reason: ${removal}\n\nRemoving from calendar...`);
        try {
            await eventManager.deleteEvent(eventId);
            console.log(`Deleted submission with id ${submissionId} and calendar event id ${eventId}`);
        }
        catch(err) {
            console.error(`Failed to delete submission with id ${submissionId} and calendar event id ${eventId} because of error ${err}`);
        }
    }
};

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
    
    await deleteRemovedEvents(snoowrap, eventManager);

    await new Promise(r => setTimeout(r, 500));

    await handleNewEvents(snoowrap, eventManager);    
})();

let timeoutHandle = setTimeout(() => process.exit(1), 60000); //Ensure process doesn't exit until timeout is reached or finished processing

run.then(() => process.exit(0), err => { console.error(err); process.exit(1); });
