import { calendar_v3, google } from "googleapis";
import { GoogleAuth } from "googleapis-common";


export class EventManager {
    private calendarApi: calendar_v3.Calendar;

    constructor(
        private auth: GoogleAuth,
        private calendarId: string
    ) {
        this.calendarApi = google.calendar({
            version: "v3",
            auth,
        });
     }

    async eventExists(event: CalendarEvent) {
        const events = await this.searchEventDate(event);        

        return events.items.some(calEvent => calEvent.summary === event.title);
    }

    /** Cached event lists so that we can query Google Calendar API once per date to avoid rate limiting */
    private _eventCache = Object.create(null) as { [key: string]: Promise<calendar_v3.Schema$Events> };

    private async searchEventDate(event: CalendarEvent) {
        let {start, end} = EventManager.getDateOfEvent(event, -1, 1);

        let key = `${this.calendarId};${start};${end}`;

        let events = await (this._eventCache[key] ?? (this._eventCache[key] = this.calendarApi.events.list({
            calendarId: this.calendarId, 

            timeMin: start, 
            timeMax: end
        })
        .then(response => response.data)));

        return events;
    }

    async publishEvent(calendarEvent: CalendarEvent) {

        if(await this.eventExists(calendarEvent))
            return; //Already exists - do nothing -- TODO: update event description if changed etc.

        let { start: date } = EventManager.getDateOfEvent(calendarEvent);

        date = EventManager.dateOnlyIso(date);

        await this.calendarApi.events.insert({
            calendarId: this.calendarId,
            requestBody: {
                summary: calendarEvent.title,
                location: calendarEvent.location,
                description: calendarEvent.description,

                //Setting start and end 'date' field instead of 'datetime' and setting them to be the same marks event as "all-day event"
                start: {
                    date
                },
                end: {
                    date
                }
            }
        });
    }

    private static dateOnlyIso(isoDate: string) {
        let date = new Date(Date.parse(isoDate));
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }

    private static getDateOfEvent(event: CalendarEvent, startOffset = 0, endOffset = 0) {
        let dateStart = new Date(event.date); //copy to avoid mutation
        let dateEnd = new Date(dateStart);
        dateEnd.setDate(dateEnd.getDate() + 1);
        
        dateStart.setHours(startOffset, 0, 0, 0);
        dateEnd.setHours(endOffset, 0, 0, 0);
    
        return { start: JSON.parse(JSON.stringify(dateStart)), end: JSON.parse(JSON.stringify(dateEnd)) };
    }
}

export interface CalendarEvent {
    date: Date;
    title: string;
    location?: string;
    description: string;
}