declare module gapi.client {
    var calendar: any;
}

class Index {
    private _subscribeButton = document.getElementById("subscribe");
    private static readonly lscCalendarId = "b3v3l43gdk3fg4hdfsqbashiec@group.calendar.google.com";
    private static readonly clientId = "282443687780-1seonvl8cfhvrd4mg13inlgld6pa4i8d.apps.googleusercontent.com";

    constructor() {
        this._subscribeButton.addEventListener("click", e => this.subscribe());
    }

    private async subscribe() {
        try {
            let token = (window as any).__lscgoogleauthcredential as string

            if(!token) {
                alert("Not signed in");
                return;
            }

            await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
                method: "POST",
                body: JSON.stringify({
                    id: Index.lscCalendarId
                }),
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // await gapi.client.load("calendar", "v3");
            // gapi.client.setToken({access_token: token});
            // await gapi.client.calendar.calendarList.insert({ 
            //     id: Index.lscCalendarId
            // });
            // await google.calendar("v3").calendarList.insert({ 
            //     oauth_token: token,
            //     requestBody: {
            //         id: Index.lscCalendarId
            //     }
            // });
        }
        catch(err) {
            console.error(err);
            alert("failed");
        }
    }
}

setTimeout(() => new Index(), 0);