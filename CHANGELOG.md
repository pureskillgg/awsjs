# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## 1.2.1 / 2021-08-30

### Changed

- Update dependencies.

## 1.2.0 / 2021-07-17

### Changed

- The internal AWS client used by each wrapper class is now cached
  and reused according to the `name` parameter.
  This allows the reuse of TCP connections even if
  a new instance of the wrapper class is created per-request.

## 1.1.1 / 2021-07-08

### Changed

- Update aws-sdk to v3.20.0.

## 1.1.0 / 2021-05-07

### Added

- Throw `DynamodbMissingKeyError` when missing hash or range keys.

## 1.0.0 / 2021-05-01

- Initial release.
