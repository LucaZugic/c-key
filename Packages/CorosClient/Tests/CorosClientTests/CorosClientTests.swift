import XCTest
import Foundation
@testable import CorosClient

final class CorosTrainingHubClientTests: XCTestCase {

    func test_authenticate_withValidCredentials_returnsAccessToken() async throws {
        // Skip if credentials not available (CI, other devs)
        guard let email = ProcessInfo.processInfo.environment["COROS_EMAIL"],
              let password = ProcessInfo.processInfo.environment["COROS_PASSWORD"] else {
            print("Skipping: COROS_EMAIL and COROS_PASSWORD environment variables not set")
            throw XCTSkip("COROS_EMAIL and COROS_PASSWORD environment variables not set")
        }

        // Arrange
        let client = CorosTrainingHubClient(region: CorosRegion.eu)

        // Act
        let token = try await client.authenticate(email: email, password: password)

        // Assert
        XCTAssertFalse(token.isEmpty, "Expected non-empty access token")
    }

    func test_authenticate_withInvalidCredentials_throwsError() async throws {
        // Arrange
        let client = CorosTrainingHubClient(region: CorosRegion.eu)

        // Act & Assert
        do {
            _ = try await client.authenticate(email: "fake@example.com", password: "wrongpassword")
            XCTFail("Expected authentication to fail")
        } catch let error as CorosError {
            // Expect either authenticationFailed or missingAccessToken
            switch error {
            case .authenticationFailed, .missingAccessToken:
                // Expected
                break
            case .invalidResponse, .requestFailed:
                XCTFail("Unexpected error type: \(error)")
            }
        }
    }

    // MARK: - Fetch Activities

    func test_fetchActivities_withValidToken_returnsActivities() async throws {
        guard let email = ProcessInfo.processInfo.environment["COROS_EMAIL"],
              let password = ProcessInfo.processInfo.environment["COROS_PASSWORD"] else {
            throw XCTSkip("COROS_EMAIL and COROS_PASSWORD required")
        }

        // Arrange
        let client = CorosTrainingHubClient(region: CorosRegion.eu)
        let token = try await client.authenticate(email: email, password: password)

        // Act
        let activities = try await client.fetchActivities(accessToken: token, limit: 5)

        // Assert - may be empty but should not throw
        XCTAssertNotNil(activities)
        if !activities.isEmpty {
            let first = activities[0]
            XCTAssertGreaterThan(first.id, 0)
            XCTAssertFalse(first.name.isEmpty)
        }
    }

    // MARK: - Diagnostic: Inspect Raw Activity Detail for Gear

    func test_diagnostic_inspectActivityDetailForGearFields() async throws {
        guard let email = ProcessInfo.processInfo.environment["COROS_EMAIL"],
              let password = ProcessInfo.processInfo.environment["COROS_PASSWORD"] else {
            throw XCTSkip("COROS_EMAIL and COROS_PASSWORD required")
        }

        let client = CorosTrainingHubClient(region: CorosRegion.eu)
        let token = try await client.authenticate(email: email, password: password)

        // Fetch activities to get an ID
        let activities = try await client.fetchActivities(accessToken: token, limit: 1)
        guard let activity = activities.first else {
            throw XCTSkip("No activities found to inspect")
        }

        // Fetch raw detail to inspect for gear fields
        let rawDetail = try await client.fetchActivityDetailRaw(
            accessToken: token,
            activityId: activity.id,
            sportType: activity.sportType
        )

        // Print raw response for inspection
        print("=== RAW ACTIVITY DETAIL ===")
        print(rawDetail.prefix(5000))
        print("=== END RAW DETAIL ===")

        // Search for gear-related keywords
        let gearKeywords = ["gear", "shoe", "equipment", "device", "bike", "sportDevice"]
        for keyword in gearKeywords {
            if rawDetail.lowercased().contains(keyword) {
                print("Found potential gear field: '\(keyword)'")
            }
        }
    }
}
