import { CalendarEvent } from "./Google/EventManager";

export module EventAdapter {

    const LOCATION_RE = /@(.+)$/g;
    const DATE_RE = /\D?(\d+\D\d+\D\d+)[^\d ]?/g;

    export function mapLscEventToCalendarEvent(event: LscEvent) {
        let date: Date;
        let title: string;
        try {
            let [[datePart, dateStr]] = Array.from(event.title.matchAll(DATE_RE));
            let [day, month, year] = dateStr.split('/').map(x => parseInt(x));
            if([day, month, year].some(Number.isNaN))
                throw new TypeError(`Date could not be parsed ${dateStr} for event ${event.link}`);

            date = new Date(year < 100 ? 2000 + year : year, month - 1, day, 0, 0, 0, 0);
            title = event.title.trim().substr(datePart.length).trim();
        }
        catch(err) {
            throw new TypeError(`Event could not be parsed ${event.title}\nError: ${err}`);
        }

        let location = Array.from(event.title.matchAll(LOCATION_RE))?.[0]?.[1] ?? null;

        return {
            date,
            description: `Posted by ${event.user}: ${event.link}\n${event.description}`,
            title,
            location
        } as CalendarEvent;
    }   
}

export interface LscEvent {
    user: string;
    title: string;
    description: string;
    link: string;
}