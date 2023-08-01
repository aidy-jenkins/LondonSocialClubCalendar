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

    async getWeeksPosts(date?: Date) {
        let events = await this.getWeeksEvents(date);
        return events.items.map(event => ({ eventId: event.id, description: event.description }));
    }

    private async getWeeksEvents(date?: Date) {
        date ??= new Date();
        date.setHours(0, 0, 0, 0);

        let endDate = new Date(date);
        endDate.setDate(date.getDate() + 7);

        //TODO: Cache the week's events to reduce queries for new events
        let events = await this.calendarApi.events.list({
            calendarId: this.calendarId,
            timeMin: EventManager.dateTimeIso(date),
            timeMax: EventManager.dateTimeIso(endDate)
        })
        .then(response => response.data);

        return events;
    }

    async publishEvent(calendarEvent: CalendarEvent) {

        if(await this.eventExists(calendarEvent))
            return; //Already exists - do nothing -- TODO: update event description if changed etc.

        let { start, end } = EventManager.getDateOfEvent(calendarEvent);

        [start, end] = [start, end].map(EventManager.dateOnlyIso);

        await this.calendarApi.events.insert({
            calendarId: this.calendarId,
            requestBody: {
                summary: calendarEvent.title,
                location: calendarEvent.location,
                description: calendarEvent.description,

                //Setting start and end 'date' field instead of 'datetime' marks event as "all-day event"
                start: {
                    date: start
                },
                end: {
                    date: end
                }
            }
        });
    }

    async deleteEvent(eventId: string) {
        await this.calendarApi.events.delete({
            calendarId: this.calendarId,
            eventId
        });
    }

    private static dateOnlyIso(isoDate: string) {
        let date = new Date(Date.parse(isoDate));
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    private static dateTimeIso(date: Date) {
        return JSON.parse(JSON.stringify(date));
    }

    private static getDateOfEvent(event: CalendarEvent, startOffset = 0, endOffset = 0) {
        let dateStart = new Date(event.date); //copy to avoid mutation
        let dateEnd = new Date(dateStart);
        dateEnd.setDate(dateEnd.getDate() + 1);
        
        dateStart.setHours(startOffset, 0, 0, 0);
        dateEnd.setHours(endOffset, 0, 0, 0);
    
        return { start: this.dateTimeIso(dateStart), end: this.dateTimeIso(dateEnd) };
    }
}

export interface CalendarEvent {
    date: Date;
    title: string;
    location?: string;
    description: string;
}