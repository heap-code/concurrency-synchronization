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

### CDN

Thanks to [_jsdelivr_](https://www.jsdelivr.com/),
this package can easily be used in browsers like this:

```html
<script
 src="https://cdn.jsdelivr.net/npm/@heap-code/concurrency-synchronization/dist/bundles/concurrency-synchronization.umd.js"
 type="application/javascript"
></script>
```

> **Note:**  
> It is recommended to use a minified and versioned bundle.
>
> For example:
>
> ```html
> <script
>  src="https://cdn.jsdelivr.net/npm/@heap-code/concurrency-synchronization@0.4.0/dist/bundles/concurrency-synchronization.umd.min.js"
>  type="application/javascript"
> ></script>
> ```

More at this [_jsdelivr_ package page](https://www.jsdelivr.com/package/npm/@heap-code/concurrency-synchronization).

## Usages

In the code examples, the `sleep` function is the following:

```typescript
function sleep(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}
```

**This is a placeholder for any asynchronous task.**

> **Note:**  
> _Avoid_ using this package on _"production"_ code.  
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
import { Mutex } from "@heap-code/concurrency-synchronization";

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
import { ConcurrencyExceedTimeoutException } from "@heap-code/concurrency-synchronization";

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
import { ConcurrencyInterruptedException, Mutex } from "@heap-code/concurrency-synchronization";

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

> From [wikipedia](https://en.wikipedia.org/wiki/Semaphore_(programming)):
>
> Semaphores are a type of synchronization primitive.

They can be used to protect certain resources (like mutexes),
but are generally used for synchronization:

```typescript
import { Semaphore } from "@heap-code/concurrency-synchronization";

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
import {
  ConcurrencyExceedTimeoutException,
  Semaphore
} from "@heap-code/concurrency-synchronization";

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
import { ConcurrencyInterruptedException, Semaphore } from "@heap-code/concurrency-synchronization";

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
import { Semaphore } from "@heap-code/concurrency-synchronization";

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

### Producer-Consumer

The `ProducerConsumer` looks a lot like a [Semaphore](#semaphore),
but it returns values on _acquire_.

By default, all readings use an array:

```typescript
import { ProducerConsumer } from "@heap-code/concurrency-synchronization";

async function bootstrap() {
  const producerConsumer = new ProducerConsumer([1]);

  const time1 = 100;
  const time2 = 150;

  sleep(time1).then(() => producerConsumer.write(3, 4));
  sleep(time2).then(() => producerConsumer.write(2));

  const maxTime = Math.max(time1, time2);

  const before = performance.now();
  const valuesRead = await producerConsumer.read(4); // waiting until all is read
  const after = performance.now();

  const elapsed = after - before; // ~150
  console.log("Done. took %dms with expected %dms", elapsed, maxTime);
  console.log(valuesRead) // [1, 3, 4, 2]
}
bootstrap();
```

#### Producer-Consumer tryRead

It is possible to try to read some values in a given time limit.  
The function will then throw an exception if it could not read in time:

```typescript
import {
  ConcurrencyExceedTimeoutException,
  ProducerConsumer
} from "@heap-code/concurrency-synchronization";

async function bootstrap() {
  const producerConsumer = new ProducerConsumer([1, 2, 3]);

  const success1 = await producerConsumer.tryRead(100, 2).then(() => true);
  const success2 = await producerConsumer.tryRead(100, 2).catch((error: unknown) => {
    if (error instanceof ConcurrencyExceedTimeoutException) {
      return false;
    }
  
    throw error;
  });

  console.log(success1); // true
  console.log(success2); // false
}
bootstrap();
```

#### Producer-Consumer readOne

The `read` and `tryRead` have their "one"-method
that do the same thing but return only one value instead of an array:

```typescript
import { ProducerConsumer } from "@heap-code/concurrency-synchronization";

async function bootstrap() {
  const producerConsumer = new ProducerConsumer([1, 2]);

  // const [value1] = producerConsumer.read(1);
  // can be written:
  const value1 = await producerConsumer.readOne();

  // const [value2] = producerConsumer.tryRead(100, 1);
 // can be written:
  const value2 = await producerConsumer.tryReadOne(100);
  
  console.log(value1, value2); // 1 2
}
bootstrap();
```

#### Producer-Consumer interrupt

A `ProducerConsumer` can be interrupted at any time.  
All awaiting _"threads"_ will then receive an exception:

```typescript
import {
  ConcurrencyInterruptedException,
  ProducerConsumer
} from "@heap-code/concurrency-synchronization";

async function bootstrap() {
  const producerConsumer = new ProducerConsumer([1]);

  void sleep(100).then(() => producerConsumer.interrupt({ code: 502 }, [1, 2, 3]));

  const succeed = await Promise.all([
    producerConsumer.read(3),
    producerConsumer.readOne(),
    producerConsumer.tryRead(200, 3),
    producerConsumer.tryReadOne(200)
  ]).catch((error: unknown) => {
    if (error instanceof ConcurrencyInterruptedException) {
      return false;
    }
    throw error;
  });

  console.log(succeed); // false
  console.log(producerConsumer.permitsAvailable); // 3
}
bootstrap();
```

## When to use

This package can be useful when writing test and wanting to synchronize events.

For example, the [RxJs observable](https://rxjs.dev/guide/observable) behavior slightly differs
if it comes from _regular_ observable or [subjects](https://rxjs.dev/guide/subject).

> [firstValueFrom](https://rxjs.dev/api/index/function/firstValueFrom) returns the value immediately.

So this difference can be omitted with the following:

```typescript
import { ProducerConsumer } from "@heap-code/concurrency-synchronization";

describe("My test", () => {
  it("should work", async () => {
    const producerConsumer = new ProducerConsumer();
    const subscription = myObservable.subscribe(value => producerConsumer.write(value));
    // something that updates the observable
 
    // Need to pass 2 times in the event
    const [r1, r2] = await producerConsumer.tryRead(500, 2);
 
    expect(r1).toBe(1);
    expect(r2).toBe(2);
    subscription.unsubscribe()
  });
});
```

---

**However**, these synchronizations are **generally** not wanted in production code as it is wanted to
keep the javascript code as _"parallelized"_ as possible, to not block code branches.  
Moreover, better solutions might exist for these problems,
such as `firstValueFrom` and `lastValueFrom` for RxJs.

## Releases

See information about breaking changes and release notes [here](https://github.com/heap-code/concurrency-synchronization/blob/HEAD/CHANGELOG.md).
