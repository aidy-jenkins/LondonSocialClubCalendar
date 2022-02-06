declare var google: any;

class Index {
    private static readonly lscCalendarId = "b3v3l43gdk3fg4hdfsqbashiec@group.calendar.google.com";
    private static readonly clientId = "282443687780-1seonvl8cfhvrd4mg13inlgld6pa4i8d.apps.googleusercontent.com";
    
    private _subscribeButton = document.getElementById("subscribe");
    private _loginButton = document.getElementById("loginButton");

    private _apiClient = null as any;
    private _token = null as string;

    constructor() {
        this._subscribeButton.addEventListener("click", e => this.subscribe());
        this._loginButton.addEventListener("click", e => this.login());

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
            if(response.status < 200 || response.status >= 300)
                throw new TypeError(`Request failed\r\n${response.status} - ${response.statusText}\r\n`);
        }
        catch(err) {
            console.error(err);
            alert("failed");
        }
    }
}

setTimeout(() => new Index(), 0);