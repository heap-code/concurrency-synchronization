# Changelog

# [0.4.0](https://github.com/heap-code/concurrency-synchronization/compare/v0.3.0...v0.4.0) (2023-06-27)


### Bug Fixes

* **npm:** fix types path ([74f70ed](https://github.com/heap-code/concurrency-synchronization/commit/74f70ede37d7558d656fa67e6b9c39dfbb4feded))


### Features

* **cdn:** add UMD bundle ([882e433](https://github.com/heap-code/concurrency-synchronization/commit/882e43382d7c59c1a67b465b73c6cae587dfa79d)), closes [#7](https://github.com/heap-code/concurrency-synchronization/issues/7)

# [0.3.0](https://github.com/heap-code/concurrency-synchronization/compare/v0.2.2...v0.3.0) (2023-06-26)


### Features

* **producer-consumer:** implement ProducerConsumer ([d2983a0](https://github.com/heap-code/concurrency-synchronization/commit/d2983a0a4f8fd58f3685c79ced1198bdd6f10a42)), closes [#3](https://github.com/heap-code/concurrency-synchronization/issues/3)

## [0.2.2](https://github.com/heap-code/concurrency-synchronization/compare/v0.2.0...v0.2.2) (2023-06-24)


### Bug Fixes

* **ci:** set runInBand when testing ([a26d8db](https://github.com/heap-code/concurrency-synchronization/commit/a26d8db8800fa12c2b616392d88a33fb8e87d677))

# [0.2.0](https://github.com/heap-code/concurrency-synchronization/compare/v0.1.2...v0.2.0) (2023-06-24)


### Bug Fixes

* **mutex:** correct `isLocked` value ([af6c84b](https://github.com/heap-code/concurrency-synchronization/commit/af6c84b10f01daa25395c75dbd4a26040fb30487))


### Features

* **mutex:** add lockWith and tryLockWith bodies ([01135a6](https://github.com/heap-code/concurrency-synchronization/commit/01135a65779eb3eb2b0dfa96706d368a65ebd8f5)), closes [#2](https://github.com/heap-code/concurrency-synchronization/issues/2)
* **mutex:** add lockWith and tryLockWith definitions ([2bc30d7](https://github.com/heap-code/concurrency-synchronization/commit/2bc30d7d7bc64f62ad68e95f81f2fc77c894e98e)), closes [#2](https://github.com/heap-code/concurrency-synchronization/issues/2)

## [0.1.2](https://github.com/heap-code/concurrency-synchronization/compare/v0.1.1...v0.1.2) (2023-06-22)


### Bug Fixes

* **semaphore:** clear timeout after acquire ([1d7f3e7](https://github.com/heap-code/concurrency-synchronization/commit/1d7f3e7e47421fc36b3e1dd4cf7206112404ab44))

## [0.1.1](https://github.com/heap-code/concurrency-synchronization/compare/v0.1.0...v0.1.1) (2023-06-21)


### Bug Fixes

* **semaphore:** release acquired permits "allocated" to a recently failed `tryLock` ([0be72f9](https://github.com/heap-code/concurrency-synchronization/commit/0be72f9651e9130c728a8763c9f3954069da924b))

# [0.1.0](https://github.com/heap-code/concurrency-synchronization/compare/v0.0.2...v0.1.0) (2023-06-19)


### Features

* **mutex:** add the mutex implementation ([6e36477](https://github.com/heap-code/concurrency-synchronization/commit/6e36477cc75ec6f8eb8bd35bb407f4107483cd8f))
* **mutex:** set the mutex definition and tests ([eb4fe52](https://github.com/heap-code/concurrency-synchronization/commit/eb4fe52efc73ec85e7eab887b5a32684444e1327))

## [0.0.2](https://github.com/heap-code/concurrency-synchronization/compare/v0.0.1...v0.0.2) (2023-06-18)


### Bug Fixes

* **ci:** get good files for code coverage ([edad6e4](https://github.com/heap-code/concurrency-synchronization/commit/edad6e4eae7b2610dcd82ba1a2c39a998fdc0938))

## 0.0.1 (2023-06-18)

* **semaphore:** add a semaphore implementation