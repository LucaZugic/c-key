import Foundation
import CryptoKit

public enum CorosRegion {
    case eu
    case global

    var baseURL: String {
        switch self {
        case .eu: return "https://teameuapi.coros.com"
        case .global: return "https://teamapi.coros.com"
        }
    }
}

public struct CorosTrainingHubClient {
    private let region: CorosRegion
    private let session: URLSession

    public init(region: CorosRegion, session: URLSession = .shared) {
        self.region = region
        self.session = session
    }

    public func authenticate(email: String, password: String) async throws -> String {
        let url = URL(string: "\(region.baseURL)/account/login")!

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let hashedPassword = md5Hash(password)
        // accountType 2 = email login (vs phone number)
        let body: [String: Any] = [
            "account": email,
            "accountType": 2,
            "pwd": hashedPassword
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw CorosError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw CorosError.authenticationFailed(statusCode: httpResponse.statusCode)
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let dataDict = json?["data"] as? [String: Any],
              let accessToken = dataDict["accessToken"] as? String else {
            throw CorosError.missingAccessToken
        }

        return accessToken
    }

    public func fetchActivities(accessToken: String, limit: Int = 30) async throws -> [CorosActivity] {
        let url = URL(string: "\(region.baseURL)/activity/query")!

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(accessToken, forHTTPHeaderField: "accessToken")

        // Get last 90 days of activities
        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -90, to: endDate)!
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyyMMdd"

        let body: [String: Any] = [
            "startDay": formatter.string(from: startDate),
            "endDay": formatter.string(from: endDate),
            "page": 1,
            "size": limit
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
            throw CorosError.requestFailed(statusCode: statusCode)
        }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let dataDict = json["data"] as? [String: Any],
              let activityList = dataDict["dataList"] as? [[String: Any]] else {
            return []
        }

        return activityList.compactMap { item -> CorosActivity? in
            guard let labelId = item["labelId"] as? Int64,
                  let name = item["name"] as? String,
                  let sportType = item["sportType"] as? Int,
                  let startTimestamp = item["startTime"] as? Int else {
                return nil
            }

            return CorosActivity(
                id: labelId,
                name: name,
                sportType: sportType,
                sportName: item["sportTypeName"] as? String ?? "Unknown",
                startTime: Date(timeIntervalSince1970: Double(startTimestamp)),
                distance: item["distance"] as? Double ?? 0,
                duration: item["totalTime"] as? Int ?? 0,
                gearId: item["gearId"] as? String // Try to extract if present
            )
        }
    }

    /// Fetch raw activity detail JSON for diagnostic purposes
    public func fetchActivityDetailRaw(accessToken: String, activityId: Int64, sportType: Int) async throws -> String {
        let url = URL(string: "\(region.baseURL)/activity/detail/query")!

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(accessToken, forHTTPHeaderField: "accessToken")

        let body: [String: Any] = [
            "labelId": "\(activityId)",
            "sportType": sportType
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
            throw CorosError.requestFailed(statusCode: statusCode)
        }

        return String(data: data, encoding: .utf8) ?? ""
    }

    private func md5Hash(_ string: String) -> String {
        let data = Data(string.utf8)
        let hash = Insecure.MD5.hash(data: data)
        return hash.map { String(format: "%02x", $0) }.joined()
    }
}

public enum CorosError: Error {
    case invalidResponse
    case authenticationFailed(statusCode: Int)
    case missingAccessToken
    case requestFailed(statusCode: Int)
}

public struct CorosActivity: Identifiable {
    public let id: Int64
    public let name: String
    public let sportType: Int
    public let sportName: String
    public let startTime: Date
    public let distance: Double // meters
    public let duration: Int // seconds
    public let gearId: String? // May be nil if not exposed by API
}
