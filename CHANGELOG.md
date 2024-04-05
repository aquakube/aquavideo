# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2024-02-22

### Added

- Added HIK PTZ security camera to configmap


## [0.5.0] - 2023-12-14

### Added

- Added protocol property for TCP configuration to pty01 cameras on prod camera map
- Added protocol property for TCP configuration to koa02 c2 internal on dev camera map (for testing)

## [0.4.0] - 2023-12-01

### Removed

- Deleted all OTAQ cameras from camera map for initial release

## [0.3.2] - 2023-11-14

### Changed

- Changed the resolution on f2 stern live streams for production

## [0.3.1] - 2023-11-13

### Added

- Added kubeContext to skaffold profiles so mistakes on rollouts to wrong context

## [0.3.0] - 2023-11-13

### Added

- Added query strings to improve video quality on axis live streams


## [0.2.0] - 2023-11-01

### Added

- Added skaffold profile for deploying the different camera map sets
- Minor changes to app.kubernetes.io/version on aquavid deployment manifest
- Added the kubernetes directory to the dockerignore so changes to manifests do not trigger new builds on the aquavid image


## [0.1.0] - 2023-10-31

### Added

- Initial release of aquavid
