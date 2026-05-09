#!/usr/bin/env swift

import Foundation

guard let clientId = ProcessInfo.processInfo.environment["STRAVA_CLIENT_ID"],
      let clientSecret = ProcessInfo.processInfo.environment["STRAVA_CLIENT_SECRET"],
      let refreshToken = ProcessInfo.processInfo.environment["STRAVA_REFRESH_TOKEN"] else {
    print("Error: Set STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_REFRESH_TOKEN")
    exit(1)
}

let url = URL(string: "https://www.strava.com/oauth/token")!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")

let body: [String: Any] = [
    "client_id": clientId,
    "client_secret": clientSecret,
    "refresh_token": refreshToken,
    "grant_type": "refresh_token"
]
request.httpBody = try! JSONSerialization.data(withJSONObject: body)

let semaphore = DispatchSemaphore(value: 0)

URLSession.shared.dataTask(with: request) { data, response, error in
    defer { semaphore.signal() }

    if let error = error {
        print("Error: \(error)")
        return
    }

    guard let data = data,
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        print("Invalid response")
        return
    }

    if let error = json["message"] as? String {
        print("Strava error: \(error)")
        return
    }

    guard let accessToken = json["access_token"] as? String,
          let newRefreshToken = json["refresh_token"] as? String,
          let expiresAt = json["expires_at"] as? Int else {
        print("Missing token fields in response:")
        print(json)
        return
    }

    print("Success! Update your environment:")
    print("")
    print("export STRAVA_ACCESS_TOKEN=\"\(accessToken)\"")
    print("export STRAVA_REFRESH_TOKEN=\"\(newRefreshToken)\"")
    print("")
    print("Token expires at: \(Date(timeIntervalSince1970: Double(expiresAt)))")
}.resume()

semaphore.wait()
