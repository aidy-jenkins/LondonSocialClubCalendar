class Index {
    constructor() {
        this._subscribeButton = document.getElementById("subscribe");
        this._subscribeButton.addEventListener("click", e => this.subscribe());
    }
    async subscribe() {
        try {
            let token = window.__lscgoogleauthcredential;
            if (!token) {
                alert("Not signed in");
                return;
            }
            await gapi.client.load("calendar", "v3");
            await gapi.client.calendar.calendarList.insert({
                oauth_token: token,
                requestBody: {
                    id: Index.lscCalendarId
                }
            });
            // await google.calendar("v3").calendarList.insert({ 
            //     oauth_token: token,
            //     requestBody: {
            //         id: Index.lscCalendarId
            //     }
            // });
        }
        catch (err) {
            console.error(err);
            alert("failed");
        }
    }
}
Index.lscCalendarId = "b3v3l43gdk3fg4hdfsqbashiec@group.calendar.google.com";
Index.clientId = "282443687780-1seonvl8cfhvrd4mg13inlgld6pa4i8d.apps.googleusercontent.com";
setTimeout(() => new Index(), 0);
//# sourceMappingURL=index.js.map