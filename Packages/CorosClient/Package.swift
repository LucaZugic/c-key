// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "CorosClient",
    platforms: [
        .macOS(.v13),
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "CorosClient",
            targets: ["CorosClient"]
        ),
    ],
    targets: [
        .target(
            name: "CorosClient"
        ),
        .testTarget(
            name: "CorosClientTests",
            dependencies: ["CorosClient"]
        ),
    ]
)
