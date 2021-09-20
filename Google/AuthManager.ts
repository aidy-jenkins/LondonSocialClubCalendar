import { google } from "googleapis"

export module AuthManager {
    export const getAuth = (keyFile: string, scopes: string | string[]) => new google.auth.GoogleAuth({keyFile, scopes});
}