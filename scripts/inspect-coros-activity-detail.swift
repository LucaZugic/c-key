#!/usr/bin/env swift

import Foundation
import CryptoKit

guard let email = ProcessInfo.processInfo.environment["COROS_EMAIL"],
      let password = ProcessInfo.processInfo.environment["COROS_PASSWORD"] else {
    print("Error: Set COROS_EMAIL and COROS_PASSWORD")
    exit(1)
}

func md5Hash(_ string: String) -> String {
    let data = Data(string.utf8)
    let hash = Insecure.MD5.hash(data: data)
    return hash.map { String(format: "%02x", $0) }.joined()
}

let baseURL = "https://teameuapi.coros.com"
let semaphore = DispatchSemaphore(value: 0)
var accessToken: String?
var userId: String?

// Step 1: Authenticate
print("Authenticating...")
let loginURL = URL(string: "\(baseURL)/account/login")!
var loginRequest = URLRequest(url: loginURL)
loginRequest.httpMethod = "POST"
loginRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

let loginBody: [String: Any] = [
    "account": email,
    "accountType": 2,
    "pwd": md5Hash(password)
]
loginRequest.httpBody = try! JSONSerialization.data(withJSONObject: loginBody)

URLSession.shared.dataTask(with: loginRequest) { data, response, error in
    defer { semaphore.signal() }

    guard let data = data,
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let dataDict = json["data"] as? [String: Any],
          let token = dataDict["accessToken"] as? String,
          let uid = dataDict["userId"] as? String else {
        print("Login failed")
        if let data = data, let str = String(data: data, encoding: .utf8) {
            print("Response: \(str)")
        }
        return
    }
    accessToken = token
    userId = uid
    print("Authenticated successfully (userId: \(uid))")
}.resume()

semaphore.wait()

guard let token = accessToken, let uid = userId else {
    print("No token/userId obtained")
    exit(1)
}

// Step 2: Fetch activities list (GET with query params)
print("\nFetching activities...")

let formatter = DateFormatter()
formatter.dateFormat = "yyyyMMdd"
let endDate = Date()
let startDate = Calendar.current.date(byAdding: .day, value: -90, to: endDate)!

var components = URLComponents(string: "\(baseURL)/activity/query")!
components.queryItems = [
    URLQueryItem(name: "size", value: "5"),
    URLQueryItem(name: "pageNumber", value: "1"),
    URLQueryItem(name: "startDay", value: formatter.string(from: startDate)),
    URLQueryItem(name: "endDay", value: formatter.string(from: endDate))
]

var activitiesRequest = URLRequest(url: components.url!)
activitiesRequest.httpMethod = "GET"
activitiesRequest.setValue(token, forHTTPHeaderField: "accessToken")
activitiesRequest.setValue("{\"userId\":\"\(uid)\"}", forHTTPHeaderField: "yfheader")

var firstActivity: (labelId: String, sportType: Int)?

URLSession.shared.dataTask(with: activitiesRequest) { data, response, error in
    defer { semaphore.signal() }

    guard let data = data,
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        print("Failed to fetch activities")
        return
    }

    print("\n=== ACTIVITY LIST RESPONSE ===")
    if let prettyData = try? JSONSerialization.data(withJSONObject: json, options: .prettyPrinted),
       let prettyString = String(data: prettyData, encoding: .utf8) {
        print(prettyString.prefix(4000))
    }

    // Extract first activity for detail query
    if let dataDict = json["data"] as? [String: Any],
       let dataList = dataDict["dataList"] as? [[String: Any]],
       let first = dataList.first,
       let labelId = first["labelId"] as? String,
       let sportType = first["sportType"] as? Int {
        firstActivity = (labelId, sportType)
        print("\n\nFirst activity: labelId=\(labelId), sportType=\(sportType)")
    } else if let dataDict = json["data"] as? [String: Any],
              let dataList = dataDict["dataList"] as? [[String: Any]],
              let first = dataList.first {
        // Try other type combinations
        let labelId = first["labelId"]
        let sportType = first["sportType"]
        print("\nFirst activity raw: labelId=\(String(describing: labelId)) (\(type(of: labelId))), sportType=\(String(describing: sportType)) (\(type(of: sportType)))")
        if let lid = labelId as? Int64, let st = sportType as? Int {
            firstActivity = ("\(lid)", st)
        } else if let lid = labelId as? Int, let st = sportType as? Int {
            firstActivity = ("\(lid)", st)
        }
    }
}.resume()

semaphore.wait()

// Step 3: Fetch activity detail
guard let activity = firstActivity else {
    print("\nNo activities found to inspect")
    exit(0)
}

print("\n\nFetching activity detail for labelId=\(activity.labelId), sportType=\(activity.sportType)...")

var detailComponents = URLComponents(string: "\(baseURL)/activity/detail/query")!
detailComponents.queryItems = [
    URLQueryItem(name: "labelId", value: activity.labelId),
    URLQueryItem(name: "sportType", value: "\(activity.sportType)")
]

var detailRequest = URLRequest(url: detailComponents.url!)
detailRequest.httpMethod = "POST"
detailRequest.setValue(token, forHTTPHeaderField: "accessToken")
detailRequest.setValue("{\"userId\":\"\(uid)\"}", forHTTPHeaderField: "yfheader")

URLSession.shared.dataTask(with: detailRequest) { data, response, error in
    defer { semaphore.signal() }

    guard let data = data else {
        print("Failed to fetch detail")
        return
    }

    let rawString = String(data: data, encoding: .utf8) ?? ""

    print("\n=== RAW ACTIVITY DETAIL (first 6000 chars) ===")
    print(rawString.prefix(6000))

    // Search for gear-related keywords
    print("\n\n=== SEARCHING FOR GEAR KEYWORDS ===")
    let keywords = ["gear", "shoe", "equipment", "device", "bike", "sportDevice", "gearId", "deviceList", "deviceId", "deviceName"]
    for keyword in keywords {
        if rawString.lowercased().contains(keyword.lowercased()) {
            print("✓ Found: '\(keyword)'")
            // Try to find context around the keyword
            if let range = rawString.lowercased().range(of: keyword.lowercased()) {
                let start = rawString.index(range.lowerBound, offsetBy: -30, limitedBy: rawString.startIndex) ?? rawString.startIndex
                let end = rawString.index(range.upperBound, offsetBy: 80, limitedBy: rawString.endIndex) ?? rawString.endIndex
                print("   Context: ...\(rawString[start..<end])...")
            }
        } else {
            print("✗ Not found: '\(keyword)'")
        }
    }
}.resume()

semaphore.wait()
print("\nDone.")
