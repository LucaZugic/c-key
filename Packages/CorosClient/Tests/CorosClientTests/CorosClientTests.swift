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
            case .invalidResponse:
                XCTFail("Unexpected error type: invalidResponse")
            }
        }
    }
}
