class Index {
    constructor() {
        this._subscribeButton = document.getElementById("subscribe");
        this._loginButton = document.getElementsByClassName("g_id_signin")[0];
        this._apiClient = null;
        this._token = null;
        this._subscribeButton.addEventListener("click", e => this.subscribe());
        this._apiClient = google.accounts.oauth2.initTokenClient({
            client_id: Index.clientId,
            scope: 'https://www.googleapis.com/auth/calendar',
            callback: (tokenResponse) => { this._token = tokenResponse.access_token; },
        });
    }
    async login() {
        //This triggers the callback of the init method - makes perfect sense
        this._apiClient.requestAccessToken();
    }
    async subscribe() {
        try {
            let token = this._token;
            if (!token) {
                alert("Not signed in");
                return;
            }
            let response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
                method: "POST",
                body: JSON.stringify({
                    id: Index.lscCalendarId
                }),
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if (response.status < 200 || response.status >= 300)
                throw new TypeError(`Request failed\r\n${response.status} - ${response.statusText}\r\n`);
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