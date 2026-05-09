import Foundation

public struct StravaConfig {
    public let clientId: String
    public let clientSecret: String
    public let redirectUri: String

    public init(clientId: String, clientSecret: String, redirectUri: String) {
        self.clientId = clientId
        self.clientSecret = clientSecret
        self.redirectUri = redirectUri
    }
}

public struct StravaTokens {
    public let accessToken: String
    public let refreshToken: String
    public let expiresAt: Date

    public var isExpired: Bool {
        Date() >= expiresAt
    }
}

public struct StravaActivity: Identifiable {
    public let id: Int64
    public let name: String
    public let sportType: String
    public let startDate: Date
    public let distance: Double
    public let movingTime: Int
    public let gearId: String?
}

public struct StravaClient {
    private let config: StravaConfig
    private let session: URLSession
    private let baseURL = "https://www.strava.com"
    private let apiBaseURL = "https://www.strava.com/api/v3"

    public init(config: StravaConfig, session: URLSession = .shared) {
        self.config = config
        self.session = session
    }

    // MARK: - Authorization URL

    public var authorizationURL: URL {
        var components = URLComponents(string: "\(baseURL)/oauth/authorize")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: config.clientId),
            URLQueryItem(name: "redirect_uri", value: config.redirectUri),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: "activity:read_all,activity:write")
        ]
        return components.url!
    }

    // MARK: - Token Exchange

    public func exchangeToken(code: String) async throws -> StravaTokens {
        let url = URL(string: "\(baseURL)/oauth/token")!

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "client_id": config.clientId,
            "client_secret": config.clientSecret,
            "code": code,
            "grant_type": "authorization_code"
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw StravaError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw StravaError.tokenExchangeFailed(statusCode: httpResponse.statusCode)
        }

        return try parseTokenResponse(data)
    }

    // MARK: - Token Refresh

    public func refreshToken(_ refreshToken: String) async throws -> StravaTokens {
        let url = URL(string: "\(baseURL)/oauth/token")!

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "client_id": config.clientId,
            "client_secret": config.clientSecret,
            "refresh_token": refreshToken,
            "grant_type": "refresh_token"
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw StravaError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw StravaError.tokenRefreshFailed(statusCode: httpResponse.statusCode)
        }

        return try parseTokenResponse(data)
    }

    // MARK: - Fetch Activities

    public func fetchActivities(accessToken: String, perPage: Int = 30) async throws -> [StravaActivity] {
        var components = URLComponents(string: "\(apiBaseURL)/athlete/activities")!
        components.queryItems = [
            URLQueryItem(name: "per_page", value: String(perPage))
        ]

        var request = URLRequest(url: components.url!)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw StravaError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw StravaError.apiFailed(statusCode: httpResponse.statusCode)
        }

        return try parseActivitiesResponse(data)
    }

    // MARK: - Update Activity

    public func updateActivity(
        accessToken: String,
        activityId: Int64,
        gearId: String
    ) async throws -> StravaActivity {
        let url = URL(string: "\(apiBaseURL)/activities/\(activityId)")!

        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = ["gear_id": gearId]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw StravaError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw StravaError.updateFailed(statusCode: httpResponse.statusCode)
        }

        return try parseActivityResponse(data)
    }

    // MARK: - Private Helpers

    private func parseTokenResponse(_ data: Data) throws -> StravaTokens {
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        guard let accessToken = json?["access_token"] as? String,
              let refreshToken = json?["refresh_token"] as? String,
              let expiresAt = json?["expires_at"] as? TimeInterval else {
            throw StravaError.invalidTokenResponse
        }

        return StravaTokens(
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresAt: Date(timeIntervalSince1970: expiresAt)
        )
    }

    private func parseActivitiesResponse(_ data: Data) throws -> [StravaActivity] {
        let json = try JSONSerialization.jsonObject(with: data) as? [[String: Any]] ?? []

        return json.compactMap { parseActivity($0) }
    }

    private func parseActivityResponse(_ data: Data) throws -> StravaActivity {
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        guard let json = json, let activity = parseActivity(json) else {
            throw StravaError.invalidActivityResponse
        }

        return activity
    }

    private func parseActivity(_ json: [String: Any]) -> StravaActivity? {
        guard let id = json["id"] as? Int64,
              let name = json["name"] as? String,
              let sportType = json["sport_type"] as? String,
              let startDateString = json["start_date"] as? String,
              let distance = json["distance"] as? Double,
              let movingTime = json["moving_time"] as? Int else {
            return nil
        }

        let formatter = ISO8601DateFormatter()
        guard let startDate = formatter.date(from: startDateString) else {
            return nil
        }

        let gearId = json["gear_id"] as? String

        return StravaActivity(
            id: id,
            name: name,
            sportType: sportType,
            startDate: startDate,
            distance: distance,
            movingTime: movingTime,
            gearId: gearId
        )
    }
}

public enum StravaError: Error {
    case invalidResponse
    case tokenExchangeFailed(statusCode: Int)
    case tokenRefreshFailed(statusCode: Int)
    case invalidTokenResponse
    case apiFailed(statusCode: Int)
    case updateFailed(statusCode: Int)
    case invalidActivityResponse
}
