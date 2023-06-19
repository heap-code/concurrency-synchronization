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

In the code examples, the `sleep` function is the following:

```typescript
function sleep(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}
```

**This is a placeholder for any asynchronous task.**

> **Note:**  
> Avoid using this package on _"production"_ code.  
> Go [here](#when-to-use) to understand why.

### Mutex

A mutex is a mechanism that enforces limits on access to a resource.
It generally protects the access to shared variables.

> Use [semaphores](#semaphore) for synchronization rather than a mutex.

---

With the given example:

```typescript
const myVar = { i: 0 };

async function do1() {
  await sleep(200);
  myVar.i += 1;
}

async function do2() {
  await sleep(50);
  myVar.i *= 3;
}

async function bootstrap() {
  await Promise.all([do1(), sleep(10).then(() => do2())]);
  console.log(myVar.i); // => 1
}
bootstrap();
```

Even with the `sleep`, we could expect that `myVar.i += 1` is done
before `myVar.i *= 3` as it is called before.  
However `myVar.i` is not protected, then the final value is `1`.

---

If a mutex locks the task, then the variable is protected:

```typescript
const mutex = new Mutex();
const myVar = { i: 0 };

async function do1() {
  await mutex.lock();

  await sleep(200);
  myVar.i += 1;

  await mutex.unlock();
}

async function do2() {
  await mutex.lock();

  await sleep(50);
  myVar.i *= 3;

  await mutex.unlock();
}

async function bootstrap() {
  await Promise.all([do1(), sleep(10).then(() => do2())]);
  console.log(myVar.i); // => 3
}
bootstrap();
```

> From this [wikipedia section](https://en.wikipedia.org/wiki/Lock_(computer_science)#Mutexes_vs._semaphores):
>
> The task that locked the mutex is supposed to unlock it.

#### Mutex tryLock

It is possible to try to lock a mutex in a given time limit.  
The function will then throw an exception if the mutex could not lock in time:

```typescript
mutex.tryLock(250).catch((error: unknown) => {
  if (error instanceof ConcurrencyExceedTimeoutException) {
    console.log("Could not lock in the given time.");
  }

  throw error;
});
```

#### Mutex interrupt

A mutex can be interrupted at any time.  
All awaiting _"threads"_ will then receive an exception:

```typescript
const mutex = new Mutex();
const myVar = { i: 0 };

async function do1() {
  await mutex.lock().catch((error: unknown) => {
    if (error instanceof ConcurrencyInterruptedException) {
      console.log("The mutex has been interrupted", error.getReason());
    }

    throw error;
  });

  await sleep(200);
  myVar.i += 1;

  await mutex.unlock();
}

async function bootstrap() {
  await Promise.all([
    do1(),
    do1(),
    sleep(20).then(() => mutex.interrupt({ message: "Take too much time" }))
  ]);
}
bootstrap();
```

### Semaphore

From [wikipedia](https://en.wikipedia.org/wiki/Semaphore_(programming)):

> Semaphores are a type of synchronization primitive.

They can be used to protect certain resources (like mutexes),
but are generally used for synchronization:

```typescript
async function bootstrap() {
  const semaphore = new Semaphore(0);

  const time1 = 100;
  const time2 = 150;

  sleep(time1).then(() => semaphore.release());
  sleep(time2).then(() => semaphore.release());

  const maxTime = Math.max(time1, time2);

  const before = performance.now();
  await semaphore.acquire(2); // waiting until releases
  const after = performance.now();

  const elapsed = after - before; // ~150
  console.log("Done. took %dms with expected %dms", elapsed, maxTime);
}
bootstrap();
```

#### Semaphore tryAcquire

It is possible to try to acquire a semaphore in a given time limit.  
The function will then throw an exception if the semaphore could not acquire in time:

 ```typescript
async function bootstrap() {
  const semaphore = new Semaphore(2);

  const acquired1 = await semaphore.tryAcquire(100).then(() => true);
  const acquired2 = await semaphore.tryAcquire(100, 2).catch((error: unknown) => {
    if (error instanceof ConcurrencyExceedTimeoutException) {
      return false;
    }
  
    throw error;
  });

  console.log(acquired1); // true
  console.log(acquired2); // false
}
bootstrap();
```

#### Semaphore interrupt

A semaphore can be interrupted at any time.  
All awaiting _"threads"_ will then receive an exception:

 ```typescript
async function bootstrap() {
  const semaphore = new Semaphore(1);

  void sleep(100).then(() => semaphore.interrupt({ code: 502 }, 2));

  const succeed = await Promise.all([
    semaphore.acquire(),
    semaphore.acquire(2),
    semaphore.tryAcquire(200),
    semaphore.tryAcquire(200, 1)
  ]).catch((error: unknown) => {
    if (error instanceof ConcurrencyInterruptedException) {
      return false;
    }
    throw error;
  });

  console.log(succeed); // false
  console.log(semaphore.permitsAvailable); // 2
}
bootstrap();
```

#### Semaphore releaseAll

Very similar to [interrupt](#semaphore-interrupt),
but it does not throw an exception.

 ```typescript
async function bootstrap() {
  const semaphore = new Semaphore(1);

  void sleep(100).then(() => semaphore.releaseAll(3));

  await Promise.all([
    semaphore.acquire(),
    semaphore.acquire(2),
    semaphore.tryAcquire(200),
    semaphore.tryAcquire(200, 1)
  ]);
 
  console.log("ok");
  console.log(semaphore.permitsAvailable); // 3
}
bootstrap()
```

> **Note:**
> Unless it is really desired, prefer [interrupt](#semaphore-interrupt) over `releaseAll`.

## When to use

<!-- TODO -->

## Releases

See information about breaking changes and release notes [here](https://github.com/heap-code/concurrency-synchronization/blob/HEAD/CHANGELOG.md).
