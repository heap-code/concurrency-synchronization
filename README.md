# Concurrency synchronization

[![CI](https://github.com/heap-code/concurrency-synchronization/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/heap-code/concurrency-synchronization/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@heap-code/concurrency-synchronization)](https://www.npmjs.com/package/@heap-code/concurrency-synchronization)
![Code coverage](.badges/code/coverage.svg)
![Comment coverage](.badges/comment/coverage.svg)

Manage concurrency in Javascript _"threads"_ with promises.

## Preface

The aim of this package is to **mimic** the various tools used for concurrency synchronization,
as multithreading does not exist in Javascript in the same way as in _C_, _Java_ or other languages.

> From the [mozilla documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#promise_concurrency>):
>
> Note that JavaScript is **single-threaded by nature**,
> so at a given instant, only one task will be executing,
> although control can shift between different promises,
> making execution of the promises **appear concurrent**.
> Parallel execution in JavaScript can only be achieved through worker threads.

A _"threads"_ is, in this context, an asynchronous task.

## Installation

Simply run:

```bash
npm i @heap-code/concurrency-synchronization
```

## Usages

<!-- TODO -->

## Releases

See information about breaking changes and release notes [here](https://github.com/heap-code/concurrency-synchronization/blob/HEAD/CHANGELOG.md).
