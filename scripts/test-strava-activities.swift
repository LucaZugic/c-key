#!/usr/bin/env swift

import Foundation

guard let accessToken = ProcessInfo.processInfo.environment["STRAVA_ACCESS_TOKEN"] else {
    print("Error: STRAVA_ACCESS_TOKEN not set")
    exit(1)
}

print("Using access token: \(accessToken.prefix(20))...")

let url = URL(string: "https://www.strava.com/api/v3/athlete/activities?per_page=5")!
var request = URLRequest(url: url)
request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

print("Request URL: \(url)")
print("Authorization header set")

let semaphore = DispatchSemaphore(value: 0)

URLSession.shared.dataTask(with: request) { data, response, error in
    defer { semaphore.signal() }

    if let error = error {
        print("Network error: \(error)")
        return
    }

    guard let httpResponse = response as? HTTPURLResponse else {
        print("Invalid response type")
        return
    }

    print("Status code: \(httpResponse.statusCode)")
    print("Headers: \(httpResponse.allHeaderFields)")

    if let data = data, let body = String(data: data, encoding: .utf8) {
        print("Response body: \(body.prefix(500))")
    }
}.resume()

semaphore.wait()
