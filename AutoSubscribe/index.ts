declare var google: any;

class Index {
    private static readonly lscCalendarId = "b3v3l43gdk3fg4hdfsqbashiec@group.calendar.google.com";
    private static readonly clientId = "282443687780-1seonvl8cfhvrd4mg13inlgld6pa4i8d.apps.googleusercontent.com";
    
    private _subscribeButton = document.getElementById("subscribe") as HTMLButtonElement;
    private _loginButton = document.getElementById("loginButton") as HTMLButtonElement;
    private _status = document.getElementById("status") as HTMLParagraphElement;
    private _calendarName = document.getElementById("calendarName") as HTMLSpanElement;

    private _apiClient = null as any;
    private _token = null as string;
    private _queryParams = null as { [key: string]: string; };
    private get queryParams() {
        return this._queryParams ?? (this._queryParams = this.getQueryParams());
    }

    constructor() {
        this._subscribeButton.addEventListener("click", e => this.subscribe());
        this._loginButton.addEventListener("click", e => this.login());

        if(!this.queryParams.calendarid) {
            this._calendarName.textContent = "LSC";
        }

        this._apiClient = google.accounts.oauth2.initTokenClient({
            client_id: Index.clientId,
            scope: 'https://www.googleapis.com/auth/calendar',
            callback: (tokenResponse) => { this._token = tokenResponse.access_token },
        });
          
    }

    private async login() {
        //This triggers the callback of the init method - makes perfect sense
        this._apiClient.requestAccessToken();
    }

    private async subscribe() {
        try {
            let token = this._token;

            if(!token) {
                alert("Not signed in");
                return;
            }

            let calendarId = this.queryParams.calendarid;
            if(!calendarId)
                calendarId = Index.lscCalendarId;

            let response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
                method: "POST",
                body: JSON.stringify({
                    id: calendarId,
                    selected: true
                }),
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if(response.status < 200 || response.status >= 300)
                throw new TypeError(`Request failed\r\n${response.status} - ${response.statusText}\r\n`);

            this._status.textContent = "Calendar successfully added or already subscribed";
        }
        catch(err) {
            console.error(err);
            alert("failed");
        }
    }

    private getQueryParams() {
        return window.location.search.substring(1).split('&').map(x => x.split('=')).reduce((obj, [key, value]) => ({ [key]: value, ...obj}), {}) as {
            [key: string]: string;
        };
    }
}

setTimeout(() => new Index(), 200);
