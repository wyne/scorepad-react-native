# Changelog

## [3.2.0](https://github.com/wyne/scorepad-react-native/compare/v3.1.2...v3.2.0) (2026-09-11)


### Features

* add round picker to game header ([#759](https://github.com/wyne/scorepad-react-native/issues/759)) ([e8a8f88](https://github.com/wyne/scorepad-react-native/commit/e8a8f882cf4c0b56923c59e97be29c0558cfe4b6))
* warn when editing earlier rounds ([#761](https://github.com/wyne/scorepad-react-native/issues/761)) ([c73a086](https://github.com/wyne/scorepad-react-native/commit/c73a08637fd4ee70ba17f67a3d79e3649a731e1a))


### Bug Fixes

* polish Android navigation and launch behavior ([#758](https://github.com/wyne/scorepad-react-native/issues/758)) ([f6e4521](https://github.com/wyne/scorepad-react-native/commit/f6e4521ec37aa7a7e4079e7550c88eeae6610ceb))

## [3.1.2](https://github.com/wyne/scorepad-react-native/compare/v3.1.1...v3.1.2) (2026-09-10)


### Bug Fixes

* **edit-player:** give the screen a top margin and a full-height scroll area ([#747](https://github.com/wyne/scorepad-react-native/issues/747)) ([d916b92](https://github.com/wyne/scorepad-react-native/commit/d916b922f9d0ec1cf5e61223ee5e94e1a4ba9a83))
* **fab:** restore SwiftUI floating action button ([#753](https://github.com/wyne/scorepad-react-native/issues/753)) ([698bfbe](https://github.com/wyne/scorepad-react-native/commit/698bfbe29e099fc0abf95493f54cfcb1a042ff20))
* **fab:** stop an outside tap on the open menu reaching the list ([#746](https://github.com/wyne/scorepad-react-native/issues/746)) ([4cc7a35](https://github.com/wyne/scorepad-react-native/commit/4cc7a353b96637935f6c716a18d83b0288fbbef1))
* **game-list:** tidy the row's hierarchy, spacing and dates ([#750](https://github.com/wyne/scorepad-react-native/issues/750)) ([d07ce4e](https://github.com/wyne/scorepad-react-native/commit/d07ce4e415f1d4ee38e94873a8b0e523fd57a682))
* **list:** refine game list hierarchy ([#752](https://github.com/wyne/scorepad-react-native/issues/752)) ([5417264](https://github.com/wyne/scorepad-react-native/commit/54172641d68009a7db0a6b1b2b085ebc80015365))
* **list:** repair game list separators and revert the android options button ([#756](https://github.com/wyne/scorepad-react-native/issues/756)) ([7d73a70](https://github.com/wyne/scorepad-react-native/commit/7d73a700be2e5332b12baff4710d384353df7b3f))
* polish android interactions ([#755](https://github.com/wyne/scorepad-react-native/issues/755)) ([d061fe4](https://github.com/wyne/scorepad-react-native/commit/d061fe460c30a8efb6c2132da3b0c0ef2c9c7af2))
* **settings:** label the analytics state in the version alert ([#745](https://github.com/wyne/scorepad-react-native/issues/745)) ([29a16c2](https://github.com/wyne/scorepad-react-native/commit/29a16c2b89b451ebf3419a152af10facd6b52986))
* **sheets:** make the sheet edge visible on Android ([#757](https://github.com/wyne/scorepad-react-native/issues/757)) ([cee99ce](https://github.com/wyne/scorepad-react-native/commit/cee99ce86ce257eb695f42616f3396dfb40803ca))
* **ui:** one section label style across the app ([#748](https://github.com/wyne/scorepad-react-native/issues/748)) ([0e9a7b8](https://github.com/wyne/scorepad-react-native/commit/0e9a7b8cc3dc38ded5c7178ce4ed9b509d82dfe4))


### Infrastructure

* drop --what-to-test so the iOS submission can be scheduled ([#743](https://github.com/wyne/scorepad-react-native/issues/743)) ([a7a27bd](https://github.com/wyne/scorepad-react-native/commit/a7a27bdea888d91fd661b3115cb87a73f2e39756))


### Miscellaneous

* **deps:** bump expo to 57.0.21 and expo-glass-effect to 57.0.2 ([#751](https://github.com/wyne/scorepad-react-native/issues/751)) ([bcaa6eb](https://github.com/wyne/scorepad-react-native/commit/bcaa6eb41dcc9a8a17815a51a244ab1452445fa6))

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
