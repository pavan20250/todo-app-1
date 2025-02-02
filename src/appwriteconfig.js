import { Client, Databases } from 'appwrite';


export const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
export const PROJECT_ID = "679f460b001cb5d392bd";

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT) 
    .setProject(PROJECT_ID);

const databases = new Databases(client);

export { databases };
