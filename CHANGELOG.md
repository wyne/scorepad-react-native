# Changelog

## [3.1.1](https://github.com/wyne/scorepad-react-native/compare/v3.1.0...v3.1.1) (2026-09-08)


### Infrastructure

* bump release-please-action to v5 for the Node 24 runtime ([#740](https://github.com/wyne/scorepad-react-native/issues/740)) ([549eef3](https://github.com/wyne/scorepad-react-native/commit/549eef33c179c3bdb8a53f5c954b2076aae256b2))
* run the EAS workflows on Node 22 ([#741](https://github.com/wyne/scorepad-react-native/issues/741)) ([eb79b5e](https://github.com/wyne/scorepad-react-native/commit/eb79b5e99253e4ddba635f62a292f0ad9e0a95ba))

## [3.1.0](https://github.com/wyne/scorepad-react-native/compare/v3.0.4...v3.1.0) (2026-09-08)


### Features

* **ui:** use native Liquid Glass for the FAB and sheet buttons ([#738](https://github.com/wyne/scorepad-react-native/issues/738)) ([db6054b](https://github.com/wyne/scorepad-react-native/commit/db6054bbfbeeda3a994c9697fa065c5ae3e18b66))


### Bug Fixes

* **analytics:** make dev_menu_enabled reportable as false ([#717](https://github.com/wyne/scorepad-react-native/issues/717)) ([9e504a4](https://github.com/wyne/scorepad-react-native/commit/9e504a4129128ae9a5d2b8952b4edb6843b4dc3b))
* **analytics:** report game_list params from post-dispatch values ([#716](https://github.com/wyne/scorepad-react-native/issues/716)) ([3396781](https://github.com/wyne/scorepad-react-native/commit/3396781c917da44b5c50d6f2e996358ca3c9f7c5))
* **deps:** pin Expo-managed native modules back to SDK 57 versions ([#727](https://github.com/wyne/scorepad-react-native/issues/727)) ([24a4210](https://github.com/wyne/scorepad-react-native/commit/24a421057ae61ca516f27d04517842b6c3560476))
* move the review prompt onto a screen that actually mounts ([#715](https://github.com/wyne/scorepad-react-native/issues/715)) ([35619bc](https://github.com/wyne/scorepad-react-native/commit/35619bcd951418cb34605fa8f202ad387b83a955))
* **review-prompt:** improve eligibility criteria ([#736](https://github.com/wyne/scorepad-react-native/issues/736)) ([0f18fa7](https://github.com/wyne/scorepad-react-native/commit/0f18fa77b86c8127af8ba3f049cdd301cb7204ea))


### Infrastructure

* auto-submit production builds to both stores ([#737](https://github.com/wyne/scorepad-react-native/issues/737)) ([825910a](https://github.com/wyne/scorepad-react-native/commit/825910afb680b617af29f7bc8e60d7816098848a))
* automate releases with release-please ([#724](https://github.com/wyne/scorepad-react-native/issues/724)) ([99eebfe](https://github.com/wyne/scorepad-react-native/commit/99eebfed192f7d0bb5296f68cc6eddde277fda81))
* seed release-please from the shipped 3.0.4, not 3.0.3 ([#726](https://github.com/wyne/scorepad-react-native/issues/726)) ([6439e88](https://github.com/wyne/scorepad-react-native/commit/6439e8830533bcc605fcb245d5f0324ae13d76db))


### Miscellaneous

* **deps-dev:** bump eslint-config-prettier from 9.1.2 to 10.1.8 ([#689](https://github.com/wyne/scorepad-react-native/issues/689)) ([46db529](https://github.com/wyne/scorepad-react-native/commit/46db529c3440669366e1fd450613a6a01d071a2f))
* **deps:** bump actions/setup-node from 6 to 7 ([#688](https://github.com/wyne/scorepad-react-native/issues/688)) ([e9cc008](https://github.com/wyne/scorepad-react-native/commit/e9cc008c889d60697ee52c9022768410f6eea4de))
* **deps:** bump react-native-reanimated from 4.5.1 to 4.6.0 ([#723](https://github.com/wyne/scorepad-react-native/issues/723)) ([1d87286](https://github.com/wyne/scorepad-react-native/commit/1d8728690f0758400f4afce9469a5e9b01c37587))
* **deps:** bump react-native-view-shot from 5.1.0 to 5.1.1 ([#692](https://github.com/wyne/scorepad-react-native/issues/692)) ([ac789d9](https://github.com/wyne/scorepad-react-native/commit/ac789d997c4d54e0f4312803436313b8aa2eefe4))
* **deps:** refresh lockfile to clear stale transitive dependencies ([#719](https://github.com/wyne/scorepad-react-native/issues/719)) ([ee83e65](https://github.com/wyne/scorepad-react-native/commit/ee83e6581ca5bff7259c5695c46a1df901997669))
* give Android the same run scripts iOS has ([#739](https://github.com/wyne/scorepad-react-native/issues/739)) ([817a002](https://github.com/wyne/scorepad-react-native/commit/817a0029a8cdb39c7f4cfaa6a66eec3d315eb081))
* remove dead BackButton and its unreachable navigate_home event ([#718](https://github.com/wyne/scorepad-react-native/issues/718)) ([2e3f933](https://github.com/wyne/scorepad-react-native/commit/2e3f933d9adefbc714a0c1b250c1f8e62cc56a58))
