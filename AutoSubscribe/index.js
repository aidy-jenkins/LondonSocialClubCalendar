var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Index {
    constructor() {
        this._subscribeButton = document.getElementById("subscribe");
        this._loginButton = document.getElementById("loginButton");
        this._status = document.getElementById("status");
        this._apiClient = null;
        this._token = null;
        this._subscribeButton.addEventListener("click", e => this.subscribe());
        this._loginButton.addEventListener("click", e => this.login());
        this._apiClient = google.accounts.oauth2.initTokenClient({
            client_id: Index.clientId,
            scope: 'https://www.googleapis.com/auth/calendar',
            callback: (tokenResponse) => { this._token = tokenResponse.access_token; },
        });
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            //This triggers the callback of the init method - makes perfect sense
            this._apiClient.requestAccessToken();
        });
    }
    subscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let token = this._token;
                if (!token) {
                    alert("Not signed in");
                    return;
                }
                let response = yield fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
                    method: "POST",
                    body: JSON.stringify({
                        id: Index.lscCalendarId,
                        selected: true
                    }),
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                if (response.status < 200 || response.status >= 300)
                    throw new TypeError(`Request failed\r\n${response.status} - ${response.statusText}\r\n`);
                this._status.textContent = "Calendar successfully added or already subscribed";
            }
            catch (err) {
                console.error(err);
                alert("failed");
            }
        });
    }
}
Index.lscCalendarId = "b3v3l43gdk3fg4hdfsqbashiec@group.calendar.google.com";
Index.clientId = "282443687780-1seonvl8cfhvrd4mg13inlgld6pa4i8d.apps.googleusercontent.com";
setTimeout(() => new Index(), 0);
//# sourceMappingURL=index.js.map