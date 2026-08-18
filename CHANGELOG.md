# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Reactive card re-rendering when referenced external entities (`sensor.*`, `binary_sensor.*`, auto-discovered battery sensors, or media-source images) update without changing the main vacuum state object ([#32](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/issues/32)).

## [4.6.2] - 2026-08-18

### Added

- Repository status badges in `README.md` for HACS validation, release version, CI checks, and license.
- Practical card configuration examples including card-with-image visual reference and template sensor tips.
- Automated changelog version validation in `tests/check-version.mjs` to guarantee `CHANGELOG.md` stays up to date with every release.
- Dedicated release workflow guide in `docs/release-workflow.md` detailing the end-to-end release lifecycle.

### Changed

- Updated card branding and header metadata to "Xiaomi Vacuum Card Reborn".
- Refreshed documentation, screenshots, and visual assets across README.
- Clarified documentation regarding two-column state/attributes layout and arbitrary external entity support in custom rows.
- Enhanced GitHub Actions release workflow to extract release notes directly from `CHANGELOG.md`.

### Fixed

- Markdownlint formatting inconsistencies across documentation files.

## [4.6.1] - 2026-08-17

### Changed

- Merged development guide into unified `CONTRIBUTING.md` ([#12](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/pull/12)).
- Enhanced pull request template and contributing guidelines ([#11](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/pull/11)).
- Added strict pull request requirements to agent instructions ([#10](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/pull/10)).

### Fixed

- Accepted native template result objects in dynamic service template executions ([#13](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/pull/13)).

## [4.6.0] - 2026-08-17

### Added

- Support for Home Assistant 2026.6 card picker and Sections grid sizing (`getGridSize`, `getGridOptions`).
- Expanded Lovelace visual card editor (`xiaomi-vacuum-card-editor`) supporting custom rows, entity-backed attributes, and object/template service data editing.
- Dynamic service templates executing Jinja template expressions ([#3](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/pull/3)).
- Robust modern battery sensor auto-discovery with legacy and attribute fallbacks ([#4](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/pull/4)).
- Auto-scroll fan speed dropdown to active selection with full ARIA keyboard navigation.
- Automated Node.js behavior test suite and Playwright Home Assistant smoke tests in Docker.

### Changed

- Revitalized maintained fork baseline as Xiaomi Vacuum Card Reborn.
- Replaced obsolete Material Web Components (`mwc-menu`, `mwc-list-item`) with dependency-free accessible ARIA combobox (`button`/`listbox`) for Home Assistant 2026+ compatibility.
- Standardized release and CI workflows with automated asset publishing and retries ([#6](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/pull/6), [#7](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/pull/7)).

### Fixed

- Prevented card crashes (`fireEvent`) when vacuum or sensor entities become unavailable.
- Hardened style URL sanitization against recursive encoded path traversal.
- Prevented duplicate card registrations in custom cards registry.
- Injected row IDs during render and refined editor battery entity filtering ([#5](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/pull/5)).

## [4.5.1] - 2026-02-15

### Fixed

- Replaced `mwc-menu` and `mwc-list-item` with accessible dropdown element for Home Assistant 2026.02 MWC component removal compatibility.

## [4.5.0] - 2022-03-05

*Note:* HA version `2022.3.0` or higher required to support new dropdown elements.

### Fixed

- Replace unsupported paper elements with MWC dropdown menu ([#99](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/99), [#100](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/100))

## [4.4.0] - 2021-11-20

*Note:* HA version `2021.11.0` or higher may be required if you use the standard `xiaomi` vacuum integration.

### Added

- Support vacuum data from separate sensor entities ([#72](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/72), [#84](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/84))

## [4.3.0] - 2021-06-15

### Added

- Support custom service on dropdown attributes ([#71](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/71))

### Fixed

- Icons not showing after change to `ha-button-icon` ([#86](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/86), [#87](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/87))

## [4.2.0] - 2021-03-03

### Added

- Support using any data values from vacuum entity ([#69](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/69))
- Support any generic dropdown list attributes ([#69](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/69))

## [4.1.0] - 2020-11-04

### Added

- Function `shouldUpdate` to prevent unnecessary re-rendering ([#61](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/61))

### Changed

- Use dashes instead of underscore in console info card name

## [4.0.1] - 2020-10-30

### Fixed

- Compatibility issue with HA `0.116` ([#56](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/56))

## [4.0.0] - 2020-09-29

Refactored most of the code and added several features and improvements.
May contain **breaking changes** and require some **configuration changes**!
See [README](https://github.com/benct/lovelace-xiaomi-vacuum-card) for more information.

### Added

- Dropdown menu for selecting operation mode/fan speed ([#9](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/9), [#48](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/48))
- Support additional buttons and custom service calls ([#26](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/26), [#41](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/41), [#50](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/50), [#51](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/51))
- Support hiding any state or attribute ([#42](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/42), [#47](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/47))
- Display icons with state values and support icons on all attributes
- Display vacuum entity's battery icon if available
- Vendor support for Neato vacuums ([#16](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/16))
- Vendor support for Xiaomi Mi vacuums ([#34](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/34))
- Vendor support for Deebot (slim) vacuums ([#53](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/53))

### Changed

- Simplify several vendor integrations
- Render proper icon buttons with optional labels
- Make background image disabled by default

### Fixed

- Incorrect padding causing hidden text shadows under title

## [3.0.1] - 2020-05-18

### Fixed

- Incorrect unit on `roomba` boolean attribute values ([#24](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/24))

## [3.0.0] - 2020-05-18

### Added

- Support for HA Cast [https://cast.home-assistant.io](https://cast.home-assistant.io)
- Support custom button icons
- Support hiding specific vacuum attributes ([#27](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/27))
- Vendor support for iRobot Roomba vacuums ([#24](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/24))

### Changed

- Major refactoring and cleanup of code
- Use LitElement instead of Polymer

## [2.4.0] - 2020-04-12

### Added

- Option to hide all labels/details ([#20](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/20))
- Vendor support for Robovac vacuums ([#23](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/23))

## [2.3.2] - 2020-04-03

### Fixed

- Error on undefined state objects

## [2.3.1] - 2020-04-02

### Changed

- Vendor `ecovacs_ozmo` changed to more accurate `deebot` ([#17](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/17))
- Round computed numbers for `deebot` values

### Fixed

- Main value units showing as undefined

## [2.3.0] - 2020-04-01

### Added

- Support alternate attributes for Valetudo/Dustcloud firmware ([#15](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/15))
- Support alternate attributes for Ecovacs Ozmo models ([#17](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/17))

### Changed

- Improved general attribute and value handling

## [2.2.1] - 2020-03-31

### Fixed

- Wrong button color on light themes ([#11](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/11))

## [2.2.0] - 2020-03-30

### Added

- Clean spot button and service call ([#7](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/7))
- Options to show/hide individual buttons

## [2.1.0] - 2020-03-29

### Added

- Customization/translation of labels ([#6](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/6))

### Fixed

- Link to changelog in custom_updater json ([#5](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/5))
- Incorrect option name in readme example

## [2.0.0] - 2020-03-28

### Added

- Support for custom_updater component ([#2](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/2))
- Vendor support for Ecovacs vacuums ([#3](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/3))

### Changed

- Significant code improvements
- Accommodate future vendor implementations

### Fixed

- Use standardized name and path for background images ([#4](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/4))

### Breaking

- Option `background` renamed to `image`
- Custom image URLs must now include the `/local/` path prefix

## [1.1.1] - 2020-03-24

### Fixed

- Unsupported function syntax for some browsers

## [1.1.0] - 2020-03-24

### Added

- Support for `frienly_name` / custom name ([#1](https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/1))
- Version information

## [1.0.0] - 2020-03-23

### Added

- Initial release

[Unreleased]: https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/compare/v4.6.2...HEAD
[4.6.2]: https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/compare/v4.6.1...v4.6.2
[4.6.1]: https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/compare/v4.6.0...v4.6.1
[4.6.0]: https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/compare/v4.5.0...v4.6.0
[4.5.1]: https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/commits/v4.5.1
[4.5.0]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v4.4.0...v4.5.0
[4.4.0]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v4.3.0...v4.4.0
[4.3.0]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v4.2.0...v4.3.0
[4.2.0]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v4.0.1...v4.1.0
[4.0.1]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v3.0.1...v4.0.0
[3.0.1]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v2.4.0...v3.0.0
[2.4.0]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v2.3.2...v2.4.0
[2.3.2]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v2.3.1...v2.3.2
[2.3.1]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v2.2.1...v2.3.0
[2.2.1]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v1.1.1...v2.0.0
[1.1.1]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/benct/lovelace-xiaomi-vacuum-card/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/benct/lovelace-xiaomi-vacuum-card/releases/tag/v1.0.0
