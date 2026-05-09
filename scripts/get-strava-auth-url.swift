#!/usr/bin/env swift

import Foundation

guard let clientId = ProcessInfo.processInfo.environment["STRAVA_CLIENT_ID"] else {
    print("Error: STRAVA_CLIENT_ID not set")
    exit(1)
}

var components = URLComponents(string: "https://www.strava.com/oauth/authorize")!
components.queryItems = [
    URLQueryItem(name: "client_id", value: clientId),
    URLQueryItem(name: "redirect_uri", value: "http://localhost"),
    URLQueryItem(name: "response_type", value: "code"),
    URLQueryItem(name: "scope", value: "activity:read_all,activity:write")
]

print("Visit this URL in your browser:")
print(components.url!.absoluteString)
print("")
print("After authorizing, you'll be redirected to localhost (which won't load).")
print("Copy the 'code' parameter from the URL, e.g.:")
print("http://localhost/?state=&code=XXXXX&scope=read,activity:read_all,activity:write")
print("")
print("Then export it:")
print("export STRAVA_AUTH_CODE=\"XXXXX\"")
