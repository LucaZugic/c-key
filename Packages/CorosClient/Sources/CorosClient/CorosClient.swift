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
}
