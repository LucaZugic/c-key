// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "StravaClient",
    platforms: [
        .macOS(.v13),
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "StravaClient",
            targets: ["StravaClient"]
        ),
    ],
    targets: [
        .target(
            name: "StravaClient"
        ),
        .testTarget(
            name: "StravaClientTests",
            dependencies: ["StravaClient"]
        ),
    ]
)
