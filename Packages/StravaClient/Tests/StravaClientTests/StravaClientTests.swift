import XCTest
import Foundation
@testable import StravaClient

final class StravaClientTests: XCTestCase {

    // MARK: - Authorization URL

    func test_authorizationURL_containsRequiredParameters() {
        // Arrange
        let config = StravaConfig(
            clientId: "12345",
            clientSecret: "secret",
            redirectUri: "ckey://oauth"
        )
        let client = StravaClient(config: config)

        // Act
        let url = client.authorizationURL

        // Assert
        XCTAssertTrue(url.absoluteString.contains("client_id=12345"))
        XCTAssertTrue(url.absoluteString.contains("redirect_uri=ckey://oauth"))
        XCTAssertTrue(url.absoluteString.contains("response_type=code"))
        XCTAssertTrue(url.absoluteString.contains("scope=activity:read_all,activity:write"))
    }

    // MARK: - Token Exchange (Integration)
    // Note: Auth codes are one-time use, so this test only works once per code

    func test_exchangeToken_withValidCode_returnsTokens() async throws {
        // Skip if we already have tokens (code was already used)
        if ProcessInfo.processInfo.environment["STRAVA_REFRESH_TOKEN"] != nil {
            throw XCTSkip("Already have refresh token - auth code was already exchanged")
        }

        guard let clientId = ProcessInfo.processInfo.environment["STRAVA_CLIENT_ID"],
              let clientSecret = ProcessInfo.processInfo.environment["STRAVA_CLIENT_SECRET"],
              let authCode = ProcessInfo.processInfo.environment["STRAVA_AUTH_CODE"] else {
            throw XCTSkip("STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_AUTH_CODE required")
        }

        let config = StravaConfig(
            clientId: clientId,
            clientSecret: clientSecret,
            redirectUri: "ckey://oauth"
        )
        let client = StravaClient(config: config)

        let tokens = try await client.exchangeToken(code: authCode)

        XCTAssertFalse(tokens.accessToken.isEmpty)
        XCTAssertFalse(tokens.refreshToken.isEmpty)
    }

    // MARK: - Refresh Token (Integration)

    func test_refreshToken_withValidRefreshToken_returnsNewTokens() async throws {
        guard let clientId = ProcessInfo.processInfo.environment["STRAVA_CLIENT_ID"],
              let clientSecret = ProcessInfo.processInfo.environment["STRAVA_CLIENT_SECRET"],
              let refreshToken = ProcessInfo.processInfo.environment["STRAVA_REFRESH_TOKEN"] else {
            throw XCTSkip("STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_REFRESH_TOKEN required")
        }

        let config = StravaConfig(
            clientId: clientId,
            clientSecret: clientSecret,
            redirectUri: "ckey://oauth"
        )
        let client = StravaClient(config: config)

        let tokens = try await client.refreshToken(refreshToken)

        XCTAssertFalse(tokens.accessToken.isEmpty)
        XCTAssertFalse(tokens.refreshToken.isEmpty)
    }

    // MARK: - Fetch Activities (Integration)

    func test_fetchActivities_withValidToken_returnsActivities() async throws {
        guard let clientId = ProcessInfo.processInfo.environment["STRAVA_CLIENT_ID"],
              let clientSecret = ProcessInfo.processInfo.environment["STRAVA_CLIENT_SECRET"],
              let accessToken = ProcessInfo.processInfo.environment["STRAVA_ACCESS_TOKEN"] else {
            throw XCTSkip("STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_ACCESS_TOKEN required")
        }

        let config = StravaConfig(
            clientId: clientId,
            clientSecret: clientSecret,
            redirectUri: "ckey://oauth"
        )
        let client = StravaClient(config: config)

        let activities = try await client.fetchActivities(accessToken: accessToken, perPage: 5)

        // May be empty if no activities, but should not throw
        XCTAssertNotNil(activities)
    }
}
